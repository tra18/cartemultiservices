import { Redis } from '@upstash/redis'
import { randomUUID } from 'crypto'

const ADMIN_SESSION_PREFIX = 'admin-session:'
const ADMIN_SESSION_TTL = 60 * 60 * 8 // 8 h

export function getRedis() {
  try {
    return Redis.fromEnv()
  } catch {
    return null
  }
}

export function parseBody(req) {
  if (!req.body) return {}
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body)
    } catch {
      return {}
    }
  }
  return req.body
}

export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim()
  }
  return req.socket?.remoteAddress ?? 'unknown'
}

export function getApiSecret() {
  return process.env.API_SECRET ?? ''
}

export function verifyApiSecret(req) {
  const expected = getApiSecret()
  if (!expected) return false
  const provided = req.headers['x-api-key']
  return typeof provided === 'string' && provided === expected
}

export function getBearerToken(req) {
  const auth = req.headers.authorization
  if (typeof auth !== 'string' || !auth.startsWith('Bearer ')) return null
  return auth.slice(7).trim()
}

export async function verifyAdminSession(req, redis) {
  const token = getBearerToken(req)
  if (!token || !redis) return null
  const session = await redis.get(`${ADMIN_SESSION_PREFIX}${token}`)
  if (!session) return null
  return { token, email: session.email }
}

export async function createAdminSession(redis, email) {
  const token = randomUUID()
  await redis.set(
    `${ADMIN_SESSION_PREFIX}${token}`,
    { email, createdAt: new Date().toISOString() },
    { ex: ADMIN_SESSION_TTL }
  )
  return token
}

export async function destroyAdminSession(redis, token) {
  if (!token) return
  await redis.del(`${ADMIN_SESSION_PREFIX}${token}`)
}

export async function rateLimit(redis, key, limit, windowSeconds) {
  if (!redis) return true
  const count = await redis.incr(key)
  if (count === 1) {
    await redis.expire(key, windowSeconds)
  }
  return count <= limit
}

export function isValidEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function sanitizeText(value, max = 200) {
  if (typeof value !== 'string') return ''
  return value.replace(/[<>"'`]/g, '').trim().slice(0, max)
}
