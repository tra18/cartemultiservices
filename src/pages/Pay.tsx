import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Bus, CheckCircle, Fuel, Shirt, ShoppingCart, UtensilsCrossed } from 'lucide-react'
import { getMerchantsForCategory } from '../data/merchants'
import { useCard } from '../context/CardContext'
import { useCardPinGate } from '../hooks/useCardPinGate'
import { CLIENT_DASHBOARD_PATH } from '../constants/brand'
import type { Category } from '../types'
import { CATEGORY_DESCRIPTIONS, CATEGORY_LABELS } from '../types'

const CATEGORIES: { key: Category; icon: typeof UtensilsCrossed }[] = [
  { key: 'restaurants', icon: UtensilsCrossed },
  { key: 'transport', icon: Bus },
  { key: 'vetements', icon: Shirt },
  { key: 'courses', icon: ShoppingCart },
]

export function Pay() {
  const { pay, balance, formatCurrency } = useCard()
  const { requestPin, PinModal } = useCardPinGate()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const initialCategory = searchParams.get('category') as Category | null
  const [step, setStep] = useState<'category' | 'details' | 'success'>(
    initialCategory && CATEGORIES.some((c) => c.key === initialCategory) ? 'details' : 'category'
  )
  const [category, setCategory] = useState<Category | null>(
    initialCategory && CATEGORIES.some((c) => c.key === initialCategory) ? initialCategory : null
  )
  const [merchant, setMerchant] = useState('')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const parsedAmount = parseFloat(amount)
    if (!category || !merchant) {
      setError('Veuillez sélectionner un commerçant')
      return
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Veuillez saisir un montant valide')
      return
    }
    if (parsedAmount > balance) {
      setError(`Solde insuffisant. Disponible : ${formatCurrency(balance)}`)
      return
    }

    requestPin((pin) => {
      void (async () => {
        const ok = await pay(category!, merchant, parsedAmount, pin)
        if (ok) {
          setStep('success')
          setTimeout(() => navigate(CLIENT_DASHBOARD_PATH), 2500)
        } else {
          setError('Le paiement a échoué. Vérifiez votre PIN ou votre solde.')
        }
      })()
    })
  }

  if (step === 'success') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <CheckCircle className="h-16 w-16 text-emerald-500" />
        <h2 className="text-xl font-bold text-slate-900">Paiement effectué !</h2>
        <p className="text-slate-600">
          {formatCurrency(parseFloat(amount))} payés chez {merchant}
        </p>
      </div>
    )
  }

  if (step === 'category') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Payer avec ma carte</h2>
          <p className="mt-1 text-sm text-slate-500">
            Choisissez le type d&apos;achat que vous souhaitez effectuer.
          </p>
        </div>

        <div className="space-y-3">
          {CATEGORIES.map(({ key, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setCategory(key)
                setMerchant('')
                setStep('details')
              }}
              className="flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-indigo-200 hover:shadow-md active:scale-[0.98]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{CATEGORY_LABELS[key]}</p>
                <p className="text-sm text-slate-500">{CATEGORY_DESCRIPTIONS[key]}</p>
              </div>
            </button>
          ))}
        </div>

        <p className="rounded-xl bg-slate-100 px-4 py-3 text-center text-sm text-slate-600">
          Solde disponible : <span className="font-semibold text-slate-900">{formatCurrency(balance)}</span>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <button
          type="button"
          onClick={() => setStep('category')}
          className="mb-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          ← Changer de catégorie
        </button>
        <h2 className="text-xl font-bold text-slate-900">
          {category ? CATEGORY_LABELS[category] : 'Paiement'}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {category ? CATEGORY_DESCRIPTIONS[category] : ''}
        </p>
      </div>

      <form onSubmit={handlePay} className="space-y-5">
        {category === 'transport' && (
          <Link
            to="/carburant"
            className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 transition hover:bg-blue-100"
          >
            <Fuel className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-semibold text-blue-900">Acheter du carburant</p>
              <p className="text-xs text-blue-700">Station-service · Essence ou Diesel</p>
            </div>
          </Link>
        )}

        <section>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Commerçant
          </label>
          <div className="space-y-2">
            {category &&
              getMerchantsForCategory(category).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMerchant(m)}
                  className={`w-full rounded-xl border px-4 py-3 text-left font-medium transition ${
                    merchant === m
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {m}
                </button>
              ))}
          </div>
        </section>

        <section>
          <label htmlFor="amount" className="mb-2 block text-sm font-medium text-slate-700">
            Montant
          </label>
          <div className="relative">
            <input
              id="amount"
              type="number"
              min="1000"
              step="1000"
              max={balance}
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-14 text-lg font-semibold text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">GNF</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Solde disponible : {formatCurrency(balance)}
          </p>
        </section>

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={!merchant || !amount}
          className="w-full rounded-xl bg-indigo-600 py-3.5 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Confirmer le paiement
        </button>
      </form>
      {PinModal}
    </div>
  )
}
