const RATE_LIMIT_KEY = 'carte-multiservice-order-attempts'
const FORM_TOKEN_KEY = 'carte-multiservice-form-token'
const MAX_ATTEMPTS = 5
const WINDOW_MS = 60 * 60 * 1000 // 1 heure
const MIN_FORM_DURATION_MS = 4000 // anti-bot : 4 secondes minimum

interface RateLimitEntry {
  count: number
  firstAttempt: number
  blockedUntil?: number
}

function loadRateLimit(): RateLimitEntry {
  try {
    const stored = localStorage.getItem(RATE_LIMIT_KEY)
    if (stored) return JSON.parse(stored) as RateLimitEntry
  } catch {
    /* ignore */
  }
  return { count: 0, firstAttempt: Date.now() }
}

function saveRateLimit(entry: RateLimitEntry) {
  localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(entry))
}

export function createFormToken(): string {
  const token = crypto.randomUUID()
  sessionStorage.setItem(FORM_TOKEN_KEY, token)
  return token
}

export function verifyFormToken(token: string): boolean {
  const stored = sessionStorage.getItem(FORM_TOKEN_KEY)
  return Boolean(stored && stored === token)
}

export function clearFormToken() {
  sessionStorage.removeItem(FORM_TOKEN_KEY)
}

export function checkRateLimit(): string | null {
  const now = Date.now()
  const entry = loadRateLimit()

  if (entry.blockedUntil && now < entry.blockedUntil) {
    const minutes = Math.ceil((entry.blockedUntil - now) / 60000)
    return `Trop de tentatives. Réessayez dans ${minutes} minute(s).`
  }

  if (now - entry.firstAttempt > WINDOW_MS) {
    saveRateLimit({ count: 0, firstAttempt: now })
    return null
  }

  if (entry.count >= MAX_ATTEMPTS) {
    const blockedUntil = now + WINDOW_MS
    saveRateLimit({ ...entry, blockedUntil })
    return 'Trop de tentatives. Réessayez dans 1 heure.'
  }

  return null
}

export function recordFailedAttempt() {
  const entry = loadRateLimit()
  saveRateLimit({ ...entry, count: entry.count + 1 })
}

export function resetRateLimit() {
  localStorage.removeItem(RATE_LIMIT_KEY)
}

export function checkFormTiming(formStartedAt: number): string | null {
  const elapsed = Date.now() - formStartedAt
  if (elapsed < MIN_FORM_DURATION_MS) {
    return 'Soumission trop rapide. Veuillez vérifier vos informations.'
  }
  return null
}

export function checkHoneypot(honeypotValue: string): string | null {
  if (honeypotValue.trim().length > 0) {
    return 'Soumission rejetée.'
  }
  return null
}
