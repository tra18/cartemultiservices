import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAdminAuth } from '../../context/AdminAuthContext'

const SESSION_KEY = 'carte-multiservice-admin-session'

function hasAdminSession(): boolean {
  try {
    return Boolean(localStorage.getItem(SESSION_KEY))
  } catch {
    return false
  }
}

export function AdminProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAdminAuth()
  const hasSession = hasAdminSession()

  if (isLoading || (hasSession && !isAuthenticated)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/connexion" replace />
  }

  return <>{children}</>
}

export function AdminPublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAdminAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/admin" replace />
  }

  return <>{children}</>
}
