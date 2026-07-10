import { getClientAuthHeaders } from './clientAuth'
import type { UserAccount } from '../types/auth'
import type { DeliveryMethod } from '../types/order'
import type { PaymentMethodId } from '../data/paymentMethods'

export async function fetchFamilyMinors(): Promise<{ minors: UserAccount[]; error?: string }> {
  const response = await fetch('/api/family', { headers: getClientAuthHeaders() })
  if (!response.ok) {
    const data = (await response.json()) as { error?: string }
    return { minors: [], error: data.error ?? 'Chargement échoué' }
  }
  const data = (await response.json()) as { minors: UserAccount[] }
  return { minors: data.minors ?? [] }
}

export async function fetchMinor(minorId: string): Promise<{ minor: UserAccount | null; error?: string }> {
  const response = await fetch(`/api/family?minorId=${encodeURIComponent(minorId)}`, {
    headers: getClientAuthHeaders(),
  })
  if (!response.ok) {
    const data = (await response.json()) as { error?: string }
    return { minor: null, error: data.error ?? 'Mineur introuvable' }
  }
  const data = (await response.json()) as { minor: UserAccount }
  return { minor: data.minor ?? null }
}

async function familyAction(body: Record<string, unknown>): Promise<{ ok: boolean; error?: string; minor?: UserAccount }> {
  const response = await fetch('/api/family', {
    method: 'POST',
    headers: { ...getClientAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await response.json()) as { ok?: boolean; error?: string; minor?: UserAccount }
  if (!response.ok) return { ok: false, error: data.error ?? 'Action échouée' }
  return { ok: Boolean(data.ok), minor: data.minor, error: data.error }
}

export async function createMinorProfile(input: {
  fullName: string
  dateOfBirth: string
  phone?: string
}): Promise<{ ok: boolean; minor?: UserAccount; error?: string }> {
  const result = await familyAction({ action: 'create_minor', ...input })
  return { ok: result.ok, minor: result.minor, error: result.error }
}

export async function orderMinorCard(
  minorId: string,
  input: {
    address: string
    city: string
    deliveryMethod: DeliveryMethod | string
    paymentMethod: PaymentMethodId | string
  }
): Promise<{ ok: boolean; error?: string }> {
  return familyAction({ action: 'order_card', minorId, ...input })
}

export async function transferToMinor(minorId: string, amount: number) {
  return familyAction({ action: 'transfer_to_minor', minorId, amount })
}

export async function withdrawFromMinor(minorId: string, amount: number) {
  return familyAction({ action: 'withdraw_from_minor', minorId, amount })
}

export async function blockMinorCard(minorId: string) {
  return familyAction({ action: 'block_card', minorId })
}

export async function unblockMinorCard(minorId: string) {
  return familyAction({ action: 'unblock_card', minorId })
}

export async function setMinorPin(minorId: string, pin: string) {
  return familyAction({ action: 'set_pin', minorId, pin })
}

export async function setMinorLimits(
  minorId: string,
  limits: { dailyMax?: number; perTransactionMax?: number }
) {
  return familyAction({ action: 'set_limits', minorId, ...limits })
}
