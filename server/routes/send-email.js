import { sendTypedEmail } from '../lib/mailer.js'
import { ALLOWED_EMAIL_TYPES } from '../lib/emailTemplates.js'
import {
  getClientIp,
  getRedis,
  parseBody,
  rateLimit,
} from '../lib/security.js'

const SERVER_ONLY_TYPES = new Set([
  'activation_code',
  'welcome_account',
  'admin_order_notification',
  'card_shipped',
])

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const redis = getRedis()
  if (!redis) {
    return res.status(503).json({ error: 'Email service not configured' })
  }

  const { type, data } = parseBody(req)
  if (!type || !ALLOWED_EMAIL_TYPES.has(type)) {
    return res.status(400).json({ error: 'Invalid email type' })
  }

  if (SERVER_ONLY_TYPES.has(type)) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const ip = getClientIp(req)
  const allowed = await rateLimit(redis, `rate:send-email:${ip}`, 30, 3600)
  if (!allowed) {
    return res.status(429).json({ error: 'Too many requests' })
  }

  const result = await sendTypedEmail(type, data ?? {})
  if (!result.ok) {
    return res.status(500).json({ error: result.error ?? 'Email send failed' })
  }

  return res.status(200).json({ ok: true, id: result.id ?? null })
}
