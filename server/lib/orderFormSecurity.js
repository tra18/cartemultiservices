import { createHmac, randomUUID, timingSafeEqual } from 'crypto'

const CHALLENGE_PREFIX = 'order-challenge:'
const CHALLENGE_TTL_SEC = 900
export const MIN_ORDER_FORM_MS = 8000
const MAX_ORDER_FORM_MS = 30 * 60 * 1000

function getSigningSecret() {
  const explicit = process.env.API_SECRET || process.env.ADMIN_PASSWORD
  if (explicit) return explicit

  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN
  if (upstashToken) {
    return createHmac('sha256', 'mscarte-order-form-v1').update(upstashToken).digest('hex')
  }

  return ''
}

function safeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false
  return timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'))
}

function signChallenge(id, issuedAt) {
  const secret = getSigningSecret()
  if (!secret) return null
  return createHmac('sha256', secret).update(`${id}:${issuedAt}`).digest('hex')
}

export function isOrderFormSecurityConfigured() {
  return Boolean(getSigningSecret())
}

export async function createOrderFormChallenge(redis) {
  const secret = getSigningSecret()
  if (!secret) {
    throw new Error('Order form security is not configured')
  }

  const id = randomUUID()
  const issuedAt = Date.now()
  const signature = signChallenge(id, issuedAt)
  const token = `${id}.${issuedAt}.${signature}`

  await redis.set(
    `${CHALLENGE_PREFIX}${id}`,
    { issuedAt, used: false },
    { ex: CHALLENGE_TTL_SEC }
  )

  return {
    token,
    issuedAt,
    minDurationMs: MIN_ORDER_FORM_MS,
    turnstileRequired: Boolean(process.env.TURNSTILE_SECRET_KEY),
  }
}

async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true
  if (!token) return false

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      secret,
      response: token,
      remoteip: ip,
    }),
  })

  const data = (await response.json().catch(() => ({}))) 
  return data.success === true
}

export async function verifyOrderFormSecurity(redis, ip, payload) {
  if (!payload || typeof payload !== 'object') {
    return { ok: false, error: 'Vérification du formulaire requise' }
  }

  const honeypot = String(payload.honeypot ?? payload.website ?? '').trim()
  if (honeypot) {
    return { ok: false, error: 'Soumission rejetée' }
  }

  if (process.env.TURNSTILE_SECRET_KEY) {
    const turnstileOk = await verifyTurnstile(payload.turnstileToken, ip)
    if (!turnstileOk) {
      return { ok: false, error: 'Vérification anti-robot échouée. Réessayez.' }
    }
  }

  if (!isOrderFormSecurityConfigured()) {
    return { ok: false, error: 'Service de commande indisponible' }
  }

  const challengeToken = String(payload.challengeToken ?? '').trim()
  const parts = challengeToken.split('.')
  if (parts.length !== 3) {
    return { ok: false, error: 'Session formulaire invalide. Rechargez la page.' }
  }

  const [id, issuedAtStr, signature] = parts
  const issuedAt = Number(issuedAtStr)
  if (!id || !Number.isFinite(issuedAt)) {
    return { ok: false, error: 'Session formulaire invalide. Rechargez la page.' }
  }

  const expected = signChallenge(id, issuedAt)
  if (!expected || !safeEqualHex(signature, expected)) {
    return { ok: false, error: 'Session formulaire invalide. Rechargez la page.' }
  }

  const stored = await redis.get(`${CHALLENGE_PREFIX}${id}`)
  if (!stored || stored.used) {
    return { ok: false, error: 'Session formulaire expirée. Rechargez la page.' }
  }

  const formStartedAt = Number(payload.formStartedAt ?? issuedAt)
  const elapsed = Date.now() - formStartedAt
  if (elapsed < MIN_ORDER_FORM_MS) {
    return { ok: false, error: 'Soumission trop rapide. Vérifiez vos informations.' }
  }
  if (elapsed > MAX_ORDER_FORM_MS) {
    return { ok: false, error: 'Session formulaire expirée. Rechargez la page.' }
  }

  await redis.set(`${CHALLENGE_PREFIX}${id}`, { ...stored, used: true }, { ex: 120 })

  return { ok: true }
}
