import { sendTypedEmail } from './_lib/mailer.js'
import { canEnableDigitalCard, getOrderByUserId } from './_lib/ordersStore.js'
import { verifyClientSession } from './_lib/clientSessions.js'
import { getUserById, saveUser } from './_lib/clientUsers.js'
import { hashPassword } from './_lib/password.js'
import { getClientIp, getRedis, parseBody, rateLimit } from './_lib/security.js'

function generateCardNumber() {
  const prefix = '2121'
  const body = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('')
  return `${prefix}${body}`
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

  const ip = getClientIp(req)
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
  if (!user) {
    return res.status(404).json({ error: 'Compte introuvable' })
  }
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
