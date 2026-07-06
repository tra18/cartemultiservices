import { useState } from 'react'
import { TransactionItem } from '../components/TransactionItem'
import { useCard } from '../context/CardContext'
import type { Category } from '../types'
import { CATEGORY_LABELS } from '../types'

type Filter = 'all' | 'recharge' | Category

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Tout' },
  { key: 'recharge', label: 'Recharges' },
  { key: 'restaurants', label: 'Restaurants' },
  { key: 'transport', label: 'Transport' },
  { key: 'vetements', label: 'Vêtements' },
  { key: 'courses', label: 'Courses' },
]

export function History() {
  const { transactions, formatCurrency } = useCard()
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = transactions.filter((t) => {
    if (filter === 'all') return true
    if (filter === 'recharge') return t.type === 'recharge'
    return t.category === filter
  })

  const totalSpent = transactions
    .filter((t) => t.type === 'paiement')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalRecharged = transactions
    .filter((t) => t.type === 'recharge')
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Historique</h2>
        <p className="mt-1 text-sm text-slate-500">
          Toutes vos recharges et paiements
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-xs font-medium text-emerald-600">Total rechargé</p>
          <p className="mt-1 text-lg font-bold text-emerald-700">{formatCurrency(totalRecharged)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Total dépensé</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{formatCurrency(totalSpent)}</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition ${
              filter === key
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {key !== 'all' && key !== 'recharge' ? CATEGORY_LABELS[key] : label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
            Aucune transaction dans cette catégorie
          </p>
        ) : (
          filtered.map((t) => <TransactionItem key={t.id} transaction={t} />)
        )}
      </div>
    </div>
  )
}
