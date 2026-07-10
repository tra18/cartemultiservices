import { useState } from 'react'
import { Layers, PlusCircle } from 'lucide-react'
import { BackToHomeLink } from '../../components/BackToHomeLink'
import { PaymentMethodPicker } from '../../components/PaymentMethodPicker'
import { getPaymentMethodLabel, type PaymentMethodId } from '../../data/paymentMethods'
import { useMerchantAuth } from '../../context/MerchantAuthContext'
import type { Category } from '../../types'
import { CATEGORY_LABELS, formatCategoryList } from '../../types'
import { formatCurrency } from '../../utils/currency'
import {
  calculateAdditionalCategoryPrice,
  calculateMerchantRegistrationPrice,
  MERCHANT_REGISTRATION_PRICE,
} from '../../utils/pricing'

import { ALL_CATEGORIES } from '../../data/categories'

export function MerchantCategories() {
  const { currentMerchant, addCategory } = useMerchantAuth()
  const [selected, setSelected] = useState<Category | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('orange-money')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  if (!currentMerchant) return null

  const available = ALL_CATEGORIES.filter((c) => !currentMerchant.categories.includes(c))
  const categoryPrice = calculateAdditionalCategoryPrice()
  const currentFee = calculateMerchantRegistrationPrice(currentMerchant.categories.length)

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!selected) {
      setError('Choisissez une catégorie')
      return
    }
    const err = addCategory(selected, getPaymentMethodLabel(paymentMethod))
    if (err) {
      setError(err)
      return
    }
    setSuccess(`Catégorie « ${CATEGORY_LABELS[selected]} » ajoutée`)
    setSelected(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Mes catégories</h2>
        <p className="mt-1 text-sm text-slate-500">
          Chaque catégorie supplémentaire : {formatCurrency(MERCHANT_REGISTRATION_PRICE)} (× nombre
          de catégories à l&apos;inscription)
        </p>
      </div>

      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
        <div className="flex items-center gap-2 text-emerald-800">
          <Layers className="h-5 w-5" />
          <span className="font-semibold">Catégories actives</span>
        </div>
        <p className="mt-2 font-medium text-emerald-900">
          {formatCategoryList(currentMerchant.categories)}
        </p>
        <p className="mt-1 text-sm text-emerald-700">
          {currentMerchant.categories.length} catégorie(s) · équivalent inscription{' '}
          {formatCurrency(currentFee)}
        </p>
      </div>

      {available.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
          Toutes les catégories sont déjà activées sur votre compte.
        </p>
      ) : (
        <form onSubmit={handleAdd} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900">Ajouter une catégorie</h3>
          <p className="text-sm text-slate-500">
            Prix : <span className="font-bold text-emerald-700">{formatCurrency(categoryPrice)}</span>{' '}
            par nouvelle catégorie
          </p>

          <div className="grid grid-cols-2 gap-2">
            {available.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelected(cat)}
                className={`rounded-xl border py-2.5 text-sm font-medium ${
                  selected === cat
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 text-slate-700'
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          {selected && (
            <>
              <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                Total à payer : <strong>{formatCurrency(categoryPrice)}</strong>
              </div>
              <PaymentMethodPicker
                value={paymentMethod}
                onChange={setPaymentMethod}
                phone={currentMerchant.mobileMoneyNumber}
                accent="emerald"
              />
            </>
          )}

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          {success && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>
          )}

          <button
            type="submit"
            disabled={!selected}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 font-semibold text-white disabled:opacity-50"
          >
            <PlusCircle className="h-5 w-5" />
            Payer et ajouter la catégorie
          </button>

          <BackToHomeLink className="mt-3" />
        </form>
      )}
    </div>
  )
}
