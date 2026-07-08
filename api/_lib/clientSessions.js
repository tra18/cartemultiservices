import { randomUUID } from 'crypto'
import { getBearerToken } from './security.js'
import { getUserById } from './clientUsers.js'

const SESSION_PREFIX = 'client-session:'
const ACTIVE_PREFIX = 'client-active-session:'
const SESSION_TTL = 60 * 60 * 24 * 30

export async function createClientSession(redis, userId, meta = {}) {
  const previousToken = await redis.get(`${ACTIVE_PREFIX}${userId}`)
  if (previousToken) {
    await redis.del(`${SESSION_PREFIX}${previousToken}`)
  }

  const token = randomUUID()
  const session = {
    userId,
    createdAt: new Date().toISOString(),
    ip: meta.ip ?? 'unknown',
    userAgent: meta.userAgent ?? 'unknown',
  }

  await redis.set(`${SESSION_PREFIX}${token}`, session, { ex: SESSION_TTL })
  await redis.set(`${ACTIVE_PREFIX}${userId}`, token, { ex: SESSION_TTL })

  return { token, session, replacedSession: Boolean(previousToken) }
}

export async function verifyClientSession(req, redis) {
  const token = getBearerToken(req)
  if (!token || !redis) return null

  const session = await redis.get(`${SESSION_PREFIX}${token}`)
  if (!session?.userId) return null

  const activeToken = await redis.get(`${ACTIVE_PREFIX}${session.userId}`)
  if (activeToken !== token) return null

  const user = await getUserById(redis, session.userId)
  if (!user) return null

  return { token, session, user }
}

export async function destroyClientSession(redis, token, userId) {
  if (token) await redis.del(`${SESSION_PREFIX}${token}`)
  if (userId) {
    const active = await redis.get(`${ACTIVE_PREFIX}${userId}`)
    if (active === token) {
      await redis.del(`${ACTIVE_PREFIX}${userId}`)
    }
  }
}
