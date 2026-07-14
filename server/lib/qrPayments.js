import { randomUUID } from 'crypto'
import { getUserById, saveUser } from './clientUsers.js'
import { recordQrSaleInFinance, loadFinanceMerchants } from './financeStore.js'
import { verifyPassword } from './password.js'
import { sanitizeText } from './security.js'
import { getSiteUrl } from './walletCommon.js'

const PAYMENT_PREFIX = 'qr-payment:'
const MERCHANT_INDEX_PREFIX = 'qr-payment-merchant:'
const PAYMENT_TTL_SEC = 15 * 60
const MAX_PIN_ATTEMPTS = 3

const VALID_CATEGORIES = new Set([
  'restaurants',
  'transport',
  'vetements',
  'courses',
  'hopitaux',
  'cliniques',
  'pharmacies',
])

export function buildQrPaymentUrl(paymentId) {
  return `${getSiteUrl()}/paiement-qr/${encodeURIComponent(paymentId)}`
}

function isExpired(payment) {
  return payment.status === 'pending' && new Date(payment.expiresAt) < new Date()
}

async function savePayment(redis, payment) {
  await redis.set(`${PAYMENT_PREFIX}${payment.id}`, payment, { ex: PAYMENT_TTL_SEC })
}

async function getPaymentRaw(redis, paymentId) {
  return redis.get(`${PAYMENT_PREFIX}${paymentId}`)
}

export async function getQrPayment(redis, paymentId) {
  const payment = await getPaymentRaw(redis, paymentId)
  if (!payment) return null
  if (isExpired(payment)) {
    const expired = { ...payment, status: 'expired' }
    await savePayment(redis, expired)
    return expired
  }
  return payment
}

export async function createQrPayment(
  redis,
  { merchantId, merchantName, category, amount }
) {
  const parsedAmount = Number(amount)
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return { ok: false, error: 'Montant invalide' }
  }

  const merchantIdSafe = sanitizeText(merchantId, 80)
  const categorySafe = sanitizeText(category, 40)
  const nameSafe = sanitizeText(merchantName, 120)

  if (!merchantIdSafe || !nameSafe) {
    return { ok: false, error: 'Commerçant invalide' }
  }
  if (!VALID_CATEGORIES.has(categorySafe)) {
    return { ok: false, error: 'Catégorie invalide' }
  }

  const merchants = await loadFinanceMerchants(redis)
  const merchant = merchants.find((item) => item.id === merchantIdSafe)
  if (!merchant) {
    return {
      ok: false,
      error: 'Commerçant non synchronisé. Reconnectez-vous à l’espace commerçant.',
    }
  }
  if (!merchant.categories?.includes(categorySafe)) {
    return { ok: false, error: 'Catégorie non autorisée pour ce commerçant' }
  }

  const now = new Date()
  const payment = {
    id: randomUUID(),
    merchantId: merchantIdSafe,
    merchantName: nameSafe || merchant.businessName,
    category: categorySafe,
    amount: parsedAmount,
    status: 'pending',
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + PAYMENT_TTL_SEC * 1000).toISOString(),
  }

  await savePayment(redis, payment)
  await redis.set(`${MERCHANT_INDEX_PREFIX}${merchantIdSafe}:${payment.id}`, payment.id, {
    ex: PAYMENT_TTL_SEC,
  })

  return { ok: true, payment, qrUrl: buildQrPaymentUrl(payment.id) }
}

export async function cancelQrPayment(redis, paymentId, merchantId) {
  const payment = await getQrPayment(redis, paymentId)
  if (!payment) return { ok: false, error: 'Paiement introuvable' }
  if (payment.merchantId !== merchantId) {
    return { ok: false, error: 'Non autorisé' }
  }
  if (payment.status !== 'pending') {
    return { ok: false, error: 'Cette demande n’est plus annulable' }
  }

  const cancelled = { ...payment, status: 'cancelled' }
  await savePayment(redis, cancelled)
  return { ok: true, payment: cancelled }
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

function isCardUsable(user) {
  if (user.cardStatus === 'blocked') return false
  if (user.cardStatus === 'active') return true
  if (user.digitalCardEnabledAt) return true
  return false
}

export async function completeQrPaymentOnServer(redis, { paymentId, userId, pin }) {
  const payment = await getQrPayment(redis, paymentId)
  if (!payment) return { ok: false, error: 'Paiement introuvable' }
  if (payment.status === 'paid') {
    return { ok: false, error: 'Ce paiement a déjà été effectué' }
  }
  if (payment.status !== 'pending') {
    return { ok: false, error: 'Ce QR code n’est plus valide' }
  }

  const user = await getUserById(redis, userId)
  if (!user) return { ok: false, error: 'Compte introuvable' }
  if (!isCardUsable(user)) {
    return { ok: false, error: 'Carte non active. Activez votre carte pour payer.' }
  }

  const pinResult = await verifyUserCardPin(redis, user, pin)
  if (!pinResult.ok) return pinResult

  if ((user.balance || 0) < payment.amount) {
    return { ok: false, error: 'Solde insuffisant sur votre carte' }
  }

  const now = new Date().toISOString()
  const transaction = {
    id: randomUUID(),
    type: 'paiement',
    category: payment.category,
    amount: payment.amount,
    date: now,
    method: 'QR Code',
    detail: payment.merchantName,
    merchant: payment.merchantName,
  }

  await saveUser(redis, {
    ...user,
    balance: (user.balance || 0) - payment.amount,
    transactions: [transaction, ...(user.transactions || [])],
  })

  const financeResult = await recordQrSaleInFinance(redis, {
    merchantId: payment.merchantId,
    paymentRequestId: payment.id,
    amount: payment.amount,
    customerName: user.fullName,
  })

  if (!financeResult.success) {
    await saveUser(redis, user)
    return { ok: false, error: financeResult.error ?? 'Synchronisation commerçant échouée' }
  }

  const paid = {
    ...payment,
    status: 'paid',
    paidAt: now,
    paidByUserId: userId,
    paidByUserName: user.fullName,
  }
  await savePayment(redis, paid)

  return {
    ok: true,
    payment: paid,
    transaction,
    merchant: financeResult.merchant,
    newBalance: (user.balance || 0) - payment.amount,
  }
}
