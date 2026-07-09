import { sendTypedEmail } from './_lib/mailer.js'
import {
  isValidOrderPayload,
  loadOrders,
  prepareNewOrder,
  stripOrderForAdmin,
  upsertOrder,
} from './_lib/ordersStore.js'
import { verifyClientSession } from './_lib/clientSessions.js'
import {
  getClientIp,
  getRedis,
  parseBody,
  rateLimit,
  verifyAdminSession,
} from './_lib/security.js'

async function sendNewOrderEmails(order, activationCode) {
  await sendTypedEmail('activation_code', {
    email: order.email,
    fullName: order.userName,
    activationCode,
  })
  await sendTypedEmail('welcome_account', {
    email: order.email,
    fullName: order.userName,
  })
  await sendTypedEmail('admin_order_notification', {
    customerName: order.userName,
    customerEmail: order.email,
    amount: order.amount,
    deliveryMethod: order.deliveryMethod,
  })
}

export default async function handler(req, res) {
  const redis = getRedis()
  if (!redis) {
    return res.status(503).json({ error: 'Order storage not configured' })
  }

  try {
    if (req.method === 'GET') {
      const session = await verifyAdminSession(req, redis)
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const orders = (await loadOrders(redis)).map(stripOrderForAdmin)
      return res.status(200).json(orders)
    }

    if (req.method === 'POST') {
      const adminSession = await verifyAdminSession(req, redis)
      const clientSession = adminSession ? null : await verifyClientSession(req, redis)
      const ip = getClientIp(req)
      const allowed = await rateLimit(redis, `rate:orders-post:${ip}`, 60, 3600)
      if (!allowed) {
        return res.status(429).json({ error: 'Too many requests' })
      }

      const body = parseBody(req)
      if (!isValidOrderPayload(body)) {
        return res.status(400).json({ error: 'Invalid order payload' })
      }

      const orders = await loadOrders(redis)
      const index = orders.findIndex((item) => item.id === body.id)
      const isNewOrder = index === -1

      if (isNewOrder) {
        if (!clientSession) {
          return res.status(401).json({ error: 'Session client requise pour créer une commande' })
        }
        if (body.userId !== clientSession.userId) {
          return res.status(403).json({ error: 'Commande non autorisée pour ce compte' })
        }

        const prepared = prepareNewOrder(body, body.activationCode)
        const activationCode = prepared._plainActivationCode
        delete prepared._plainActivationCode

        const { isNew } = await upsertOrder(redis, prepared)
        if (isNew) {
          await sendNewOrderEmails(prepared, activationCode)
        }

        return res.status(200).json({ ok: true, order: stripOrderForAdmin(prepared) })
      }

      if (!adminSession) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const previous = orders[index]
      const merged = { ...previous, ...body }
      await upsertOrder(redis, merged)

      if (merged.status === 'shipped' && previous?.status !== 'shipped') {
        await sendTypedEmail('card_shipped', {
          email: merged.email,
          fullName: merged.userName,
        })
      }

      return res.status(200).json({ ok: true })
    }

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('orders api error', error)
    return res.status(500).json({ error: 'Server error' })
  }
}
