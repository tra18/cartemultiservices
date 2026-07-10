import type { DiasporaPaymentMethodId } from '../data/diasporaPaymentMethods'

export interface DiasporaRechargePayload {
  beneficiaryEmail?: string
  beneficiaryPhone?: string
  beneficiaryCard?: string
  payerName: string
  payerEmail: string
  payerCountry: string
  amount: number
  paymentMethod: DiasporaPaymentMethodId
  message?: string
  _honeypot?: string
}

export async function submitDiasporaRecharge(
  payload: DiasporaRechargePayload
): Promise<{
  ok: boolean
  beneficiaryName?: string
  newBalance?: number
  error?: string
}> {
  try {
    const response = await fetch('/api/diaspora-recharge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = (await response.json()) as {
      ok?: boolean
      beneficiaryName?: string
      newBalance?: number
      error?: string
    }
    if (!response.ok) {
      return { ok: false, error: data.error ?? 'Recharge échouée' }
    }
    return {
      ok: Boolean(data.ok),
      beneficiaryName: data.beneficiaryName,
      newBalance: data.newBalance,
    }
  } catch {
    return { ok: false, error: 'Recharge échouée. Vérifiez votre connexion.' }
  }
}
