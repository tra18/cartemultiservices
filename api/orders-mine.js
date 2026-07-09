import { getOrderByUserId, stripOrderForClient } from './_lib/ordersStore.js'
import { verifyClientSession } from './_lib/clientSessions.js'
import { getRedis } from './_lib/security.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const redis = getRedis()
  if (!redis) {
    return res.status(503).json({ error: 'Service indisponible' })
  }

  const session = await verifyClientSession(req, redis)
  if (!session) {
    return res.status(401).json({ error: 'Session expirée ou utilisée sur un autre appareil' })
  }

  const order = await getOrderByUserId(redis, session.userId)
  return res.status(200).json({ order: stripOrderForClient(order) })
}
