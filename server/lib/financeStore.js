import { sendTypedEmail } from "./mailer.js"
import { sanitizeText } from "./security.js"

const FINANCE_STATE_KEY = "finance-state"
const FINANCE_MERCHANTS_KEY = "finance-merchants"

const METHOD_LABELS = {
  "orange-money": "Orange Money",
  "mobile-money": "Mobile Money (MTN)",
  bank: "Virement bancaire",
}

function emptyState() {
  return { entries: [], adminWithdrawals: [] }
}

async function loadState(redis) {
  return (await redis.get(FINANCE_STATE_KEY)) ?? emptyState()
}

async function saveState(redis, state) {
  await redis.set(FINANCE_STATE_KEY, state)
}

export async function loadFinanceMerchants(redis) {
  return (await redis.get(FINANCE_MERCHANTS_KEY)) ?? []
}

async function saveFinanceMerchants(redis, merchants) {
  await redis.set(FINANCE_MERCHANTS_KEY, merchants)
}

export function buildFinanceSummary(entries) {
  const income = entries.filter((entry) => entry.amount > 0).reduce((sum, entry) => sum + entry.amount, 0)
  const payouts = entries.filter((entry) => entry.amount < 0).reduce((sum, entry) => sum + Math.abs(entry.amount), 0)
  const cardOrders = entries
    .filter((entry) => entry.type === "card_order")
    .reduce((sum, entry) => sum + entry.amount, 0)
  const merchantFees = entries
    .filter((entry) => entry.type === "merchant_registration" || entry.type === "merchant_category")
    .reduce((sum, entry) => sum + entry.amount, 0)

  return {
    balance: income - payouts,
    totalIncome: income,
    totalPayouts: payouts,
    cardOrdersRevenue: cardOrders,
    merchantFeesRevenue: merchantFees,
  }
}

export async function addTreasuryEntry(redis, type, amount, label, referenceId) {
  const entry = {
    id: crypto.randomUUID(),
    type,
    amount,
    label,
    date: new Date().toISOString(),
    ...(referenceId ? { referenceId } : {}),
  }

  const state = await loadState(redis)
  await saveState(redis, {
    entries: [entry, ...(state.entries ?? [])],
    adminWithdrawals: state.adminWithdrawals ?? [],
  })
  return entry
}

export async function upsertFinanceMerchant(redis, merchant) {
  const merchants = await loadFinanceMerchants(redis)
  const sanitized = {
    id: sanitizeText(merchant.id, 80),
    businessName: sanitizeText(merchant.businessName, 120),
    email: sanitizeText(merchant.email, 120).toLowerCase(),
    phone: sanitizeText(merchant.phone, 40),
    categories: Array.isArray(merchant.categories) ? merchant.categories : [],
    balance: Number(merchant.balance) || 0,
    mobileMoneyNumber: sanitizeText(merchant.mobileMoneyNumber, 40),
    bankAccount: sanitizeText(merchant.bankAccount ?? '', 80) || undefined,
    sales: Array.isArray(merchant.sales) ? merchant.sales : [],
    withdrawals: Array.isArray(merchant.withdrawals) ? merchant.withdrawals : [],
    registrationPaid: merchant.registrationPaid !== false,
  }

  const index = merchants.findIndex((item) => item.id === sanitized.id)
  if (index === -1) {
    await saveFinanceMerchants(redis, [sanitized, ...merchants])
    return sanitized
  }

  const next = [...merchants]
  next[index] = { ...next[index], ...sanitized }
  await saveFinanceMerchants(redis, next)
  return next[index]
}

export async function recordQrSaleInFinance(redis, { merchantId, paymentRequestId, amount, customerName }) {
  const merchants = await loadFinanceMerchants(redis)
  const index = merchants.findIndex((merchant) => merchant.id === merchantId)
  if (index === -1) return { success: false, error: "Commerçant introuvable" }

  const merchant = merchants[index]
  const saleAmount = Number(amount) || 0
  if (saleAmount <= 0) return { success: false, error: "Montant invalide" }

  const existing = merchant.sales.find((sale) => sale.paymentRequestId === paymentRequestId)
  if (existing) {
    return { success: true, merchant, sale: existing, duplicate: true }
  }

  const sale = {
    id: crypto.randomUUID(),
    paymentRequestId: sanitizeText(paymentRequestId, 80),
    amount: saleAmount,
    customerName: sanitizeText(customerName, 120),
    date: new Date().toISOString(),
  }

  merchants[index] = {
    ...merchant,
    balance: merchant.balance + saleAmount,
    sales: [sale, ...merchant.sales],
  }
  await saveFinanceMerchants(redis, merchants)

  await sendTypedEmail("merchant_sale", {
    email: merchant.email,
    businessName: merchant.businessName,
    amount: saleAmount,
    customerName: sale.customerName,
    newBalance: merchants[index].balance,
  })

  return { success: true, merchant: merchants[index], sale }
}

export async function requestMerchantWithdrawalInFinance(redis, merchantId, amount, method, accountNumber) {
  const merchants = await loadFinanceMerchants(redis)
  const index = merchants.findIndex((merchant) => merchant.id === merchantId)
  if (index === -1) return { success: false, error: "Commerçant introuvable" }

  const merchant = merchants[index]
  const pending = merchant.withdrawals
    .filter((withdrawal) => withdrawal.status === "pending")
    .reduce((sum, withdrawal) => sum + withdrawal.amount, 0)
  const available = merchant.balance - pending

  if (amount <= 0) return { success: false, error: "Montant invalide" }
  if (amount > available) {
    return { success: false, error: `Solde disponible : ${available.toLocaleString("fr-GN")} GNF` }
  }

  const withdrawal = {
    id: crypto.randomUUID(),
    amount,
    method,
    accountNumber: sanitizeText(accountNumber, 80),
    status: "pending",
    createdAt: new Date().toISOString(),
  }

  merchants[index] = {
    ...merchant,
    withdrawals: [withdrawal, ...merchant.withdrawals],
  }
  await saveFinanceMerchants(redis, merchants)

  await sendTypedEmail("merchant_withdrawal_requested", {
    email: merchant.email,
    businessName: merchant.businessName,
    amount,
    methodLabel: METHOD_LABELS[method],
    accountNumber: withdrawal.accountNumber,
  })
  await sendTypedEmail("admin_withdrawal_notification", {
    subject: "Nouvelle demande de retrait commerçant — Guinée Multiservices",
    body: `Bonjour Admin,

Un commerçant a demandé un retrait.

  Commerce : ${merchant.businessName}
  Email : ${merchant.email}
  Montant : ${amount.toLocaleString("fr-GN")} GNF
  Méthode : ${METHOD_LABELS[method]}
  Destination : ${withdrawal.accountNumber}

Action attendue : valider ou refuser la demande dans l'espace administration.

Cordialement,
Système Guinée Multiservices`,
  })

  return { success: true, merchant: merchants[index], withdrawal }
}

export async function processMerchantWithdrawalInFinance(redis, merchantId, withdrawalId, action) {
  const merchants = await loadFinanceMerchants(redis)
  const index = merchants.findIndex((merchant) => merchant.id === merchantId)
  if (index === -1) return { success: false, error: "Commerçant introuvable" }

  const merchant = merchants[index]
  const wIndex = merchant.withdrawals.findIndex((withdrawal) => withdrawal.id === withdrawalId)
  if (wIndex === -1) return { success: false, error: "Retrait introuvable" }

  const withdrawal = merchant.withdrawals[wIndex]
  if (withdrawal.status !== "pending") {
    return { success: false, error: "Demande déjà traitée" }
  }

  const processedAt = new Date().toISOString()
  const withdrawals = [...merchant.withdrawals]

  if (action === "reject") {
    withdrawals[wIndex] = { ...withdrawal, status: "rejected", processedAt }
    merchants[index] = { ...merchant, withdrawals }
  } else {
    if (merchant.balance < withdrawal.amount) {
      return { success: false, error: "Solde commerçant insuffisant" }
    }
    withdrawals[wIndex] = { ...withdrawal, status: "completed", processedAt }
    merchants[index] = {
      ...merchant,
      balance: merchant.balance - withdrawal.amount,
      withdrawals,
    }
  }

  await saveFinanceMerchants(redis, merchants)

  await sendTypedEmail("merchant_withdrawal_processed", {
    email: merchant.email,
    businessName: merchant.businessName,
    amount: withdrawal.amount,
    methodLabel: METHOD_LABELS[withdrawal.method],
    status: action === "complete" ? "completed" : "rejected",
  })

  return { success: true, merchant: merchants[index] }
}

export async function requestAdminWithdrawalInFinance(redis, amount, method, accountNumber) {
  const state = await loadState(redis)
  const summary = buildFinanceSummary(state.entries ?? [])
  if (amount <= 0) return { success: false, error: "Montant invalide" }
  if (amount > summary.balance) {
    return {
      success: false,
      error: `Solde plateforme insuffisant (${summary.balance.toLocaleString("fr-GN")} GNF)`,
    }
  }

  const withdrawal = {
    id: crypto.randomUUID(),
    amount,
    method,
    accountNumber: sanitizeText(accountNumber, 80),
    createdAt: new Date().toISOString(),
  }

  const entry = {
    id: crypto.randomUUID(),
    type: "admin_withdrawal",
    amount: -amount,
    label: `Retrait admin — ${METHOD_LABELS[method]} · ${withdrawal.accountNumber}`,
    date: new Date().toISOString(),
    referenceId: withdrawal.id,
  }

  await saveState(redis, {
    entries: [entry, ...(state.entries ?? [])],
    adminWithdrawals: [withdrawal, ...(state.adminWithdrawals ?? [])],
  })

  await sendTypedEmail("admin_withdrawal_notification", {
    subject: "Retrait plateforme enregistré — Guinée Multiservices",
    body: `Bonjour Admin,

Un retrait plateforme a été enregistré.

  Montant : ${amount.toLocaleString("fr-GN")} GNF
  Méthode : ${METHOD_LABELS[method]}
  Destination : ${withdrawal.accountNumber}

Le journal de trésorerie a été mis à jour.

Cordialement,
Système Guinée Multiservices`,
  })

  return { success: true, withdrawal }
}

export async function getFinanceSnapshot(redis) {
  const state = await loadState(redis)
  const merchants = await loadFinanceMerchants(redis)
  const entries = [...(state.entries ?? [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const pendingMerchant = merchants.flatMap((merchant) =>
    merchant.withdrawals
      .filter((withdrawal) => withdrawal.status === "pending")
      .map((withdrawal) => ({
        ...withdrawal,
        merchantId: merchant.id,
        merchantName: merchant.businessName,
      }))
  )

  return {
    summary: buildFinanceSummary(entries),
    entries,
    adminWithdrawals: state.adminWithdrawals ?? [],
    merchants,
    pendingMerchant,
  }
}
