import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, Search, UserRound } from 'lucide-react'
import { ADMIN_BASE_PATH } from '../../constants/brand'
import { ORDER_STATUS_LABELS } from '../../data/deliveryMethods'
import { fetchAdminClientUsers, type AdminClientUser } from '../../services/clientUsersAdmin'
import { normalizeOrderStatus } from '../../services/orderServer'
import { formatCurrency } from '../../utils/currency'
import { maskCardNumber } from '../../utils/card'
import type { CardStatus } from '../../types/order'

const CARD_STATUS_LABELS: Record<CardStatus, string> = {
  none: 'Sans carte',
  ordered: 'Commandée',
  shipped: 'Expédiée',
  active: 'Active',
  blocked: 'Bloquée',
}

const STATUS_FILTERS: { value: 'all' | CardStatus | 'no_order'; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'none', label: 'Sans carte' },
  { value: 'ordered', label: 'Commandée' },
  { value: 'shipped', label: 'Expédiée' },
  { value: 'active', label: 'Active' },
  { value: 'blocked', label: 'Bloquée' },
  { value: 'no_order', label: 'Sans commande' },
]

export function AdminUsers() {
  const [users, setUsers] = useState<AdminClientUser[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | CardStatus | 'no_order'>('all')

  const refresh = async () => {
    setLoading(true)
    setError('')
    const result = await fetchAdminClientUsers()
    setUsers(result.users)
    setTotal(result.total)
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
    return users
      .filter((user) => {
        if (filter === 'all') return true
        if (filter === 'no_order') return !user.hasOrder
        return user.cardStatus === filter
      })
      .filter(
        (user) =>
          !q ||
          user.fullName.toLowerCase().includes(q) ||
          user.email.toLowerCase().includes(q) ||
          user.phone.toLowerCase().includes(q) ||
          user.id.toLowerCase().includes(q)
      )
      .sort((a, b) => a.fullName.localeCompare(b.fullName, 'fr'))
  }, [users, filter, search])

  const counts = useMemo(() => {
    const c = { active: 0, ordered: 0, shipped: 0, blocked: 0, none: 0, noOrder: 0 }
    for (const user of users) {
      if (user.cardStatus in c) c[user.cardStatus as keyof typeof c]++
      if (!user.hasOrder) c.noOrder++
    }
    return c
  }, [users])

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-start sm:gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Comptes clients</h2>
          <p className="mt-1 text-sm text-slate-500">
            {total} compte(s) enregistré(s) sur le serveur
            {counts.noOrder > 0 && (
              <span className="text-amber-600"> · {counts.noOrder} sans commande liée</span>
            )}
          </p>
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
            <p className="font-semibold">Impossible de charger les comptes</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-center">
          <p className="text-2xl font-bold text-emerald-700">{counts.active}</p>
          <p className="text-xs text-emerald-600">Actifs</p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-center">
          <p className="text-2xl font-bold text-blue-700">{counts.shipped}</p>
          <p className="text-xs text-blue-600">Expédiés</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-center">
          <p className="text-2xl font-bold text-amber-700">{counts.ordered}</p>
          <p className="text-xs text-amber-600">Commandés</p>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-center">
          <p className="text-2xl font-bold text-red-700">{counts.blocked}</p>
          <p className="text-xs text-red-600">Bloqués</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
          <p className="text-2xl font-bold text-slate-700">{counts.none}</p>
          <p className="text-xs text-slate-600">Sans carte</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Rechercher par nom, email, téléphone ou identifiant…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-violet-500"
        />
      </div>

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:overflow-visible sm:px-0">
        <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
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
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-500">
          {loading ? 'Chargement des comptes…' : 'Aucun compte trouvé'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((user) => (
            <div
              key={user.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                  <UserRound className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{user.fullName}</p>
                  <p className="truncate text-sm text-slate-500">{user.email}</p>
                  <p className="truncate text-xs text-slate-400">{user.phone}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm sm:text-right">
                <div>
                  <p className="text-xs text-slate-400">Statut carte</p>
                  <p className="font-medium text-slate-900">
                    {CARD_STATUS_LABELS[user.cardStatus] ?? user.cardStatus}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Solde</p>
                  <p className="font-medium text-slate-900">{formatCurrency(user.balance)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Commande</p>
                  {user.hasOrder && user.orderId ? (
                    <Link
                      to={`${ADMIN_BASE_PATH}/commandes/${user.orderId}`}
                      className="font-medium text-violet-700 hover:underline"
                    >
                      {user.orderStatus
                        ? ORDER_STATUS_LABELS[normalizeOrderStatus(user.orderStatus)] ?? user.orderStatus
                        : 'Voir'}
                      {user.orderType === 'replacement' ? ' · Remplacement' : ''}
                    </Link>
                  ) : (
                    <p className="font-medium text-amber-700">Aucune</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-slate-400">Carte / PIN</p>
                  <p className="font-medium text-slate-900">
                    {user.cardNumber && user.cardNumber !== 'En attente de carte'
                      ? maskCardNumber(user.cardNumber)
                      : user.digitalCardEnabledAt
                        ? 'Numérique'
                        : '—'}
                    {user.hasPin ? '' : ' · sans PIN'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
