export const ADMIN_TOKEN_KEY = 'carte-multiservice-admin-token'

export function getAdminAuthHeaders(): Record<string, string> {
  const token = sessionStorage.getItem(ADMIN_TOKEN_KEY)
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}
