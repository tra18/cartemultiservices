import sendEmail from '../server/routes/send-email.js'
import orders from '../server/routes/orders.js'
import adminAuth from '../server/routes/admin-auth.js'
import wallet from '../server/routes/wallet.js'
import clientAuth from '../server/routes/client-auth.js'
import finance from '../server/routes/finance.js'
import card from '../server/routes/card.js'

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

const ROUTES = {
  '/api/send-email': sendEmail,
  '/api/orders': orders,
  '/api/orders-mine': orders,
  '/api/orders-admin': orders,
  '/api/orders-replacement': orders,
  '/api/admin-auth': adminAuth,
  '/api/wallet': wallet,
  '/api/wallet-health': wallet,
  '/api/client-auth': clientAuth,
  '/api/finance': finance,
  '/api/card-activate': card,
  '/api/digital-card': card,
  '/api/verify-card-pin': card,
  '/api/card-security': card,
  '/api/reset-card-pin': card,
}

export default async function handler(req, res) {
  const path = getPathname(req)
  const routeHandler = ROUTES[path]

  if (!routeHandler) {
    return res.status(404).json({ error: 'Not found' })
  }

  return routeHandler(req, res)
}
