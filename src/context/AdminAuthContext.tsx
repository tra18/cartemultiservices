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
import { ADMIN_TOKEN_KEY } from '../services/apiClient'
import { markUserActivity, clearUserActivity } from '../constants/session'

interface AdminAuthContextValue {
  isAuthenticated: boolean
  isLoading: boolean
  adminEmail: string | null
  login: (email: string, password: string) => Promise<string | null>
  logout: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)

async function verifyAdminToken(token: string): Promise<string | null> {
  try {
    const response = await fetch('/api/admin-auth', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) return null
    const data = (await response.json()) as { email?: string }
    return data.email ?? ADMIN_EMAIL
  } catch {
    return null
  }
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminEmail, setAdminEmail] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      const token = sessionStorage.getItem(ADMIN_TOKEN_KEY)
      if (!token) {
        setIsLoading(false)
        return
      }

      const email = await verifyAdminToken(token)
      if (email) {
        setIsAuthenticated(true)
        setAdminEmail(email)
        markUserActivity()
      } else {
        sessionStorage.removeItem(ADMIN_TOKEN_KEY)
      }
      setIsLoading(false)
    })()
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    try {
      const response = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        return 'Identifiants administrateur incorrects'
      }

      const data = (await response.json()) as { token?: string; email?: string }
      if (!data.token) {
        return 'Connexion administrateur impossible'
      }

      sessionStorage.setItem(ADMIN_TOKEN_KEY, data.token)
      flushSync(() => {
        setIsAuthenticated(true)
        setAdminEmail(data.email ?? ADMIN_EMAIL)
      })
      markUserActivity()
      return null
    } catch {
      return 'Connexion administrateur impossible'
    }
  }, [])

  const logout = useCallback(async () => {
    const token = sessionStorage.getItem(ADMIN_TOKEN_KEY)
    if (token) {
      try {
        await fetch('/api/admin-auth', {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch {
        /* ignore */
      }
    }
    sessionStorage.removeItem(ADMIN_TOKEN_KEY)
    clearUserActivity()
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
