import type { SimulatedEmail } from './emailService'

export const ADMIN_TOKEN_KEY = 'carte-multiservice-admin-token'

const API_SECRET = import.meta.env.VITE_API_SECRET ?? ''

export function getWriteApiHeaders(): Record<string, string> {
  if (!API_SECRET) return {}
  return { 'x-api-key': API_SECRET }
}

export function getAdminAuthHeaders(): Record<string, string> {
  const token = sessionStorage.getItem(ADMIN_TOKEN_KEY)
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

export type EmailType = SimulatedEmail['type']

export interface EmailApiPayload {
  type: EmailType
  data: Record<string, unknown>
}

export function buildEmailApiPayload(
  type: EmailType,
  to: string,
  extra: Record<string, unknown> = {}
): EmailApiPayload {
  return {
    type,
    data: { email: to, ...extra },
  }
}

export function buildAdminEmailApiPayload(
  type: Extract<
    EmailType,
    'admin_order_notification' | 'admin_merchant_notification' | 'admin_withdrawal_notification'
  >,
  data: Record<string, unknown>
): EmailApiPayload {
  return { type, data }
}
