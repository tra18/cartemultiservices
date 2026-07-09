import { useAuth } from '../context/AuthContext'
import { useAdminAuth } from '../context/AdminAuthContext'
import { useMerchantAuth } from '../context/MerchantAuthContext'
import {
  ADMIN_IDLE_TIMEOUT_MS,
  CLIENT_IDLE_TIMEOUT_MS,
  MERCHANT_IDLE_TIMEOUT_MS,
} from '../constants/session'
import { useIdleTimeout } from '../hooks/useIdleTimeout'

export function IdleSessionGuard() {
  const { isAuthenticated: isClient, logout: logoutClient } = useAuth()
  const { isAuthenticated: isAdmin, logout: logoutAdmin } = useAdminAuth()
  const { isAuthenticated: isMerchant, logout: logoutMerchant } = useMerchantAuth()

  useIdleTimeout({
    enabled: isClient,
    timeoutMs: CLIENT_IDLE_TIMEOUT_MS,
    onIdle: () => {
      void logoutClient()
    },
  })

  useIdleTimeout({
    enabled: isMerchant,
    timeoutMs: MERCHANT_IDLE_TIMEOUT_MS,
    onIdle: () => {
      logoutMerchant()
    },
  })

  useIdleTimeout({
    enabled: isAdmin,
    timeoutMs: ADMIN_IDLE_TIMEOUT_MS,
    onIdle: () => {
      void logoutAdmin()
    },
  })

  return null
}
