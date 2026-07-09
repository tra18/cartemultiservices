import { listAllUsers } from '../lib/clientUsers.js'
import { loadOrders } from '../lib/ordersStore.js'
import { getClientIp, getRedis, rateLimit, verifyAdminSession } from '../lib/security.js'

function enrichUsersWithOrders(users, orders) {
  const ordersByUserId = new Map()
  for (const order of orders) {
    if (!order?.userId) continue
    const existing = ordersByUserId.get(order.userId)
    if (!existing || new Date(order.createdAt) > new Date(existing.createdAt)) {
      ordersByUserId.set(order.userId, order)
    }
  }

  return users.map((user) => {
    const order = ordersByUserId.get(user.id)
    return {
      ...user,
      hasOrder: Boolean(order),
      orderId: order?.id,
      orderStatus: order?.status,
      orderType: order?.orderType,
    }
  })
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
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
  const allowed = await rateLimit(redis, `rate:client-users-admin:${ip}`, 60, 3600)
  if (!allowed) {
    return res.status(429).json({ error: 'Too many requests' })
  }

  try {
    const [users, orders] = await Promise.all([listAllUsers(redis), loadOrders(redis)])
    return res.status(200).json({
      users: enrichUsersWithOrders(users, orders),
      total: users.length,
    })
  } catch (error) {
    console.error('client-users-admin error', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
