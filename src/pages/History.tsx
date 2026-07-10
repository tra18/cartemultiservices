import { useState } from 'react'
import { TransactionItem } from '../components/TransactionItem'
import { useCard } from '../context/CardContext'
import { ALL_CATEGORIES } from '../data/categories'
import type { Category } from '../types'
import { CATEGORY_LABELS } from '../types'

type Filter = 'all' | 'recharge' | Category

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Tout' },
  { key: 'recharge', label: 'Recharges' },
  ...ALL_CATEGORIES.map((key) => ({ key, label: CATEGORY_LABELS[key] })),
]

export function History() {
  const { transactions, formatCurrency } = useCard()
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = transactions.filter((t) => {
    if (filter === 'all') return true
    if (filter === 'recharge') return t.type === 'recharge'
    return t.category === filter
  })

  const totalIn = filtered
    .filter((t) => t.type === 'recharge')
    .reduce((sum, t) => sum + t.amount, 0)
  const totalOut = filtered
    .filter((t) => t.type === 'paiement')
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Historique</h2>
        <p className="mt-1 text-sm text-slate-500">
          Toutes vos recharges et paiements par catégorie.
        </p>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:overflow-visible sm:px-0">
        <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                filter === key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {(filter === 'all' || filter === 'recharge') && filtered.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-center">
            <p className="text-xs text-emerald-600">Entrées</p>
            <p className="text-lg font-bold text-emerald-700">{formatCurrency(totalIn)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
            <p className="text-xs text-slate-500">Sorties</p>
            <p className="text-lg font-bold text-slate-800">{formatCurrency(totalOut)}</p>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-500">
          Aucune opération pour ce filtre
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((transaction) => (
            <TransactionItem key={transaction.id} transaction={transaction} />
          ))}
        </div>
      )}
    </div>
  )
}
