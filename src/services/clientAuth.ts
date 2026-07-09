import type { RegisterData, UserAccount } from '../types/auth'

export const CLIENT_TOKEN_KEY = 'carte-multiservice-client-token'

export function getClientAuthHeaders(): Record<string, string> {
  const token = sessionStorage.getItem(CLIENT_TOKEN_KEY)
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

async function readError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string }
    return data.error ?? 'Erreur de connexion'
  } catch {
    return 'Erreur de connexion'
  }
}

function storeSession(token: string) {
  sessionStorage.setItem(CLIENT_TOKEN_KEY, token)
}

export function clearClientSession() {
  sessionStorage.removeItem(CLIENT_TOKEN_KEY)
}

export async function checkEmailAvailable(email: string): Promise<boolean> {
  const response = await fetch(`/api/client-auth?email=${encodeURIComponent(email)}`)
  if (!response.ok) return false
  const data = (await response.json()) as { available?: boolean }
  return Boolean(data.available)
}

export async function fetchClientSession(): Promise<UserAccount | null> {
  const token = sessionStorage.getItem(CLIENT_TOKEN_KEY)
  if (!token) return null

  const response = await fetch('/api/client-auth', {
    headers: getClientAuthHeaders(),
  })

  if (!response.ok) {
    clearClientSession()
    return null
  }

  const data = (await response.json()) as { user: UserAccount }
  return data.user
}

export async function loginClient(email: string, password: string): Promise<{
  error?: string
  user?: UserAccount
}> {
  const response = await fetch('/api/client-auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', email, password }),
  })

  if (!response.ok) {
    return { error: await readError(response) }
  }

  const data = (await response.json()) as {
    token: string
    user: UserAccount
  }
  storeSession(data.token)
  return { user: data.user }
}

export async function registerClient(
  data: RegisterData & { cardStatus?: 'none' | 'ordered' }
): Promise<{ error?: string; user?: UserAccount }> {
  const response = await fetch('/api/client-auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'register',
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      phone: data.phone,
      cardStatus: data.cardStatus ?? 'none',
    }),
  })

  if (!response.ok) {
    return { error: await readError(response) }
  }

  const result = (await response.json()) as { token: string; user: UserAccount }
  storeSession(result.token)
  return { user: result.user }
}

export async function logoutClient(): Promise<void> {
  const headers = getClientAuthHeaders()
  clearClientSession()
  if (headers.Authorization) {
    await fetch('/api/client-auth', { method: 'DELETE', headers }).catch(() => {})
  }
}

export async function patchClientProfile(patch: Partial<UserAccount>): Promise<UserAccount | null> {
  const response = await fetch('/api/client-auth', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getClientAuthHeaders() },
    body: JSON.stringify(patch),
  })

  if (!response.ok) {
    if (response.status === 401) clearClientSession()
    return null
  }

  const data = (await response.json()) as { user: UserAccount }
  return data.user
}
