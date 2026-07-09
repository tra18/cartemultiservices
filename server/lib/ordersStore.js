import { randomBytes } from 'crypto'
import { hashPassword, verifyPassword } from './password.js'
import { getUserById, saveUser } from './clientUsers.js'
import { isValidEmail, sanitizeText } from './security.js'

export const ORDERS_KEY = 'card-orders'

const ACTIVATION_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateActivationCode() {
  return Array.from({ length: 6 }, () =>
    ACTIVATION_CHARS[Math.floor(Math.random() * ACTIVATION_CHARS.length)]
  ).join('')
}

export function generateCardNumber() {
  const prefix = '2121'
  const body = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('')
  return `${prefix}${body}`
}

export function generateCardToken() {
  return randomBytes(8).toString('hex').toUpperCase()
}

export function normalizeOrderStatus(status) {
  if (status === 'paid') return 'pending_review'
  if (status === 'delivered') return 'activated'
  return status
}

export function isOrderActivated(order) {
  return order.cardActivated === true || normalizeOrderStatus(order.status) === 'activated'
}

export function stripOrderForClient(order) {
  if (!order) return null
  const {
    activationCode,
    activationCodeHash,
    cardToken,
    ...safe
  } = order
  return {
    ...safe,
    status: normalizeOrderStatus(safe.status),
  }
}

export function stripOrderForAdmin(order) {
  if (!order) return null
  const { activationCode, activationCodeHash, ...safe } = order
  return {
    ...safe,
    status: normalizeOrderStatus(safe.status),
    hasActivationCode: Boolean(activationCodeHash || activationCode),
  }
}

export async function loadOrders(redis) {
  return (await redis.get(ORDERS_KEY)) ?? []
}

export async function saveOrders(redis, orders) {
  await redis.set(ORDERS_KEY, orders)
}

export async function getOrderById(redis, orderId) {
  const orders = await loadOrders(redis)
  return orders.find((item) => item.id === orderId) ?? null
}

export async function getOrderByUserId(redis, userId) {
  const orders = await loadOrders(redis)
  return (
    orders.find(
      (item) => item.userId === userId && normalizeOrderStatus(item.status) !== 'rejected'
    ) ?? null
  )
}

export async function upsertOrder(redis, order) {
  const orders = await loadOrders(redis)
  const index = orders.findIndex((item) => item.id === order.id)
  const next =
    index === -1
      ? [order, ...orders]
      : orders.map((item, itemIndex) => (itemIndex === index ? { ...item, ...order } : item))
  await saveOrders(redis, next)
  return { isNew: index === -1, previous: index === -1 ? null : orders[index] }
}

function assertTransition(order, allowedStatuses, errorMessage) {
  const status = normalizeOrderStatus(order.status)
  if (!allowedStatuses.includes(status)) {
    throw new Error(errorMessage)
  }
}

export async function approveOrder(redis, orderId, adminEmail) {
  const order = await getOrderById(redis, orderId)
  if (!order) throw new Error('Commande introuvable')
  assertTransition(order, ['pending_review', 'paid'], 'Cette commande ne peut pas être validée')

  const updated = {
    ...order,
    status: 'approved',
    adminApprovedAt: new Date().toISOString(),
    approvedBy: sanitizeText(adminEmail, 120),
  }
  await upsertOrder(redis, updated)
  return updated
}

export async function rejectOrder(redis, orderId, reason, adminEmail) {
  const order = await getOrderById(redis, orderId)
  if (!order) throw new Error('Commande introuvable')
  assertTransition(order, ['pending_review', 'paid'], 'Cette commande ne peut pas être refusée')

  const updated = {
    ...order,
    status: 'rejected',
    rejectedAt: new Date().toISOString(),
    rejectionReason: sanitizeText(reason, 300),
    rejectedBy: sanitizeText(adminEmail, 120),
  }
  await upsertOrder(redis, updated)
  return updated
}

export async function produceOrderCard(redis, orderId) {
  const order = await getOrderById(redis, orderId)
  if (!order) throw new Error('Commande introuvable')
  if (isOrderActivated(order)) throw new Error('Carte déjà activée par le client')

  const status = normalizeOrderStatus(order.status)
  if (!['approved', 'processing'].includes(status)) {
    throw new Error('La commande doit être validée par un admin avant production')
  }

  if (order.cardNumber && order.cardToken) {
    return order
  }

  const updated = {
    ...order,
    cardNumber: generateCardNumber(),
    cardToken: generateCardToken(),
    producedAt: new Date().toISOString(),
    status: 'processing',
  }
  await upsertOrder(redis, updated)
  return updated
}

export async function shipOrder(redis, orderId) {
  const order = await getOrderById(redis, orderId)
  if (!order) throw new Error('Commande introuvable')
  if (!order.cardNumber || !order.cardToken) {
    throw new Error('Produisez la carte avant l\'expédition')
  }
  if (isOrderActivated(order)) throw new Error('Carte déjà activée')

  const status = normalizeOrderStatus(order.status)
  if (status !== 'processing') {
    throw new Error('Statut invalide pour expédition')
  }
  if (!order.adminApprovedAt) {
    throw new Error('Commande non validée par un admin')
  }

  const updated = { ...order, status: 'shipped' }
  await upsertOrder(redis, updated)

  const user = await getUserById(redis, order.userId)
  if (user) {
    await saveUser(redis, {
      ...user,
      cardStatus: 'shipped',
      cardNumber: order.cardNumber,
    })
  }

  return updated
}

export async function activateOrderCard(redis, { userId, activationCode, cardPin, cardToken }) {
  const order = await getOrderByUserId(redis, userId)
  if (!order) throw new Error('Aucune commande de carte trouvée')
  if (isOrderActivated(order)) throw new Error('Cette carte a déjà été activée')

  const status = normalizeOrderStatus(order.status)
  if (status !== 'shipped') {
    throw new Error('Votre carte n\'est pas encore prête à être activée')
  }
  if (!order.adminApprovedAt) {
    throw new Error('Commande non validée par notre équipe')
  }
  if (!order.cardNumber || !order.cardToken) {
    throw new Error('Carte non encore produite. Contactez le support.')
  }

  if (cardToken?.trim()) {
    if (order.cardToken.toUpperCase() !== cardToken.trim().toUpperCase()) {
      throw new Error('Ce QR code ne correspond pas à votre commande')
    }
  }

  const code = String(activationCode ?? '').trim().toUpperCase()
  if (!code) throw new Error('Code d\'activation requis')

  const hash = order.activationCodeHash
  let codeValid = false
  if (hash) {
    codeValid = verifyPassword(code, hash)
  } else if (order.activationCode) {
    codeValid = order.activationCode.toUpperCase() === code
  }
  if (!codeValid) {
    throw new Error('Code incorrect. Vérifiez le code reçu par email lors de votre commande.')
  }

  const pin = String(cardPin ?? '').trim()
  if (!/^\d{4}$/.test(pin)) {
    throw new Error('Le code PIN doit contenir 4 chiffres')
  }

  const updated = {
    ...order,
    cardActivated: true,
    status: 'activated',
    activatedAt: new Date().toISOString(),
    activationCode: undefined,
    activationCodeHash: hash,
  }
  await upsertOrder(redis, updated)

  const user = await getUserById(redis, userId)
  if (!user) throw new Error('Compte client introuvable')

  await saveUser(redis, {
    ...user,
    cardStatus: 'active',
    cardNumber: order.cardNumber,
    cardPinHash: hashPassword(pin),
    cardPin: undefined,
    pinFailedAttempts: 0,
  })

  return { order: updated, cardNumber: order.cardNumber }
}

export function prepareNewOrder(order, activationCode) {
  const code = activationCode || generateActivationCode()
  return {
    ...order,
    status: 'pending_review',
    activationCode: undefined,
    activationCodeHash: hashPassword(code),
    cardActivated: false,
    adminApprovedAt: undefined,
    approvedBy: undefined,
    rejectedAt: undefined,
    rejectionReason: undefined,
    email: typeof order.email === 'string' ? order.email.trim().toLowerCase() : '',
    userName: sanitizeText(order.userName, 80),
    phone: sanitizeText(order.phone, 30),
    address: sanitizeText(order.address, 200),
    city: sanitizeText(order.city, 60),
    _plainActivationCode: code,
  }
}

export function isValidOrderPayload(order) {
  return (
    order &&
    typeof order.id === 'string' &&
    typeof order.userId === 'string' &&
    typeof order.userName === 'string' &&
    isValidEmail(order.email) &&
    typeof order.createdAt === 'string'
  )
}

export function canEnableDigitalCard(order) {
  if (!order || isOrderActivated(order)) return false
  const status = normalizeOrderStatus(order.status)
  return ['approved', 'processing', 'shipped'].includes(status)
}
