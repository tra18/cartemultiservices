import type { CardOrder } from '../types/order'
import { getClientAuthHeaders } from './clientAuth'
import { getAdminAuthHeaders } from './apiClient'

export async function syncOrderToServer(order: CardOrder, options?: { admin?: boolean }) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (options?.admin) {
    Object.assign(headers, getAdminAuthHeaders())
  } else {
    Object.assign(headers, getClientAuthHeaders())
  }

  const response = await fetch('/api/orders', {
    method: 'POST',
    headers,
    body: JSON.stringify(order),
  })

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(data.error ?? 'Synchronisation commande échouée')
  }

  const data = (await response.json()) as { order?: CardOrder }
  return data.order ?? order
}

export async function fetchServerOrders(): Promise<CardOrder[]> {
  const response = await fetch('/api/orders', {
    headers: getAdminAuthHeaders(),
  })
  if (!response.ok) return []
  return (await response.json()) as CardOrder[]
}

export async function fetchMyOrder(): Promise<CardOrder | null> {
  const response = await fetch('/api/orders-mine', {
    headers: getClientAuthHeaders(),
  })
  if (!response.ok) return null
  const data = (await response.json()) as { order: CardOrder | null }
  return data.order
}

export async function adminOrderAction(
  action: 'approve' | 'reject' | 'produce' | 'ship',
  orderId: string,
  reason?: string
): Promise<{ ok: boolean; error?: string; order?: CardOrder }> {
  const response = await fetch('/api/orders-admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAdminAuthHeaders() },
    body: JSON.stringify({ action, orderId, reason }),
  })

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string }
    return { ok: false, error: data.error ?? 'Action échouée' }
  }

  const data = (await response.json()) as { order?: CardOrder }
  return { ok: true, order: data.order }
}

export async function activateCardOnServer(payload: {
  activationCode: string
  cardPin: string
  cardToken?: string
}): Promise<{ ok: boolean; error?: string; cardNumber?: string }> {
  const response = await fetch('/api/card-activate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getClientAuthHeaders() },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string }
    return { ok: false, error: data.error ?? 'Activation échouée' }
  }

  const data = (await response.json()) as { cardNumber?: string }
  return { ok: true, cardNumber: data.cardNumber }
}

export async function enableDigitalCardOnServer(
  cardPin: string
): Promise<{ ok: boolean; error?: string; digitalCardNumber?: string }> {
  const response = await fetch('/api/digital-card', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getClientAuthHeaders() },
    body: JSON.stringify({ cardPin }),
  })

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string }
    return { ok: false, error: data.error ?? 'Activation carte numérique échouée' }
  }

  const data = (await response.json()) as { digitalCardNumber?: string }
  return { ok: true, digitalCardNumber: data.digitalCardNumber }
}

export async function verifyCardPinOnServer(
  pin: string
): Promise<{ ok: boolean; error?: string; blocked?: boolean }> {
  const response = await fetch('/api/verify-card-pin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getClientAuthHeaders() },
    body: JSON.stringify({ pin }),
  })
  const data = (await response.json().catch(() => ({}))) as {
    ok?: boolean
    error?: string
    blocked?: boolean
  }
  if (!response.ok) {
    return { ok: false, error: data.error ?? 'PIN incorrect', blocked: data.blocked }
  }
  return { ok: Boolean(data.ok) }
}

export async function cardSecurityAction(
  action: 'block' | 'unblock',
  pin?: string,
  reason?: 'loss'
): Promise<{ ok: boolean; error?: string; cardStatus?: string }> {
  const response = await fetch('/api/card-security', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getClientAuthHeaders() },
    body: JSON.stringify({ action, pin, reason }),
  })
  const data = (await response.json().catch(() => ({}))) as {
    ok?: boolean
    error?: string
    cardStatus?: string
  }
  if (!response.ok) {
    return { ok: false, error: data.error ?? 'Action échouée' }
  }
  return { ok: true, cardStatus: data.cardStatus }
}

export async function requestCardPinResetOnServer(): Promise<{
  ok: boolean
  error?: string
  email?: string
}> {
  const response = await fetch('/api/reset-card-pin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getClientAuthHeaders() },
    body: JSON.stringify({ action: 'request' }),
  })
  const data = (await response.json().catch(() => ({}))) as {
    ok?: boolean
    error?: string
    email?: string
  }
  if (!response.ok) {
    return { ok: false, error: data.error ?? 'Envoi du code échoué' }
  }
  return { ok: true, email: data.email }
}

export async function confirmCardPinResetOnServer(
  code: string,
  newPin: string
): Promise<{ ok: boolean; error?: string; cardStatus?: string }> {
  const response = await fetch('/api/reset-card-pin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getClientAuthHeaders() },
    body: JSON.stringify({ action: 'confirm', code, newPin }),
  })
  const data = (await response.json().catch(() => ({}))) as {
    ok?: boolean
    error?: string
    cardStatus?: string
  }
  if (!response.ok) {
    return { ok: false, error: data.error ?? 'Réinitialisation échouée' }
  }
  return { ok: true, cardStatus: data.cardStatus }
}

/** Le serveur fait foi — le local sert de cache d'affichage uniquement */
export function mergeOrders(localOrders: CardOrder[], serverOrders: CardOrder[]): CardOrder[] {
  const byId = new Map<string, CardOrder>()

  for (const order of localOrders) {
    byId.set(order.id, order)
  }

  for (const order of serverOrders) {
    const existing = byId.get(order.id)
    byId.set(order.id, existing ? { ...existing, ...order } : order)
  }

  return [...byId.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export function normalizeOrderStatus(status: string): string {
  if (status === 'paid') return 'pending_review'
  if (status === 'delivered') return 'activated'
  return status
}

export function isOrderActivated(order: CardOrder | null | undefined): boolean {
  if (!order) return false
  return order.cardActivated || normalizeOrderStatus(order.status) === 'activated'
}
