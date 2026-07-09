import { randomUUID } from 'crypto'

const USER_PREFIX = 'client-user:'
const EMAIL_INDEX = 'client-email:'
const USERS_INDEX_KEY = 'client-users-index'

export function stripUserForClient(user) {
  if (!user) return null
  const { passwordHash, cardPinHash, cardPin, ...clientUser } = user
  return clientUser
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
  for await (const key of redis.scanIterator({ match: `${USER_PREFIX}*`, count: 50 })) {
    const userId = String(key).slice(USER_PREFIX.length)
    if (userId) await redis.sadd(USERS_INDEX_KEY, userId)
  }
}

export async function listAllUsers(redis) {
  const indexSize = await redis.scard(USERS_INDEX_KEY)
  if (!indexSize) {
    await rebuildUsersIndex(redis)
  }

  const ids = await redis.smembers(USERS_INDEX_KEY)
  if (!ids?.length) return []

  const users = await Promise.all(ids.map((id) => getUserById(redis, id)))
  return users
    .filter(Boolean)
    .map(stripUserForAdmin)
    .sort((a, b) => a.fullName.localeCompare(b.fullName, 'fr'))
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
