import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, CheckCircle, Store } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getPaymentRequest } from '../store/platformStore'
import type { PaymentRequest } from '../types/merchant'
import { CATEGORY_LABELS } from '../types'
import { useCardPinGate } from '../hooks/useCardPinGate'
import { CLIENT_DASHBOARD_PATH } from '../constants/brand'
import { formatCurrency } from '../utils/currency'

export function QrPay() {
  const { paymentId } = useParams<{ paymentId: string }>()
  const { isAuthenticated, isLoading, payViaQr, currentUser } = useAuth()
  const { requestPin, PinModal } = useCardPinGate()
  const navigate = useNavigate()
  const [payment, setPayment] = useState<PaymentRequest | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    if (!paymentId) return
    const request = getPaymentRequest(paymentId)
    if (!request) {
      setError('Paiement introuvable')
      return
    }
    if (request.status === 'pending' && new Date(request.expiresAt) < new Date()) {
      setPayment({ ...request, status: 'expired' })
      return
    }
    setPayment(request)
  }, [paymentId])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
        <Store className="h-12 w-12 text-indigo-600" />
        <h1 className="text-xl font-bold text-slate-900">Paiement commerçant</h1>
        <p className="text-slate-600">Connectez-vous pour confirmer ce paiement.</p>
        <Link
          to={`/connexion?redirect=/paiement-qr/${paymentId}`}
          className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
        >
          Se connecter
        </Link>
      </div>
    )
  }

  if (success && payment) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
        <CheckCircle className="h-16 w-16 text-emerald-500" />
        <h1 className="text-xl font-bold text-slate-900">Paiement effectué !</h1>
        <p className="text-slate-600">
          {formatCurrency(payment.amount)} payés à {payment.merchantName}
        </p>
        <button
          type="button"
          onClick={() => navigate(CLIENT_DASHBOARD_PATH)}
          className="mt-4 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white"
        >
          Retour à l&apos;accueil
        </button>
      </div>
    )
  }

  if (error && !payment) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-slate-600">{error}</p>
        <Link to={CLIENT_DASHBOARD_PATH} className="text-indigo-600 hover:text-indigo-700">
          Retour à l&apos;accueil
        </Link>
      </div>
    )
  }

  if (!payment) return null

  if (payment.status === 'paid') {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
        <CheckCircle className="h-12 w-12 text-emerald-500" />
        <p className="text-slate-600">Ce paiement a déjà été effectué.</p>
        <Link to={CLIENT_DASHBOARD_PATH} className="text-indigo-600">Retour à l&apos;accueil</Link>
      </div>
    )
  }

  if (payment.status !== 'pending') {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
        <AlertCircle className="h-12 w-12 text-amber-500" />
        <p className="text-slate-600">Ce QR code n&apos;est plus valide.</p>
        <Link to={CLIENT_DASHBOARD_PATH} className="text-indigo-600">Retour à l&apos;accueil</Link>
      </div>
    )
  }

  const handlePay = () => {
    if (!paymentId) return
    setError('')
    requestPin((pin) => {
      setPaying(true)
      const result = payViaQr(paymentId, pin)
      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.error ?? 'Paiement échoué')
        setPaying(false)
      }
    })
  }

  const canPay = currentUser && currentUser.balance >= payment.amount

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-slate-50 px-6 py-12">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
          <Store className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Confirmer le paiement</h1>
        <p className="mt-1 text-sm text-slate-500">Paiement par QR Code</p>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Commerçant</p>
        <p className="text-lg font-bold text-slate-900">{payment.merchantName}</p>
        <p className="mt-1 text-sm text-slate-500">{CATEGORY_LABELS[payment.category]}</p>

        <div className="my-6 border-t border-slate-100 pt-6">
          <p className="text-sm text-slate-500">Montant</p>
          <p className="text-3xl font-bold text-slate-900">{formatCurrency(payment.amount)}</p>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Votre solde</p>
          <p className="font-semibold text-slate-900">
            {currentUser ? formatCurrency(currentUser.balance) : '—'}
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {!canPay && (
        <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Solde insuffisant.{' '}
          <Link to="/recharger" className="font-medium underline">
            Recharger ma carte
          </Link>
        </p>
      )}

      <button
        type="button"
        onClick={handlePay}
        disabled={!canPay || paying}
        className="mt-6 w-full rounded-xl bg-indigo-600 py-4 font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {paying ? 'Paiement en cours...' : `Payer ${formatCurrency(payment.amount)}`}
      </button>

      <button
        type="button"
        onClick={() => navigate(CLIENT_DASHBOARD_PATH)}
        className="mt-3 w-full py-3 text-sm text-slate-500 hover:text-slate-700"
      >
        Annuler
      </button>
      {PinModal}
    </div>
  )
}
