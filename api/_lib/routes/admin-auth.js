import {
  createAdminSession,
  destroyAdminSession,
  getClientIp,
  getRedis,
  parseBody,
  rateLimit,
  verifyAdminSession,
} from '../security.js'

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? 'admin@mscarte.com').toLowerCase()
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? ''

export default async function handler(req, res) {
  const redis = getRedis()
  if (!redis) {
    return res.status(503).json({ error: 'Auth storage not configured' })
  }

  if (!ADMIN_PASSWORD) {
    return res.status(503).json({ error: 'Admin auth not configured' })
  }

  try {
    if (req.method === 'GET') {
      const session = await verifyAdminSession(req, redis)
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' })
      }
      return res.status(200).json({ ok: true, email: session.email })
    }

    if (req.method === 'POST') {
      const ip = getClientIp(req)
      const allowed = await rateLimit(redis, `rate:admin-login:${ip}`, 5, 900)
      if (!allowed) {
        return res.status(429).json({ error: 'Too many login attempts' })
      }

      const { email, password } = parseBody(req)
      if (
        typeof email !== 'string' ||
        typeof password !== 'string' ||
        email.trim().toLowerCase() !== ADMIN_EMAIL ||
        password !== ADMIN_PASSWORD
      ) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }

      const token = await createAdminSession(redis, ADMIN_EMAIL)
      return res.status(200).json({ ok: true, token, email: ADMIN_EMAIL })
    }

    if (req.method === 'DELETE') {
      const session = await verifyAdminSession(req, redis)
      if (session) {
        await destroyAdminSession(redis, session.token)
      }
      return res.status(200).json({ ok: true })
    }

    res.setHeader('Allow', 'GET, POST, DELETE')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('admin-auth error', error)
    return res.status(500).json({ error: 'Server error' })
  }
}
