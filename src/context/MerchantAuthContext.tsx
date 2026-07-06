import { flushSync } from 'react-dom'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { createMerchant, loadMerchants, saveMerchants } from '../store/platformStore'
import type { MerchantAccount, MerchantRegisterData } from '../types/merchant'

const SESSION_KEY = 'carte-multiservice-merchant-session'

interface MerchantAuthContextValue {
  currentMerchant: MerchantAccount | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => string | null
  register: (data: MerchantRegisterData) => string | null
  logout: () => void
  refreshMerchant: () => void
}

const MerchantAuthContext = createContext<MerchantAuthContextValue | null>(null)

export function MerchantAuthProvider({ children }: { children: ReactNode }) {
  const [merchants, setMerchants] = useState<MerchantAccount[]>(loadMerchants)
  const [currentMerchant, setCurrentMerchant] = useState<MerchantAccount | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
      }
    }
    setIsLoading(false)
  }, [])

  const refreshMerchant = useCallback(() => {
    if (!currentMerchant) return
    const all = loadMerchants()
    setMerchants(all)
    const merchant = all.find((m) => m.id === currentMerchant.id)
    if (merchant) setCurrentMerchant(merchant)
  }, [currentMerchant])

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

    const newMerchant = createMerchant({
      businessName: data.businessName,
      email: data.email,
      password: data.password,
      phone: data.phone,
      categories: data.categories,
      mobileMoneyNumber: data.mobileMoneyNumber,
      registrationPaid: true,
    })

    const updated = [...merchants, newMerchant]
    localStorage.setItem(SESSION_KEY, newMerchant.id)
    flushSync(() => {
      setMerchants(updated)
      setCurrentMerchant(newMerchant)
    })
    return null
  }

  const logout = () => {
    setCurrentMerchant(null)
    localStorage.removeItem(SESSION_KEY)
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
