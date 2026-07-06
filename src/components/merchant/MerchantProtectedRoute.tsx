import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useMerchantAuth } from '../../context/MerchantAuthContext'

const SESSION_KEY = 'carte-multiservice-merchant-session'

function hasMerchantSession(): boolean {
  try {
    return Boolean(localStorage.getItem(SESSION_KEY))
  } catch {
    return false
  }
}

export function MerchantProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useMerchantAuth()
  const hasSession = hasMerchantSession()

  if (isLoading || (hasSession && !isAuthenticated)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/commercant/connexion" replace />
  }

  return <>{children}</>
}

export function MerchantPublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useMerchantAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/commercant" replace />
  }

  return <>{children}</>
}
