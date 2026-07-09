import { sendTypedEmail } from './_lib/mailer.js'
import {
  approveOrder,
  produceOrderCard,
  rejectOrder,
  shipOrder,
} from './_lib/ordersStore.js'
import { getClientIp, getRedis, parseBody, rateLimit, verifyAdminSession } from './_lib/security.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const redis = getRedis()
  if (!redis) {
    return res.status(503).json({ error: 'Service indisponible' })
  }

  const session = await verifyAdminSession(req, redis)
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const ip = getClientIp(req)
  const allowed = await rateLimit(redis, `rate:orders-admin:${ip}`, 120, 3600)
  if (!allowed) {
    return res.status(429).json({ error: 'Too many requests' })
  }

  const body = parseBody(req)
  const action = typeof body.action === 'string' ? body.action : ''
  const orderId = typeof body.orderId === 'string' ? body.orderId : ''

  if (!orderId) {
    return res.status(400).json({ error: 'orderId requis' })
  }

  try {
    if (action === 'approve') {
      const order = await approveOrder(redis, orderId, session.email)
      await sendTypedEmail('order_approved', {
        email: order.email,
        fullName: order.userName,
      })
      return res.status(200).json({ ok: true, order })
    }

    if (action === 'reject') {
      const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
      if (!reason) {
        return res.status(400).json({ error: 'Motif de refus requis' })
      }
      const order = await rejectOrder(redis, orderId, reason, session.email)
      await sendTypedEmail('order_rejected', {
        email: order.email,
        fullName: order.userName,
        reason,
      })
      return res.status(200).json({ ok: true, order })
    }

    if (action === 'produce') {
      const order = await produceOrderCard(redis, orderId)
      return res.status(200).json({ ok: true, order })
    }

    if (action === 'ship') {
      const order = await shipOrder(redis, orderId)
      await sendTypedEmail('card_shipped', {
        email: order.email,
        fullName: order.userName,
      })
      return res.status(200).json({ ok: true, order })
    }

    return res.status(400).json({ error: 'Action invalide' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Action échouée'
    return res.status(400).json({ error: message })
  }
}
