import { randomUUID } from 'crypto'
import { sendTypedEmail } from '../lib/mailer.js'
import {
  addMinorToParentIndex,
  assertParentAccess,
  createMinorRecord,
  getUserById,
  isAdultAccount,
  isMinorAge,
  listMinorsForParent,
  saveUser,
  stripUserForClient,
  transferBalance,
} from '../lib/clientUsers.js'
import { verifyClientSession } from '../lib/clientSessions.js'
import {
  hasPendingInitialOrder,
  loadOrders,
  prepareNewOrder,
  upsertOrder,
} from '../lib/ordersStore.js'
import { hashPassword } from '../lib/password.js'
import { CARD_PRICE } from '../lib/pricing.js'
import {
  getClientIp,
  getRedis,
  parseBody,
  rateLimit,
  sanitizeText,
} from '../lib/security.js'

const DELIVERY_METHODS = new Set(['home', 'pickup', 'agency_kaloum', 'agency_ratoma', 'agency_kipé'])

async function notifyParentMinorOrder(parent, minor, order) {
  await sendTypedEmail('minor_card_ordered', {
    email: parent.email,
    parentName: parent.fullName,
    minorName: minor.fullName,
    orderId: order.id,
    amount: order.amount,
  })
}

export default async function handler(req, res) {
  const redis = getRedis()
  if (!redis) {
    return res.status(503).json({ error: 'Service indisponible' })
  }

  const session = await verifyClientSession(req, redis)
  if (!session) {
    return res.status(401).json({ error: 'Session expirée' })
  }

  const parent = session.user
  if (!isAdultAccount(parent)) {
    return res.status(403).json({ error: 'Réservé aux comptes parents' })
  }

  const ip = getClientIp(req)
  const allowed = await rateLimit(redis, `rate:family:${ip}`, 60, 3600)
  if (!allowed) {
    return res.status(429).json({ error: 'Trop de requêtes' })
  }

  try {
    if (req.method === 'GET') {
      const url = new URL(req.url ?? '/', 'http://localhost')
      const minorId = url.searchParams.get('minorId')

      if (minorId) {
        const access = await assertParentAccess(redis, parent.id, minorId)
        if (!access.ok) return res.status(404).json({ error: access.error })
        return res.status(200).json({ minor: stripUserForClient(access.minor) })
      }

      const minors = await listMinorsForParent(redis, parent.id)
      return res.status(200).json({ minors })
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST')
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const body = parseBody(req)
    const action = body.action

    if (action === 'create_minor') {
      const fullName = sanitizeText(body.fullName, 80)
      const dateOfBirth = sanitizeText(body.dateOfBirth, 10)
      const phone = sanitizeText(body.phone ?? '', 30)

      if (!fullName || fullName.length < 2) {
        return res.status(400).json({ error: 'Nom du mineur requis' })
      }
      if (!isMinorAge(dateOfBirth)) {
        return res.status(400).json({ error: 'Le mineur doit avoir moins de 18 ans' })
      }

      const existing = await listMinorsForParent(redis, parent.id)
      if (existing.length >= 5) {
        return res.status(400).json({ error: 'Maximum 5 cartes mineurs par compte parent' })
      }

      const minor = createMinorRecord({
        parentUserId: parent.id,
        fullName,
        dateOfBirth,
        phone,
      })
      await saveUser(redis, minor)
      await addMinorToParentIndex(redis, parent.id, minor.id)

      return res.status(200).json({ ok: true, minor: stripUserForClient(minor) })
    }

    const minorId = body.minorId
    if (!minorId) {
      return res.status(400).json({ error: 'minorId requis' })
    }

    const access = await assertParentAccess(redis, parent.id, minorId)
    if (!access.ok) return res.status(404).json({ error: access.error })
    const minor = access.minor

    if (action === 'order_card') {
      const orders = await loadOrders(redis)
      if (hasPendingInitialOrder(orders, minor.id)) {
        return res.status(409).json({ error: 'Une commande est déjà en cours pour ce mineur' })
      }

      const deliveryMethod = DELIVERY_METHODS.has(body.deliveryMethod) ? body.deliveryMethod : 'home'
      const now = new Date().toISOString()
      const rawOrder = {
        id: randomUUID(),
        userId: minor.id,
        userName: minor.fullName,
        email: parent.email,
        phone: minor.phone || parent.phone,
        address: sanitizeText(body.address ?? parent.phone, 200),
        city: sanitizeText(body.city ?? 'Conakry', 60),
        deliveryMethod,
        amount: CARD_PRICE,
        paymentMethod: sanitizeText(body.paymentMethod ?? 'orange-money', 80),
        orderType: 'initial',
        orderedByUserId: parent.id,
        minorOrder: true,
        createdAt: now,
        activationEmailSentAt: now,
        cardActivated: false,
        status: 'pending_review',
      }

      const prepared = prepareNewOrder(rawOrder)
      delete prepared._plainActivationCode
      await upsertOrder(redis, prepared)
      await saveUser(redis, { ...minor, cardStatus: 'ordered' })
      await notifyParentMinorOrder(parent, minor, prepared)

      return res.status(200).json({ ok: true, orderId: prepared.id })
    }

    if (action === 'transfer_to_minor') {
      const amount = Number(body.amount)
      const result = await transferBalance(redis, parent.id, minor.id, amount, {
        label: `Transfert vers ${minor.fullName}`,
        method: 'Transfert parent',
      })
      if (!result.ok) return res.status(400).json({ error: result.error })
      const updatedMinor = await getUserById(redis, minor.id)
      return res.status(200).json({ ok: true, minor: stripUserForClient(updatedMinor) })
    }

    if (action === 'withdraw_from_minor') {
      const amount = Number(body.amount)
      const result = await transferBalance(redis, minor.id, parent.id, amount, {
        label: `Retrait parent — ${minor.fullName}`,
        method: 'Contrôle parent',
      })
      if (!result.ok) return res.status(400).json({ error: result.error })
      const updatedMinor = await getUserById(redis, minor.id)
      return res.status(200).json({ ok: true, minor: stripUserForClient(updatedMinor) })
    }

    if (action === 'block_card') {
      if (minor.cardStatus === 'blocked') {
        return res.status(400).json({ error: 'Carte déjà bloquée' })
      }
      await saveUser(redis, {
        ...minor,
        cardStatus: 'blocked',
        blockReason: 'manual',
        blockedAt: new Date().toISOString(),
        blockedByParent: true,
        statusBeforeBlock: minor.cardStatus,
      })
      return res.status(200).json({ ok: true, cardStatus: 'blocked' })
    }

    if (action === 'unblock_card') {
      if (minor.cardStatus !== 'blocked') {
        return res.status(400).json({ error: 'La carte n\'est pas bloquée' })
      }
      const restoredStatus = minor.statusBeforeBlock ?? (minor.cardPinHash ? 'active' : 'shipped')
      await saveUser(redis, {
        ...minor,
        cardStatus: restoredStatus,
        blockReason: undefined,
        blockedAt: undefined,
        blockedByParent: undefined,
        statusBeforeBlock: undefined,
        pinFailedAttempts: 0,
      })
      const updated = await getUserById(redis, minor.id)
      return res.status(200).json({ ok: true, cardStatus: updated.cardStatus })
    }

    if (action === 'set_pin') {
      const pin = String(body.pin ?? '').trim()
      if (!/^\d{4}$/.test(pin)) {
        return res.status(400).json({ error: 'Le PIN doit contenir 4 chiffres' })
      }
      await saveUser(redis, {
        ...minor,
        cardPinHash: hashPassword(pin),
        cardPin: undefined,
        pinFailedAttempts: 0,
      })
      return res.status(200).json({ ok: true })
    }

    if (action === 'set_limits') {
      const dailyMax = body.dailyMax != null ? Number(body.dailyMax) : undefined
      const perTransactionMax = body.perTransactionMax != null ? Number(body.perTransactionMax) : undefined
      await saveUser(redis, {
        ...minor,
        spendingLimits: {
          dailyMax: Number.isFinite(dailyMax) ? dailyMax : minor.spendingLimits?.dailyMax,
          perTransactionMax: Number.isFinite(perTransactionMax) ? perTransactionMax : minor.spendingLimits?.perTransactionMax,
        },
      })
      const updated = await getUserById(redis, minor.id)
      return res.status(200).json({ ok: true, minor: stripUserForClient(updated) })
    }

    return res.status(400).json({ error: 'Action inconnue' })
  } catch (error) {
    console.error('family api error', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
