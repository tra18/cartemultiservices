import type { CardOrder } from '../types/order'
import { getAdminAuthHeaders } from './apiClient'

export async function syncOrderToServer(order: CardOrder, options?: { admin?: boolean }) {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (options?.admin) {
      Object.assign(headers, getAdminAuthHeaders())
    }

    await fetch('/api/orders', {
      method: 'POST',
      headers,
      body: JSON.stringify(order),
    })
  } catch (error) {
    console.error('Order sync failed', error)
  }
}

export async function fetchServerOrders(): Promise<CardOrder[]> {
  try {
    const response = await fetch('/api/orders', {
      headers: getAdminAuthHeaders(),
    })
    if (!response.ok) return []
    return (await response.json()) as CardOrder[]
  } catch (error) {
    console.error('Order fetch failed', error)
    return []
  }
}

export function mergeOrders(localOrders: CardOrder[], serverOrders: CardOrder[]): CardOrder[] {
  const byId = new Map<string, CardOrder>()

  for (const order of serverOrders) {
    byId.set(order.id, order)
  }

  for (const order of localOrders) {
    const existing = byId.get(order.id)
    byId.set(order.id, existing ? { ...existing, ...order } : order)
  }

  return [...byId.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}
