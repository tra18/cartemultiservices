import { getClientAuthHeaders } from './clientAuth'
import type { Category } from '../types'
import type { PaymentRequest } from '../types/merchant'

async function readError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string }
    return data.error ?? 'Erreur serveur'
  } catch {
    return 'Erreur serveur'
  }
}

export function getQrPaymentUrl(paymentId: string): string {
  return `${window.location.origin}/paiement-qr/${paymentId}`
}

export async function createQrPaymentOnServer(payload: {
  merchantId: string
  merchantName: string
  category: Category
  amount: number
}): Promise<{ ok: boolean; payment?: PaymentRequest; qrUrl?: string; error?: string }> {
  const response = await fetch('/api/qr-payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create', ...payload }),
  })
  if (!response.ok) {
    return { ok: false, error: await readError(response) }
  }
  const data = (await response.json()) as { payment: PaymentRequest; qrUrl?: string }
  return { ok: true, payment: data.payment, qrUrl: data.qrUrl }
}

export async function fetchQrPayment(
  paymentId: string
): Promise<{ ok: boolean; payment?: PaymentRequest; error?: string }> {
  const response = await fetch(`/api/qr-payments/${encodeURIComponent(paymentId)}`)
  if (!response.ok) {
    return { ok: false, error: await readError(response) }
  }
  const data = (await response.json()) as { payment: PaymentRequest }
  return { ok: true, payment: data.payment }
}

export async function cancelQrPaymentOnServer(
  paymentId: string,
  merchantId: string
): Promise<{ ok: boolean; error?: string }> {
  const response = await fetch('/api/qr-payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'cancel', paymentId, merchantId }),
  })
  if (!response.ok) {
    return { ok: false, error: await readError(response) }
  }
  return { ok: true }
}

export async function payQrPaymentOnServer(
  paymentId: string,
  pin: string
): Promise<{
  ok: boolean
  error?: string
  blocked?: boolean
  payment?: PaymentRequest
  newBalance?: number
}> {
  const response = await fetch('/api/qr-payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getClientAuthHeaders() },
    body: JSON.stringify({ action: 'pay', paymentId, pin }),
  })
  const data = (await response.json()) as {
    ok?: boolean
    error?: string
    blocked?: boolean
    payment?: PaymentRequest
    newBalance?: number
  }
  if (!response.ok) {
    return { ok: false, error: data.error ?? 'Paiement échoué', blocked: data.blocked }
  }
  return {
    ok: true,
    payment: data.payment,
    newBalance: data.newBalance,
  }
}
