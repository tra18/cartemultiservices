import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle, CreditCard, Lock, Package, ShieldOff } from 'lucide-react'
import { PaymentMethodPicker } from '../components/PaymentMethodPicker'
import { DELIVERY_OPTIONS } from '../data/deliveryMethods'
import { getPaymentMethodLabel, PAYMENT_METHODS, type PaymentMethodId } from '../data/paymentMethods'
import { useAuth } from '../context/AuthContext'
import type { DeliveryMethod } from '../types/order'
import { formatCurrency } from '../utils/currency'
import { canOrderReplacementCard } from '../utils/cardReplacement'
import { CARD_PRICE, getReplacementCardPrice } from '../utils/pricing'
import { validateOrderStep2 } from '../utils/validation'

export function OrderReplacementCard() {
  const { currentUser, orderReplacementCard } = useAuth()
  const navigate = useNavigate()
  const replacementPrice = getReplacementCardPrice()

  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('Conakry')
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('home')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('orange-money')
  const [paymentPhone, setPaymentPhone] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [orderId, setOrderId] = useState('')

  useEffect(() => {
    if (currentUser) {
      setPhone(currentUser.phone)
    }
  }, [currentUser])

  if (!currentUser) return null

  if (!canOrderReplacementCard(currentUser)) {
    return (
      <div className="py-12 text-center">
        <ShieldOff className="mx-auto h-12 w-12 text-slate-300" />
        <p className="mt-4 text-slate-600">
          La commande de remplacement est disponible après avoir déclaré la perte ou le vol de votre
          carte.
        </p>
        <Link to="/securite-carte" className="mt-4 inline-block text-indigo-600">
          Sécurité carte
        </Link>
      </div>
    )
  }

  const needsAddress = deliveryMethod === 'home'
  const paymentNeedsPhone = PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.needsPhone ?? false
  const inputClass =
    'w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!acceptTerms) {
      setError('Vous devez accepter les conditions générales')
      return
    }

    const step2Err = validateOrderStep2({
      fullName: currentUser.fullName,
      email: currentUser.email,
      phone,
      password: 'placeholder1',
      confirmPassword: 'placeholder1',
      address,
      city,
      needsAddress,
      paymentPhone: paymentPhone || phone,
      paymentNeedsPhone,
    })
    if (step2Err) {
      setError(step2Err)
      return
    }

    setSubmitting(true)
    const result = await orderReplacementCard({
      phone,
      address: needsAddress ? address : '',
      city,
      deliveryMethod,
      paymentMethod: getPaymentMethodLabel(paymentMethod),
    })
    setSubmitting(false)

    if (!result.success) {
      setError(result.error ?? 'Commande échouée')
      return
    }

    setOrderId(result.order?.id ?? '')
    setDone(true)
  }

  if (done) {
    return (
      <div className="space-y-6 text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-emerald-500" />
        <div>
          <h2 className="text-xl font-bold text-slate-900">Carte de remplacement commandée</h2>
          <p className="mt-2 text-sm text-slate-600">
            Montant payé : {formatCurrency(replacementPrice)} (50 % du tarif initial)
          </p>
          {orderId && (
            <p className="mt-1 text-xs text-slate-500">
              Référence : {orderId.slice(0, 8).toUpperCase()}
            </p>
          )}
        </div>
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Votre solde reste sur votre compte. Un code d&apos;activation vous sera envoyé par email.
          Suivez l&apos;avancement dans « Ma commande ».
        </p>
        <button
          type="button"
          onClick={() => navigate('/ma-commande')}
          className="w-full rounded-xl bg-indigo-600 py-3.5 font-semibold text-white hover:bg-indigo-700"
        >
          Suivre ma commande
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
          <CreditCard className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Commander une carte de remplacement</h2>
        <p className="mt-2 text-sm text-slate-500">
          Après déclaration de perte ·{' '}
          <span className="font-semibold text-indigo-600">{formatCurrency(replacementPrice)}</span>
        </p>
      </div>

      <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
        <p>
          Tarif remplacement : <strong>50 %</strong> du prix initial (
          {formatCurrency(CARD_PRICE)} → {formatCurrency(replacementPrice)}). Votre solde actuel est
          conservé.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-medium text-slate-900">{currentUser.fullName}</p>
          <p>{currentUser.email}</p>
        </div>

        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-slate-700">
            Téléphone
          </label>
          <input
            id="phone"
            required
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Mode de livraison</label>
          <div className="space-y-2">
            {DELIVERY_OPTIONS.map(({ id, label, description, delay }) => (
              <button
                key={id}
                type="button"
                onClick={() => setDeliveryMethod(id)}
                className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${
                  deliveryMethod === id
                    ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600 ring-offset-1'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <Package className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                <div>
                  <p className="font-semibold text-slate-900">{label}</p>
                  <p className="text-xs text-slate-500">{description}</p>
                  <p className="mt-0.5 text-xs font-medium text-indigo-600">{delay}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {needsAddress && (
          <>
            <div>
              <label htmlFor="address" className="mb-1.5 block text-sm font-medium text-slate-700">
                Adresse complète
              </label>
              <input
                id="address"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="city" className="mb-1.5 block text-sm font-medium text-slate-700">
                Ville
              </label>
              <input
                id="city"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={inputClass}
              />
            </div>
          </>
        )}

        <PaymentMethodPicker
          value={paymentMethod}
          onChange={setPaymentMethod}
          phone={paymentPhone || phone}
          onPhoneChange={setPaymentPhone}
        />

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex justify-between text-sm text-slate-500">
            <span>Prix initial</span>
            <span className="line-through">{formatCurrency(CARD_PRICE)}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-slate-600">Carte de remplacement (-50 %)</span>
            <span className="font-semibold">{formatCurrency(replacementPrice)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-slate-100 pt-2">
            <span className="font-semibold text-slate-900">Total</span>
            <span className="text-lg font-bold text-indigo-600">{formatCurrency(replacementPrice)}</span>
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <input
            type="checkbox"
            required
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600"
          />
          <span className="text-sm text-slate-600">
            J&apos;accepte les conditions générales et confirme la commande de remplacement.
          </span>
        </label>

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || !acceptTerms}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          <Lock className="h-4 w-4" />
          {submitting ? 'Traitement…' : `Payer ${formatCurrency(replacementPrice)}`}
        </button>
      </form>
    </div>
  )
}
