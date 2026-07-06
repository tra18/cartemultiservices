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
import { isEmailTaken, validateAndSanitizeOrderData } from '../utils/orderSecurity'
import { resetRateLimit } from '../utils/formSecurity'
import { generateCardNumber } from '../utils/card'
import { canEnableDigitalCard, isCardUsable } from '../utils/cardStatus'
import { validateCardPin } from '../utils/cardPin'
import {
  sendCardBlockedEmail,
  sendCardActivatedEmail,
  sendDigitalCardEmail,
  sendTransactionAlertEmail,
  sendWalletAddedEmail,
} from '../services/emailService'

const USERS_KEY = 'carte-multiservice-users'
const SESSION_KEY = 'carte-multiservice-session'

function createDemoTransactions(): Transaction[] {
  const now = Date.now()
  return [
    {
      id: '1',
      type: 'recharge',
      amount: 500_000,
      date: new Date(now - 86400000 * 3).toISOString(),
      method: 'Orange Money',
    },
    {
      id: '2',
      type: 'paiement',
      category: 'restaurants',
      merchant: 'Riviera Restaurant',
      amount: 85_000,
      date: new Date(now - 86400000 * 2).toISOString(),
    },
    {
      id: '3',
      type: 'paiement',
      category: 'transport',
      merchant: 'SOTRA',
      amount: 15_000,
      date: new Date(now - 86400000).toISOString(),
    },
    {
      id: '4',
      type: 'paiement',
      category: 'courses',
      merchant: 'Prodimar',
      amount: 320_000,
      date: new Date(now - 3600000 * 5).toISOString(),
    },
  ]
}

const DEMO_USER: UserAccount = {
  id: 'demo-user',
  email: 'demo@carte.gn',
  password: 'demo123',
  fullName: 'Mamadou Diallo',
  phone: '+224 620 00 00 00',
  cardNumber: '6245 8810 4521 7893',
  balance: 1_500_000,
  transactions: createDemoTransactions(),
  cardStatus: 'active',
  cardPin: '5678',
}

function normalizeUser(user: UserAccount): UserAccount {
  return {
    ...user,
    cardStatus: user.cardStatus ?? (user.balance > 0 ? 'active' : 'none'),
  }
}

function loadUsers(): UserAccount[] {
  try {
    const stored = localStorage.getItem(USERS_KEY)
    if (stored) return (JSON.parse(stored) as UserAccount[]).map(normalizeUser)
  } catch {
    /* ignore */
  }
  return [DEMO_USER]
}

function saveUsers(users: UserAccount[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

interface AuthContextValue {
  currentUser: UserAccount | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => string | null
  register: (data: RegisterData) => string | null
  logout: () => void
  updateBalance: (amount: number) => void
  addTransaction: (transaction: Transaction) => void
  pay: (
    category: Category,
    merchant: string,
    amount: number,
    pin: string,
    detail?: string
  ) => boolean
  payViaQr: (paymentId: string, pin: string) => { success: boolean; error?: string }
  recharge: (amount: number, method: string, pin: string) => boolean
  orderCard: (
    data: CardOrderFormData & { needsAddress?: boolean; addressFallback?: string }
  ) => { success: boolean; error?: string; order?: CardOrder }
  activateCard: (code: string, cardPin: string, cardToken?: string) => string | null
  verifyCardPin: (pin: string) => string | null
  blockCard: () => string | null
  unblockCard: (pin: string) => string | null
  addToMobileWallet: (wallet: 'apple' | 'google') => string | null
  enableDigitalCard: (pin: string) => string | null
  markCardShipped: () => void
  refreshCurrentUser: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<UserAccount[]>(loadUsers)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    saveUsers(users)
  }, [users])

  useEffect(() => {
    const sessionId = localStorage.getItem(SESSION_KEY)
    if (sessionId) {
      const allUsers = loadUsers()
      const user = allUsers.find((u) => u.id === sessionId)
      if (user) {
        setUsers(allUsers)
        setCurrentUser(user)
      }
    }
    setIsLoading(false)
  }, [])

  const syncCurrentUser = useCallback((updatedUsers: UserAccount[], userId: string) => {
    const user = updatedUsers.find((u) => u.id === userId) ?? null
    setCurrentUser(user)
    return user
  }, [])

  const login = (email: string, password: string): string | null => {
    const allUsers = loadUsers()
    const user = allUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    )
    if (!user) return 'Email ou mot de passe incorrect'
    setUsers(allUsers)
    setCurrentUser(user)
    localStorage.setItem(SESSION_KEY, user.id)
    return null
  }

  const register = (data: RegisterData): string | null => {
    if (users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
      return 'Cet email est déjà utilisé'
    }
    if (data.password.length < 6) {
      return 'Le mot de passe doit contenir au moins 6 caractères'
    }

    const newUser: UserAccount = {
      id: crypto.randomUUID(),
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      phone: data.phone,
      cardNumber: 'En attente de carte',
      balance: 0,
      transactions: [],
      cardStatus: 'none',
    }

    const updated = [...users, newUser]
    setUsers(updated)
    setCurrentUser(newUser)
    localStorage.setItem(SESSION_KEY, newUser.id)
    return null
  }

  const logout = () => {
    setCurrentUser(null)
    localStorage.removeItem(SESSION_KEY)
  }

  const updateUser = (userId: string, updater: (user: UserAccount) => UserAccount) => {
    setUsers((prev) => {
      const updated = prev.map((u) => (u.id === userId ? updater(u) : u))
      syncCurrentUser(updated, userId)
      return updated
    })
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
        ...(attempts >= MAX_PIN_ATTEMPTS
          ? { cardStatus: 'blocked' as const }
          : {}),
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
    sendWalletAddedEmail(currentUser.email, currentUser.fullName, wallet)
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
      setUsers((prev) => {
        const merged = loadUsers().map((stored) => {
          const fromState = prev.find((u) => u.id === stored.id)
          return fromState ?? stored
        })
        for (const u of prev) {
          if (!merged.some((m) => m.id === u.id)) merged.push(u)
        }

        const updated = merged.map((u) =>
          u.id === userId
            ? {
                ...u,
                cardStatus: 'active' as const,
                cardNumber: result.cardNumber ?? u.cardNumber,
                cardPin,
                pinFailedAttempts: 0,
              }
            : u
        )
        saveUsers(updated)
        syncCurrentUser(updated, userId)
        return updated
      })
    })
    sendCardActivatedEmail(currentUser.email, currentUser.fullName, result.cardNumber ?? currentUser.cardNumber)
    return null
  }

  const orderCard = (
    data: CardOrderFormData & { needsAddress?: boolean; addressFallback?: string }
  ): { success: boolean; error?: string; order?: CardOrder } => {
    const validated = validateAndSanitizeOrderData({
      ...data,
      needsAddress: data.needsAddress ?? false,
      addressFallback: data.addressFallback ?? '',
    })

    if (!validated.success) {
      return { success: false, error: validated.error }
    }

    const safeData = validated.data

    if (isEmailTaken(safeData.email, users.map((u) => u.email))) {
      return { success: false, error: 'Cet email est déjà utilisé' }
    }

    const newUser: UserAccount = {
      id: crypto.randomUUID(),
      email: safeData.email,
      password: safeData.password,
      fullName: safeData.fullName,
      phone: safeData.phone,
      cardNumber: 'En attente de carte',
      balance: 0,
      transactions: [],
      cardStatus: 'ordered',
    }

    const order = createCardOrder(newUser.id, safeData)
    const updated = [...users, newUser]
    setUsers(updated)
    setCurrentUser(newUser)
    localStorage.setItem(SESSION_KEY, newUser.id)
    resetRateLimit()
    return { success: true, order }
  }

  const refreshCurrentUser = useCallback(() => {
    const sessionId = localStorage.getItem(SESSION_KEY)
    if (!sessionId) return
    const allUsers = loadUsers()
    const user = allUsers.find((u) => u.id === sessionId) ?? null
    setUsers(allUsers)
    setCurrentUser(user)
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

  const payViaQr = (paymentId: string, pin: string): { success: boolean; error?: string } => {
    if (!currentUser) return { success: false, error: 'Non connecté' }
    const cardErr = requireUsableCard()
    if (cardErr) return { success: false, error: cardErr }
    const pinErr = verifyCardPin(pin)
    if (pinErr) return { success: false, error: pinErr }

    const result = completeQrPayment(paymentId, currentUser)
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
