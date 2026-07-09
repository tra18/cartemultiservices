import { sendTypedEmail } from './_lib/mailer.js'
import { activateOrderCard, canEnableDigitalCard, getOrderByUserId } from './_lib/ordersStore.js'
import { verifyClientSession } from './_lib/clientSessions.js'
import { getUserById, saveUser } from './_lib/clientUsers.js'
import { hashPassword, verifyPassword } from './_lib/password.js'
import { getClientIp, getRedis, parseBody, rateLimit } from './_lib/security.js'

const MAX_PIN_ATTEMPTS = 3

function getPathname(req) {
  const raw = req.url ?? ''
  if (raw.startsWith('/')) return raw.split('?')[0]
  try {
    return new URL(raw, 'http://localhost').pathname
  } catch {
    return raw.split('?')[0]
  }
}

function generateCardNumber() {
  const prefix = '2121'
  const body = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('')
  return `${prefix}${body}`
}

async function handleActivate(req, res, redis, session) {
  const allowed = await rateLimit(redis, `rate:card-activate:${session.userId}`, 10, 3600)
  if (!allowed) {
    return res.status(429).json({ error: 'Trop de tentatives. Réessayez plus tard.' })
  }

  try {
    const body = parseBody(req)
    const { cardNumber } = await activateOrderCard(redis, {
      userId: session.userId,
      activationCode: body.activationCode,
      cardPin: body.cardPin,
      cardToken: body.cardToken,
    })

    await sendTypedEmail('card_activated', {
      email: session.user.email,
      fullName: session.user.fullName,
      cardNumber,
    })

    return res.status(200).json({ ok: true, cardNumber })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Activation échouée'
    return res.status(400).json({ error: message })
  }
}

async function handleDigitalCard(req, res, redis, session) {
  const allowed = await rateLimit(redis, `rate:digital-card:${session.userId}`, 5, 3600)
  if (!allowed) {
    return res.status(429).json({ error: 'Trop de tentatives. Réessayez plus tard.' })
  }

  const body = parseBody(req)
  const pin = String(body.cardPin ?? '').trim()
  if (!/^\d{4}$/.test(pin)) {
    return res.status(400).json({ error: 'Le code PIN doit contenir 4 chiffres' })
  }

  const user = await getUserById(redis, session.userId)
  if (!user) return res.status(404).json({ error: 'Compte introuvable' })
  if (user.digitalCardEnabledAt) {
    return res.status(400).json({ error: 'Carte numérique déjà activée' })
  }
  if (user.cardStatus === 'active') {
    return res.status(400).json({ error: 'Carte physique déjà active' })
  }

  const order = await getOrderByUserId(redis, session.userId)
  if (!canEnableDigitalCard(order)) {
    return res.status(403).json({
      error: 'Carte numérique disponible après validation de votre commande par notre équipe.',
    })
  }

  const digitalCardNumber = generateCardNumber()
  const now = new Date().toISOString()

  await saveUser(redis, {
    ...user,
    digitalCardNumber,
    digitalCardEnabledAt: now,
    cardPinHash: hashPassword(pin),
    cardPin: undefined,
    pinFailedAttempts: 0,
  })

  await sendTypedEmail('digital_card', {
    email: user.email,
    fullName: user.fullName,
    digitalCardNumber,
  })

  return res.status(200).json({ ok: true, digitalCardNumber })
}

async function handleVerifyPin(req, res, redis, session) {
  const allowed = await rateLimit(redis, `rate:verify-pin:${session.userId}`, 20, 3600)
  if (!allowed) {
    return res.status(429).json({ error: 'Trop de tentatives. Réessayez plus tard.' })
  }

  const body = parseBody(req)
  const pin = String(body.pin ?? '').trim()
  if (!/^\d{4}$/.test(pin)) {
    return res.status(400).json({ error: 'PIN invalide' })
  }

  const user = await getUserById(redis, session.userId)
  if (!user) return res.status(404).json({ error: 'Compte introuvable' })

  if (user.cardStatus === 'blocked') {
    return res.status(403).json({ error: 'Carte bloquée', blocked: true })
  }

  const hasHash = Boolean(user.cardPinHash)
  const hasLegacyPin = Boolean(user.cardPin)
  if (!hasHash && !hasLegacyPin) {
    return res.status(400).json({ error: 'Aucun code PIN configuré' })
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
      ...(blocked ? { cardStatus: 'blocked' } : {}),
    })
    return res.status(400).json({
      ok: false,
      error: blocked
        ? 'Trop de tentatives incorrectes. Carte bloquée par sécurité.'
        : `Code PIN incorrect (${MAX_PIN_ATTEMPTS - attempts} essai(s) restant(s))`,
      blocked,
      attemptsRemaining: Math.max(0, MAX_PIN_ATTEMPTS - attempts),
    })
  }

  if (user.pinFailedAttempts) {
    await saveUser(redis, { ...user, pinFailedAttempts: 0 })
  }

  return res.status(200).json({ ok: true })
}

async function handleCardSecurity(req, res, redis, session) {
  const allowed = await rateLimit(redis, `rate:card-security:${session.userId}`, 20, 3600)
  if (!allowed) {
    return res.status(429).json({ error: 'Trop de tentatives. Réessayez plus tard.' })
  }

  const body = parseBody(req)
  const action = body.action === 'unblock' ? 'unblock' : body.action === 'block' ? 'block' : null
  if (!action) return res.status(400).json({ error: 'Action invalide' })

  const user = await getUserById(redis, session.userId)
  if (!user) return res.status(404).json({ error: 'Compte introuvable' })

  if (action === 'block') {
    if (user.cardStatus === 'blocked') {
      return res.status(400).json({ error: 'Carte déjà bloquée' })
    }
    await saveUser(redis, { ...user, cardStatus: 'blocked' })
    await sendTypedEmail('card_blocked', {
      email: user.email,
      fullName: user.fullName,
    })
    return res.status(200).json({ ok: true, cardStatus: 'blocked' })
  }

  if (user.cardStatus !== 'blocked') {
    return res.status(400).json({ error: 'La carte n\'est pas bloquée' })
  }

  const pin = String(body.pin ?? '').trim()
  const pinOk =
    (user.cardPinHash && verifyPassword(pin, user.cardPinHash)) ||
    (user.cardPin && user.cardPin === pin)

  if (!pinOk) return res.status(400).json({ error: 'Code PIN incorrect' })

  await saveUser(redis, {
    ...user,
    cardStatus: 'active',
    pinFailedAttempts: 0,
  })

  return res.status(200).json({ ok: true, cardStatus: 'active' })
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

  const session = await verifyClientSession(req, redis)
  if (!session) {
    return res.status(401).json({ error: 'Session expirée ou utilisée sur un autre appareil' })
  }

  const path = getPathname(req)

  if (path.endsWith('/card-activate')) return handleActivate(req, res, redis, session)
  if (path.endsWith('/digital-card')) return handleDigitalCard(req, res, redis, session)
  if (path.endsWith('/verify-card-pin')) return handleVerifyPin(req, res, redis, session)
  if (path.endsWith('/card-security')) return handleCardSecurity(req, res, redis, session)

  return res.status(404).json({ error: 'Route carte inconnue' })
}
