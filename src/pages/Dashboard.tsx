import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { AlertCircle, CreditCard, Fuel, Globe, PlusCircle, QrCode, Shield, Smartphone } from 'lucide-react'
import { WalletChargeBanner } from '../components/WalletChargeBanner'
import { CardVisual } from '../components/CardVisual'
import { TransactionItem } from '../components/TransactionItem'
import { useAuth } from '../context/AuthContext'
import { useCard } from '../context/CardContext'
import { PAYMENT_FAMILIES, getCategoryMeta } from '../data/categories'
import { resolveCardStatus, isCardUsable, isDigitalCardActive, canEnableDigitalCard } from '../utils/cardStatus'

export function Dashboard() {
  const { currentUser, refreshCurrentUser } = useAuth()
  const { transactions } = useCard()
  const recent = transactions.slice(0, 4)
  const cardStatus = resolveCardStatus(currentUser)
  const cardUsable = isCardUsable(currentUser)
  const digitalActive = isDigitalCardActive(currentUser)
  const canEnableDigital = canEnableDigitalCard(currentUser)

  useEffect(() => {
    refreshCurrentUser()
  }, [refreshCurrentUser])

  return (
    <div className="space-y-6">
      <WalletChargeBanner />

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

      {cardStatus !== 'active' && !cardUsable && currentUser?.cardStatus !== 'blocked' && (
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
                  <p className="mt-1 text-amber-800">
                    Activez votre carte numérique sur votre profil pour payer en attendant la livraison.
                  </p>
                  <Link
                    to="/profil"
                    className="mt-3 inline-block rounded-lg bg-cyan-600 px-4 py-2 font-medium text-white hover:bg-cyan-700"
                  >
                    Activer la carte numérique
                  </Link>
                  <Link to="/ma-commande" className="mt-2 block font-medium text-amber-700 underline">
                    Suivre ma commande
                  </Link>
                </>
              )}
              {cardStatus === 'shipped' && (
                <>
                  <p className="font-semibold text-amber-900">Carte physique en route</p>
                  <p className="mt-1 text-amber-800">
                    Utilisez la carte numérique ou activez la carte physique à réception.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      to="/profil"
                      className="inline-block rounded-lg bg-cyan-600 px-4 py-2 font-medium text-white"
                    >
                      Carte numérique
                    </Link>
                    <Link
                      to="/activer-carte"
                      className="inline-block rounded-lg border border-indigo-300 bg-white px-4 py-2 font-medium text-indigo-700"
                    >
                      Activer carte physique
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {digitalActive && cardStatus !== 'active' && (
        <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
          <span className="font-semibold">Carte numérique active</span>
          <span className="text-cyan-800"> — votre carte physique arrive bientôt.</span>
        </div>
      )}

      {(cardUsable || canEnableDigital) && <CardVisual />}

      {cardUsable && (
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
            to="/recharger-diaspora"
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-indigo-200 bg-indigo-50 px-4 py-3.5 font-semibold text-indigo-700 transition hover:bg-indigo-100"
          >
            <Globe className="h-5 w-5" />
            Recharge diaspora (depuis l&apos;étranger)
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

      {cardUsable && (
        <section className="space-y-5">
          {PAYMENT_FAMILIES.map((family) => (
            <div key={family.id}>
              <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
                {family.label}
              </h2>
              <p className="mb-3 text-xs text-slate-400">{family.description}</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {family.categories.map((key) => {
                  const meta = getCategoryMeta(key)
                  const Icon = meta.icon
                  return (
                    <Link
                      key={key}
                      to={`/payer?category=${key}`}
                      className={`flex flex-col gap-2 rounded-xl border p-4 transition hover:shadow-md ${meta.color}`}
                    >
                      <Icon className="h-6 w-6" />
                      <div>
                        <p className="font-semibold">{meta.label}</p>
                        <p className="text-xs opacity-80">{meta.description}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </section>
      )}

      {!cardUsable && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 py-8 text-slate-400">
          <CreditCard className="h-6 w-6" />
          <span className="text-sm">
            {canEnableDigital
              ? 'Activez votre carte numérique depuis le profil'
              : 'Recharge et paiements disponibles après commande de carte'}
          </span>
        </div>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Activité récente
          </h2>
          {cardUsable && (
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
