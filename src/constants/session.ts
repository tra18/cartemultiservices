export const CLIENT_IDLE_TIMEOUT_MS = 5 * 60 * 1000
export const MERCHANT_IDLE_TIMEOUT_MS = 10 * 60 * 1000
export const ADMIN_IDLE_TIMEOUT_MS = 10 * 60 * 1000

/** @deprecated Utiliser CLIENT_IDLE_TIMEOUT_MS */
export const IDLE_TIMEOUT_MS = CLIENT_IDLE_TIMEOUT_MS

export const IDLE_ACTIVITY_KEY = 'carte-ms-last-activity'

export const IDLE_ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keydown',
  'touchstart',
  'scroll',
  'click',
] as const

export function markUserActivity(timestamp = Date.now()) {
  sessionStorage.setItem(IDLE_ACTIVITY_KEY, String(timestamp))
}

export function clearUserActivity() {
  sessionStorage.removeItem(IDLE_ACTIVITY_KEY)
}

export function getIdleElapsedMs() {
  const stored = sessionStorage.getItem(IDLE_ACTIVITY_KEY)
  if (!stored) return 0
  const last = Number(stored)
  if (!Number.isFinite(last)) return 0
  return Date.now() - last
}
