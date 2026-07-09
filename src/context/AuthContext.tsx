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
  createReplacementCardOrder,
  type ReplacementOrderData,
} from '../store/orderStore'
import { cardSecurityAction, confirmCardPinResetOnServer, enableDigitalCardOnServer, requestCardPinResetOnServer, verifyCardPinOnServer } from '../services/orderServer'
import { validateAndSanitizeOrderData } from '../utils/orderSecurity'
import { resetRateLimit } from '../utils/formSecurity'
import { canEnableDigitalCard, isCardUsable } from '../utils/cardStatus'
import { validateCardPin } from '../utils/cardPin'
import { sendCardBlockedEmail, sendTransactionAlertEmail } from '../services/emailService'
import {
  checkEmailAvailable,
  fetchClientSession,
  loginClient,
  logoutClient,
  patchClientProfile,
  registerClient,
} from '../services/clientAuth'
import { clearUserActivity, markUserActivity } from '../constants/session'

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
  ) => Promise<boolean>
  payViaQr: (paymentId: string, pin: string) => Promise<{ success: boolean; error?: string }>
  recharge: (amount: number, method: string, pin: string) => Promise<boolean>
  orderCard: (
    data: CardOrderFormData & { needsAddress?: boolean; addressFallback?: string }
  ) => Promise<{ success: boolean; error?: string; order?: CardOrder }>
  orderReplacementCard: (
    data: ReplacementOrderData
  ) => Promise<{ success: boolean; error?: string; order?: CardOrder }>
  activateCard: (code: string, cardPin: string, cardToken?: string) => Promise<string | null>
  verifyCardPin: (pin: string) => Promise<string | null>
  blockCard: () => Promise<string | null>
  unblockCard: (pin: string) => Promise<string | null>
  requestCardPinReset: () => Promise<{ error: string | null; maskedEmail?: string }>
  resetCardPin: (code: string, newPin: string) => Promise<string | null>
  addToMobileWallet: (wallet: 'apple' | 'google') => string | null
  enableDigitalCard: (pin: string) => Promise<string | null>
  markCardShipped: () => void
  refreshCurrentUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionCardPin, setSessionCardPin] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchClientSession()
      .then((user) => {
        if (!cancelled && user) {
          setCurrentUser(normalizeUser(user))
          markUserActivity()
        }
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
    markUserActivity()
    return null
  }

  const register = async (data: RegisterData): Promise<string | null> => {
    if (data.password.length < 6) {
      return 'Le mot de passe doit contenir au moins 6 caractères'
    }
    const result = await registerClient(data)
    if (result.error || !result.user) return result.error ?? 'Inscription échouée'
    setCurrentUser(normalizeUser(result.user))
    markUserActivity()
    return null
  }

  const logout = async () => {
    await logoutClient()
    clearUserActivity()
    setSessionCardPin(null)
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

  const refreshCurrentUser = useCallback(async () => {
    const user = await fetchClientSession()
    setCurrentUser(user ? normalizeUser(user) : null)
  }, [])

  const verifyCardPin = async (pin: string): Promise<string | null> => {
    if (!currentUser) return 'Non connecté'
    if (currentUser.cardStatus === 'blocked') {
      return 'Carte bloquée. Débloquez-la dans Sécurité carte.'
    }

    if (sessionCardPin === pin) return null

    if (currentUser.cardPin && currentUser.cardPin === pin) {
      setSessionCardPin(pin)
      return null
    }

    const result = await verifyCardPinOnServer(pin)
    if (result.ok) {
      setSessionCardPin(pin)
      await refreshCurrentUser()
      return null
    }

    await refreshCurrentUser()
    if (result.blocked) {
      sendCardBlockedEmail(currentUser.email, currentUser.fullName)
    }
    return result.error ?? 'Code PIN incorrect'
  }

  const blockCard = async (): Promise<string | null> => {
    if (!currentUser) return 'Non connecté'
    if (currentUser.cardStatus === 'blocked') return 'Carte déjà bloquée'
    if (!isCardUsable(currentUser)) return 'Carte non active'

    const result = await cardSecurityAction('block', undefined, 'loss')
    if (!result.ok) return result.error ?? 'Échec du blocage'
    await refreshCurrentUser()
    return null
  }

  const unblockCard = async (pin: string): Promise<string | null> => {
    if (!currentUser) return 'Non connecté'
    if (currentUser.cardStatus !== 'blocked') return 'La carte n\'est pas bloquée'

    const result = await cardSecurityAction('unblock', pin)
    if (!result.ok) return result.error ?? 'Déblocage échoué'
    setSessionCardPin(pin)
    await refreshCurrentUser()
    return null
  }

  const requestCardPinReset = async (): Promise<{ error: string | null; maskedEmail?: string }> => {
    if (!currentUser) return { error: 'Non connecté' }
    const result = await requestCardPinResetOnServer()
    if (!result.ok) return { error: result.error ?? 'Envoi du code échoué' }
    return { error: null, maskedEmail: result.email }
  }

  const resetCardPin = async (code: string, newPin: string): Promise<string | null> => {
    if (!currentUser) return 'Non connecté'
    const pinErr = validateCardPin(newPin)
    if (pinErr) return pinErr

    const result = await confirmCardPinResetOnServer(code, newPin)
    if (!result.ok) return result.error ?? 'Réinitialisation échouée'

    setSessionCardPin(newPin)
    await refreshCurrentUser()
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

  const enableDigitalCard = async (pin: string): Promise<string | null> => {
    if (!currentUser) return 'Non connecté'
    const pinErr = validateCardPin(pin)
    if (pinErr) return pinErr

    if (!canEnableDigitalCard(currentUser)) {
      return 'Carte numérique disponible après validation de votre commande par notre équipe.'
    }

    const result = await enableDigitalCardOnServer(pin)
    if (!result.ok) return result.error ?? 'Activation carte numérique échouée'

    setSessionCardPin(pin)
    await refreshCurrentUser()
    return null
  }

  const activateCard = async (
    code: string,
    cardPin: string,
    cardToken?: string
  ): Promise<string | null> => {
    if (!currentUser) return 'Non connecté'
    const pinErr = validateCardPin(cardPin)
    if (pinErr) return pinErr

    const result = await activateCardWithCode(currentUser.id, code, cardPin, cardToken)
    if (!result.success) return result.error ?? 'Activation échouée'

    setSessionCardPin(cardPin)
    await refreshCurrentUser()
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

    const order = await createCardOrder(registration.user.id, safeData)
    setCurrentUser(normalizeUser(registration.user))
    resetRateLimit()
    return { success: true, order }
  }

  const orderReplacementCard = async (
    data: ReplacementOrderData
  ): Promise<{ success: boolean; error?: string; order?: CardOrder }> => {
    if (!currentUser) return { success: false, error: 'Non connecté' }

    try {
      const order = await createReplacementCardOrder(currentUser.id, data)
      await refreshCurrentUser()
      return { success: true, order }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Commande échouée',
      }
    }
  }

  const markCardShipped = () => {
    console.warn('markCardShipped désactivé — utilisez le portail admin')
  }

  const recharge = async (amount: number, method: string, pin: string): Promise<boolean> => {
    const cardErr = requireUsableCard()
    if (cardErr) return false
    const pinErr = await verifyCardPin(pin)
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

  const pay = async (
    category: Category,
    merchant: string,
    amount: number,
    pin: string,
    detail?: string
  ): Promise<boolean> => {
    const cardErr = requireUsableCard()
    if (cardErr) return false
    const pinErr = await verifyCardPin(pin)
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
    const pinErr = await verifyCardPin(pin)
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
        orderReplacementCard,
        activateCard,
        verifyCardPin,
        blockCard,
        unblockCard,
        requestCardPinReset,
        resetCardPin,
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
