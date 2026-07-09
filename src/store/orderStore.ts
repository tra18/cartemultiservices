import type { CardOrder, CardOrderFormData } from '../types/order'
import { recordCardOrderRevenue } from './treasuryStore'
import { CARD_PRICE } from '../utils/pricing'
import { normalizeEmail, sanitizeText } from '../utils/validation'
import {
  adminOrderAction,
  activateCardOnServer,
  fetchMyOrder,
  fetchServerOrders,
  isOrderActivated,
  mergeOrders,
  normalizeOrderStatus,
  syncOrderToServer,
} from '../services/orderServer'
import { getClientAuthHeaders } from '../services/clientAuth'

const ORDERS_KEY = 'carte-multiservice-card-orders'

function loadJson<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key)
    if (stored) return JSON.parse(stored) as T
  } catch {
    /* ignore */
  }
  return fallback
}

function saveJson<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data))
}

function normalizeOrder(o: CardOrder): CardOrder {
  return {
    ...o,
    status: normalizeOrderStatus(o.status) as CardOrder['status'],
    activationEmailSentAt: o.activationEmailSentAt ?? o.createdAt,
    cardActivated: o.cardActivated ?? isOrderActivated(o),
  }
}

export function loadCardOrders(): CardOrder[] {
  return loadJson<CardOrder[]>(ORDERS_KEY, []).map(normalizeOrder)
}

export function saveCardOrders(orders: CardOrder[]) {
  saveJson(ORDERS_KEY, orders)
}

export async function hydrateOrdersFromServer() {
  try {
    const serverOrders = await fetchServerOrders()
    const merged = mergeOrders(loadCardOrders(), serverOrders)
    saveCardOrders(merged)
    return merged
  } catch {
    return loadCardOrders()
  }
}

export async function hydrateMyOrderFromServer(userId: string): Promise<CardOrder | null> {
  try {
    const order = await fetchMyOrder()
    if (!order) return getCardOrderByUserId(userId) ?? null

    const normalized = normalizeOrder(order)
    const orders = loadCardOrders().filter((o) => o.id !== normalized.id)
    saveCardOrders([normalized, ...orders])
    return normalized
  } catch {
    return getCardOrderByUserId(userId) ?? null
  }
}

export function getCardOrderById(orderId: string): CardOrder | undefined {
  return loadCardOrders().find((o) => o.id === orderId)
}

export function getCardOrderByUserId(userId: string): CardOrder | undefined {
  const userOrders = loadCardOrders()
    .filter((o) => o.userId === userId && normalizeOrderStatus(o.status) !== 'rejected')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const inProgress = userOrders.find((o) => !isOrderActivated(o))
  return inProgress ?? userOrders[0]
}

export function getCardOrderByToken(cardToken: string): CardOrder | undefined {
  const token = cardToken.trim().toUpperCase()
  return loadCardOrders().find((o) => o.cardToken?.toUpperCase() === token)
}

export async function createCardOrder(userId: string, data: CardOrderFormData): Promise<CardOrder> {
  const now = new Date().toISOString()
  const safeEmail = normalizeEmail(data.email)
  const safeName = sanitizeText(data.fullName, 80)

  const order: CardOrder = {
    id: crypto.randomUUID(),
    userId,
    userName: safeName,
    email: safeEmail,
    phone: sanitizeText(data.phone, 20),
    address: sanitizeText(data.address, 200),
    city: sanitizeText(data.city, 60),
    deliveryMethod: data.deliveryMethod,
    amount: CARD_PRICE,
    paymentMethod: data.paymentMethod,
    status: 'pending_review',
    activationEmailSentAt: now,
    cardActivated: false,
    createdAt: now,
  }

  const synced = normalizeOrder(await syncOrderToServer(order))
  const orders = loadCardOrders().filter((o) => o.id !== synced.id)
  saveCardOrders([synced, ...orders])
  recordCardOrderRevenue(synced.id, synced.amount, safeName)
  return synced
}

export interface ReplacementOrderData {
  phone?: string
  address: string
  city: string
  deliveryMethod: CardOrder['deliveryMethod']
  paymentMethod: string
}

export async function createReplacementCardOrder(
  _userId: string,
  data: ReplacementOrderData
): Promise<CardOrder> {
  const response = await fetch('/api/orders-replacement', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getClientAuthHeaders() },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(payload.error ?? 'Commande de remplacement échouée')
  }

  const payload = (await response.json()) as { order?: CardOrder }
  if (!payload.order) throw new Error('Commande de remplacement échouée')

  const synced = normalizeOrder(payload.order)
  const orders = loadCardOrders().filter((o) => o.id !== synced.id)
  saveCardOrders([synced, ...orders])
  recordCardOrderRevenue(synced.id, synced.amount, synced.userName)
  return synced
}

export async function approveOrder(
  orderId: string
): Promise<{ success: boolean; error?: string; order?: CardOrder }> {
  const result = await adminOrderAction('approve', orderId)
  if (!result.ok || !result.order) {
    return { success: false, error: result.error }
  }
  updateLocalOrder(result.order)
  return { success: true, order: normalizeOrder(result.order) }
}

export async function rejectOrder(
  orderId: string,
  reason: string
): Promise<{ success: boolean; error?: string; order?: CardOrder }> {
  const result = await adminOrderAction('reject', orderId, reason)
  if (!result.ok || !result.order) {
    return { success: false, error: result.error }
  }
  updateLocalOrder(result.order)
  return { success: true, order: normalizeOrder(result.order) }
}

export async function produceCard(
  orderId: string
): Promise<{ success: boolean; error?: string; order?: CardOrder }> {
  const result = await adminOrderAction('produce', orderId)
  if (!result.ok || !result.order) {
    return { success: false, error: result.error }
  }
  updateLocalOrder(result.order)
  return { success: true, order: normalizeOrder(result.order) }
}

export async function markOrderShipped(
  orderId: string
): Promise<{ success: boolean; error?: string; order?: CardOrder }> {
  const result = await adminOrderAction('ship', orderId)
  if (!result.ok || !result.order) {
    return { success: false, error: result.error }
  }
  updateLocalOrder(result.order)
  return { success: true, order: normalizeOrder(result.order) }
}

function updateLocalOrder(order: CardOrder) {
  const normalized = normalizeOrder(order)
  const orders = loadCardOrders()
  const index = orders.findIndex((o) => o.id === normalized.id)
  if (index === -1) {
    saveCardOrders([normalized, ...orders])
    return
  }
  orders[index] = normalized
  saveCardOrders(orders)
}

export async function activateCardWithCode(
  _userId: string,
  code: string,
  cardPin: string,
  cardToken?: string
): Promise<{ success: boolean; error?: string; cardNumber?: string }> {
  const result = await activateCardOnServer({
    activationCode: code,
    cardPin,
    cardToken,
  })

  if (!result.ok) {
    return { success: false, error: result.error }
  }

  const order = await hydrateMyOrderFromServer(_userId)
  if (order) {
    updateLocalOrder({ ...order, cardActivated: true, status: 'activated' })
  }

  return { success: true, cardNumber: result.cardNumber }
}

/** @deprecated Désactivé en production — utiliser le portail admin */
export function simulateOrderReady(_userId: string) {
  console.warn('simulateOrderReady est désactivé — utilisez le portail admin')
}
