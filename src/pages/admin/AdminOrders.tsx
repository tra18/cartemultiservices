import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, Search } from 'lucide-react'
import { DELIVERY_LABELS, ORDER_STATUS_LABELS } from '../../data/deliveryMethods'
import { loadCardOrders } from '../../store/orderStore'
import type { CardOrderStatus } from '../../types/order'
import { formatCurrency } from '../../utils/currency'
import { maskCardNumber } from '../../utils/card'

const STATUS_FILTERS: { value: 'all' | CardOrderStatus; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'paid', label: 'Payées' },
  { value: 'processing', label: 'En production' },
  { value: 'shipped', label: 'Expédiées' },
  { value: 'delivered', label: 'Activées' },
]

export function AdminOrders() {
  const [filter, setFilter] = useState<'all' | CardOrderStatus>('all')
  const [search, setSearch] = useState('')
  const [orders, setOrders] = useState(() => loadCardOrders())

  const refresh = () => setOrders(loadCardOrders())

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return orders
      .filter((o) => filter === 'all' || o.status === filter)
      .filter(
        (o) =>
          !q ||
          o.userName.toLowerCase().includes(q) ||
          o.email.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q)
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [orders, filter, search])

  const counts = useMemo(() => {
    const c = { paid: 0, processing: 0, shipped: 0, delivered: 0 }
    for (const o of orders) {
      if (o.status in c) c[o.status as keyof typeof c]++
    }
    return c
  }, [orders])

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-start sm:gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Commandes de cartes</h2>
          <p className="mt-1 text-sm text-slate-500">{orders.length} commande(s) au total</p>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white"
        >
          Actualiser
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-center">
          <p className="text-2xl font-bold text-amber-700">{counts.paid}</p>
          <p className="text-xs text-amber-600">À produire</p>
        </div>
        <div className="rounded-xl border border-violet-100 bg-violet-50 p-3 text-center">
          <p className="text-2xl font-bold text-violet-700">{counts.processing}</p>
          <p className="text-xs text-violet-600">En production</p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-center">
          <p className="text-2xl font-bold text-blue-700">{counts.shipped}</p>
          <p className="text-xs text-blue-600">Expédiées</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-center">
          <p className="text-2xl font-bold text-emerald-700">{counts.delivered}</p>
          <p className="text-xs text-emerald-600">Activées</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Rechercher nom, email, référence..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-violet-500"
        />
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              filter === value
                ? 'bg-violet-600 text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-500">
            Aucune commande trouvée
          </div>
        ) : (
          filtered.map((order) => (
            <Link
              key={order.id}
              to={`/admin/commandes/${order.id}`}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-violet-200 hover:shadow-sm sm:flex-row sm:items-center sm:gap-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                <Package className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">{order.userName}</p>
                <p className="truncate text-sm text-slate-500">{order.email}</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {DELIVERY_LABELS[order.deliveryMethod]} ·{' '}
                  {new Date(order.createdAt).toLocaleDateString('fr-GN')}
                </p>
              </div>
              <div className="shrink-0 sm:text-right">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    order.status === 'paid'
                      ? 'bg-amber-100 text-amber-700'
                      : order.status === 'processing'
                        ? 'bg-violet-100 text-violet-700'
                        : order.status === 'shipped'
                          ? 'bg-blue-100 text-blue-700'
                          : order.status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {ORDER_STATUS_LABELS[order.status] ?? order.status}
                </span>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {formatCurrency(order.amount)}
                </p>
                {order.cardNumber && (
                  <p className="mt-0.5 font-mono text-xs text-slate-400">
                    {maskCardNumber(order.cardNumber)}
                  </p>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
