import { sendTypedEmail } from '../lib/mailer.js'
import {
  approveOrder,
  createReplacementOrder,
  getOrderByUserId,
  isValidOrderPayload,
  loadOrders,
  prepareNewOrder,
  produceOrderCard,
  rejectOrder,
  shipOrder,
  stripOrderForAdmin,
  stripOrderForClient,
  upsertOrder,
} from '../lib/ordersStore.js'
import { verifyClientSession } from '../lib/clientSessions.js'
import {
  getClientIp,
  getRedis,
  parseBody,
  rateLimit,
  verifyAdminSession,
} from '../lib/security.js'
import { CARD_PRICE } from '../lib/pricing.js'

function getPathname(req) {
  const raw = req.url ?? ''
  if (raw.startsWith('/')) return raw.split('?')[0]
  try {
    return new URL(raw, 'http://localhost').pathname
  } catch {
    return raw.split('?')[0]
  }
}

async function sendNewOrderEmails(order, activationCode) {
  await sendTypedEmail('activation_code', {
    email: order.email,
    fullName: order.userName,
    activationCode,
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

async function sendReplacementOrderEmails(order, activationCode) {
  await sendTypedEmail('activation_code', {
    email: order.email,
    fullName: order.userName,
    activationCode,
  })
  await sendTypedEmail('card_replacement_ordered', {
    email: order.email,
    fullName: order.userName,
    amount: order.amount,
  })
  await sendTypedEmail('admin_order_notification', {
    customerName: order.userName,
    customerEmail: order.email,
    amount: order.amount,
    deliveryMethod: order.deliveryMethod,
    orderType: 'replacement',
  })
}

async function handleOrdersReplacement(req, res, redis) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = await verifyClientSession(req, redis)
  if (!session) {
    return res.status(401).json({ error: 'Session expirée ou utilisée sur un autre appareil' })
  }

  const ip = getClientIp(req)
  const allowed = await rateLimit(redis, `rate:orders-replacement:${session.userId}`, 5, 3600)
  if (!allowed) {
    return res.status(429).json({ error: 'Trop de demandes. Réessayez plus tard.' })
  }

  const body = parseBody(req)

  try {
    const { order, activationCode } = await createReplacementOrder(redis, session.user, body)
    await sendReplacementOrderEmails(order, activationCode)
    return res.status(200).json({ ok: true, order: stripOrderForClient(order) })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Commande échouée'
    return res.status(400).json({ error: message })
  }
}

async function handleOrdersMine(req, res, redis) {
  const session = await verifyClientSession(req, redis)
  if (!session) {
    return res.status(401).json({ error: 'Session expirée ou utilisée sur un autre appareil' })
  }

  const order = await getOrderByUserId(redis, session.userId)
  return res.status(200).json({ order: stripOrderForClient(order) })
}

async function handleOrdersAdmin(req, res, redis) {
  const session = await verifyAdminSession(req, redis)
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const ip = getClientIp(req)
  const allowed = await rateLimit(redis, `rate:orders-admin:${ip}`, 120, 3600)
  if (!allowed) {
    return res.status(429).json({ error: 'Too many requests' })
  }

  const body = parseBody(req)
  const action = typeof body.action === 'string' ? body.action : ''
  const orderId = typeof body.orderId === 'string' ? body.orderId : ''

  if (!orderId) {
    return res.status(400).json({ error: 'orderId requis' })
  }

  try {
    if (action === 'approve') {
      const order = await approveOrder(redis, orderId, session.email)
      await sendTypedEmail('order_approved', {
        email: order.email,
        fullName: order.userName,
      })
      return res.status(200).json({ ok: true, order })
    }

    if (action === 'reject') {
      const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
      if (!reason) {
        return res.status(400).json({ error: 'Motif de refus requis' })
      }
      const order = await rejectOrder(redis, orderId, reason, session.email)
      await sendTypedEmail('order_rejected', {
        email: order.email,
        fullName: order.userName,
        reason,
      })
      return res.status(200).json({ ok: true, order })
    }

    if (action === 'produce') {
      const order = await produceOrderCard(redis, orderId)
      return res.status(200).json({ ok: true, order })
    }

    if (action === 'ship') {
      const order = await shipOrder(redis, orderId)
      await sendTypedEmail('card_shipped', {
        email: order.email,
        fullName: order.userName,
      })
      return res.status(200).json({ ok: true, order })
    }

    return res.status(400).json({ error: 'Action invalide' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Action échouée'
    return res.status(400).json({ error: message })
  }
}

export default async function handler(req, res) {
  const redis = getRedis()
  if (!redis) {
    return res.status(503).json({ error: 'Order storage not configured' })
  }

  const path = getPathname(req)

  try {
    if (path.endsWith('/orders-replacement')) {
      return handleOrdersReplacement(req, res, redis)
    }

    if (path.endsWith('/orders-mine')) {
      if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET')
        return res.status(405).json({ error: 'Method not allowed' })
      }
      return handleOrdersMine(req, res, redis)
    }

    if (path.endsWith('/orders-admin')) {
      if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST')
        return res.status(405).json({ error: 'Method not allowed' })
      }
      return handleOrdersAdmin(req, res, redis)
    }

    if (req.method === 'GET') {
      const session = await verifyAdminSession(req, redis)
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const orders = (await loadOrders(redis)).map(stripOrderForAdmin)
      return res.status(200).json(orders)
    }

    if (req.method === 'POST') {
      const adminSession = await verifyAdminSession(req, redis)
      const clientSession = adminSession ? null : await verifyClientSession(req, redis)
      const ip = getClientIp(req)
      const allowed = await rateLimit(redis, `rate:orders-post:${ip}`, 60, 3600)
      if (!allowed) {
        return res.status(429).json({ error: 'Too many requests' })
      }

      const body = parseBody(req)
      if (!isValidOrderPayload(body)) {
        return res.status(400).json({ error: 'Invalid order payload' })
      }

      const orders = await loadOrders(redis)
      const index = orders.findIndex((item) => item.id === body.id)
      const isNewOrder = index === -1

      if (isNewOrder) {
        if (!clientSession) {
          return res.status(401).json({ error: 'Session client requise pour créer une commande' })
        }
        if (body.userId !== clientSession.userId) {
          return res.status(403).json({ error: 'Commande non autorisée pour ce compte' })
        }

        if (body.orderType === 'replacement') {
          return res.status(400).json({ error: 'Utilisez la commande de remplacement depuis votre profil' })
        }

        const prepared = prepareNewOrder({ ...body, amount: CARD_PRICE, orderType: 'initial' }, body.activationCode)
        const activationCode = prepared._plainActivationCode
        delete prepared._plainActivationCode

        const { isNew } = await upsertOrder(redis, prepared)
        if (isNew) {
          await sendNewOrderEmails(prepared, activationCode)
        }

        return res.status(200).json({ ok: true, order: stripOrderForAdmin(prepared) })
      }

      if (!adminSession) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const previous = orders[index]
      const merged = { ...previous, ...body }
      await upsertOrder(redis, merged)

      if (merged.status === 'shipped' && previous?.status !== 'shipped') {
        await sendTypedEmail('card_shipped', {
          email: merged.email,
          fullName: merged.userName,
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
