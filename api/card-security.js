import { sendTypedEmail } from './_lib/mailer.js'
import { verifyClientSession } from './_lib/clientSessions.js'
import { getUserById, saveUser } from './_lib/clientUsers.js'
import { verifyPassword } from './_lib/password.js'
import { getClientIp, getRedis, parseBody, rateLimit } from './_lib/security.js'

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
  const allowed = await rateLimit(redis, `rate:card-security:${session.userId}`, 20, 3600)
  if (!allowed) {
    return res.status(429).json({ error: 'Trop de tentatives. Réessayez plus tard.' })
  }

  const body = parseBody(req)
  const action = body.action === 'unblock' ? 'unblock' : body.action === 'block' ? 'block' : null
  if (!action) {
    return res.status(400).json({ error: 'Action invalide' })
  }

  const user = await getUserById(redis, session.userId)
  if (!user) {
    return res.status(404).json({ error: 'Compte introuvable' })
  }

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

  if (!pinOk) {
    return res.status(400).json({ error: 'Code PIN incorrect' })
  }

  await saveUser(redis, {
    ...user,
    cardStatus: 'active',
    pinFailedAttempts: 0,
  })

  return res.status(200).json({ ok: true, cardStatus: 'active' })
}
