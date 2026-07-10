import { randomUUID } from 'crypto'
import { getUserById, saveUser } from './clientUsers.js'
import { recordQrSaleInFinance, loadFinanceMerchants } from './financeStore.js'
import { verifyPassword } from './password.js'
import { maskCardNumber, getSiteUrl } from './walletCommon.js'

const TOKEN_PREFIX = 'wallet-pay-token:'
const USER_TOKEN_PREFIX = 'wallet-pay-user:'
const CHARGE_PREFIX = 'wallet-charge:'
const PENDING_PREFIX = 'wallet-charge-pending:'
const TOKEN_TTL_SEC = 60 * 60 * 24 * 365 * 2
const CHARGE_TTL_SEC = 15 * 60
const MAX_PIN_ATTEMPTS = 3

export function buildWalletPayQrUrl(token) {
  return `${getSiteUrl()}/wallet-pay/${encodeURIComponent(token)}`
}

export async function getOrCreateWalletPayToken(redis, userId) {
  const existing = await redis.get(`${USER_TOKEN_PREFIX}${userId}`)
  if (existing) {
    const mapped = await redis.get(`${TOKEN_PREFIX}${existing}`)
    if (mapped === userId) return existing
  }

  const token = randomUUID()
  await redis.set(`${TOKEN_PREFIX}${token}`, userId, { ex: TOKEN_TTL_SEC })
  await redis.set(`${USER_TOKEN_PREFIX}${userId}`, token, { ex: TOKEN_TTL_SEC })
  return token
}

export async function resolveWalletPayToken(redis, token) {
  const sanitized = String(token ?? '').trim()
  if (!sanitized) return null

  const userId = await redis.get(`${TOKEN_PREFIX}${sanitized}`)
  if (!userId) return null

  const user = await getUserById(redis, userId)
  if (!user) return null

  return { userId, user, token: sanitized }
}

function getEffectiveCardNumber(user) {
  const digital = String(user.digitalCardNumber ?? '').replace(/\s/g, '')
  if (digital.length >= 4) return user.digitalCardNumber
  const physical = String(user.cardNumber ?? '')
  if (physical.length >= 4 && physical !== 'En attente de carte') return user.cardNumber
  return user.cardNumber ?? ''
}

export function stripClientForMerchant(user) {
  return {
    fullName: user.fullName,
    maskedCard: maskCardNumber(getEffectiveCardNumber(user)),
    cardStatus: user.cardStatus ?? 'none',
  }
}

function isChargeExpired(charge) {
  return charge.status === 'pending' && new Date(charge.expiresAt) < new Date()
}

async function saveCharge(redis, charge) {
  await redis.set(`${CHARGE_PREFIX}${charge.id}`, charge, { ex: CHARGE_TTL_SEC })
}

async function getCharge(redis, chargeId) {
  const charge = await redis.get(`${CHARGE_PREFIX}${chargeId}`)
  if (!charge) return null
  if (isChargeExpired(charge)) {
    const expired = { ...charge, status: 'expired' }
    await saveCharge(redis, expired)
    if (charge.status === 'pending') {
      await redis.del(`${PENDING_PREFIX}${charge.userId}`)
    }
    return expired
  }
  return charge
}

async function clearPendingCharge(redis, userId, chargeId) {
  const pendingId = await redis.get(`${PENDING_PREFIX}${userId}`)
  if (pendingId === chargeId) {
    await redis.del(`${PENDING_PREFIX}${userId}`)
  }
}

export async function createWalletCharge(redis, { userId, merchantId, merchantName, category, amount }) {
  const parsedAmount = Number(amount)
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return { ok: false, error: 'Montant invalide' }
  }

  const user = await getUserById(redis, userId)
  if (!user) return { ok: false, error: 'Client introuvable' }
  if (user.cardStatus === 'blocked') {
    return { ok: false, error: 'Carte client bloquée' }
  }

  const merchants = await loadFinanceMerchants(redis)
  const merchant = merchants.find((item) => item.id === merchantId)
  if (!merchant) return { ok: false, error: 'Commerçant introuvable' }
  if (!merchant.categories?.includes(category)) {
    return { ok: false, error: 'Catégorie non autorisée pour ce commerçant' }
  }

  const existingPendingId = await redis.get(`${PENDING_PREFIX}${userId}`)
  if (existingPendingId) {
    const existing = await getCharge(redis, existingPendingId)
    if (existing?.status === 'pending') {
      await saveCharge(redis, { ...existing, status: 'cancelled' })
      await clearPendingCharge(redis, userId, existingPendingId)
    }
  }

  const now = new Date()
  const charge = {
    id: randomUUID(),
    userId,
    merchantId,
    merchantName: merchantName || merchant.businessName,
    category,
    amount: parsedAmount,
    status: 'pending',
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + CHARGE_TTL_SEC * 1000).toISOString(),
  }

  await saveCharge(redis, charge)
  await redis.set(`${PENDING_PREFIX}${userId}`, charge.id, { ex: CHARGE_TTL_SEC })

  return { ok: true, charge }
}

export async function getPendingWalletCharge(redis, userId) {
  const chargeId = await redis.get(`${PENDING_PREFIX}${userId}`)
  if (!chargeId) return null

  const charge = await getCharge(redis, chargeId)
  if (!charge || charge.status !== 'pending') {
    await clearPendingCharge(redis, userId, chargeId)
    return null
  }
  return charge
}

export async function getWalletChargeForMerchant(redis, chargeId, merchantId) {
  const charge = await getCharge(redis, chargeId)
  if (!charge || charge.merchantId !== merchantId) return null
  return charge
}

export async function cancelWalletCharge(redis, chargeId, { merchantId, userId } = {}) {
  const charge = await getCharge(redis, chargeId)
  if (!charge) return { ok: false, error: 'Demande introuvable' }
  if (charge.status !== 'pending') {
    return { ok: false, error: 'Cette demande n\'est plus annulable' }
  }
  if (merchantId && charge.merchantId !== merchantId) {
    return { ok: false, error: 'Non autorisé' }
  }
  if (userId && charge.userId !== userId) {
    return { ok: false, error: 'Non autorisé' }
  }

  const cancelled = { ...charge, status: 'cancelled' }
  await saveCharge(redis, cancelled)
  await clearPendingCharge(redis, charge.userId, chargeId)
  return { ok: true, charge: cancelled }
}

async function verifyUserCardPin(redis, user, pin) {
  if (user.cardStatus === 'blocked') {
    return { ok: false, error: 'Carte bloquée', blocked: true }
  }

  const hasHash = Boolean(user.cardPinHash)
  const hasLegacyPin = Boolean(user.cardPin)
  if (!hasHash && !hasLegacyPin) {
    return { ok: false, error: 'Aucun code PIN configuré' }
  }

  const pinOk =
    (hasHash && verifyPassword(pin, user.cardPinHash)) ||
    (hasLegacyPin && user.cardPin === pin)

  if (!pinOk) {
    const attempts = (user.pinFailedAttempts ?? 0) + 1
    const blocked = attempts >= MAX_PIN_ATTEMPTS
    await saveUser(redis, {
      ...user,
      pinFailedAttempts: attempts,
      ...(blocked
        ? { cardStatus: 'blocked', blockReason: 'pin_attempts', blockedAt: new Date().toISOString() }
        : {}),
    })
    return {
      ok: false,
      error: blocked
        ? 'Trop de tentatives incorrectes. Carte bloquée par sécurité.'
        : `Code PIN incorrect (${MAX_PIN_ATTEMPTS - attempts} essai(s) restant(s))`,
      blocked,
    }
  }

  if (user.pinFailedAttempts) {
    await saveUser(redis, { ...user, pinFailedAttempts: 0 })
  }

  return { ok: true }
}

export async function confirmWalletCharge(redis, { chargeId, userId, pin }) {
  const charge = await getCharge(redis, chargeId)
  if (!charge) return { ok: false, error: 'Demande de paiement introuvable' }
  if (charge.userId !== userId) return { ok: false, error: 'Non autorisé' }
  if (charge.status === 'paid') return { ok: false, error: 'Paiement déjà effectué' }
  if (charge.status !== 'pending') {
    return { ok: false, error: 'Cette demande n\'est plus valide' }
  }

  const user = await getUserById(redis, userId)
  if (!user) return { ok: false, error: 'Compte introuvable' }

  const pinResult = await verifyUserCardPin(redis, user, pin)
  if (!pinResult.ok) return pinResult

  if ((user.balance || 0) < charge.amount) {
    return { ok: false, error: 'Solde insuffisant sur votre carte' }
  }

  const now = new Date().toISOString()
  const transaction = {
    id: randomUUID(),
    type: 'paiement',
    category: charge.category,
    amount: charge.amount,
    date: now,
    method: 'QR Wallet',
    detail: charge.merchantName,
    merchant: charge.merchantName,
  }

  await saveUser(redis, {
    ...user,
    balance: (user.balance || 0) - charge.amount,
    transactions: [transaction, ...(user.transactions || [])],
  })

  const financeResult = await recordQrSaleInFinance(redis, {
    merchantId: charge.merchantId,
    paymentRequestId: charge.id,
    amount: charge.amount,
    customerName: user.fullName,
  })

  if (!financeResult.success) {
    await saveUser(redis, user)
    return { ok: false, error: financeResult.error ?? 'Synchronisation commerçant échouée' }
  }

  const paid = {
    ...charge,
    status: 'paid',
    paidAt: now,
    paidByUserName: user.fullName,
  }
  await saveCharge(redis, paid)
  await clearPendingCharge(redis, userId, chargeId)

  return {
    ok: true,
    charge: paid,
    transaction,
    merchant: financeResult.merchant,
    newBalance: (user.balance || 0) - charge.amount,
  }
}
