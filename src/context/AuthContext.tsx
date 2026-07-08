import { flushSync } from 'react-dom'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Category, Transaction } from '../types'
import type { RegisterData, UserAccount } from '../types/auth'
import type { CardOrder, CardOrderFormData } from '../types/order'
import { completeQrPayment } from '../store/platformStore'
import {
  activateCardWithCode,
  createCardOrder,
  simulateOrderReady,
} from '../store/orderStore'
import { validateAndSanitizeOrderData } from '../utils/orderSecurity'
import { resetRateLimit } from '../utils/formSecurity'
import { generateCardNumber } from '../utils/card'
import { canEnableDigitalCard, isCardUsable } from '../utils/cardStatus'
import { validateCardPin } from '../utils/cardPin'
import {
  sendCardBlockedEmail,
  sendCardActivatedEmail,
  sendDigitalCardEmail,
  sendTransactionAlertEmail,
} from '../services/emailService'
import {
  checkEmailAvailable,
  fetchClientSession,
  loginClient,
  logoutClient,
  patchClientProfile,
  registerClient,
} from '../services/clientAuth'

function normalizeUser(user: UserAccount): UserAccount {
  return {
    ...user,
    cardStatus: user.cardStatus ?? (user.balance > 0 ? 'active' : 'none'),
  }
}

function toProfilePatch(user: UserAccount): Partial<UserAccount> {
  return {
    fullName: user.fullName,
    phone: user.phone,
    cardNumber: user.cardNumber,
    balance: user.balance,
    transactions: user.transactions,
    cardStatus: user.cardStatus,
    cardPin: user.cardPin,
    pinFailedAttempts: user.pinFailedAttempts,
    walletAppleAddedAt: user.walletAppleAddedAt,
    walletGoogleAddedAt: user.walletGoogleAddedAt,
    digitalCardNumber: user.digitalCardNumber,
    digitalCardEnabledAt: user.digitalCardEnabledAt,
  }
}

interface AuthContextValue {
  currentUser: UserAccount | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<string | null>
  register: (data: RegisterData) => Promise<string | null>
  logout: () => Promise<void>
  updateBalance: (amount: number) => void
  addTransaction: (transaction: Transaction) => void
  pay: (
    category: Category,
    merchant: string,
    amount: number,
    pin: string,
    detail?: string
  ) => boolean
  payViaQr: (paymentId: string, pin: string) => Promise<{ success: boolean; error?: string }>
  recharge: (amount: number, method: string, pin: string) => boolean
  orderCard: (
    data: CardOrderFormData & { needsAddress?: boolean; addressFallback?: string }
  ) => Promise<{ success: boolean; error?: string; order?: CardOrder }>
  activateCard: (code: string, cardPin: string, cardToken?: string) => string | null
  verifyCardPin: (pin: string) => string | null
  blockCard: () => string | null
  unblockCard: (pin: string) => string | null
  addToMobileWallet: (wallet: 'apple' | 'google') => string | null
  enableDigitalCard: (pin: string) => string | null
  markCardShipped: () => void
  refreshCurrentUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchClientSession()
      .then((user) => {
        if (!cancelled && user) setCurrentUser(normalizeUser(user))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const updateUser = useCallback(
    (userId: string, updater: (user: UserAccount) => UserAccount) => {
      setCurrentUser((prev) => {
        if (!prev || prev.id !== userId) return prev
        const updated = normalizeUser(updater(prev))
        void patchClientProfile(toProfilePatch(updated))
        return updated
      })
    },
    []
  )

  const login = async (email: string, password: string): Promise<string | null> => {
    const result = await loginClient(email, password)
    if (result.error || !result.user) return result.error ?? 'Connexion échouée'
    setCurrentUser(normalizeUser(result.user))
    return null
  }

  const register = async (data: RegisterData): Promise<string | null> => {
    if (data.password.length < 6) {
      return 'Le mot de passe doit contenir au moins 6 caractères'
    }
    const result = await registerClient(data)
    if (result.error || !result.user) return result.error ?? 'Inscription échouée'
    setCurrentUser(normalizeUser(result.user))
    return null
  }

  const logout = async () => {
    await logoutClient()
    setCurrentUser(null)
  }

  const requireUsableCard = (): string | null => {
    if (!currentUser) return 'Non connecté'
    if (currentUser.cardStatus === 'blocked') {
      return 'Votre carte est bloquée. Débloquez-la dans Sécurité carte.'
    }
    if (!isCardUsable(currentUser)) {
      return 'Activez votre carte numérique ou physique pour utiliser ce service'
    }
    return null
  }

  const MAX_PIN_ATTEMPTS = 3

  const verifyCardPin = (pin: string): string | null => {
    if (!currentUser) return 'Non connecté'
    if (!currentUser.cardPin) {
      return 'Code PIN non configuré. Activez votre carte numérique ou physique.'
    }
    if (currentUser.cardStatus === 'blocked' && currentUser.pinFailedAttempts! >= MAX_PIN_ATTEMPTS) {
      return 'Carte bloquée après trop de tentatives. Débloquez dans Sécurité carte.'
    }

    if (currentUser.cardPin !== pin) {
      const attempts = (currentUser.pinFailedAttempts ?? 0) + 1
      updateUser(currentUser.id, (user) => ({
        ...user,
        pinFailedAttempts: attempts,
        ...(attempts >= MAX_PIN_ATTEMPTS ? { cardStatus: 'blocked' as const } : {}),
      }))
      if (attempts >= MAX_PIN_ATTEMPTS) {
        sendCardBlockedEmail(currentUser.email, currentUser.fullName)
        return 'Trop de tentatives incorrectes. Carte bloquée par sécurité.'
      }
      return `Code PIN incorrect (${MAX_PIN_ATTEMPTS - attempts} essai(s) restant(s))`
    }

    if (currentUser.pinFailedAttempts) {
      updateUser(currentUser.id, (user) => ({ ...user, pinFailedAttempts: 0 }))
    }
    return null
  }

  const blockCard = (): string | null => {
    if (!currentUser) return 'Non connecté'
    if (currentUser.cardStatus === 'blocked') return 'Carte déjà bloquée'
    if (!isCardUsable(currentUser)) return 'Carte non active'

    updateUser(currentUser.id, (user) => ({
      ...user,
      cardStatus: 'blocked',
    }))
    sendCardBlockedEmail(currentUser.email, currentUser.fullName)
    return null
  }

  const unblockCard = (pin: string): string | null => {
    if (!currentUser) return 'Non connecté'
    if (currentUser.cardStatus !== 'blocked') return 'La carte n\'est pas bloquée'

    if (currentUser.cardPin !== pin) {
      return 'Code PIN incorrect'
    }

    updateUser(currentUser.id, (user) => ({
      ...user,
      cardStatus: 'active',
      pinFailedAttempts: 0,
    }))
    return null
  }

  const addToMobileWallet = (wallet: 'apple' | 'google'): string | null => {
    if (!currentUser) return 'Non connecté'
    if (currentUser.cardStatus === 'blocked') {
      return 'Carte bloquée. Débloquez-la avant d\'ajouter au portefeuille.'
    }
    if (!isCardUsable(currentUser)) {
      return 'Activez votre carte numérique ou physique avant de l\'ajouter au portefeuille.'
    }

    const now = new Date().toISOString()
    if (wallet === 'apple' && currentUser.walletAppleAddedAt) {
      return 'Carte déjà ajoutée à Apple Wallet'
    }
    if (wallet === 'google' && currentUser.walletGoogleAddedAt) {
      return 'Carte déjà ajoutée à Google Wallet'
    }

    updateUser(currentUser.id, (user) => ({
      ...user,
      ...(wallet === 'apple' ? { walletAppleAddedAt: now } : { walletGoogleAddedAt: now }),
    }))
    return null
  }

  const enableDigitalCard = (pin: string): string | null => {
    if (!currentUser) return 'Non connecté'
    const pinErr = validateCardPin(pin)
    if (pinErr) return pinErr

    if (!canEnableDigitalCard(currentUser)) {
      return 'Carte numérique non disponible pour votre compte'
    }

    const digitalNumber = generateCardNumber()
    const now = new Date().toISOString()

    updateUser(currentUser.id, (user) => ({
      ...user,
      digitalCardNumber: digitalNumber,
      digitalCardEnabledAt: now,
      cardPin: pin,
      pinFailedAttempts: 0,
    }))
    sendDigitalCardEmail(currentUser.email, currentUser.fullName, digitalNumber)
    return null
  }

  const activateCard = (code: string, cardPin: string, cardToken?: string): string | null => {
    if (!currentUser) return 'Non connecté'
    const pinErr = validateCardPin(cardPin)
    if (pinErr) return pinErr

    const userId = currentUser.id
    const result = activateCardWithCode(userId, code, cardToken)
    if (!result.success) return result.error ?? 'Activation échouée'

    flushSync(() => {
      setCurrentUser((prev) => {
        if (!prev || prev.id !== userId) return prev
        const updated = normalizeUser({
          ...prev,
          cardStatus: 'active',
          cardNumber: result.cardNumber ?? prev.cardNumber,
          cardPin,
          pinFailedAttempts: 0,
        })
        void patchClientProfile(toProfilePatch(updated))
        return updated
      })
    })
    sendCardActivatedEmail(currentUser.email, currentUser.fullName, result.cardNumber ?? currentUser.cardNumber)
    return null
  }

  const orderCard = async (
    data: CardOrderFormData & { needsAddress?: boolean; addressFallback?: string }
  ): Promise<{ success: boolean; error?: string; order?: CardOrder }> => {
    const validated = validateAndSanitizeOrderData({
      ...data,
      needsAddress: data.needsAddress ?? false,
      addressFallback: data.addressFallback ?? '',
    })

    if (!validated.success) {
      return { success: false, error: validated.error }
    }

    const safeData = validated.data

    const emailAvailable = await checkEmailAvailable(safeData.email)
    if (!emailAvailable) {
      return { success: false, error: 'Cet email est déjà utilisé' }
    }

    const registration = await registerClient({
      email: safeData.email,
      password: safeData.password,
      fullName: safeData.fullName,
      phone: safeData.phone,
      cardStatus: 'ordered',
    })

    if (registration.error || !registration.user) {
      return { success: false, error: registration.error ?? 'Création de compte échouée' }
    }

    const order = createCardOrder(registration.user.id, safeData)
    setCurrentUser(normalizeUser(registration.user))
    resetRateLimit()
    return { success: true, order }
  }

  const refreshCurrentUser = useCallback(async () => {
    const user = await fetchClientSession()
    setCurrentUser(user ? normalizeUser(user) : null)
  }, [])

  const markCardShipped = () => {
    if (!currentUser) return
    simulateOrderReady(currentUser.id)
    updateUser(currentUser.id, (user) => ({
      ...user,
      cardStatus: 'shipped',
    }))
  }

  const recharge = (amount: number, method: string, pin: string): boolean => {
    const cardErr = requireUsableCard()
    if (cardErr) return false
    const pinErr = verifyCardPin(pin)
    if (pinErr) return false
    if (!currentUser || amount <= 0 || amount > 5_000_000) return false

    const newBalance = currentUser.balance + amount
    const transaction: Transaction = {
      id: crypto.randomUUID(),
      type: 'recharge',
      amount,
      date: new Date().toISOString(),
      method,
    }

    updateUser(currentUser.id, (user) => ({
      ...user,
      balance: newBalance,
      transactions: [transaction, ...user.transactions],
    }))
    sendTransactionAlertEmail(
      currentUser.email,
      currentUser.fullName,
      `Recharge ${method}`,
      amount,
      newBalance,
      true
    )
    return true
  }

  const pay = (
    category: Category,
    merchant: string,
    amount: number,
    pin: string,
    detail?: string
  ): boolean => {
    const cardErr = requireUsableCard()
    if (cardErr) return false
    const pinErr = verifyCardPin(pin)
    if (pinErr) return false
    if (!currentUser || amount <= 0 || amount > currentUser.balance) return false

    const newBalance = currentUser.balance - amount
    const transaction: Transaction = {
      id: crypto.randomUUID(),
      type: 'paiement',
      category,
      merchant,
      detail,
      amount,
      date: new Date().toISOString(),
    }

    updateUser(currentUser.id, (user) => ({
      ...user,
      balance: newBalance,
      transactions: [transaction, ...user.transactions],
    }))
    sendTransactionAlertEmail(
      currentUser.email,
      currentUser.fullName,
      detail ? `${merchant} (${detail})` : merchant,
      amount,
      newBalance,
      false
    )
    return true
  }

  const updateBalance = (amount: number) => {
    if (!currentUser) return
    updateUser(currentUser.id, (user) => ({ ...user, balance: amount }))
  }

  const addTransaction = (transaction: Transaction) => {
    if (!currentUser) return
    updateUser(currentUser.id, (user) => ({
      ...user,
      transactions: [transaction, ...user.transactions],
    }))
  }

  const payViaQr = async (paymentId: string, pin: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Non connecté' }
    const cardErr = requireUsableCard()
    if (cardErr) return { success: false, error: cardErr }
    const pinErr = verifyCardPin(pin)
    if (pinErr) return { success: false, error: pinErr }

    const result = await completeQrPayment(paymentId, currentUser)
    if (!result.success || !result.transaction) {
      return { success: false, error: result.error ?? 'Paiement échoué' }
    }

    const newBalance = currentUser.balance - result.transaction.amount
    updateUser(currentUser.id, (user) => ({
      ...user,
      balance: newBalance,
      transactions: [result.transaction!, ...user.transactions],
    }))
    sendTransactionAlertEmail(
      currentUser.email,
      currentUser.fullName,
      `QR ${result.transaction.merchant ?? 'Commerçant'}`,
      result.transaction.amount,
      newBalance,
      false
    )
    return { success: true }
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        login,
        register,
        logout,
        updateBalance,
        addTransaction,
        pay,
        payViaQr,
        recharge,
        orderCard,
        activateCard,
        verifyCardPin,
        blockCard,
        unblockCard,
        addToMobileWallet,
        enableDigitalCard,
        markCardShipped,
        refreshCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
