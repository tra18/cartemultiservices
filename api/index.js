import sendEmail from './_lib/routes/send-email.js'
import orders from './_lib/routes/orders.js'
import adminAuth from './_lib/routes/admin-auth.js'
import wallet from './_lib/routes/wallet.js'
import clientAuth from './_lib/routes/client-auth.js'
import finance from './_lib/routes/finance.js'
import card from './_lib/routes/card.js'

function getPathname(req) {
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
  '/api/admin-auth': adminAuth,
  '/api/wallet': wallet,
  '/api/wallet-health': wallet,
  '/api/client-auth': clientAuth,
  '/api/finance': finance,
  '/api/card-activate': card,
  '/api/digital-card': card,
  '/api/verify-card-pin': card,
  '/api/card-security': card,
}

export default async function handler(req, res) {
  const path = getPathname(req)
  const routeHandler = ROUTES[path]

  if (!routeHandler) {
    return res.status(404).json({ error: 'Not found' })
  }

  return routeHandler(req, res)
}
