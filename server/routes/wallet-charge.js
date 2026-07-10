import { verifyClientSession } from '../lib/clientSessions.js'
import {
  cancelWalletCharge,
  confirmWalletCharge,
  createWalletCharge,
  getPendingWalletCharge,
  getWalletChargeForMerchant,
  resolveWalletPayToken,
  stripClientForMerchant,
} from '../lib/walletPay.js'
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

function extractTokenFromPath(path) {
  const match = path.match(/^\/api\/wallet-pay\/([^/]+)$/)
  return match ? decodeURIComponent(match[1]) : null
}

function extractChargeIdFromPath(path) {
  const match = path.match(/^\/api\/wallet-charge\/([^/]+)$/)
  return match ? decodeURIComponent(match[1]) : null
}

export default async function handler(req, res) {
  const redis = getRedis()
  if (!redis) {
    return res.status(503).json({ error: 'Service indisponible (Redis requis)' })
  }

  const path = getPathname(req)
  const ip = getClientIp(req)

  if (path.startsWith('/api/wallet-pay/')) {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET')
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const token = extractTokenFromPath(path)
    if (!token) return res.status(400).json({ error: 'Token invalide' })

    const allowed = await rateLimit(redis, `rate:wallet-pay-lookup:${ip}`, 60, 3600)
    if (!allowed) return res.status(429).json({ error: 'Trop de requêtes' })

    const resolved = await resolveWalletPayToken(redis, token)
    if (!resolved) return res.status(404).json({ error: 'Carte wallet introuvable ou expirée' })

    const client = stripClientForMerchant(resolved.user)
    if (client.cardStatus === 'blocked') {
      return res.status(403).json({ error: 'Carte client bloquée', client })
    }

    return res.status(200).json({ ok: true, token, client })
  }

  if (path === '/api/wallet-charge/pending') {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET')
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const session = await verifyClientSession(req, redis)
    if (!session) return res.status(401).json({ error: 'Non connecté' })

    const charge = await getPendingWalletCharge(redis, session.userId)
    return res.status(200).json({ charge })
  }

  if (path === '/api/wallet-charge') {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST')
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const allowed = await rateLimit(redis, `rate:wallet-charge:${ip}`, 60, 3600)
    if (!allowed) return res.status(429).json({ error: 'Trop de requêtes' })

    const body = parseBody(req)
    const action = typeof body.action === 'string' ? body.action : 'create'

    if (action === 'create') {
      const token = sanitizeText(body.token, 80)
      const merchantId = sanitizeText(body.merchantId, 80)
      const merchantName = sanitizeText(body.merchantName, 120)
      const category = sanitizeText(body.category, 40)
      const amount = Number(body.amount)

      if (!token || !merchantId || !category) {
        return res.status(400).json({ error: 'Paramètres manquants' })
      }

      const resolved = await resolveWalletPayToken(redis, token)
      if (!resolved) return res.status(404).json({ error: 'Carte wallet introuvable' })

      const result = await createWalletCharge(redis, {
        userId: resolved.userId,
        merchantId,
        merchantName,
        category,
        amount,
      })

      if (!result.ok) return res.status(400).json(result)
      return res.status(200).json(result)
    }

    if (action === 'confirm') {
      const session = await verifyClientSession(req, redis)
      if (!session) return res.status(401).json({ error: 'Non connecté' })

      const chargeId = sanitizeText(body.chargeId, 80)
      const pin = String(body.pin ?? '').trim()
      if (!chargeId || !/^\d{4}$/.test(pin)) {
        return res.status(400).json({ error: 'Paramètres invalides' })
      }

      const allowedConfirm = await rateLimit(redis, `rate:wallet-charge-confirm:${session.userId}`, 20, 3600)
      if (!allowedConfirm) return res.status(429).json({ error: 'Trop de tentatives' })

      const result = await confirmWalletCharge(redis, {
        chargeId,
        userId: session.userId,
        pin,
      })

      if (!result.ok) return res.status(400).json(result)
      return res.status(200).json(result)
    }

    if (action === 'cancel') {
      const chargeId = sanitizeText(body.chargeId, 80)
      if (!chargeId) return res.status(400).json({ error: 'Identifiant requis' })

      const session = await verifyClientSession(req, redis)
      const merchantId = sanitizeText(body.merchantId, 80)

      const result = await cancelWalletCharge(redis, chargeId, {
        merchantId: merchantId || undefined,
        userId: session?.userId,
      })

      if (!result.ok) return res.status(400).json(result)
      return res.status(200).json(result)
    }

    return res.status(400).json({ error: 'Action inconnue' })
  }

  const chargeId = extractChargeIdFromPath(path)
  if (chargeId && path.startsWith('/api/wallet-charge/')) {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET')
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const merchantId = sanitizeText(req.query?.merchantId, 80)
    if (!merchantId) return res.status(400).json({ error: 'merchantId requis' })

    const charge = await getWalletChargeForMerchant(redis, chargeId, merchantId)
    if (!charge) return res.status(404).json({ error: 'Paiement introuvable' })
    return res.status(200).json({ charge })
  }

  return res.status(404).json({ error: 'Not found' })
}
