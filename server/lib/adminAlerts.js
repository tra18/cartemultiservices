import { randomUUID } from 'crypto'

export const ADMIN_ALERTS_KEY = 'admin-alerts'
const MAX_ALERTS = 200

export async function pushAdminAlert(redis, alert) {
  const alerts = (await redis.get(ADMIN_ALERTS_KEY)) ?? []
  const entry = {
    id: randomUUID(),
    read: false,
    createdAt: new Date().toISOString(),
    ...alert,
  }
  const next = [entry, ...alerts].slice(0, MAX_ALERTS)
  await redis.set(ADMIN_ALERTS_KEY, next)
  return entry
}

export async function loadAdminAlerts(redis) {
  return (await redis.get(ADMIN_ALERTS_KEY)) ?? []
}

export async function markAdminAlertsRead(redis, alertIds) {
  const ids = new Set(alertIds)
  const alerts = await loadAdminAlerts(redis)
  const next = alerts.map((item) => (ids.has(item.id) ? { ...item, read: true } : item))
  await redis.set(ADMIN_ALERTS_KEY, next)
  return next
}
