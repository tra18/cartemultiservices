import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { AlertCircle, Bus, CreditCard, Fuel, PlusCircle, QrCode, Shield, Shirt, ShoppingCart, Smartphone, UtensilsCrossed } from 'lucide-react'
import { CardVisual } from '../components/CardVisual'
import { TransactionItem } from '../components/TransactionItem'
import { useAuth } from '../context/AuthContext'
import { useCard } from '../context/CardContext'
import type { Category } from '../types'
import { CATEGORY_DESCRIPTIONS, CATEGORY_LABELS } from '../types'
import { resolveCardStatus } from '../utils/cardStatus'

const CATEGORIES: { key: Category; icon: typeof UtensilsCrossed; color: string }[] = [
  { key: 'restaurants', icon: UtensilsCrossed, color: 'bg-orange-50 text-orange-600 border-orange-100' },
  { key: 'transport', icon: Bus, color: 'bg-blue-50 text-blue-600 border-blue-100' },
  { key: 'vetements', icon: Shirt, color: 'bg-pink-50 text-pink-600 border-pink-100' },
  { key: 'courses', icon: ShoppingCart, color: 'bg-green-50 text-green-600 border-green-100' },
]

export function Dashboard() {
  const { currentUser, refreshCurrentUser } = useAuth()
  const { transactions } = useCard()
  const recent = transactions.slice(0, 4)
  const cardStatus = resolveCardStatus(currentUser)

  useEffect(() => {
    refreshCurrentUser()
  }, [refreshCurrentUser])

  return (
    <div className="space-y-6">
      {currentUser?.cardStatus === 'blocked' && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
            <div className="flex-1 text-sm">
              <p className="font-semibold text-red-900">Carte bloquée</p>
              <p className="mt-1 text-red-800">Paiements et recharges suspendus.</p>
              <Link
                to="/securite-carte"
                className="mt-2 inline-block font-medium text-red-700 underline"
              >
                Débloquer ma carte
              </Link>
            </div>
          </div>
        </div>
      )}

      {cardStatus !== 'active' && currentUser?.cardStatus !== 'blocked' && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
            <div className="flex-1 text-sm">
              {cardStatus === 'none' && (
                <>
                  <p className="font-semibold text-amber-900">Carte physique requise</p>
                  <p className="mt-1 text-amber-800">
                    Commandez votre carte multiservice pour commencer.
                  </p>
                  <Link
                    to="/commander-carte"
                    className="mt-3 inline-block rounded-lg bg-amber-600 px-4 py-2 font-medium text-white hover:bg-amber-700"
                  >
                    Commander ma carte — 100 000 GNF
                  </Link>
                </>
              )}
              {cardStatus === 'ordered' && (
                <>
                  <p className="font-semibold text-amber-900">Carte en préparation</p>
                  <p className="mt-1 text-amber-800">Votre commande est en cours de traitement.</p>
                  <Link to="/ma-commande" className="mt-2 inline-block font-medium text-amber-700 underline">
                    Suivre ma commande
                  </Link>
                </>
              )}
              {cardStatus === 'shipped' && (
                <>
                  <p className="font-semibold text-amber-900">Carte prête !</p>
                  <p className="mt-1 text-amber-800">
                    Activez votre carte avec le code reçu par email à la commande.
                  </p>
                  <Link
                    to="/activer-carte"
                    className="mt-3 inline-block rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white"
                  >
                    Activer ma carte
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <CardVisual />

      {cardStatus === 'active' && (
        <>
          <Link
            to="/scanner"
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-indigo-200 bg-indigo-50 px-4 py-3.5 font-semibold text-indigo-700 transition hover:bg-indigo-100"
          >
            <QrCode className="h-5 w-5" />
            Scanner QR commerçant
          </Link>

          <Link
            to="/carburant"
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-blue-200 bg-blue-50 px-4 py-3.5 font-semibold text-blue-700 transition hover:bg-blue-100"
          >
            <Fuel className="h-5 w-5" />
            Acheter du carburant
          </Link>

          <Link
            to="/securite-carte"
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3.5 font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Shield className="h-5 w-5 text-indigo-600" />
            Sécurité carte (PIN · blocage)
          </Link>

          <Link
            to="/profil#wallet"
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3.5 font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Smartphone className="h-5 w-5 text-slate-700" />
            Apple Pay · Google Pay
          </Link>

          <Link
            to="/recharger"
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
          >
            <PlusCircle className="h-5 w-5" />
            Recharger ma carte
          </Link>
        </>
      )}

      {cardStatus === 'active' && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Où utiliser ma carte
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map(({ key, icon: Icon, color }) => (
              <Link
                key={key}
                to={`/payer?category=${key}`}
                className={`flex flex-col gap-2 rounded-xl border p-4 transition hover:shadow-md ${color}`}
              >
                <Icon className="h-6 w-6" />
                <div>
                  <p className="font-semibold">{CATEGORY_LABELS[key]}</p>
                  <p className="text-xs opacity-80">{CATEGORY_DESCRIPTIONS[key]}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {cardStatus !== 'active' && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 py-8 text-slate-400">
          <CreditCard className="h-6 w-6" />
          <span className="text-sm">Recharge et paiements disponibles après activation</span>
        </div>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Activité récente
          </h2>
          {cardStatus === 'active' && (
            <Link to="/historique" className="text-sm font-medium text-indigo-600">
              Voir tout
            </Link>
          )}
        </div>
        <div className="space-y-2">
          {recent.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
              Aucune transaction pour le moment
            </p>
          ) : (
            recent.map((t) => <TransactionItem key={t.id} transaction={t} />)
          )}
        </div>
      </section>
    </div>
  )
}
