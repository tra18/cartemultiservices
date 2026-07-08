import { flushSync } from 'react-dom'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { createMerchant, addMerchantCategory as addCategoryToStore, loadMerchants, saveMerchants } from '../store/platformStore'
import {
  recordMerchantCategoryRevenue,
  recordMerchantRegistrationRevenue,
} from '../store/treasuryStore'
import type { Category } from '../types'
import { CATEGORY_LABELS } from '../types'
import type { MerchantAccount, MerchantRegisterData } from '../types/merchant'
import {
  sendAdminMerchantNotificationEmail,
  sendMerchantCategoryAddedEmail,
  sendMerchantWelcomeEmail,
} from '../services/emailService'
import { fetchFinanceMerchant, upsertFinanceMerchant } from '../services/financeServer'
import { calculateAdditionalCategoryPrice, calculateMerchantRegistrationPrice } from '../utils/pricing'

const SESSION_KEY = 'carte-multiservice-merchant-session'

interface MerchantAuthContextValue {
  currentMerchant: MerchantAccount | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => string | null
  register: (data: MerchantRegisterData) => string | null
  logout: () => void
  refreshMerchant: () => Promise<void>
  addCategory: (category: Category, paymentMethod: string) => string | null
}

const MerchantAuthContext = createContext<MerchantAuthContextValue | null>(null)

export function MerchantAuthProvider({ children }: { children: ReactNode }) {
  const [merchants, setMerchants] = useState<MerchantAccount[]>(loadMerchants)
  const [currentMerchant, setCurrentMerchant] = useState<MerchantAccount | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const currentMerchantId = currentMerchant?.id ?? null

  useEffect(() => {
    saveMerchants(merchants)
  }, [merchants])

  useEffect(() => {
    const sessionId = localStorage.getItem(SESSION_KEY)
    if (sessionId) {
      const all = loadMerchants()
      const merchant = all.find((m) => m.id === sessionId)
      if (merchant) {
        setMerchants(all)
        setCurrentMerchant(merchant)
        void upsertFinanceMerchant(merchant)
      }
    }
    setIsLoading(false)
  }, [])

  const refreshMerchant = useCallback(async () => {
    if (!currentMerchantId) return
    const local = loadMerchants()
    const index = local.findIndex((merchant) => merchant.id === currentMerchantId)
    const fromServer = await fetchFinanceMerchant(currentMerchantId)

    if (fromServer && index !== -1) {
      const merged = { ...local[index], ...fromServer, password: local[index].password }
      const next = [...local]
      next[index] = merged
      setMerchants(next)
      setCurrentMerchant(merged)
      return
    }

    setMerchants(local)
    const merchant = local.find((item) => item.id === currentMerchantId)
    if (merchant) setCurrentMerchant(merchant)
  }, [currentMerchantId])

  const login = (email: string, password: string): string | null => {
    const all = loadMerchants()
    const merchant = all.find(
      (m) => m.email.toLowerCase() === email.trim().toLowerCase() && m.password === password
    )
    if (!merchant) return 'Email ou mot de passe incorrect'
    localStorage.setItem(SESSION_KEY, merchant.id)
    flushSync(() => {
      setMerchants(all)
      setCurrentMerchant(merchant)
    })
    void upsertFinanceMerchant(merchant)
    return null
  }

  const register = (data: MerchantRegisterData): string | null => {
    if (merchants.some((m) => m.email.toLowerCase() === data.email.toLowerCase())) {
      return 'Cet email est déjà utilisé'
    }
    if (data.password.length < 6) {
      return 'Le mot de passe doit contenir au moins 6 caractères'
    }
    if (data.categories.length === 0) {
      return 'Sélectionnez au moins une catégorie'
    }

    const registrationFee = calculateMerchantRegistrationPrice(data.categories.length)
    const newMerchant = createMerchant({
      businessName: data.businessName,
      email: data.email,
      password: data.password,
      phone: data.phone,
      categories: data.categories,
      mobileMoneyNumber: data.mobileMoneyNumber,
      registrationPaid: true,
    })

    recordMerchantRegistrationRevenue(
      newMerchant.id,
      registrationFee,
      data.businessName,
      data.categories.length
    )
    sendMerchantWelcomeEmail(
      newMerchant.email,
      newMerchant.businessName,
      newMerchant.categories.map((category) => CATEGORY_LABELS[category])
    )
    sendAdminMerchantNotificationEmail(
      'Nouvelle inscription commerçant — Guinée Multiservices',
      `Bonjour Admin,

Un nouveau commerçant vient de s'inscrire.

  Commerce : ${newMerchant.businessName}
  Email : ${newMerchant.email}
  Téléphone : ${newMerchant.phone}
  Catégories : ${newMerchant.categories.map((category) => CATEGORY_LABELS[category]).join(', ')}
  Frais payés : ${registrationFee.toLocaleString('fr-GN')} GNF

Cordialement,
Système Guinée Multiservices`
    )

    const updated = [...merchants, newMerchant]
    localStorage.setItem(SESSION_KEY, newMerchant.id)
    flushSync(() => {
      setMerchants(updated)
      setCurrentMerchant(newMerchant)
    })
    void upsertFinanceMerchant(newMerchant)
    return null
  }

  const logout = () => {
    setCurrentMerchant(null)
    localStorage.removeItem(SESSION_KEY)
  }

  const addCategory = (category: Category, _paymentMethod: string): string | null => {
    if (!currentMerchant) return 'Non connecté'

    const price = calculateAdditionalCategoryPrice()
    const result = addCategoryToStore(currentMerchant.id, category)
    if (!result.success) return result.error ?? 'Erreur'

    recordMerchantCategoryRevenue(
      currentMerchant.id,
      price,
      currentMerchant.businessName,
      CATEGORY_LABELS[category]
    )
    sendMerchantCategoryAddedEmail(
      currentMerchant.email,
      currentMerchant.businessName,
      CATEGORY_LABELS[category],
      price
    )
    sendAdminMerchantNotificationEmail(
      'Catégorie commerçant ajoutée — Guinée Multiservices',
      `Bonjour Admin,

Une catégorie supplémentaire a été activée pour un commerçant.

  Commerce : ${currentMerchant.businessName}
  Email : ${currentMerchant.email}
  Catégorie : ${CATEGORY_LABELS[category]}
  Frais payés : ${price.toLocaleString('fr-GN')} GNF

Cordialement,
Système Guinée Multiservices`
    )

    const all = loadMerchants()
    setMerchants(all)
    const merchant = all.find((m) => m.id === currentMerchant.id)
    if (merchant) {
      setCurrentMerchant(merchant)
      void upsertFinanceMerchant(merchant)
    }
    return null
  }

  return (
    <MerchantAuthContext.Provider
      value={{
        currentMerchant,
        isAuthenticated: !!currentMerchant,
        isLoading,
        login,
        register,
        logout,
        refreshMerchant,
        addCategory,
      }}
    >
      {children}
    </MerchantAuthContext.Provider>
  )
}

export function useMerchantAuth() {
  const ctx = useContext(MerchantAuthContext)
  if (!ctx) throw new Error('useMerchantAuth must be used within MerchantAuthProvider')
  return ctx
}
