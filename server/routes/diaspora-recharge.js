import { randomUUID } from 'crypto'
import { sendTypedEmail } from '../lib/mailer.js'
import { creditUserRecharge, findBeneficiaryUser } from '../lib/clientUsers.js'
import {
  getClientIp,
  getRedis,
  isValidEmail,
  parseBody,
  rateLimit,
  sanitizeText,
} from '../lib/security.js'

const DIASPORA_RECHARGES_KEY = 'diaspora-recharges'
const MAX_LOG = 300
const MAX_AMOUNT = 5_000_000
const MIN_AMOUNT = 10_000

const PAYMENT_METHODS = new Set(['visa', 'mastercard', 'paypal', 'bank-transfer'])

const PAYMENT_METHOD_LABELS = {
  visa: 'Visa diaspora',
  mastercard: 'Mastercard diaspora',
  paypal: 'PayPal diaspora',
  'bank-transfer': 'Virement diaspora',
}

function isValidPayload(body) {
  if (!body || typeof body !== 'object') return false
  const hasBeneficiary =
    (typeof body.beneficiaryEmail === 'string' && body.beneficiaryEmail.trim()) ||
    (typeof body.beneficiaryPhone === 'string' && body.beneficiaryPhone.trim()) ||
    (typeof body.beneficiaryCard === 'string' && body.beneficiaryCard.trim())
  if (!hasBeneficiary) return false
  if (typeof body.payerName !== 'string' || body.payerName.trim().length < 2) return false
  if (!isValidEmail(body.payerEmail)) return false
  if (typeof body.payerCountry !== 'string' || !body.payerCountry.trim()) return false
  if (!PAYMENT_METHODS.has(body.paymentMethod)) return false
  const amount = Number(body.amount)
  if (!Number.isFinite(amount) || amount < MIN_AMOUNT || amount > MAX_AMOUNT) return false
  return true
}

async function logRecharge(redis, entry) {
  const existing = (await redis.get(DIASPORA_RECHARGES_KEY)) ?? []
  await redis.set(DIASPORA_RECHARGES_KEY, [entry, ...existing].slice(0, MAX_LOG))
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const redis = getRedis()
  if (!redis) {
    return res.status(503).json({ error: 'Service indisponible' })
  }

  const ip = getClientIp(req)
  const allowed = await rateLimit(redis, `rate:diaspora-recharge:${ip}`, 8, 3600)
  if (!allowed) {
    return res.status(429).json({ error: 'Trop de tentatives. Réessayez plus tard.' })
  }

  const body = parseBody(req)
  if (body._honeypot) {
    return res.status(200).json({ ok: true })
  }

  if (!isValidPayload(body)) {
    return res.status(400).json({ error: 'Données de recharge invalides' })
  }

  const payerEmail = body.payerEmail.trim().toLowerCase()
  const allowedEmail = await rateLimit(redis, `rate:diaspora-recharge-email:${payerEmail}`, 3, 86_400)
  if (!allowedEmail) {
    return res.status(429).json({ error: 'Limite de recharges atteinte pour cet email aujourd’hui.' })
  }

  try {
    const beneficiary = await findBeneficiaryUser(redis, {
      email: body.beneficiaryEmail,
      phone: body.beneficiaryPhone,
      cardNumber: body.beneficiaryCard,
    })

    if (!beneficiary) {
      return res.status(404).json({ error: 'Bénéficiaire introuvable. Vérifiez l’email, le téléphone ou le numéro de carte.' })
    }

    const methodLabel =
      PAYMENT_METHOD_LABELS[body.paymentMethod] ?? 'Recharge diaspora'

    const detail = `Recharge diaspora de ${sanitizeText(body.payerName, 80)} (${sanitizeText(body.payerCountry, 40)})`

    const result = await creditUserRecharge(redis, beneficiary.id, {
      amount: body.amount,
      method: methodLabel,
      detail,
    })

    if (!result.ok) {
      return res.status(400).json({ error: result.error ?? 'Recharge échouée' })
    }

    const entry = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      beneficiaryId: beneficiary.id,
      beneficiaryName: beneficiary.fullName,
      payerName: sanitizeText(body.payerName, 80),
      payerEmail,
      payerCountry: sanitizeText(body.payerCountry, 40),
      amount: body.amount,
      paymentMethod: body.paymentMethod,
    }
    await logRecharge(redis, entry)

    try {
      await sendTypedEmail('diaspora_recharge_beneficiary', {
        email: beneficiary.email,
        fullName: beneficiary.fullName,
        amount: body.amount,
        payerName: entry.payerName,
        newBalance: result.user.balance,
      })

      await sendTypedEmail('diaspora_recharge_payer', {
        email: payerEmail,
        payerName: entry.payerName,
        beneficiaryName: beneficiary.fullName,
        amount: body.amount,
      })
    } catch (emailError) {
      console.error('diaspora-recharge email error', emailError)
    }

    return res.status(200).json({
      ok: true,
      beneficiaryName: beneficiary.fullName,
      newBalance: result.user.balance,
      transactionId: result.transaction.id,
    })
  } catch (error) {
    console.error('diaspora-recharge error', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
