import { getClientIp, getRedis, isValidEmail, rateLimit, sanitizeText } from './security.js'

export function getSiteUrl() {
  return (process.env.SITE_URL ?? 'https://mscarte.com').replace(/\/$/, '')
}

export function maskCardNumber(cardNumber) {
  const digits = String(cardNumber ?? '').replace(/\s/g, '')
  if (digits.length < 4) return '•••• •••• •••• ••••'
  return `•••• •••• •••• ${digits.slice(-4)}`
}

export function buildWalletPayQrUrl(token) {
  return `${getSiteUrl()}/wallet-pay/${encodeURIComponent(token)}`
}

export function isAppleWalletConfigured() {
  return Boolean(
    process.env.APPLE_TEAM_ID &&
      process.env.APPLE_PASS_TYPE_ID &&
      process.env.APPLE_WWDR_CERT_BASE64 &&
      ((process.env.APPLE_PASS_SIGNER_CERT_BASE64 && process.env.APPLE_PASS_SIGNER_KEY_BASE64) ||
        process.env.APPLE_PASS_CERT_P12_BASE64)
  )
}

export function isGoogleWalletConfigured() {
  return Boolean(
    process.env.GOOGLE_WALLET_ISSUER_ID?.trim() &&
      (process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON?.trim() ||
        process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON_BASE64?.trim())
  )
}

export function parseWalletRequest(req) {
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body ?? {}
  const platform = body.platform === 'google' ? 'google' : body.platform === 'apple' ? 'apple' : null
  const userId = sanitizeText(body.userId, 80)
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const fullName = sanitizeText(body.fullName, 80)
  const cardNumber = sanitizeText(body.cardNumber, 32)

  if (!platform) return { error: 'Plateforme invalide (apple ou google)' }
  if (!userId) return { error: 'Identifiant utilisateur requis' }
  if (!isValidEmail(email)) return { error: 'Email invalide' }
  if (!fullName) return { error: 'Nom requis' }
  if (cardNumber.replace(/\s/g, '').length < 4) return { error: 'Numéro de carte invalide' }

  return { platform, userId, email, fullName, cardNumber }
}

export async function enforceWalletRateLimit(req) {
  const redis = getRedis()
  if (!redis) return true
  const ip = getClientIp(req)
  return rateLimit(redis, `rate:wallet:${ip}`, 20, 3600)
}

export async function markWalletAdded(userId, platform) {
  const redis = getRedis()
  if (!redis) return
  const key = `wallet:${platform}:${userId}`
  await redis.set(key, new Date().toISOString(), { ex: 60 * 60 * 24 * 365 })
}
