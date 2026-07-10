import { useEffect, useState } from 'react'
import { ArrowDownToLine, CheckCircle, Clock } from 'lucide-react'
import { BackToHomeLink } from '../../components/BackToHomeLink'
import { useMerchantAuth } from '../../context/MerchantAuthContext'
import { requestMerchantWithdrawalOnServer, upsertFinanceMerchant } from '../../services/financeServer'
import type { WithdrawalMethod } from '../../types/merchant'
import { formatCurrency } from '../../utils/currency'

const METHODS: { id: WithdrawalMethod; label: string }[] = [
  { id: 'orange-money', label: 'Orange Money' },
  { id: 'mobile-money', label: 'Mobile Money (MTN)' },
  { id: 'bank', label: 'Virement bancaire' },
]

const STATUS_LABELS = {
  pending: { label: 'En attente', color: 'bg-amber-100 text-amber-700' },
  completed: { label: 'Versé', color: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Refusé', color: 'bg-red-100 text-red-700' },
}

export function MerchantWithdrawals() {
  const { currentMerchant, refreshMerchant } = useMerchantAuth()
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<WithdrawalMethod>('orange-money')
  const [accountNumber, setAccountNumber] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (currentMerchant) {
      void upsertFinanceMerchant(currentMerchant)
    }
  }, [currentMerchant])

  if (!currentMerchant) return null

  const pending = currentMerchant.withdrawals
    .filter((withdrawal) => withdrawal.status === 'pending')
    .reduce((sum, withdrawal) => sum + withdrawal.amount, 0)
  const available = currentMerchant.balance - pending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    const parsed = parseInt(amount, 10)
    const account =
      accountNumber ||
      (method === 'bank' ? currentMerchant.bankAccount : currentMerchant.mobileMoneyNumber) ||
      ''

    if (!account) {
      setError('Veuillez saisir un numéro de compte')
      return
    }

    const result = await requestMerchantWithdrawalOnServer(currentMerchant.id, parsed, method, account)
    if (!result.success) {
      setError(result.error ?? 'Erreur')
      return
    }

    setSuccess(true)
    setAmount('')
    await refreshMerchant()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Retraits</h2>
        <p className="mt-1 text-sm text-slate-500">
          Transférez votre solde vers Orange Money, Mobile Money ou votre banque.
        </p>
      </div>

      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
        <p className="text-sm text-emerald-600">Solde disponible pour retrait</p>
        <p className="text-2xl font-bold text-emerald-800">{formatCurrency(available)}</p>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Montant (GNF)</label>
          <input
            type="number"
            min="10000"
            step="1000"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Montant à retirer"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Destination</label>
          <div className="space-y-2">
            {METHODS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setMethod(id)}
                className={`w-full rounded-xl border px-4 py-3 text-left font-medium transition ${
                  method === id ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            {method === 'bank' ? 'Numéro de compte bancaire' : 'Numéro de téléphone'}
          </label>
          <input
            type="text"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder={method === 'bank' ? 'IBAN ou numéro de compte' : currentMerchant.mobileMoneyNumber}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        {success && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle className="h-4 w-4" />
            Demande de retrait envoyée. Traitement sous 24-48h.
          </div>
        )}

        <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 font-semibold text-white hover:bg-emerald-700">
          <ArrowDownToLine className="h-5 w-5" />
          Demander le retrait
        </button>

        <BackToHomeLink className="mt-3" />
      </form>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Historique des retraits</h3>
        <div className="space-y-2">
          {currentMerchant.withdrawals.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
              Aucun retrait demandé
            </p>
          ) : (
            currentMerchant.withdrawals.map((withdrawal) => {
              const status = STATUS_LABELS[withdrawal.status]
              return (
                <div key={withdrawal.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4">
                  <div>
                    <p className="font-medium text-slate-900">{formatCurrency(withdrawal.amount)}</p>
                    <p className="text-sm text-slate-500">
                      {METHODS.find((item) => item.id === withdrawal.method)?.label} · {withdrawal.accountNumber}
                    </p>
                    <p className="text-xs text-slate-400">{new Date(withdrawal.createdAt).toLocaleDateString('fr-GN')}</p>
                  </div>
                  <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${status.color}`}>
                    {withdrawal.status === 'pending' && <Clock className="h-3 w-3" />}
                    {status.label}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </section>
    </div>
  )
}
