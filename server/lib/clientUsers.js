import { randomUUID } from 'crypto'

const USER_PREFIX = 'client-user:'
const EMAIL_INDEX = 'client-email:'
const USERS_INDEX_KEY = 'client-users-index'

export function stripUserForClient(user) {
  if (!user) return null
  const { passwordHash, cardPinHash, cardPin, ...clientUser } = user
  const accountType = clientUser.accountType ?? 'adult'
  return {
    ...clientUser,
    accountType,
    email: accountType === 'minor' ? '' : clientUser.email,
  }
}

export function stripUserForAdmin(user) {
  if (!user) return null
  const { passwordHash, cardPinHash, cardPin, transactions, ...adminUser } = user
  return {
    ...adminUser,
    transactionCount: Array.isArray(transactions) ? transactions.length : 0,
    hasPin: Boolean(cardPinHash || cardPin || user.digitalCardEnabledAt),
  }
}

async function rebuildUsersIndex(redis) {
  let cursor = 0
  do {
    const [nextCursor, keys] = await redis.scan(cursor, {
      match: `${USER_PREFIX}*`,
      count: 100,
    })
    cursor = Number(nextCursor)
    for (const key of keys) {
      const userId = String(key).slice(USER_PREFIX.length)
      if (userId) await redis.sadd(USERS_INDEX_KEY, userId)
    }
  } while (cursor !== 0)
}

export async function listAllUsers(redis) {
  let indexSize = 0
  try {
    indexSize = await redis.scard(USERS_INDEX_KEY)
  } catch {
    await redis.del(USERS_INDEX_KEY)
  }

  if (!indexSize) {
    await rebuildUsersIndex(redis)
  }

  const ids = await redis.smembers(USERS_INDEX_KEY)
  if (!ids?.length) return []

  const users = await Promise.all(ids.map((id) => getUserById(redis, id)))
  return users
    .filter(Boolean)
    .map(stripUserForAdmin)
    .sort((a, b) => (a.fullName || a.email || '').localeCompare(b.fullName || b.email || '', 'fr'))
}

export async function getUserById(redis, userId) {
  return redis.get(`${USER_PREFIX}${userId}`)
}

export async function getUserByEmail(redis, email) {
  const normalized = email.trim().toLowerCase()
  const userId = await redis.get(`${EMAIL_INDEX}${normalized}`)
  if (!userId) return null
  return getUserById(redis, userId)
}

export async function isEmailAvailable(redis, email) {
  const existing = await getUserByEmail(redis, email)
  return !existing
}

export function createUserRecord({ email, passwordHash, fullName, phone, cardStatus = 'none' }) {
  return {
    id: randomUUID(),
    email: email.trim().toLowerCase(),
    passwordHash,
    fullName: fullName.trim().slice(0, 80),
    phone: phone.trim().slice(0, 30),
    cardNumber: 'En attente de carte',
    balance: 0,
    transactions: [],
    cardStatus,
    pinFailedAttempts: 0,
    accountType: 'adult',
  }
}

export async function saveUser(redis, user) {
  await redis.set(`${USER_PREFIX}${user.id}`, user)
  await redis.set(`${EMAIL_INDEX}${user.email.toLowerCase()}`, user.id)
  await redis.sadd(USERS_INDEX_KEY, user.id)
}

const CLIENT_PATCHABLE_FIELDS = new Set(['fullName', 'phone'])

const SERVER_PATCHABLE_FIELDS = new Set([
  'cardNumber',
  'balance',
  'transactions',
  'cardStatus',
  'cardPinHash',
  'pinFailedAttempts',
  'walletAppleAddedAt',
  'walletGoogleAddedAt',
  'digitalCardNumber',
  'digitalCardEnabledAt',
  'blockReason',
  'blockedAt',
  'cardReplacementCount',
])

export function mergeUserPatch(user, patch, { server = false } = {}) {
  const allowed = server ? SERVER_PATCHABLE_FIELDS : CLIENT_PATCHABLE_FIELDS
  const next = { ...user }
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(patch, key)) {
      next[key] = patch[key]
    }
  }
  return next
}

function normalizePhone(value) {
  return String(value ?? '').replace(/\D/g, '')
}

function normalizeCard(value) {
  return String(value ?? '').replace(/\s/g, '')
}

export async function findBeneficiaryUser(redis, { email, phone, cardNumber }) {
  if (email) {
    const user = await getUserByEmail(redis, email)
    if (user) return user
  }

  const targetPhone = phone ? normalizePhone(phone) : ''
  const targetCard = cardNumber ? normalizeCard(cardNumber) : ''
  if (!targetPhone && !targetCard) return null

  const ids = (await redis.smembers(USERS_INDEX_KEY)) ?? []
  for (const id of ids) {
    const user = await getUserById(redis, id)
    if (!user) continue
    if (targetPhone && normalizePhone(user.phone) === targetPhone) return user
    if (targetCard && normalizeCard(user.cardNumber) === targetCard) return user
    if (targetCard && normalizeCard(user.digitalCardNumber) === targetCard) return user
  }

  return null
}

export async function creditUserRecharge(redis, userId, { amount, method, detail }) {
  const user = await getUserById(redis, userId)
  if (!user) return { ok: false, error: 'Compte introuvable' }
  if (user.cardStatus === 'blocked') return { ok: false, error: 'La carte du bénéficiaire est bloquée' }

  const parsedAmount = Number(amount)
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return { ok: false, error: 'Montant invalide' }
  }

  const transaction = {
    id: randomUUID(),
    type: 'recharge',
    amount: parsedAmount,
    date: new Date().toISOString(),
    method,
    detail,
  }

  const updated = {
    ...user,
    balance: (user.balance || 0) + parsedAmount,
    transactions: [transaction, ...(user.transactions || [])],
  }

  await saveUser(redis, updated)
  return { ok: true, user: updated, transaction }
}

const PARENT_MINORS_PREFIX = 'client-parent-minors:'

export function isAdultAccount(user) {
  return (user?.accountType ?? 'adult') !== 'minor'
}

export function calculateAge(dateOfBirth) {
  const dob = new Date(dateOfBirth)
  if (Number.isNaN(dob.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const monthDiff = today.getMonth() - dob.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1
  }
  return age
}

export function isMinorAge(dateOfBirth) {
  const age = calculateAge(dateOfBirth)
  return age !== null && age < 18
}

export function createMinorRecord({ parentUserId, fullName, dateOfBirth, phone = '' }) {
  const id = randomUUID()
  return {
    id,
    email: `minor.${id}@family.mscarte.local`,
    passwordHash: null,
    accountType: 'minor',
    parentUserId,
    managedByParent: true,
    parentControlsPin: true,
    fullName: fullName.trim().slice(0, 80),
    dateOfBirth: dateOfBirth.slice(0, 10),
    phone: phone.trim().slice(0, 30),
    cardNumber: 'En attente de carte',
    balance: 0,
    transactions: [],
    cardStatus: 'none',
    pinFailedAttempts: 0,
  }
}

export async function addMinorToParentIndex(redis, parentUserId, minorUserId) {
  await redis.sadd(`${PARENT_MINORS_PREFIX}${parentUserId}`, minorUserId)
}

export async function listMinorsForParent(redis, parentUserId) {
  const ids = (await redis.smembers(`${PARENT_MINORS_PREFIX}${parentUserId}`)) ?? []
  const minors = await Promise.all(ids.map((id) => getUserById(redis, id)))
  return minors
    .filter((user) => user && user.accountType === 'minor' && user.parentUserId === parentUserId)
    .map(stripUserForClient)
}

export async function getMinorForParent(redis, parentUserId, minorUserId) {
  const minor = await getUserById(redis, minorUserId)
  if (!minor || minor.accountType !== 'minor' || minor.parentUserId !== parentUserId) {
    return null
  }
  return minor
}

export async function assertParentAccess(redis, parentUserId, minorUserId) {
  const parent = await getUserById(redis, parentUserId)
  if (!parent || !isAdultAccount(parent)) {
    return { ok: false, error: 'Compte parent requis' }
  }
  const minor = await getMinorForParent(redis, parentUserId, minorUserId)
  if (!minor) {
    return { ok: false, error: 'Compte mineur introuvable' }
  }
  return { ok: true, parent, minor }
}

export async function transferBalance(redis, fromUserId, toUserId, amount, { label, method }) {
  const parsed = Number(amount)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return { ok: false, error: 'Montant invalide' }
  }

  const fromUser = await getUserById(redis, fromUserId)
  const toUser = await getUserById(redis, toUserId)
  if (!fromUser || !toUser) return { ok: false, error: 'Compte introuvable' }
  if ((fromUser.balance || 0) < parsed) {
    return { ok: false, error: 'Solde insuffisant' }
  }

  const now = new Date().toISOString()
  const debitTx = {
    id: randomUUID(),
    type: 'paiement',
    amount: parsed,
    date: now,
    method,
    detail: label,
    merchant: label,
  }
  const creditTx = {
    id: randomUUID(),
    type: 'recharge',
    amount: parsed,
    date: now,
    method,
    detail: label,
  }

  await saveUser(redis, {
    ...fromUser,
    balance: (fromUser.balance || 0) - parsed,
    transactions: [debitTx, ...(fromUser.transactions || [])],
  })

  await saveUser(redis, {
    ...toUser,
    balance: (toUser.balance || 0) + parsed,
    transactions: [creditTx, ...(toUser.transactions || [])],
  })

  return { ok: true }
}
