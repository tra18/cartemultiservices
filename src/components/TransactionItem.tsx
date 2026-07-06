import {
  ArrowDownLeft,
  ArrowUpRight,
  Bus,
  Shirt,
  ShoppingCart,
  UtensilsCrossed,
} from 'lucide-react'
import type { Category, Transaction } from '../types'
import { CATEGORY_LABELS } from '../types'
import { useCard } from '../context/CardContext'

const CATEGORY_ICONS: Record<Category, typeof UtensilsCrossed> = {
  restaurants: UtensilsCrossed,
  transport: Bus,
  vetements: Shirt,
  courses: ShoppingCart,
}

const CATEGORY_COLORS: Record<Category, string> = {
  restaurants: 'bg-orange-100 text-orange-600',
  transport: 'bg-blue-100 text-blue-600',
  vetements: 'bg-pink-100 text-pink-600',
  courses: 'bg-green-100 text-green-600',
}

interface TransactionItemProps {
  transaction: Transaction
}

export function TransactionItem({ transaction }: TransactionItemProps) {
  const { formatCurrency } = useCard()
  const isRecharge = transaction.type === 'recharge'
  const date = new Date(transaction.date)

  const Icon = transaction.category ? CATEGORY_ICONS[transaction.category] : null
  const colorClass = transaction.category ? CATEGORY_COLORS[transaction.category] : 'bg-indigo-100 text-indigo-600'

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
            ? 'Recharge'
            : transaction.merchant ?? CATEGORY_LABELS[transaction.category!]}
        </p>
        <p className="text-sm text-slate-500">
          {isRecharge
            ? transaction.method
            : [
                transaction.detail,
                transaction.method === 'QR Code' ? 'QR Code' : transaction.category ? CATEGORY_LABELS[transaction.category] : '',
              ]
                .filter(Boolean)
                .join(' · ')}
          {(isRecharge || transaction.method || transaction.category) && ' · '}
          {date.toLocaleDateString('fr-GN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
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
