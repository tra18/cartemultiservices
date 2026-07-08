import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle,
  Package,
  Printer,
  QrCode,
  Truck,
} from 'lucide-react'
import { DELIVERY_LABELS, ORDER_STATUS_LABELS } from '../../data/deliveryMethods'
import {
  getCardOrderById,
  hydrateOrdersFromServer,
  markOrderShipped,
  produceCard,
} from '../../store/orderStore'
import { formatCurrency } from '../../utils/currency'
import { getCardActivationUrl, maskCardNumber } from '../../utils/card'
import { ADMIN_BASE_PATH } from '../../constants/brand'

export function AdminOrderDetail() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState(() => (orderId ? getCardOrderById(orderId) : undefined))
  const [loading, setLoading] = useState(!order)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!orderId) return

    void (async () => {
      setLoading(true)
      await hydrateOrdersFromServer()
      setOrder(getCardOrderById(orderId))
      setLoading(false)
    })()
  }, [orderId])

  if (!orderId) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-600">Commande introuvable</p>
        <Link to={ADMIN_BASE_PATH} className="mt-4 inline-block text-violet-600">
          Retour aux commandes
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-600">Chargement de la commande…</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-600">Commande introuvable</p>
        <Link to={ADMIN_BASE_PATH} className="mt-4 inline-block text-violet-600">
          Retour aux commandes
        </Link>
      </div>
    )
  }

  const reload = () => {
    const updated = getCardOrderById(orderId)
    if (updated) setOrder(updated)
  }

  const handleProduce = () => {
    setError('')
    setMessage('')
    const result = produceCard(orderId)
    if (!result.success) {
      setError(result.error ?? 'Échec production')
      return
    }
    setMessage('Carte produite — numéro et QR générés. Vous pouvez imprimer.')
    reload()
  }

  const handleShip = () => {
    setError('')
    setMessage('')
    const result = markOrderShipped(orderId)
    if (!result.success) {
      setError(result.error ?? 'Échec expédition')
      return
    }
    setMessage('Commande marquée expédiée — le client peut activer sa carte.')
    reload()
  }

  const canProduce =
    !order.cardActivated && !order.cardNumber && ['paid', 'processing'].includes(order.status)
  const canShip =
    !order.cardActivated &&
    order.cardNumber &&
    order.cardToken &&
    order.status !== 'shipped' &&
    order.status !== 'delivered'
  const canPrint = Boolean(order.cardNumber && order.cardToken)

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate(ADMIN_BASE_PATH)}
        className="flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Toutes les commandes
      </button>

      <div>
        <h2 className="text-xl font-bold text-slate-900">{order.userName}</h2>
        <p className="mt-1 text-sm text-slate-500">
          Réf. {order.id.slice(0, 8).toUpperCase()} ·{' '}
          {ORDER_STATUS_LABELS[order.status]}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
          <p className="font-medium text-slate-900">Client</p>
          <p className="mt-2 text-slate-600">{order.email}</p>
          <p className="text-slate-600">{order.phone}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
          <p className="font-medium text-slate-900">Livraison</p>
          <p className="mt-2 text-slate-600">{DELIVERY_LABELS[order.deliveryMethod]}</p>
          {order.deliveryMethod === 'home' && (
            <p className="text-slate-600">
              {order.address}, {order.city}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500">Montant</span>
          <span className="font-semibold">{formatCurrency(order.amount)}</span>
        </div>
        <div className="mt-2 flex justify-between">
          <span className="text-slate-500">Paiement</span>
          <span>{order.paymentMethod}</span>
        </div>
        <div className="mt-2 flex justify-between">
          <span className="text-slate-500">Commande</span>
          <span>
            {new Date(order.createdAt).toLocaleString('fr-GN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>

      {order.cardNumber && (
        <div className="rounded-xl border border-violet-100 bg-violet-50 p-4">
          <p className="text-sm font-semibold text-violet-900">Carte produite</p>
          <p className="mt-2 font-mono text-lg tracking-wider text-violet-800">
            {order.cardNumber}
          </p>
          {order.cardToken && (
            <div className="mt-3 space-y-1 text-sm text-violet-700">
              <p className="flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                Token QR : <span className="font-mono">{order.cardToken}</span>
              </p>
              <p className="break-all text-xs opacity-80">{getCardActivationUrl(order.cardToken)}</p>
            </div>
          )}
          {order.producedAt && (
            <p className="mt-2 text-xs text-violet-600">
              Produite le{' '}
              {new Date(order.producedAt).toLocaleString('fr-GN')}
            </p>
          )}
        </div>
      )}

      {order.cardActivated && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle className="h-5 w-5" />
          Carte activée par le client
          {order.cardNumber && ` — ${maskCardNumber(order.cardNumber)}`}
        </div>
      )}

      {message && (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Actions production
        </h3>

        {canProduce && (
          <button
            type="button"
            onClick={handleProduce}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3.5 font-semibold text-white hover:bg-violet-700"
          >
            <Package className="h-5 w-5" />
            {order.cardNumber ? 'Régénérer (déjà produite)' : '1. Produire la carte (numéro + QR)'}
          </button>
        )}

        {canPrint && (
          <Link
            to={`${ADMIN_BASE_PATH}/commandes/${orderId}/imprimer`}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 py-3.5 font-semibold text-violet-700 hover:bg-violet-100"
          >
            <Printer className="h-5 w-5" />
            2. Imprimer la carte
          </Link>
        )}

        {canShip && (
          <button
            type="button"
            onClick={handleShip}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-semibold text-white hover:bg-blue-700"
          >
            <Truck className="h-5 w-5" />
            3. Marquer expédiée / prête au retrait
          </button>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
        <p className="font-semibold text-slate-700">Workflow</p>
        <ol className="mt-2 list-inside list-decimal space-y-1">
          <li>Produire → génère le numéro de carte et le QR lié au compte client</li>
          <li>Imprimer → recto (carte) + verso (QR d&apos;activation)</li>
          <li>Expédier → le client reçoit un email et peut activer via QR + code email</li>
        </ol>
      </div>
    </div>
  )
}
