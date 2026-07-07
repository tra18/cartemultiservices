import { Resend } from 'resend'
import { ALLOWED_EMAIL_TYPES, buildEmail } from './_lib/emailTemplates.js'
import {
  getApiSecret,
  getClientIp,
  getRedis,
  isValidEmail,
  parseBody,
  rateLimit,
  verifyApiSecret,
} from './_lib/security.js'

const resendApiKey = process.env.RESEND_API_KEY
const emailFrom = process.env.EMAIL_FROM
const replyTo = process.env.EMAIL_REPLY_TO

function toHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br />')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!getApiSecret()) {
    return res.status(503).json({ error: 'API not configured' })
  }

  if (!verifyApiSecret(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (!resendApiKey || !emailFrom) {
    return res.status(503).json({ error: 'Email service not configured' })
  }

  const redis = getRedis()
  const ip = getClientIp(req)
  if (redis) {
    const allowed = await rateLimit(redis, `rate:send-email:${ip}`, 40, 3600)
    if (!allowed) {
      return res.status(429).json({ error: 'Too many requests' })
    }
  }

  const { type, data } = parseBody(req)
  if (!type || !ALLOWED_EMAIL_TYPES.has(type)) {
    return res.status(400).json({ error: 'Invalid email type' })
  }

  const email = buildEmail(type, data ?? {})
  if (!email?.to || !email.subject || !email.text) {
    return res.status(400).json({ error: 'Invalid email payload' })
  }

  if (!isValidEmail(email.to)) {
    return res.status(400).json({ error: 'Invalid recipient' })
  }

  try {
    const resend = new Resend(resendApiKey)
    const result = await resend.emails.send({
      from: emailFrom,
      to: [email.to],
      subject: email.subject,
      text: email.text,
      html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">${toHtml(email.text)}</div>`,
      ...(replyTo ? { replyTo } : {}),
    })

    if (result.error) {
      console.error('Resend API error', result.error)
      return res.status(500).json({ error: result.error.message ?? 'Email send failed' })
    }

    return res.status(200).json({ ok: true, id: result.data?.id ?? null })
  } catch (error) {
    console.error('Resend send failed', error)
    return res.status(500).json({ error: 'Email send failed' })
  }
}
