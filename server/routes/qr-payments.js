import { verifyClientSession } from '../lib/clientSessions.js'
import {
  cancelQrPayment,
  completeQrPaymentOnServer,
  createQrPayment,
  getQrPayment,
} from '../lib/qrPayments.js'
import { getClientIp, getRedis, parseBody, rateLimit, sanitizeText } from '../lib/security.js'

function getPathname(req) {
  const forwarded = req.headers['x-forwarded-uri'] ?? req.headers['x-vercel-original-url']
  if (typeof forwarded === 'string' && forwarded.startsWith('/api/')) {
    return forwarded.split('?')[0]
  }

  const raw = req.url ?? ''
  if (raw.startsWith('/')) return raw.split('?')[0]
  try {
    return new URL(raw, 'http://localhost').pathname
  } catch {
    return raw.split('?')[0]
  }
}

function extractPaymentId(path) {
  const match = path.match(/^\/api\/qr-payments\/([^/]+)$/)
  return match ? decodeURIComponent(match[1]) : null
}

export default async function handler(req, res) {
  const redis = getRedis()
  if (!redis) {
    return res.status(503).json({ error: 'Service indisponible (Redis requis)' })
  }

  const path = getPathname(req)
  const ip = getClientIp(req)

  if (path === '/api/qr-payments') {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST')
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const allowed = await rateLimit(redis, `rate:qr-payments:${ip}`, 60, 3600)
    if (!allowed) return res.status(429).json({ error: 'Trop de requêtes' })

    const body = parseBody(req)
    const action = typeof body.action === 'string' ? body.action : ''

    if (action === 'create') {
      const result = await createQrPayment(redis, {
        merchantId: body.merchantId,
        merchantName: body.merchantName,
        category: body.category,
        amount: body.amount,
      })
      if (!result.ok) return res.status(400).json(result)
      return res.status(200).json(result)
    }

    if (action === 'cancel') {
      const paymentId = sanitizeText(body.paymentId, 80)
      const merchantId = sanitizeText(body.merchantId, 80)
      if (!paymentId || !merchantId) {
        return res.status(400).json({ error: 'Paramètres manquants' })
      }
      const result = await cancelQrPayment(redis, paymentId, merchantId)
      if (!result.ok) return res.status(400).json(result)
      return res.status(200).json(result)
    }

    if (action === 'pay') {
      const session = await verifyClientSession(req, redis)
      if (!session) return res.status(401).json({ error: 'Non connecté' })

      const paymentId = sanitizeText(body.paymentId, 80)
      const pin = String(body.pin ?? '').trim()
      if (!paymentId || !/^\d{4}$/.test(pin)) {
        return res.status(400).json({ error: 'Paramètres invalides' })
      }

      const allowedPay = await rateLimit(redis, `rate:qr-pay:${session.userId}`, 20, 3600)
      if (!allowedPay) return res.status(429).json({ error: 'Trop de tentatives' })

      const result = await completeQrPaymentOnServer(redis, {
        paymentId,
        userId: session.userId,
        pin,
      })
      if (!result.ok) return res.status(400).json(result)
      return res.status(200).json(result)
    }

    return res.status(400).json({ error: 'Action inconnue' })
  }

  const paymentId = extractPaymentId(path)
  if (paymentId) {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET')
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const allowed = await rateLimit(redis, `rate:qr-payment-get:${ip}`, 120, 3600)
    if (!allowed) return res.status(429).json({ error: 'Trop de requêtes' })

    const payment = await getQrPayment(redis, paymentId)
    if (!payment) return res.status(404).json({ error: 'Paiement introuvable' })
    return res.status(200).json({ payment })
  }

  return res.status(404).json({ error: 'Not found' })
}
