import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, CreditCard, KeyRound, Mail, QrCode } from 'lucide-react'
import { BackToHomeLink } from '../components/BackToHomeLink'
import { useAuth } from '../context/AuthContext'
import { getCardOrderByToken, getCardOrderByUserId, hydrateMyOrderFromServer } from '../store/orderStore'
import { isCardActive, resolveCardStatus } from '../utils/cardStatus'
import { normalizeOrderStatus } from '../services/orderServer'
import { CLIENT_DASHBOARD_PATH } from '../constants/brand'
import { maskCardNumber } from '../utils/card'
import { pinsMatch } from '../utils/cardPin'

export function ActivateCard() {
  const { currentUser, activateCard, refreshCurrentUser } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const cardTokenFromQr = searchParams.get('carte') ?? ''

  const [code, setCode] = useState('')
  const [cardPin, setCardPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    void refreshCurrentUser()
    if (currentUser) void hydrateMyOrderFromServer(currentUser.id)
  }, [refreshCurrentUser, currentUser?.id])

  if (!currentUser) return null

  const order = getCardOrderByUserId(currentUser.id)
  const cardStatus = resolveCardStatus(currentUser)
  const qrOrder = cardTokenFromQr ? getCardOrderByToken(cardTokenFromQr) : undefined
  const qrLinked =
    Boolean(cardTokenFromQr) &&
    qrOrder?.userId === currentUser.id &&
    qrOrder.cardToken?.toUpperCase() === cardTokenFromQr.toUpperCase()

  if (isCardActive(currentUser)) {
    return (
      <div className="py-12 text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
        <p className="mt-4 font-medium text-slate-900">Votre carte est déjà active</p>
        {currentUser.cardNumber && (
          <p className="mt-1 font-mono text-sm text-slate-500">
            {maskCardNumber(currentUser.cardNumber)}
          </p>
        )}
        <Link to={CLIENT_DASHBOARD_PATH} className="mt-4 inline-block text-indigo-600">Retour à l&apos;accueil</Link>
      </div>
    )
  }

  if (
    cardStatus !== 'shipped' &&
    order?.status !== 'shipped' &&
    normalizeOrderStatus(order?.status ?? '') !== 'activated'
  ) {
    return (
      <div className="py-12 text-center">
        <CreditCard className="mx-auto h-12 w-12 text-slate-300" />
        <p className="mt-4 text-slate-600">Votre carte n&apos;est pas encore arrivée.</p>
        <p className="mt-2 text-sm text-slate-500">
          {order?.status === 'processing'
            ? 'Votre carte est en cours de production.'
            : 'Le code d\'activation vous a été envoyé par email lors de la commande.'}
        </p>
        <Link to="/ma-commande" className="mt-4 inline-block text-indigo-600">
          Suivre ma commande
        </Link>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (cardTokenFromQr && !qrLinked) {
      setError('Ce QR code ne correspond pas à votre compte.')
      return
    }

    if (!code.trim()) {
      setError('Le code d\'activation est obligatoire')
      return
    }

    const pinErr = pinsMatch(cardPin, confirmPin)
    if (pinErr) {
      setError(pinErr)
      return
    }

    setSubmitting(true)
    const err = await activateCard(code, cardPin, cardTokenFromQr || undefined)
    setSubmitting(false)
    if (err) {
      setError(err)
      return
    }
    setSuccess(true)
    setTimeout(() => navigate(CLIENT_DASHBOARD_PATH), 2500)
  }

  if (success) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <CheckCircle className="h-16 w-16 text-emerald-500" />
        <h2 className="mt-4 text-xl font-bold">Carte activée !</h2>
        <p className="mt-2 text-slate-600">
          {order?.cardNumber
            ? `Numéro ${maskCardNumber(order.cardNumber)} lié à votre compte.`
            : 'Vous pouvez maintenant recharger et payer.'}
        </p>
        <p className="mt-2 text-sm text-indigo-600">
          Votre code PIN est enregistré — il sera demandé à chaque paiement.
        </p>
      </div>
    )
  }

  const inputClass =
    'w-full rounded-xl border border-slate-200 px-4 py-3 text-center font-mono outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Activer ma carte</h2>
        <p className="mt-1 text-sm text-slate-500">
          Code email + code PIN carte (4 chiffres) pour sécuriser vos paiements.
        </p>
      </div>

      {qrLinked && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <QrCode className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <p className="font-semibold text-emerald-900">Carte physique détectée</p>
            <p className="mt-1">
              QR lié à votre compte
              {order?.cardNumber && <> · {maskCardNumber(order.cardNumber)}</>}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-800">
        <Mail className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
        <p>
          Code d&apos;activation envoyé à <span className="font-semibold">{currentUser.email}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="activation-code" className="mb-2 block text-sm font-medium text-slate-700">
            Code d&apos;activation (email)
          </label>
          <input
            id="activation-code"
            required
            autoComplete="off"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            placeholder="Ex : A3B7K9"
            maxLength={6}
            className={`${inputClass} text-2xl tracking-[0.3em]`}
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2 text-slate-700">
            <KeyRound className="h-4 w-4 text-indigo-600" />
            <span className="text-sm font-semibold">Créer votre code PIN carte</span>
          </div>
          <p className="mb-3 text-xs text-slate-500">
            4 chiffres — demandé à chaque paiement et recharge. Ne le partagez avec personne.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="card-pin" className="mb-1 block text-xs text-slate-600">
                Code PIN
              </label>
              <input
                id="card-pin"
                required
                type="password"
                inputMode="numeric"
                maxLength={4}
                autoComplete="off"
                placeholder="••••"
                value={cardPin}
                onChange={(e) => setCardPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="confirm-pin" className="mb-1 block text-xs text-slate-600">
                Confirmer
              </label>
              <input
                id="confirm-pin"
                required
                type="password"
                inputMode="numeric"
                maxLength={4}
                autoComplete="off"
                placeholder="••••"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting || code.length < 6 || cardPin.length !== 4 || confirmPin.length !== 4}
          className="w-full rounded-xl bg-indigo-600 py-3.5 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Activation…' : 'Activer ma carte'}
        </button>

        <BackToHomeLink className="mt-3" />
      </form>
    </div>
  )
}
