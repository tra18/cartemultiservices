import {
  getApiSecret,
  getClientIp,
  getRedis,
  isValidEmail,
  parseBody,
  rateLimit,
  verifyAdminSession,
  verifyApiSecret,
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
      if (!getApiSecret()) {
        return res.status(503).json({ error: 'API not configured' })
      }

      if (!verifyApiSecret(req)) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

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
      const next =
        index === -1
          ? [order, ...orders]
          : orders.map((item, itemIndex) =>
              itemIndex === index ? { ...item, ...order } : item
            )

      await redis.set(ORDERS_KEY, next)
      return res.status(200).json({ ok: true })
    }

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('orders api error', error)
    return res.status(500).json({ error: 'Server error' })
  }
}
