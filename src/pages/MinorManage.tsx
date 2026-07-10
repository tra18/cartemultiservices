import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowDownToLine,
  ArrowUpToLine,
  Ban,
  CreditCard,
  Lock,
  ShieldCheck,
} from 'lucide-react'
import { TransactionItem } from '../components/TransactionItem'
import { DELIVERY_OPTIONS } from '../data/deliveryMethods'
import { PAYMENT_METHODS } from '../data/paymentMethods'
import { CARD_PRICE } from '../utils/pricing'
import {
  blockMinorCard,
  fetchMinor,
  orderMinorCard,
  setMinorLimits,
  setMinorPin,
  transferToMinor,
  unblockMinorCard,
  withdrawFromMinor,
} from '../services/familyServer'
import { useAuth } from '../context/AuthContext'
import type { UserAccount } from '../types/auth'
import type { DeliveryMethod } from '../types/order'
import { formatCurrency } from '../utils/currency'

export function MinorManage() {
  const { minorId } = useParams<{ minorId: string }>()
  const { currentUser, refreshCurrentUser } = useAuth()
  const [minor, setMinor] = useState<UserAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [transferAmount, setTransferAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [pin, setPin] = useState('')
  const [dailyMax, setDailyMax] = useState('')
  const [perTxMax, setPerTxMax] = useState('')

  const [address, setAddress] = useState('')
  const [city, setCity] = useState('Conakry')
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('home')
  const [paymentMethod, setPaymentMethod] = useState('orange-money')

  const refresh = async () => {
    if (!minorId) return
    setLoading(true)
    const result = await fetchMinor(minorId)
    setMinor(result.minor)
    if (result.error) setError(result.error)
    if (result.minor?.spendingLimits) {
      setDailyMax(result.minor.spendingLimits.dailyMax?.toString() ?? '')
      setPerTxMax(result.minor.spendingLimits.perTransactionMax?.toString() ?? '')
    }
    setLoading(false)
  }

  useEffect(() => {
    void refresh()
  }, [minorId])

  const runAction = async (fn: () => Promise<{ ok: boolean; error?: string }>, successMsg: string) => {
    setError('')
    setSuccess('')
    const result = await fn()
    if (!result.ok) {
      setError(result.error ?? 'Action échouée')
      return
    }
    setSuccess(successMsg)
    await refresh()
    await refreshCurrentUser()
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Chargement…</p>
  }

  if (!minor) {
    return (
      <div className="space-y-4">
        <p className="text-red-600">{error || 'Mineur introuvable'}</p>
        <Link to="/ma-famille" className="text-sm font-medium text-indigo-600 hover:underline">
          ← Retour à ma famille
        </Link>
      </div>
    )
  }

  const canOrderCard = minor.cardStatus === 'none' || minor.cardStatus === 'blocked'

  return (
    <div className="space-y-6">
      <Link to="/ma-famille" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600">
        <ArrowLeft className="h-4 w-4" />
        Ma famille
      </Link>

      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5">
        <h2 className="text-xl font-bold text-slate-900">{minor.fullName}</h2>
        <p className="mt-1 text-sm text-slate-500">Carte mineur · Contrôle parental total</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white/80 p-3">
            <p className="text-xs text-slate-500">Solde carte</p>
            <p className="text-lg font-bold text-slate-900">{formatCurrency(minor.balance)}</p>
          </div>
          <div className="rounded-xl bg-white/80 p-3">
            <p className="text-xs text-slate-500">Statut carte</p>
            <p className="text-lg font-bold capitalize text-slate-900">{minor.cardStatus}</p>
          </div>
          <div className="rounded-xl bg-white/80 p-3">
            <p className="text-xs text-slate-500">Votre solde</p>
            <p className="text-lg font-bold text-slate-900">{formatCurrency(currentUser?.balance ?? 0)}</p>
          </div>
        </div>
      </div>

      {(error || success) && (
        <p className={`rounded-xl px-4 py-3 text-sm ${error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
          {error || success}
        </p>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900">
          <ArrowUpToLine className="h-5 w-5 text-indigo-600" />
          Alimenter la carte
        </h3>
        <p className="mt-1 text-sm text-slate-500">Transférez des fonds depuis votre carte parent.</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            type="number"
            min="1000"
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
            placeholder="Montant GNF"
            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm"
          />
          <button
            type="button"
            onClick={() =>
              void runAction(
                () => transferToMinor(minor.id, parseInt(transferAmount, 10)),
                'Transfert effectué'
              )
            }
            className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white"
          >
            Transférer
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900">
          <ArrowDownToLine className="h-5 w-5 text-slate-600" />
          Récupérer des fonds
        </h3>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            type="number"
            min="1000"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder="Montant GNF"
            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm"
          />
          <button
            type="button"
            onClick={() =>
              void runAction(
                () => withdrawFromMinor(minor.id, parseInt(withdrawAmount, 10)),
                'Fonds récupérés sur votre carte'
              )
            }
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
          >
            Récupérer
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          Sécurité & limites
        </h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            type="number"
            value={dailyMax}
            onChange={(e) => setDailyMax(e.target.value)}
            placeholder="Plafond journalier (GNF)"
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
          />
          <input
            type="number"
            value={perTxMax}
            onChange={(e) => setPerTxMax(e.target.value)}
            placeholder="Plafond par paiement (GNF)"
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={() =>
            void runAction(
              () =>
                setMinorLimits(minor.id, {
                  dailyMax: dailyMax ? parseInt(dailyMax, 10) : undefined,
                  perTransactionMax: perTxMax ? parseInt(perTxMax, 10) : undefined,
                }),
              'Limites enregistrées'
            )
          }
          className="mt-3 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
        >
          Enregistrer les limites
        </button>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="PIN carte (4 chiffres)"
            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm"
          />
          <button
            type="button"
            onClick={() => void runAction(() => setMinorPin(minor.id, pin), 'PIN défini')}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
          >
            <Lock className="h-4 w-4" />
            Définir le PIN
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {minor.cardStatus !== 'blocked' ? (
            <button
              type="button"
              onClick={() => void runAction(() => blockMinorCard(minor.id), 'Carte bloquée')}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700"
            >
              <Ban className="h-4 w-4" />
              Bloquer la carte
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void runAction(() => unblockMinorCard(minor.id), 'Carte débloquée')}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700"
            >
              Débloquer la carte
            </button>
          )}
        </div>
      </section>

      {canOrderCard && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
            <CreditCard className="h-5 w-5 text-indigo-600" />
            Commander une carte ({formatCurrency(CARD_PRICE)})
          </h3>
          <div className="mt-4 space-y-3">
            <input
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Adresse de livraison *"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ville"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <div className="flex flex-wrap gap-2">
              {DELIVERY_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setDeliveryMethod(opt.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                    deliveryMethod === opt.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() =>
                void runAction(
                  () =>
                    orderMinorCard(minor.id, {
                      address,
                      city,
                      deliveryMethod,
                      paymentMethod,
                    }),
                  'Commande enregistrée'
                )
              }
              className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white"
            >
              Commander la carte mineur
            </button>
          </div>
        </section>
      )}

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Historique du mineur
        </h3>
        {minor.transactions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-500">
            Aucune opération
          </p>
        ) : (
          <div className="space-y-2">
            {minor.transactions.slice(0, 15).map((tx) => (
              <TransactionItem key={tx.id} transaction={tx} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
