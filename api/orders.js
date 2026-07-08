import { sendTypedEmail } from './_lib/mailer.js'
import {
  getClientIp,
  getRedis,
  isValidEmail,
  parseBody,
  rateLimit,
  verifyAdminSession,
} from './_lib/security.js'

const ORDERS_KEY = 'card-orders'

function isValidOrder(order) {
  return (
    order &&
    typeof order.id === 'string' &&
    typeof order.userId === 'string' &&
    typeof order.userName === 'string' &&
    isValidEmail(order.email) &&
    typeof order.status === 'string' &&
    typeof order.createdAt === 'string'
  )
}

async function sendNewOrderEmails(order) {
  await sendTypedEmail('activation_code', {
    email: order.email,
    fullName: order.userName,
    activationCode: order.activationCode,
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

      const orders = (await redis.get(ORDERS_KEY)) ?? []
      return res.status(200).json(orders)
    }

    if (req.method === 'POST') {
      const session = await verifyAdminSession(req, redis)
      const ip = getClientIp(req)
      const allowed = await rateLimit(redis, `rate:orders-post:${ip}`, 60, 3600)
      if (!allowed) {
        return res.status(429).json({ error: 'Too many requests' })
      }

      const order = parseBody(req)
      if (!isValidOrder(order)) {
        return res.status(400).json({ error: 'Invalid order payload' })
      }

      const orders = (await redis.get(ORDERS_KEY)) ?? []
      const index = orders.findIndex((item) => item.id === order.id)
      const isNewOrder = index === -1

      if (!session && !isNewOrder) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const previous = index === -1 ? null : orders[index]
      const next =
        index === -1
          ? [order, ...orders]
          : orders.map((item, itemIndex) =>
              itemIndex === index ? { ...item, ...order } : item
            )

      await redis.set(ORDERS_KEY, next)

      if (isNewOrder) {
        await sendNewOrderEmails(order)
      } else if (session && order.status === 'shipped' && previous?.status !== 'shipped') {
        await sendTypedEmail('card_shipped', {
          email: order.email,
          fullName: order.userName,
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
