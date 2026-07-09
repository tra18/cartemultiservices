import { useAuth } from '../context/AuthContext'
import { useAdminAuth } from '../context/AdminAuthContext'
import { useMerchantAuth } from '../context/MerchantAuthContext'
import { useIdleTimeout } from '../hooks/useIdleTimeout'

export function IdleSessionGuard() {
  const { isAuthenticated: isClient, logout: logoutClient } = useAuth()
  const { isAuthenticated: isAdmin, logout: logoutAdmin } = useAdminAuth()
  const { isAuthenticated: isMerchant, logout: logoutMerchant } = useMerchantAuth()

  const isActive = isClient || isAdmin || isMerchant

  useIdleTimeout({
    enabled: isActive,
    onIdle: () => {
      if (isClient) void logoutClient()
      if (isAdmin) void logoutAdmin()
      if (isMerchant) logoutMerchant()
    },
  })

  return null
}
