import { useEffect, useState } from 'react'
import {
  ArrowDownToLine,
  Banknote,
  CheckCircle,
  Clock,
  TrendingUp,
  XCircle,
} from 'lucide-react'
import {
  fetchFinanceSnapshot,
  processMerchantWithdrawalOnServer,
  requestAdminWithdrawalOnServer,
  type FinanceSnapshot,
} from '../../services/financeServer'
import type { WithdrawalMethod } from '../../types/merchant'
import { formatCurrency } from '../../utils/currency'

const METHODS: { id: WithdrawalMethod; label: string }[] = [
  { id: 'orange-money', label: 'Orange Money' },
  { id: 'mobile-money', label: 'Mobile Money (MTN)' },
  { id: 'bank', label: 'Virement bancaire' },
]

const METHOD_LABEL: Record<WithdrawalMethod, string> = {
  'orange-money': 'Orange Money',
  'mobile-money': 'Mobile Money',
  bank: 'Virement bancaire',
}

export function AdminFinance() {
  const [snapshot, setSnapshot] = useState<FinanceSnapshot | null>(null)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<WithdrawalMethod>('orange-money')
  const [accountNumber, setAccountNumber] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const next = await fetchFinanceSnapshot()
    if (!next) {
      setError('Impossible de charger les données financières réelles')
    } else {
      setSnapshot(next)
    }
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  const handleAdminWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    const parsed = parseInt(amount, 10)
    const result = await requestAdminWithdrawalOnServer(parsed, method, accountNumber)
    if (!result.success) {
      setError(result.error ?? 'Erreur')
      return
    }
    setSuccess(`Retrait de ${formatCurrency(parsed)} enregistré`)
    setAmount('')
    setAccountNumber('')
    await load()
  }

  const handleMerchantWithdrawal = async (
    merchantId: string,
    withdrawalId: string,
    action: 'complete' | 'reject'
  ) => {
    setError('')
    setSuccess('')
    const result = await processMerchantWithdrawalOnServer(merchantId, withdrawalId, action)
    if (!result.success) {
      setError(result.error ?? 'Erreur')
      return
    }
    setSuccess(action === 'complete' ? 'Retrait commerçant versé' : 'Demande refusée')
    await load()
  }

  const summary = snapshot?.summary ?? {
    balance: 0,
    totalIncome: 0,
    totalPayouts: 0,
    cardOrdersRevenue: 0,
    merchantFeesRevenue: 0,
  }
  const entries = snapshot?.entries ?? []
  const pendingMerchant = snapshot?.pendingMerchant ?? []
  const merchants = snapshot?.merchants ?? []
  const totalMerchantBalances = merchants.reduce((sum, merchant) => sum + merchant.balance, 0)
  const totalMerchantPending = merchants.reduce(
    (sum, merchant) =>
      sum + merchant.withdrawals.filter((withdrawal) => withdrawal.status === 'pending').reduce((a, w) => a + w.amount, 0),
    0
  )

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Finances & retraits</h2>
        <p className="mt-1 text-sm text-slate-500">
          Trésorerie plateforme, retraits admin et validation des retraits commerçants
        </p>
      </div>

      {loading && <p className="text-sm text-slate-500">Chargement des données serveur…</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-600 to-indigo-700 p-5 text-white shadow-lg">
          <div className="flex items-center gap-2 text-violet-200">
            <Banknote className="h-5 w-5" />
            <span className="text-sm font-medium">Solde plateforme</span>
          </div>
          <p className="mt-2 text-2xl font-bold">{formatCurrency(summary.balance)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-medium">Revenus totaux</span>
          </div>
          <p className="mt-2 text-xl font-bold text-slate-900">{formatCurrency(summary.totalIncome)}</p>
          <p className="mt-1 text-xs text-slate-500">
            Cartes {formatCurrency(summary.cardOrdersRevenue)} · Commerçants {formatCurrency(summary.merchantFeesRevenue)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Soldes commerçants (total)</p>
          <p className="mt-2 text-xl font-bold text-emerald-700">{formatCurrency(totalMerchantBalances)}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-xs font-medium text-amber-700">Retraits commerçants en attente</p>
          <p className="mt-2 text-xl font-bold text-amber-900">{formatCurrency(totalMerchantPending)}</p>
          <p className="text-xs text-amber-600">{pendingMerchant.length} demande(s)</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
            <ArrowDownToLine className="h-5 w-5 text-violet-600" />
            Retrait plateforme (admin)
          </h3>
          <p className="mt-1 text-sm text-slate-500">Disponible : {formatCurrency(summary.balance)}</p>

          <form onSubmit={handleAdminWithdraw} className="mt-4 space-y-3">
            <input
              type="number"
              min="10000"
              step="1000"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Montant (GNF)"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
            <div className="space-y-2">
              {METHODS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMethod(id)}
                  className={`w-full rounded-xl border px-4 py-2.5 text-left text-sm font-medium ${
                    method === id ? 'border-violet-600 bg-violet-50 text-violet-700' : 'border-slate-200 text-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <input
              type="text"
              required
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder={method === 'bank' ? 'Compte bancaire / IBAN' : 'Numéro téléphone'}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500"
            />
            <button type="submit" className="w-full rounded-xl bg-violet-600 py-3 font-semibold text-white hover:bg-violet-700">
              Effectuer le retrait
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900">Retraits commerçants à valider</h3>
          <div className="mt-4 space-y-3">
            {pendingMerchant.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                Aucune demande en attente
              </p>
            ) : (
              pendingMerchant.map((withdrawal) => (
                <div key={withdrawal.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{withdrawal.merchantName}</p>
                      <p className="text-lg font-bold text-emerald-700">{formatCurrency(withdrawal.amount)}</p>
                      <p className="text-sm text-slate-500">
                        {METHOD_LABEL[withdrawal.method]} · {withdrawal.accountNumber}
                      </p>
                      <p className="text-xs text-slate-400">{new Date(withdrawal.createdAt).toLocaleString('fr-GN')}</p>
                    </div>
                    <Clock className="h-5 w-5 shrink-0 text-amber-500" />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => void handleMerchantWithdrawal(withdrawal.merchantId, withdrawal.id, 'complete')}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Verser
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleMerchantWithdrawal(withdrawal.merchantId, withdrawal.id, 'reject')}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-red-200 bg-white py-2 text-sm font-medium text-red-600"
                    >
                      <XCircle className="h-4 w-4" />
                      Refuser
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {(error || success) && (
        <p className={`rounded-xl px-4 py-3 text-sm ${error ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
          {error || success}
        </p>
      )}

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Journal de trésorerie</h3>
        <div className="space-y-2">
          {entries.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
              Aucune opération enregistrée
            </p>
          ) : (
            entries.slice(0, 20).map((entry) => (
              <div key={entry.id} className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800">{entry.label}</p>
                  <p className="text-xs text-slate-400">{new Date(entry.date).toLocaleString('fr-GN')}</p>
                </div>
                <p className={`shrink-0 font-semibold ${entry.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {entry.amount >= 0 ? '+' : ''}
                  {formatCurrency(entry.amount)}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
