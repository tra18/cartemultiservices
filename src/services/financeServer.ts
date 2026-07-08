import type { MerchantAccount, WithdrawalMethod, WithdrawalRequest } from '../types/merchant'
import type { AdminWithdrawalRecord, TreasuryEntry, TreasuryEntryType } from '../store/treasuryStore'
import { getAdminAuthHeaders } from './apiClient'

export interface MerchantWithdrawalWithMeta extends WithdrawalRequest {
  merchantId: string
  merchantName: string
}

export interface FinanceSummary {
  balance: number
  totalIncome: number
  totalPayouts: number
  cardOrdersRevenue: number
  merchantFeesRevenue: number
}

export interface FinanceSnapshot {
  summary: FinanceSummary
  entries: TreasuryEntry[]
  adminWithdrawals: AdminWithdrawalRecord[]
  merchants: MerchantAccount[]
  pendingMerchant: MerchantWithdrawalWithMeta[]
}

async function readError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string }
    return data.error ?? 'Erreur serveur'
  } catch {
    return 'Erreur serveur'
  }
}

export async function fetchFinanceSnapshot(): Promise<FinanceSnapshot | null> {
  const response = await fetch('/api/finance', { headers: getAdminAuthHeaders() })
  if (!response.ok) return null
  return (await response.json()) as FinanceSnapshot
}

export async function fetchFinanceMerchant(merchantId: string): Promise<MerchantAccount | null> {
  const response = await fetch('/api/finance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'get_merchant', merchantId }),
  })
  if (!response.ok) return null
  const data = (await response.json()) as { merchant?: MerchantAccount }
  return data.merchant ?? null
}

export async function syncTreasuryEntry(entry: {
  type: TreasuryEntryType
  amount: number
  label: string
  referenceId?: string
}): Promise<void> {
  await fetch('/api/finance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'record_entry', ...entry }),
  }).catch(() => {})
}

export async function upsertFinanceMerchant(merchant: MerchantAccount): Promise<void> {
  await fetch('/api/finance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'upsert_merchant', merchant }),
  }).catch(() => {})
}

export async function requestAdminWithdrawalOnServer(
  amount: number,
  method: WithdrawalMethod,
  accountNumber: string
): Promise<{ success: boolean; error?: string }> {
  const response = await fetch('/api/finance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAdminAuthHeaders() },
    body: JSON.stringify({ action: 'admin_withdrawal', amount, method, accountNumber }),
  })

  if (!response.ok) return { success: false, error: await readError(response) }
  return { success: true }
}

export async function processMerchantWithdrawalOnServer(
  merchantId: string,
  withdrawalId: string,
  decision: 'complete' | 'reject'
): Promise<{ success: boolean; error?: string }> {
  const response = await fetch('/api/finance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAdminAuthHeaders() },
    body: JSON.stringify({ action: 'merchant_withdrawal_process', merchantId, withdrawalId, decision }),
  })

  if (!response.ok) return { success: false, error: await readError(response) }
  return { success: true }
}

export async function requestMerchantWithdrawalOnServer(
  merchantId: string,
  amount: number,
  method: WithdrawalMethod,
  accountNumber: string
): Promise<{ success: boolean; error?: string; merchant?: MerchantAccount }> {
  const response = await fetch('/api/finance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'merchant_withdrawal_request', merchantId, amount, method, accountNumber }),
  })

  if (!response.ok) return { success: false, error: await readError(response) }
  const data = (await response.json()) as { merchant?: MerchantAccount }
  return { success: true, merchant: data.merchant }
}
