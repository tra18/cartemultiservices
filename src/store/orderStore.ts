import { sendActivationCodeEmail, sendCardShippedEmail, sendWelcomeAccountEmail } from '../services/emailService'
import type { CardStatus } from '../types/order'
import type { CardOrder, CardOrderFormData } from '../types/order'
import type { UserAccount } from '../types/auth'
import { generateCardNumber, generateCardToken } from '../utils/card'
import { CARD_PRICE } from '../utils/pricing'
import { recordCardOrderRevenue } from './treasuryStore'
import { normalizeEmail, sanitizeText } from '../utils/validation'

const ORDERS_KEY = 'carte-multiservice-card-orders'
const USERS_KEY = 'carte-multiservice-users'

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

function generateActivationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function normalizeOrder(o: CardOrder): CardOrder {
  return {
    ...o,
    activationEmailSentAt: o.activationEmailSentAt ?? o.createdAt,
    cardActivated: o.cardActivated ?? false,
  }
}

export function loadCardOrders(): CardOrder[] {
  return loadJson<CardOrder[]>(ORDERS_KEY, []).map(normalizeOrder)
}

export function saveCardOrders(orders: CardOrder[]) {
  saveJson(ORDERS_KEY, orders)
}

export function getCardOrderById(orderId: string): CardOrder | undefined {
  return loadCardOrders().find((o) => o.id === orderId)
}

export function getCardOrderByUserId(userId: string): CardOrder | undefined {
  return loadCardOrders().find((o) => o.userId === userId && o.status !== 'cancelled')
}

export function getCardOrderByToken(cardToken: string): CardOrder | undefined {
  const token = cardToken.trim().toUpperCase()
  return loadCardOrders().find((o) => o.cardToken?.toUpperCase() === token)
}

function syncUserCardStatus(userId: string, cardStatus: CardStatus, cardNumber?: string) {
  const users = loadJson<UserAccount[]>(USERS_KEY, [])
  const updated = users.map((u) => {
    if (u.id !== userId) return u
    return {
      ...u,
      cardStatus,
      ...(cardNumber ? { cardNumber } : {}),
    }
  })
  saveJson(USERS_KEY, updated)
}

export function createCardOrder(userId: string, data: CardOrderFormData): CardOrder {
  const activationCode = generateActivationCode()
  const now = new Date().toISOString()

  const safeEmail = normalizeEmail(data.email)
  const safeName = sanitizeText(data.fullName, 80)

  sendActivationCodeEmail(safeEmail, safeName, activationCode)
  sendWelcomeAccountEmail(safeEmail, safeName)

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
    status: 'paid',
    activationCode,
    activationEmailSentAt: now,
    cardActivated: false,
    createdAt: now,
  }

  const orders = loadCardOrders()
  saveCardOrders([order, ...orders])
  recordCardOrderRevenue(order.id, CARD_PRICE, safeName)
  return order
}

export function produceCard(
  orderId: string
): { success: boolean; error?: string; order?: CardOrder } {
  const orders = loadCardOrders()
  const index = orders.findIndex((o) => o.id === orderId)
  if (index === -1) return { success: false, error: 'Commande introuvable' }

  const order = orders[index]
  if (order.status === 'cancelled' || order.status === 'delivered') {
    return { success: false, error: 'Cette commande ne peut plus être produite' }
  }
  if (order.cardActivated) {
    return { success: false, error: 'Carte déjà activée par le client' }
  }

  if (order.cardNumber && order.cardToken) {
    return { success: true, order }
  }

  const updated: CardOrder = {
    ...order,
    cardNumber: generateCardNumber(),
    cardToken: generateCardToken(),
    producedAt: new Date().toISOString(),
    status: order.status === 'paid' ? 'processing' : order.status,
  }

  orders[index] = updated
  saveCardOrders(orders)
  return { success: true, order: updated }
}

export function markOrderShipped(
  orderId: string
): { success: boolean; error?: string; order?: CardOrder } {
  const orders = loadCardOrders()
  const index = orders.findIndex((o) => o.id === orderId)
  if (index === -1) return { success: false, error: 'Commande introuvable' }

  const order = orders[index]
  if (!order.cardNumber || !order.cardToken) {
    return { success: false, error: 'Produisez la carte avant l\'expédition' }
  }
  if (order.status !== 'processing' && order.status !== 'paid') {
    return { success: false, error: 'Statut de commande invalide pour expédition' }
  }
  if (order.cardActivated) {
    return { success: false, error: 'Carte déjà activée' }
  }

  const updated: CardOrder = { ...order, status: 'shipped' }
  orders[index] = updated
  saveCardOrders(orders)

  sendCardShippedEmail(order.email, order.userName)
  syncUserCardStatus(order.userId, 'shipped', order.cardNumber)

  return { success: true, order: updated }
}

export function activateCardWithCode(
  userId: string,
  code: string,
  cardToken?: string
): { success: boolean; error?: string; cardNumber?: string } {
  const order = getCardOrderByUserId(userId)
  if (!order) return { success: false, error: 'Aucune commande de carte trouvée' }
  if (order.cardActivated) {
    return { success: false, error: 'Cette carte a déjà été activée' }
  }
  if (order.status !== 'shipped' && order.status !== 'delivered') {
    return {
      success: false,
      error: 'Votre carte n\'est pas encore arrivée. Vous pourrez l\'activer après réception.',
    }
  }
  if (!order.cardNumber || !order.cardToken) {
    return {
      success: false,
      error: 'Carte non encore produite. Contactez le support.',
    }
  }

  if (cardToken?.trim()) {
    if (order.cardToken.toUpperCase() !== cardToken.trim().toUpperCase()) {
      return {
        success: false,
        error: 'Ce QR code ne correspond pas à votre commande.',
      }
    }
  }

  if (!code.trim()) {
    return { success: false, error: 'Veuillez saisir le code reçu par email' }
  }
  if (order.activationCode.toUpperCase() !== code.trim().toUpperCase()) {
    return {
      success: false,
      error: 'Code incorrect. Vérifiez le code reçu par email lors de votre commande.',
    }
  }

  const orders = loadCardOrders()
  saveCardOrders(
    orders.map((o) =>
      o.id === order.id ? { ...o, cardActivated: true, status: 'delivered' as const } : o
    )
  )
  syncUserCardStatus(userId, 'active', order.cardNumber)

  return { success: true, cardNumber: order.cardNumber }
}

/** Rétrocompatibilité démo — préférer le portail admin */
export function simulateOrderReady(userId: string) {
  const order = getCardOrderByUserId(userId)
  if (!order) return

  if (!order.cardNumber || !order.cardToken) {
    produceCard(order.id)
  }
  markOrderShipped(order.id)
}
