import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { PAYMENT_METHODS } from '../data/paymentMethods'
import { useAuth } from '../context/AuthContext'
import { useCard } from '../context/CardContext'
import { useCardPinGate } from '../hooks/useCardPinGate'
import { formatAmountShort, formatCurrency, MAX_RECHARGE, PRESET_AMOUNTS } from '../utils/currency'
import type { PaymentMethodId } from '../data/paymentMethods'

export function Recharge() {
  const { recharge, formatCurrency: fmt } = useCard()
  const { currentUser } = useAuth()
  const { requestPin, PinModal } = useCardPinGate()
  const navigate = useNavigate()
  const [amount, setAmount] = useState(PRESET_AMOUNTS[1])
  const [customAmount, setCustomAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethodId>('orange-money')
  const [phone, setPhone] = useState(currentUser?.phone ?? '')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const selectedMethod = PAYMENT_METHODS.find((m) => m.id === method)!
  const selectedAmount = customAmount ? parseInt(customAmount, 10) : amount

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (isNaN(selectedAmount) || selectedAmount <= 0) {
      setError('Veuillez saisir un montant valide')
      return
    }
    if (selectedAmount > MAX_RECHARGE) {
      setError(`Le montant maximum de recharge est de ${formatCurrency(MAX_RECHARGE)}`)
      return
    }
    if (selectedMethod.needsPhone && !phone.trim()) {
      setError('Veuillez saisir votre numéro de téléphone')
      return
    }

    requestPin((pin) => {
      const ok = recharge(selectedAmount, selectedMethod.label, pin)
      if (ok) {
        setSuccess(true)
        setTimeout(() => navigate('/'), 2000)
      } else {
        setError('La recharge a échoué. Vérifiez votre PIN.')
      }
    })
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <CheckCircle className="h-16 w-16 text-emerald-500" />
        <h2 className="text-xl font-bold text-slate-900">Recharge réussie !</h2>
        <p className="text-slate-600">
          {fmt(selectedAmount)} ont été ajoutés à votre carte via {selectedMethod.label}.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Recharger ma carte</h2>
        <p className="mt-1 text-sm text-slate-500">
          Rechargez en francs guinéens (GNF) via Orange Money, Mobile Money, Visa ou Mastercard.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section>
          <label className="mb-3 block text-sm font-medium text-slate-700">
            Montant (GNF)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {PRESET_AMOUNTS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setAmount(preset)
                  setCustomAmount('')
                }}
                className={`rounded-xl border py-3 text-sm font-semibold transition ${
                  amount === preset && !customAmount
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                {formatAmountShort(preset)} GNF
              </button>
            ))}
          </div>
          <div className="mt-3">
            <input
              type="number"
              min="1000"
              max={MAX_RECHARGE}
              step="1000"
              placeholder={`Autre montant (max ${formatAmountShort(MAX_RECHARGE)} GNF)`}
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </section>

        <section>
          <label className="mb-3 block text-sm font-medium text-slate-700">
            Mode de paiement
          </label>
          <div className="space-y-2">
            {PAYMENT_METHODS.map(({ id, label, description, icon: Icon, color }) => (
              <button
                key={id}
                type="button"
                onClick={() => setMethod(id)}
                className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${
                  method === id
                    ? `${color} ring-2 ring-indigo-600 ring-offset-1`
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    id === 'orange-money'
                      ? 'bg-orange-500 text-white'
                      : id === 'mobile-money'
                        ? 'bg-yellow-500 text-white'
                        : id === 'visa'
                          ? 'bg-blue-700 text-white'
                          : 'bg-red-600 text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{label}</p>
                  <p className="text-xs text-slate-500">{description}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {selectedMethod.needsPhone && (
          <section>
            <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-slate-700">
              Numéro {selectedMethod.label}
            </label>
            <input
              id="phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+224 620 00 00 00"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            <p className="mt-1 text-xs text-slate-500">
              Vous recevrez une demande de confirmation sur ce numéro.
            </p>
          </section>
        )}

        {(method === 'visa' || method === 'mastercard') && (
          <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-medium text-slate-800">Paiement par carte bancaire</p>
            <p className="mt-1">
              En production, vous seriez redirigé vers la passerelle de paiement sécurisée{' '}
              {method === 'visa' ? 'Visa' : 'Mastercard'}.
            </p>
          </section>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          className="w-full rounded-xl bg-indigo-600 py-3.5 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 active:scale-[0.98]"
        >
          Recharger {fmt(selectedAmount || 0)}
        </button>
      </form>
      {PinModal}
    </div>
  )
}
