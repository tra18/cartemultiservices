import type { WithdrawalMethod } from '../types/merchant'
import { syncTreasuryEntry } from '../services/financeServer'

const TREASURY_KEY = 'carte-multiservice-treasury'

export type TreasuryEntryType =
  | 'card_order'
  | 'merchant_registration'
  | 'merchant_category'
  | 'admin_withdrawal'

export interface TreasuryEntry {
  id: string
  type: TreasuryEntryType
  amount: number
  label: string
  date: string
  referenceId?: string
}

export interface AdminWithdrawalRecord {
  id: string
  amount: number
  method: WithdrawalMethod
  accountNumber: string
  createdAt: string
}

interface TreasuryState {
  entries: TreasuryEntry[]
  adminWithdrawals: AdminWithdrawalRecord[]
}

function loadState(): TreasuryState {
  try {
    const stored = localStorage.getItem(TREASURY_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as TreasuryState
      return { entries: parsed.entries ?? [], adminWithdrawals: parsed.adminWithdrawals ?? [] }
    }
  } catch {
    /* ignore */
  }
  return { entries: [], adminWithdrawals: [] }
}

function saveState(state: TreasuryState) {
  localStorage.setItem(TREASURY_KEY, JSON.stringify(state))
}

export function replaceTreasuryState(state: TreasuryState) {
  saveState(state)
}

function addEntry(
  type: TreasuryEntryType,
  amount: number,
  label: string,
  referenceId?: string
): TreasuryEntry {
  const entry: TreasuryEntry = {
    id: crypto.randomUUID(),
    type,
    amount,
    label,
    date: new Date().toISOString(),
    referenceId,
  }
  const state = loadState()
  saveState({
    entries: [entry, ...state.entries],
    adminWithdrawals: state.adminWithdrawals,
  })
  void syncTreasuryEntry({ type, amount, label, referenceId })
  return entry
}

export function recordCardOrderRevenue(orderId: string, amount: number, customerName: string) {
  return addEntry('card_order', amount, `Commande carte — ${customerName}`, orderId)
}

export function recordMerchantRegistrationRevenue(
  merchantId: string,
  amount: number,
  businessName: string,
  categoryCount: number
) {
  return addEntry(
    'merchant_registration',
    amount,
    `Inscription commerçant — ${businessName} (${categoryCount} catégorie${categoryCount > 1 ? 's' : ''})`,
    merchantId
  )
}

export function recordMerchantCategoryRevenue(
  merchantId: string,
  amount: number,
  businessName: string,
  categoryLabel: string
) {
  return addEntry(
    'merchant_category',
    amount,
    `Catégorie ajoutée — ${businessName} · ${categoryLabel}`,
    merchantId
  )
}
