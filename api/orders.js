import { Redis } from '@upstash/redis'

const ORDERS_KEY = 'card-orders'

function getRedis() {
  try {
    // UPSTASH_* (Upstash direct) ou KV_* (intégration Vercel Storage)
    return Redis.fromEnv()
  } catch {
    return null
  }
}

function parseBody(req) {
  if (!req.body) return {}
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body)
    } catch {
      return {}
    }
  }
  return req.body
}

export default async function handler(req, res) {
  const redis = getRedis()

  if (!redis) {
    return res.status(503).json({ error: 'Order storage not configured' })
  }

  try {
    if (req.method === 'GET') {
      const orders = (await redis.get(ORDERS_KEY)) ?? []
      return res.status(200).json(orders)
    }

    if (req.method === 'POST') {
      const order = parseBody(req)
      if (!order?.id) {
        return res.status(400).json({ error: 'Missing order id' })
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
