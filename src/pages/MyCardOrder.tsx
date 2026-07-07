import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Package, QrCode, Truck } from 'lucide-react'
import { DELIVERY_LABELS, ORDER_STATUS_LABELS } from '../data/deliveryMethods'
import { useAuth } from '../context/AuthContext'
import { getCardOrderByUserId } from '../store/orderStore'
import { CLIENT_DASHBOARD_PATH } from '../constants/brand'
import { formatCurrency } from '../utils/currency'
import { maskCardNumber } from '../utils/card'
import { isCardActive, isCardUsable, canEnableDigitalCard, resolveCardStatus } from '../utils/cardStatus'

export function MyCardOrder() {
  const { currentUser, refreshCurrentUser } = useAuth()

  useEffect(() => {
    refreshCurrentUser()
  }, [refreshCurrentUser])

  if (!currentUser) return null

  const order = getCardOrderByUserId(currentUser.id)

  if (!order && isCardActive(currentUser)) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-600">Votre carte est active.</p>
        <Link to={CLIENT_DASHBOARD_PATH} className="mt-4 inline-block text-indigo-600 hover:text-indigo-700">
          Retour à l&apos;accueil
        </Link>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="py-12 text-center">
        <Package className="mx-auto h-12 w-12 text-slate-300" />
        <p className="mt-4 text-slate-600">Aucune commande de carte</p>
        <Link
          to="/commander-carte"
          className="mt-4 inline-block rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white"
        >
          Commander ma carte
        </Link>
      </div>
    )
  }

  const statusLabel = ORDER_STATUS_LABELS[order.status] ?? order.status
  const cardStatus = resolveCardStatus(currentUser)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Ma commande de carte</h2>
        <p className="mt-1 text-sm text-slate-500">
          Réf. {order.id.slice(0, 8).toUpperCase()}
        </p>
      </div>

      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
        <div className="flex items-center gap-3">
          <Truck className="h-8 w-8 text-indigo-600" />
          <div>
            <p className="font-semibold text-indigo-900">{statusLabel}</p>
            <p className="text-sm text-indigo-700">
              {DELIVERY_LABELS[order.deliveryMethod]}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
        <div className="flex items-start gap-3">
          <Mail className="mt-0.5 h-5 w-5 text-emerald-600" />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-emerald-900">Code d&apos;activation par email</p>
            <p className="mt-1 text-emerald-800">
              Envoyé le{' '}
              {new Date(order.activationEmailSentAt).toLocaleDateString('fr-GN', {
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              à <span className="font-medium">{order.email}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500">Montant payé</span>
          <span className="font-semibold">{formatCurrency(order.amount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Paiement</span>
          <span>{order.paymentMethod}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Date</span>
          <span>
            {new Date(order.createdAt).toLocaleDateString('fr-GN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
        </div>
        {order.deliveryMethod === 'home' && (
          <div className="border-t border-slate-100 pt-3">
            <span className="text-slate-500">Adresse : </span>
            <span>{order.address}, {order.city}</span>
          </div>
        )}
      </div>

      {order.cardActivated && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center text-sm text-emerald-800">
          <p className="font-semibold text-emerald-900">Carte activée</p>
          {order.cardNumber && (
            <p className="mt-1 font-mono">{maskCardNumber(order.cardNumber)}</p>
          )}
          <Link to={CLIENT_DASHBOARD_PATH} className="mt-3 inline-block font-medium text-emerald-700 underline">
            Aller à l&apos;accueil
          </Link>
        </div>
      )}

      {order.status === 'processing' && order.cardNumber && (
        <div className="rounded-xl border border-violet-100 bg-violet-50 p-4 text-sm text-violet-800">
          <p className="font-semibold">Carte en production</p>
          <p className="mt-1 font-mono">{maskCardNumber(order.cardNumber)}</p>
          <p className="mt-2 text-violet-700">
            Votre carte est en cours d&apos;impression. Vous serez notifié dès l&apos;expédition.
          </p>
        </div>
      )}

      {canEnableDigitalCard(currentUser) && (
        <Link
          to="/profil"
          className="flex items-center justify-center gap-2 rounded-xl border-2 border-cyan-200 bg-cyan-50 py-3.5 font-semibold text-cyan-800 hover:bg-cyan-100"
        >
          Activer ma carte numérique (en attendant)
        </Link>
      )}

      {isCardUsable(currentUser) && !isCardActive(currentUser) && (
        <p className="rounded-xl bg-cyan-50 px-4 py-3 text-center text-sm text-cyan-900">
          Carte numérique active — vous pouvez payer et recharger dès maintenant.
        </p>
      )}

      {(cardStatus === 'shipped' || order.status === 'shipped') && order.cardToken && !order.cardActivated && (
        <Link
          to={`/activer-carte?carte=${order.cardToken}`}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 font-semibold text-white hover:bg-indigo-700"
        >
          <QrCode className="h-5 w-5" />
          Activer ma carte (QR + code email)
        </Link>
      )}

      {cardStatus === 'ordered' && !order.cardActivated && (
        <p className="text-center text-sm text-slate-500">
          Production gérée par l&apos;équipe Guinée Multiservices. Vous recevrez un email à
          l&apos;expédition.
        </p>
      )}
    </div>
  )
}
