import {
  createOrderFormChallenge,
  isOrderFormSecurityConfigured,
} from '../lib/orderFormSecurity.js'
import { getClientIp, getRedis, rateLimit } from '../lib/security.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  const redis = getRedis()
  if (!redis) {
    return res.status(503).json({
      error: 'Service temporairement indisponible. Réessayez dans quelques instants.',
    })
  }

  if (!isOrderFormSecurityConfigured()) {
    return res.status(503).json({
      error: 'Protection du formulaire non configurée sur le serveur.',
    })
  }

  const ip = getClientIp(req)
  const allowed = await rateLimit(redis, `rate:order-challenge:${ip}`, 30, 3600)
  if (!allowed) {
    return res.status(429).json({ error: 'Trop de requêtes. Réessayez plus tard.' })
  }

  try {
    const challenge = await createOrderFormChallenge(redis)
    return res.status(200).json(challenge)
  } catch (error) {
    console.error('order-form-challenge error', error)
    return res.status(500).json({ error: 'Erreur serveur. Réessayez plus tard.' })
  }
}
