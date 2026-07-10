import { getClientAuthHeaders } from './clientAuth'
import type { Category } from '../types'

export interface WalletPayClient {
  fullName: string
  maskedCard: string
  cardStatus: string
}

export interface WalletCharge {
  id: string
  userId: string
  merchantId: string
  merchantName: string
  category: Category
  amount: number
  status: 'pending' | 'paid' | 'cancelled' | 'expired'
  createdAt: string
  expiresAt: string
  paidAt?: string
  paidByUserName?: string
}

async function readError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string }
    return data.error ?? 'Erreur serveur'
  } catch {
    return 'Erreur serveur'
  }
}

export async function lookupWalletPayToken(
  token: string
): Promise<{ ok: boolean; client?: WalletPayClient; error?: string }> {
  const response = await fetch(`/api/wallet-pay/${encodeURIComponent(token)}`)
  if (!response.ok) {
    return { ok: false, error: await readError(response) }
  }
  const data = (await response.json()) as { client: WalletPayClient }
  return { ok: true, client: data.client }
}

export async function createWalletCharge(payload: {
  token: string
  merchantId: string
  merchantName: string
  category: Category
  amount: number
}): Promise<{ ok: boolean; charge?: WalletCharge; error?: string }> {
  const response = await fetch('/api/wallet-charge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create', ...payload }),
  })
  if (!response.ok) {
    return { ok: false, error: await readError(response) }
  }
  const data = (await response.json()) as { charge: WalletCharge }
  return { ok: true, charge: data.charge }
}

export async function fetchPendingWalletCharge(): Promise<WalletCharge | null> {
  const response = await fetch('/api/wallet-charge/pending', {
    headers: getClientAuthHeaders(),
  })
  if (!response.ok) return null
  const data = (await response.json()) as { charge: WalletCharge | null }
  return data.charge
}

export async function fetchWalletChargeStatus(
  chargeId: string,
  merchantId: string
): Promise<WalletCharge | null> {
  const response = await fetch(
    `/api/wallet-charge/${encodeURIComponent(chargeId)}?merchantId=${encodeURIComponent(merchantId)}`
  )
  if (!response.ok) return null
  const data = (await response.json()) as { charge: WalletCharge }
  return data.charge
}

export async function confirmWalletChargeOnServer(
  chargeId: string,
  pin: string
): Promise<{
  ok: boolean
  error?: string
  blocked?: boolean
  newBalance?: number
  charge?: WalletCharge
}> {
  const response = await fetch('/api/wallet-charge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getClientAuthHeaders() },
    body: JSON.stringify({ action: 'confirm', chargeId, pin }),
  })
  const data = (await response.json()) as {
    ok?: boolean
    error?: string
    blocked?: boolean
    newBalance?: number
    charge?: WalletCharge
  }
  if (!response.ok) {
    return { ok: false, error: data.error ?? 'Paiement échoué', blocked: data.blocked }
  }
  return { ok: true, newBalance: data.newBalance, charge: data.charge }
}

export async function cancelWalletChargeOnServer(
  chargeId: string,
  options: { merchantId?: string } = {}
): Promise<{ ok: boolean; error?: string }> {
  const response = await fetch('/api/wallet-charge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getClientAuthHeaders() },
    body: JSON.stringify({ action: 'cancel', chargeId, ...options }),
  })
  if (!response.ok) {
    return { ok: false, error: await readError(response) }
  }
  return { ok: true }
}

export function extractWalletPayToken(text: string): string | null {
  const urlMatch = text.match(/wallet-pay\/([a-f0-9-]+)/i)
  if (urlMatch) return urlMatch[1]
  if (/^[a-f0-9-]{36}$/i.test(text.trim())) return text.trim()
  return null
}
