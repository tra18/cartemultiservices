import type { Category } from '../types'
import type { Transaction } from '../types'
import type { UserAccount } from '../types/auth'
import type {
  MerchantAccount,
  PaymentRequest,
  WithdrawalRequest,
} from '../types/merchant'
import {
  sendAdminWithdrawalNotificationEmail,
  sendMerchantWithdrawalProcessedEmail,
  sendMerchantWithdrawalRequestedEmail,
} from '../services/emailService'
import { recordQrSaleOnServer } from '../services/financeServer'

const MERCHANTS_KEY = 'carte-multiservice-merchants'
const PAYMENTS_KEY = 'carte-multiservice-payments'
const PAYMENT_EXPIRY_MS = 15 * 60 * 1000
const WITHDRAWAL_METHOD_LABELS: Record<WithdrawalRequest['method'], string> = {
  'orange-money': 'Orange Money',
  'mobile-money': 'Mobile Money (MTN)',
  bank: 'Virement bancaire',
}

const DEMO_MERCHANTS: MerchantAccount[] = [
  {
    id: 'merchant-prodimar',
    businessName: 'Prodimar',
    email: 'prodimar@carte.gn',
    password: 'demo123',
    phone: '+224 621 00 00 01',
    categories: ['courses', 'vetements'],
    balance: 450_000,
    mobileMoneyNumber: '+224 621 00 00 01',
    sales: [
      {
        id: 'sale-1',
        paymentRequestId: 'legacy-1',
        amount: 320_000,
        customerName: 'Mamadou Diallo',
        date: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
    ],
    withdrawals: [],
    registrationPaid: true,
  },
  {
    id: 'merchant-riviera',
    businessName: 'Riviera Restaurant',
    email: 'riviera@carte.gn',
    password: 'demo123',
    phone: '+224 622 00 00 02',
    categories: ['restaurants', 'transport'],
    balance: 125_000,
    mobileMoneyNumber: '+224 622 00 00 02',
    sales: [
      {
        id: 'sale-2',
        paymentRequestId: 'legacy-2',
        amount: 85_000,
        customerName: 'Mamadou Diallo',
        date: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    ],
    withdrawals: [],
    registrationPaid: true,
  },
]

function loadJson<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key)
    if (stored) return JSON.parse(stored) as T
  } catch {
    /* ignore */
  }
  return fallback
}

function saveJson<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data))
}

function normalizeMerchant(raw: MerchantAccount & { category?: Category }): MerchantAccount {
  const categories: Category[] =
    raw.categories?.length > 0
      ? raw.categories
      : raw.category
        ? [raw.category]
        : ['courses']

  const { category: _legacy, ...rest } = raw
  return { ...rest, categories }
}

export function loadMerchants(): MerchantAccount[] {
  const stored = loadJson<(MerchantAccount & { category?: Category })[] | null>(MERCHANTS_KEY, null)
  const demoMerchants = import.meta.env.DEV ? DEMO_MERCHANTS : []

  if (!stored || stored.length === 0) {
    if (demoMerchants.length > 0) {
      saveJson(MERCHANTS_KEY, demoMerchants)
      return demoMerchants
    }
    return []
  }

  const merged = [...stored.map(normalizeMerchant)]
  if (import.meta.env.DEV) {
    for (const demo of DEMO_MERCHANTS) {
      if (!merged.some((m) => m.email.toLowerCase() === demo.email.toLowerCase())) {
        merged.push(demo)
      }
    }
  }
  return merged.map((m) => ({ ...m, registrationPaid: m.registrationPaid ?? true }))
}

export function saveMerchants(merchants: MerchantAccount[]) {
  saveJson(MERCHANTS_KEY, merchants)
}

export function loadPaymentRequests(): PaymentRequest[] {
  return loadJson(PAYMENTS_KEY, [])
}

export function savePaymentRequests(requests: PaymentRequest[]) {
  saveJson(PAYMENTS_KEY, requests)
}

export function getPaymentRequest(id: string): PaymentRequest | undefined {
  return loadPaymentRequests().find((p) => p.id === id)
}

export function createPaymentRequest(
  merchant: MerchantAccount,
  amount: number,
  category?: Category
): PaymentRequest {
  const paymentCategory =
    category ?? (merchant.categories.length === 1 ? merchant.categories[0] : undefined)

  if (!paymentCategory || !merchant.categories.includes(paymentCategory)) {
    throw new Error('Catégorie de paiement invalide')
  }

  const now = new Date()
  const request: PaymentRequest = {
    id: crypto.randomUUID(),
    merchantId: merchant.id,
    merchantName: merchant.businessName,
    category: paymentCategory,
    amount,
    status: 'pending',
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + PAYMENT_EXPIRY_MS).toISOString(),
  }

  const requests = loadPaymentRequests()
  savePaymentRequests([request, ...requests])
  return request
}

export function cancelPaymentRequest(paymentId: string, merchantId: string): boolean {
  const requests = loadPaymentRequests()
  const index = requests.findIndex(
    (p) => p.id === paymentId && p.merchantId === merchantId && p.status === 'pending'
  )
  if (index === -1) return false

  requests[index] = { ...requests[index], status: 'cancelled' }
  savePaymentRequests(requests)
  return true
}

export function getQrPaymentUrl(paymentId: string): string {
  return `${window.location.origin}/paiement-qr/${paymentId}`
}

function expireIfNeeded(request: PaymentRequest): PaymentRequest {
  if (request.status === 'pending' && new Date(request.expiresAt) < new Date()) {
    const requests = loadPaymentRequests()
    const updated = requests.map((p) =>
      p.id === request.id ? { ...p, status: 'expired' as const } : p
    )
    savePaymentRequests(updated)
    return { ...request, status: 'expired' }
  }
  return request
}

export async function completeQrPayment(
  paymentId: string,
  user: UserAccount
): Promise<{ success: boolean; error?: string; transaction?: Transaction }> {
  let request = getPaymentRequest(paymentId)
  if (!request) return { success: false, error: 'Paiement introuvable' }

  request = expireIfNeeded(request)

  if (request.status === 'paid') {
    return { success: false, error: 'Ce paiement a déjà été effectué' }
  }
  if (request.status !== 'pending') {
    return { success: false, error: 'Ce QR code n\'est plus valide' }
  }
  if (user.balance < request.amount) {
    return { success: false, error: 'Solde insuffisant sur votre carte' }
  }

  const merchants = loadMerchants()
  const merchantIndex = merchants.findIndex((m) => m.id === request!.merchantId)
  if (merchantIndex === -1) {
    return { success: false, error: 'Commerçant introuvable' }
  }

  const serverResult = await recordQrSaleOnServer({
    merchantId: request.merchantId,
    paymentRequestId: paymentId,
    amount: request.amount,
    customerName: user.fullName,
  })
  if (!serverResult.success) {
    return { success: false, error: serverResult.error ?? 'Synchronisation du paiement échouée' }
  }

  if (serverResult.merchant) {
    merchants[merchantIndex] = {
      ...merchants[merchantIndex],
      balance: serverResult.merchant.balance,
      sales: serverResult.merchant.sales,
    }
    saveMerchants(merchants)
  }

  const requests = loadPaymentRequests()
  savePaymentRequests(
    requests.map((p) =>
      p.id === paymentId
        ? {
            ...p,
            status: 'paid' as const,
            paidAt: new Date().toISOString(),
            paidByUserId: user.id,
            paidByUserName: user.fullName,
          }
        : p
    )
  )

  const transaction: Transaction = {
    id: crypto.randomUUID(),
    type: 'paiement',
    category: request.category,
    merchant: request.merchantName,
    amount: request.amount,
    date: new Date().toISOString(),
    method: 'QR Code',
  }

  return { success: true, transaction }
}

export function requestWithdrawal(
  merchantId: string,
  amount: number,
  method: WithdrawalRequest['method'],
  accountNumber: string
): { success: boolean; error?: string } {
  const merchants = loadMerchants()
  const index = merchants.findIndex((m) => m.id === merchantId)
  if (index === -1) return { success: false, error: 'Commerçant introuvable' }

  const merchant = merchants[index]
  const pending = merchant.withdrawals
    .filter((w) => w.status === 'pending')
    .reduce((sum, w) => sum + w.amount, 0)
  const available = merchant.balance - pending

  if (amount <= 0) return { success: false, error: 'Montant invalide' }
  if (amount > available) {
    return { success: false, error: `Solde disponible : ${available.toLocaleString('fr-GN')} GNF` }
  }

  const withdrawal: WithdrawalRequest = {
    id: crypto.randomUUID(),
    amount,
    method,
    accountNumber,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }

  merchants[index] = {
    ...merchant,
    withdrawals: [withdrawal, ...merchant.withdrawals],
  }
  saveMerchants(merchants)
  sendMerchantWithdrawalRequestedEmail(
    merchant.email,
    merchant.businessName,
    amount,
    WITHDRAWAL_METHOD_LABELS[method],
    accountNumber
  )
  sendAdminWithdrawalNotificationEmail(
    'Nouvelle demande de retrait commerçant — Guinée Multiservices',
    `Bonjour Admin,

Un commerçant a demandé un retrait.

  Commerce : ${merchant.businessName}
  Email : ${merchant.email}
  Montant : ${amount.toLocaleString('fr-GN')} GNF
  Méthode : ${WITHDRAWAL_METHOD_LABELS[method]}
  Destination : ${accountNumber}

Action attendue : valider ou refuser la demande dans l'espace administration.

Cordialement,
Système Guinée Multiservices`
  )
  return { success: true }
}

export function getMerchantPendingBalance(merchant: MerchantAccount): number {
  return merchant.withdrawals
    .filter((w) => w.status === 'pending')
    .reduce((sum, w) => sum + w.amount, 0)
}

export function getMerchantAvailableBalance(merchant: MerchantAccount): number {
  return merchant.balance - getMerchantPendingBalance(merchant)
}

export function createMerchant(data: Omit<MerchantAccount, 'id' | 'balance' | 'sales' | 'withdrawals'>): MerchantAccount {
  return {
    ...data,
    id: crypto.randomUUID(),
    balance: 0,
    sales: [],
    withdrawals: [],
    registrationPaid: data.registrationPaid ?? false,
  }
}

export function getMerchantPayments(merchantId: string): PaymentRequest[] {
  return loadPaymentRequests().filter((p) => p.merchantId === merchantId)
}

export interface MerchantWithdrawalWithMeta extends WithdrawalRequest {
  merchantId: string
  merchantName: string
}

export function getAllPendingMerchantWithdrawals(): MerchantWithdrawalWithMeta[] {
  return loadMerchants().flatMap((m) =>
    m.withdrawals
      .filter((w) => w.status === 'pending')
      .map((w) => ({
        ...w,
        merchantId: m.id,
        merchantName: m.businessName,
      }))
  )
}

export function processMerchantWithdrawal(
  merchantId: string,
  withdrawalId: string,
  action: 'complete' | 'reject'
): { success: boolean; error?: string } {
  const merchants = loadMerchants()
  const index = merchants.findIndex((m) => m.id === merchantId)
  if (index === -1) return { success: false, error: 'Commerçant introuvable' }

  const merchant = merchants[index]
  const wIndex = merchant.withdrawals.findIndex((w) => w.id === withdrawalId)
  if (wIndex === -1) return { success: false, error: 'Retrait introuvable' }

  const withdrawal = merchant.withdrawals[wIndex]
  if (withdrawal.status !== 'pending') {
    return { success: false, error: 'Demande déjà traitée' }
  }

  const now = new Date().toISOString()
  const updatedWithdrawals = [...merchant.withdrawals]

  if (action === 'reject') {
    updatedWithdrawals[wIndex] = { ...withdrawal, status: 'rejected', processedAt: now }
    merchants[index] = { ...merchant, withdrawals: updatedWithdrawals }
  } else {
    if (merchant.balance < withdrawal.amount) {
      return { success: false, error: 'Solde commerçant insuffisant' }
    }
    updatedWithdrawals[wIndex] = { ...withdrawal, status: 'completed', processedAt: now }
    merchants[index] = {
      ...merchant,
      balance: merchant.balance - withdrawal.amount,
      withdrawals: updatedWithdrawals,
    }
  }

  saveMerchants(merchants)
  sendMerchantWithdrawalProcessedEmail(
    merchant.email,
    merchant.businessName,
    withdrawal.amount,
    WITHDRAWAL_METHOD_LABELS[withdrawal.method],
    action === 'complete' ? 'completed' : 'rejected'
  )
  return { success: true }
}

export function addMerchantCategory(
  merchantId: string,
  category: Category
): { success: boolean; error?: string } {
  const merchants = loadMerchants()
  const index = merchants.findIndex((m) => m.id === merchantId)
  if (index === -1) return { success: false, error: 'Commerçant introuvable' }

  const merchant = merchants[index]
  if (merchant.categories.includes(category)) {
    return { success: false, error: 'Cette catégorie est déjà active' }
  }

  merchants[index] = {
    ...merchant,
    categories: [...merchant.categories, category],
  }
  saveMerchants(merchants)
  return { success: true }
}
