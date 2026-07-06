import type { WithdrawalMethod } from '../types/merchant'
import { sendAdminWithdrawalNotificationEmail } from '../services/emailService'

const TREASURY_KEY = 'carte-multiservice-treasury'

export type TreasuryEntryType =
  | 'card_order'
  | 'merchant_registration'
  | 'merchant_category'
  | 'admin_withdrawal'

export interface TreasuryEntry {
  id: string
  type: TreasuryEntryType
  /** Positif = entrée, négatif = sortie */
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

export function getTreasuryBalance(): number {
  return loadState().entries.reduce((sum, e) => sum + e.amount, 0)
}

export function getTreasuryEntries(): TreasuryEntry[] {
  return [...loadState().entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}

export function getTreasurySummary() {
  const entries = loadState().entries
  const income = entries.filter((e) => e.amount > 0).reduce((s, e) => s + e.amount, 0)
  const payouts = entries.filter((e) => e.amount < 0).reduce((s, e) => s + Math.abs(e.amount), 0)
  const cardOrders = entries
    .filter((e) => e.type === 'card_order')
    .reduce((s, e) => s + e.amount, 0)
  const merchantFees = entries
    .filter((e) => e.type === 'merchant_registration' || e.type === 'merchant_category')
    .reduce((s, e) => s + e.amount, 0)

  return {
    balance: income - payouts,
    totalIncome: income,
    totalPayouts: payouts,
    cardOrdersRevenue: cardOrders,
    merchantFeesRevenue: merchantFees,
  }
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

export function requestAdminWithdrawal(
  amount: number,
  method: WithdrawalMethod,
  accountNumber: string
): { success: boolean; error?: string; withdrawal?: AdminWithdrawalRecord } {
  const balance = getTreasuryBalance()
  if (amount <= 0) return { success: false, error: 'Montant invalide' }
  if (amount > balance) {
    return {
      success: false,
      error: `Solde plateforme insuffisant (${balance.toLocaleString('fr-GN')} GNF)`,
    }
  }
  if (!accountNumber.trim()) {
    return { success: false, error: 'Numéro de compte requis' }
  }

  const methodLabels: Record<WithdrawalMethod, string> = {
    'orange-money': 'Orange Money',
    'mobile-money': 'Mobile Money',
    bank: 'Virement bancaire',
  }

  const withdrawal: AdminWithdrawalRecord = {
    id: crypto.randomUUID(),
    amount,
    method,
    accountNumber: accountNumber.trim(),
    createdAt: new Date().toISOString(),
  }

  const state = loadState()
  saveState({
    entries: [
      {
        id: crypto.randomUUID(),
        type: 'admin_withdrawal',
        amount: -amount,
        label: `Retrait admin — ${methodLabels[method]} · ${accountNumber.trim()}`,
        date: new Date().toISOString(),
        referenceId: withdrawal.id,
      },
      ...state.entries,
    ],
    adminWithdrawals: [withdrawal, ...state.adminWithdrawals],
  })

  sendAdminWithdrawalNotificationEmail(
    'Retrait plateforme enregistré — Guinée Multiservices',
    `Bonjour Admin,

Un retrait plateforme a été enregistré.

  Montant : ${amount.toLocaleString('fr-GN')} GNF
  Méthode : ${methodLabels[method]}
  Destination : ${accountNumber.trim()}

Le journal de trésorerie a été mis à jour.

Cordialement,
Système Guinée Multiservices`
  )

  return { success: true, withdrawal }
}

export function getAdminWithdrawals(): AdminWithdrawalRecord[] {
  return loadState().adminWithdrawals
}
