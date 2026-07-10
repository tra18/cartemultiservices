import {
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react'
import type { Transaction } from '../types'
import { CATEGORY_LABELS } from '../types'
import { CATEGORY_ICONS, CATEGORY_TILE_COLORS } from '../data/categories'
import { useCard } from '../context/CardContext'

interface TransactionItemProps {
  transaction: Transaction
}

export function TransactionItem({ transaction }: TransactionItemProps) {
  const { formatCurrency } = useCard()
  const isRecharge = transaction.type === 'recharge'
  const date = new Date(transaction.date)

  const Icon = transaction.category ? CATEGORY_ICONS[transaction.category] : null
  const colorClass = transaction.category
    ? CATEGORY_TILE_COLORS[transaction.category].split(' ').slice(0, 2).join(' ')
    : 'bg-indigo-100 text-indigo-600'

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          isRecharge ? 'bg-emerald-100 text-emerald-600' : colorClass
        }`}
      >
        {isRecharge ? (
          <ArrowDownLeft className="h-5 w-5" />
        ) : Icon ? (
          <Icon className="h-5 w-5" />
        ) : (
          <ArrowUpRight className="h-5 w-5" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-900">
          {isRecharge
            ? transaction.method?.includes('diaspora')
              ? 'Recharge diaspora'
              : 'Recharge'
            : transaction.merchant ?? CATEGORY_LABELS[transaction.category!]}
        </p>
        <p className="text-xs text-slate-500">
          {date.toLocaleDateString('fr-GN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
          {transaction.detail ? ` · ${transaction.detail}` : ''}
        </p>
      </div>

      <p
        className={`shrink-0 font-semibold ${
          isRecharge ? 'text-emerald-600' : 'text-slate-900'
        }`}
      >
        {isRecharge ? '+' : '-'}
        {formatCurrency(transaction.amount)}
      </p>
    </div>
  )
}
