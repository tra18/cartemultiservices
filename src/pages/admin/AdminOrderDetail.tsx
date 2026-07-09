import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle,
  Package,
  Printer,
  QrCode,
  ShieldCheck,
  ShieldX,
  Truck,
} from 'lucide-react'
import { DELIVERY_LABELS, ORDER_STATUS_LABELS } from '../../data/deliveryMethods'
import {
  approveOrder,
  getCardOrderById,
  hydrateOrdersFromServer,
  markOrderShipped,
  produceCard,
  rejectOrder,
} from '../../store/orderStore'
import { normalizeOrderStatus } from '../../services/orderServer'
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
  const [rejectReason, setRejectReason] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [acting, setActing] = useState(false)

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

  const status = normalizeOrderStatus(order.status)

  const reload = () => {
    const updated = getCardOrderById(orderId)
    if (updated) setOrder(updated)
  }

  const runAction = async (action: () => Promise<{ success: boolean; error?: string }>, successMsg: string) => {
    setError('')
    setMessage('')
    setActing(true)
    const result = await action()
    setActing(false)
    if (!result.success) {
      setError(result.error ?? 'Action échouée')
      return
    }
    setMessage(successMsg)
    reload()
  }

  const canApprove = ['pending_review', 'paid'].includes(status) && !order.cardActivated
  const canReject = canApprove
  const canProduce =
    !order.cardActivated && status === 'approved' && !order.cardNumber
  const canShip =
    !order.cardActivated &&
    order.cardNumber &&
    order.cardToken &&
    status === 'processing'
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
          {ORDER_STATUS_LABELS[status] ?? ORDER_STATUS_LABELS[order.status]}
          {order.orderType === 'replacement' && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              Remplacement perte/vol
            </span>
          )}
        </p>
      </div>

      {status === 'rejected' && order.rejectionReason && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Commande refusée</p>
          <p className="mt-1">{order.rejectionReason}</p>
        </div>
      )}

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
        {order.adminApprovedAt && (
          <div className="mt-2 flex justify-between">
            <span className="text-slate-500">Validée le</span>
            <span>{new Date(order.adminApprovedAt).toLocaleString('fr-GN')}</span>
          </div>
        )}
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
          Validation & production
        </h3>

        {canApprove && (
          <button
            type="button"
            disabled={acting}
            onClick={() => void runAction(() => approveOrder(orderId), 'Commande validée — vous pouvez produire la carte.')}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            <ShieldCheck className="h-5 w-5" />
            1. Valider la commande (paiement vérifié)
          </button>
        )}

        {canReject && !showReject && (
          <button
            type="button"
            disabled={acting}
            onClick={() => setShowReject(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-3.5 font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            <ShieldX className="h-5 w-5" />
            Refuser la commande
          </button>
        )}

        {showReject && (
          <div className="space-y-2 rounded-xl border border-red-200 bg-red-50 p-4">
            <label className="block text-sm font-medium text-red-900">Motif du refus</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm"
              placeholder="Ex. : paiement non reçu, informations incorrectes…"
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={acting || !rejectReason.trim()}
                onClick={() =>
                  void runAction(
                    () => rejectOrder(orderId, rejectReason.trim()),
                    'Commande refusée — le client a été notifié.'
                  ).then(() => setShowReject(false))
                }
                className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Confirmer le refus
              </button>
              <button
                type="button"
                onClick={() => setShowReject(false)}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-700"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {canProduce && (
          <button
            type="button"
            disabled={acting}
            onClick={() => void runAction(() => produceCard(orderId), 'Carte produite — numéro et QR générés.')}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3.5 font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
          >
            <Package className="h-5 w-5" />
            2. Produire la carte (numéro + QR)
          </button>
        )}

        {canPrint && (
          <Link
            to={`${ADMIN_BASE_PATH}/commandes/${orderId}/imprimer`}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 py-3.5 font-semibold text-violet-700 hover:bg-violet-100"
          >
            <Printer className="h-5 w-5" />
            3. Imprimer la carte
          </Link>
        )}

        {canShip && (
          <button
            type="button"
            disabled={acting}
            onClick={() =>
              void runAction(
                () => markOrderShipped(orderId),
                'Commande expédiée — le client peut activer sa carte.'
              )
            }
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Truck className="h-5 w-5" />
            4. Marquer expédiée / prête au retrait
          </button>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
        <p className="font-semibold text-slate-700">Workflow sécurisé</p>
        <ol className="mt-2 list-inside list-decimal space-y-1">
          <li>Valider → vérifie le paiement avant toute production</li>
          <li>Produire → génère numéro de carte et QR</li>
          <li>Imprimer → recto carte + verso QR</li>
          <li>Expédier → le client peut activer via l&apos;API serveur</li>
        </ol>
      </div>
    </div>
  )
}
