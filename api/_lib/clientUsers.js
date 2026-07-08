import { randomUUID } from 'crypto'

const USER_PREFIX = 'client-user:'
const EMAIL_INDEX = 'client-email:'

export function stripUserForClient(user) {
  if (!user) return null
  const { passwordHash, ...clientUser } = user
  return clientUser
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
}

const PATCHABLE_FIELDS = new Set([
  'fullName',
  'phone',
  'cardNumber',
  'balance',
  'transactions',
  'cardStatus',
  'cardPin',
  'pinFailedAttempts',
  'walletAppleAddedAt',
  'walletGoogleAddedAt',
  'digitalCardNumber',
  'digitalCardEnabledAt',
])

export function mergeUserPatch(user, patch) {
  const next = { ...user }
  for (const key of PATCHABLE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(patch, key)) {
      next[key] = patch[key]
    }
  }
  return next
}
