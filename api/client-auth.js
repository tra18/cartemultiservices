import { sendTypedEmail } from './_lib/mailer.js'
import {
  createUserRecord,
  getUserByEmail,
  isEmailAvailable,
  mergeUserPatch,
  saveUser,
  stripUserForClient,
} from './_lib/clientUsers.js'
import { createClientSession, destroyClientSession, verifyClientSession } from './_lib/clientSessions.js'
import { hashPassword, verifyPassword } from './_lib/password.js'
import {
  getClientIp,
  getRedis,
  isValidEmail,
  parseBody,
  rateLimit,
  sanitizeText,
} from './_lib/security.js'

function getUserAgent(req) {
  const ua = req.headers['user-agent']
  return typeof ua === 'string' ? ua.slice(0, 200) : 'unknown'
}

async function notifyLogin(redis, user, meta) {
  if (!redis) return
  await sendTypedEmail('client_login_alert', {
    email: user.email,
    fullName: user.fullName,
    userAgent: meta.userAgent,
    ip: meta.ip,
    date: new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Conakry' }),
  })
}

export default async function handler(req, res) {
  const redis = getRedis()
  if (!redis) {
    return res.status(503).json({ error: 'Service d\'authentification indisponible' })
  }

  try {
    if (req.method === 'GET') {
      const email = typeof req.query?.email === 'string' ? req.query.email : null
      if (email) {
        const available = await isEmailAvailable(redis, email)
        return res.status(200).json({ available })
      }

      const session = await verifyClientSession(req, redis)
      if (!session) {
        return res.status(401).json({ error: 'Session expirée ou utilisée sur un autre appareil' })
      }

      return res.status(200).json({
        ok: true,
        user: stripUserForClient(session.user),
      })
    }

    if (req.method === 'POST') {
      const ip = getClientIp(req)
      const allowed = await rateLimit(redis, `rate:client-auth:${ip}`, 30, 3600)
      if (!allowed) {
        return res.status(429).json({ error: 'Trop de tentatives. Réessayez plus tard.' })
      }

      const body = parseBody(req)
      const action = body.action === 'register' ? 'register' : 'login'
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
      const password = typeof body.password === 'string' ? body.password : ''

      if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Email invalide' })
      }
      if (password.length < 6) {
        return res.status(400).json({ error: 'Mot de passe trop court (6 caractères minimum)' })
      }

      const meta = { ip, userAgent: getUserAgent(req) }

      if (action === 'register') {
        const fullName = sanitizeText(body.fullName, 80)
        const phone = sanitizeText(body.phone, 30)
        const cardStatus = body.cardStatus === 'ordered' ? 'ordered' : 'none'

        if (!fullName) return res.status(400).json({ error: 'Nom requis' })
        if (!phone) return res.status(400).json({ error: 'Téléphone requis' })

        const available = await isEmailAvailable(redis, email)
        if (!available) {
          return res.status(409).json({ error: 'Cet email est déjà utilisé' })
        }

        const user = createUserRecord({
          email,
          passwordHash: hashPassword(password),
          fullName,
          phone,
          cardStatus,
        })
        await saveUser(redis, user)

        const { token } = await createClientSession(redis, user.id, meta)
        await notifyLogin(redis, user, meta)

        return res.status(201).json({
          ok: true,
          token,
          user: stripUserForClient(user),
        })
      }

      const user = await getUserByEmail(redis, email)
      if (!user || !verifyPassword(password, user.passwordHash)) {
        return res.status(401).json({ error: 'Email ou mot de passe incorrect' })
      }

      const { token } = await createClientSession(redis, user.id, meta)
      await notifyLogin(redis, user, meta)

      return res.status(200).json({
        ok: true,
        token,
        user: stripUserForClient(user),
      })
    }

    if (req.method === 'PATCH') {
      const session = await verifyClientSession(req, redis)
      if (!session) {
        return res.status(401).json({ error: 'Session expirée ou utilisée sur un autre appareil' })
      }

      const patch = parseBody(req)
      const forbidden = [
        'cardStatus',
        'cardNumber',
        'cardPin',
        'cardPinHash',
        'balance',
        'transactions',
        'digitalCardNumber',
        'digitalCardEnabledAt',
        'pinFailedAttempts',
      ]
      if (forbidden.some((key) => Object.prototype.hasOwnProperty.call(patch, key))) {
        return res.status(403).json({ error: 'Modification non autorisée' })
      }

      const updated = mergeUserPatch(session.user, patch)
      await saveUser(redis, updated)

      return res.status(200).json({
        ok: true,
        user: stripUserForClient(updated),
      })
    }

    if (req.method === 'DELETE') {
      const session = await verifyClientSession(req, redis)
      if (session) {
        await destroyClientSession(redis, session.token, session.userId)
      }
      return res.status(200).json({ ok: true })
    }

    res.setHeader('Allow', 'GET, POST, PATCH, DELETE')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('client-auth error', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
