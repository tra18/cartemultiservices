import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, Bell, Package, Search } from 'lucide-react'
import { ORDER_STATUS_LABELS } from '../../data/deliveryMethods'
import { hydrateOrdersFromServer } from '../../store/orderStore'
import { normalizeOrderStatus } from '../../services/orderServer'
import type { CardOrder, CardOrderStatus } from '../../types/order'
import { formatCurrency } from '../../utils/currency'
import { maskCardNumber } from '../../utils/card'
import { ADMIN_BASE_PATH } from '../../constants/brand'

const STATUS_FILTERS: { value: 'all' | CardOrderStatus; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'pending_review', label: 'À valider' },
  { value: 'approved', label: 'Validées' },
  { value: 'processing', label: 'En production' },
  { value: 'shipped', label: 'Expédiées' },
  { value: 'activated', label: 'Activées' },
  { value: 'rejected', label: 'Refusées' },
]

export function AdminOrders() {
  const [filter, setFilter] = useState<'all' | CardOrderStatus>('all')
  const [search, setSearch] = useState('')
  const [orders, setOrders] = useState<CardOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [recentAlerts, setRecentAlerts] = useState<
    Array<{
      id: string
      customerName: string
      customerEmail: string
      amount: number
      orderType?: string
      createdAt: string
    }>
  >([])

  const refresh = async () => {
    setLoading(true)
    setError('')
    const result = await hydrateOrdersFromServer()
    setOrders(result.orders)
    setRecentAlerts(result.recentAlerts ?? [])
    if (result.error) setError(result.error)
    setLoading(false)
  }

  useEffect(() => {
    void refresh()
    const interval = window.setInterval(() => {
      void refresh()
    }, 60_000)
    return () => window.clearInterval(interval)
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return orders
      .filter((o) => filter === 'all' || normalizeOrderStatus(o.status) === filter)
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
    const c = { pending_review: 0, approved: 0, processing: 0, shipped: 0, activated: 0 }
    for (const o of orders) {
      const s = normalizeOrderStatus(o.status)
      if (s in c) c[s as keyof typeof c]++
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
          onClick={() => void refresh()}
          disabled={loading}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white disabled:opacity-50"
        >
          {loading ? 'Chargement…' : 'Actualiser'}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Impossible de synchroniser avec le serveur</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {recentAlerts.length > 0 && (
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
          <div className="flex items-center gap-2 text-violet-900">
            <Bell className="h-5 w-5" />
            <p className="font-semibold">Nouvelles demandes ({recentAlerts.length})</p>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-violet-800">
            {recentAlerts.map((alert) => (
              <li key={alert.id} className="rounded-lg bg-white/70 px-3 py-2">
                <span className="font-medium">{alert.customerName}</span> — {alert.customerEmail}
                <span className="mx-2 text-violet-400">·</span>
                {formatCurrency(alert.amount)}
                {alert.orderType === 'replacement' && (
                  <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                    Remplacement
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-center">
          <p className="text-2xl font-bold text-amber-700">{counts.pending_review}</p>
          <p className="text-xs text-amber-600">À valider</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-center">
          <p className="text-2xl font-bold text-emerald-700">{counts.approved}</p>
          <p className="text-xs text-emerald-600">Validées</p>
        </div>
        <div className="rounded-xl border border-violet-100 bg-violet-50 p-3 text-center">
          <p className="text-2xl font-bold text-violet-700">{counts.processing}</p>
          <p className="text-xs text-violet-600">Production</p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-center">
          <p className="text-2xl font-bold text-blue-700">{counts.shipped}</p>
          <p className="text-xs text-blue-600">Expédiées</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
          <p className="text-2xl font-bold text-slate-700">{counts.activated}</p>
          <p className="text-xs text-slate-600">Activées</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Rechercher par nom, email ou référence…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-violet-500"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              filter === value
                ? 'bg-violet-600 text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-500">
          {loading ? 'Chargement des commandes…' : 'Aucune commande trouvée'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((order) => (
            <Link
              key={order.id}
              to={`${ADMIN_BASE_PATH}/commandes/${order.id}`}
              className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-violet-200 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                <Package className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">{order.userName}</p>
                <p className="truncate text-sm text-slate-500">{order.email}</p>
              </div>
              <div className="text-right text-sm">
                <p className="font-semibold text-slate-900">{formatCurrency(order.amount)}</p>
                <p className="text-slate-500">
                  {ORDER_STATUS_LABELS[normalizeOrderStatus(order.status)] ?? order.status}
                </p>
                {order.orderType === 'replacement' && (
                  <p className="text-xs font-medium text-amber-700">Remplacement</p>
                )}
                {order.cardNumber && (
                  <p className="font-mono text-xs text-slate-400">{maskCardNumber(order.cardNumber)}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
