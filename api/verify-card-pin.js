import { verifyClientSession } from './_lib/clientSessions.js'
import { getUserById, saveUser } from './_lib/clientUsers.js'
import { verifyPassword } from './_lib/password.js'
import { getClientIp, getRedis, parseBody, rateLimit } from './_lib/security.js'

const MAX_PIN_ATTEMPTS = 3

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
  if (!user) {
    return res.status(404).json({ error: 'Compte introuvable' })
  }

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
    const updated = {
      ...user,
      pinFailedAttempts: attempts,
      ...(blocked ? { cardStatus: 'blocked' } : {}),
    }
    await saveUser(redis, updated)
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
