import { sendTypedEmail } from './_lib/mailer.js'
import { activateOrderCard } from './_lib/ordersStore.js'
import { verifyClientSession } from './_lib/clientSessions.js'
import { getClientIp, getRedis, parseBody, rateLimit } from './_lib/security.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
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

  const ip = getClientIp(req)
  const allowed = await rateLimit(redis, `rate:card-activate:${session.userId}`, 10, 3600)
  if (!allowed) {
    return res.status(429).json({ error: 'Trop de tentatives. Réessayez plus tard.' })
  }

  try {
    const body = parseBody(req)
    const { cardNumber } = await activateOrderCard(redis, {
      userId: session.userId,
      activationCode: body.activationCode,
      cardPin: body.cardPin,
      cardToken: body.cardToken,
    })

    await sendTypedEmail('card_activated', {
      email: session.user.email,
      fullName: session.user.fullName,
      cardNumber,
    })

    return res.status(200).json({ ok: true, cardNumber })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Activation échouée'
    const status = message.includes('Code incorrect') ? 400 : 400
    return res.status(status).json({ error: message })
  }
}
