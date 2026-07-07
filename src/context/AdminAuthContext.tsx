import { flushSync } from 'react-dom'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import { ADMIN_EMAIL } from '../constants/brand'

const SESSION_KEY = 'carte-multiservice-admin-session'

const ADMIN_PASSWORD = 'admin123'

interface AdminAuthContextValue {
  isAuthenticated: boolean
  isLoading: boolean
  adminEmail: string | null
  login: (email: string, password: string) => string | null
  logout: () => void
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminEmail, setAdminEmail] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const session = localStorage.getItem(SESSION_KEY)
    if (session === ADMIN_EMAIL) {
      setIsAuthenticated(true)
      setAdminEmail(ADMIN_EMAIL)
    }
    setIsLoading(false)
  }, [])

  const login = useCallback((email: string, password: string): string | null => {
    if (email.trim().toLowerCase() !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return 'Identifiants administrateur incorrects'
    }
    localStorage.setItem(SESSION_KEY, ADMIN_EMAIL)
    flushSync(() => {
      setIsAuthenticated(true)
      setAdminEmail(ADMIN_EMAIL)
    })
    return null
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY)
    setIsAuthenticated(false)
    setAdminEmail(null)
  }, [])

  return (
    <AdminAuthContext.Provider
      value={{ isAuthenticated, isLoading, adminEmail, login, logout }}
    >
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider')
  return ctx
}

export const ADMIN_DEMO_CREDENTIALS = {
  email: ADMIN_EMAIL,
  password: ADMIN_PASSWORD,
}
