import { Link } from 'react-router-dom'
import { ChevronRight, Mail, Phone, Shield, User } from 'lucide-react'
import { WalletAddSection } from '../components/WalletAddSection'
import { useAuth } from '../context/AuthContext'
import { maskCardNumber } from '../utils/card'
import { isCardActive, resolveCardStatus } from '../utils/cardStatus'
import type { MobileWalletKind } from '../utils/mobileWallet'

const STATUS_LABELS: Record<string, string> = {
  none: 'Aucune carte',
  ordered: 'Commande en cours',
  shipped: 'En attente d\'activation',
  active: 'Active',
  blocked: 'Bloquée',
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function Profile() {
  const { currentUser, addToMobileWallet } = useAuth()

  if (!currentUser) return null

  const cardStatus = resolveCardStatus(currentUser)
  const canAddWallet = isCardActive(currentUser) && currentUser.cardStatus !== 'blocked'

  const handleAddWallet = async (wallet: MobileWalletKind): Promise<string | null> => {
    await new Promise((r) => setTimeout(r, 1200))
    return addToMobileWallet(wallet)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Mon profil</h2>
        <p className="mt-1 text-sm text-slate-500">Informations du compte et portefeuille mobile</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-700">
            {getInitials(currentUser.fullName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold text-slate-900">{currentUser.fullName}</p>
            <p className="text-sm text-slate-500">
              {STATUS_LABELS[currentUser.cardStatus] ?? cardStatus}
            </p>
          </div>
        </div>

        <dl className="mt-5 space-y-3 border-t border-slate-100 pt-5 text-sm">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 shrink-0 text-slate-400" />
            <div>
              <dt className="text-xs text-slate-400">Email</dt>
              <dd className="font-medium text-slate-800">{currentUser.email}</dd>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 shrink-0 text-slate-400" />
            <div>
              <dt className="text-xs text-slate-400">Téléphone</dt>
              <dd className="font-medium text-slate-800">{currentUser.phone}</dd>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 shrink-0 text-slate-400" />
            <div>
              <dt className="text-xs text-slate-400">Carte</dt>
              <dd className="font-mono font-medium text-slate-800">
                {maskCardNumber(currentUser.cardNumber)}
              </dd>
            </div>
          </div>
        </dl>
      </div>

      {canAddWallet ? (
        <WalletAddSection
          appleAddedAt={currentUser.walletAppleAddedAt}
          googleAddedAt={currentUser.walletGoogleAddedAt}
          onAdd={handleAddWallet}
        />
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
          <p className="text-sm font-medium text-slate-700">Portefeuille numérique</p>
          <p className="mt-1 text-sm text-slate-500">
            {currentUser.cardStatus === 'blocked'
              ? 'Débloquez votre carte pour l\'ajouter à Apple Pay ou Google Pay.'
              : 'Activez votre carte physique pour l\'ajouter à votre téléphone.'}
          </p>
          {currentUser.cardStatus === 'blocked' ? (
            <Link
              to="/securite-carte"
              className="mt-3 inline-block text-sm font-medium text-indigo-600"
            >
              Sécurité carte
            </Link>
          ) : cardStatus === 'shipped' ? (
            <Link
              to="/activer-carte"
              className="mt-3 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
            >
              Activer ma carte
            </Link>
          ) : (
            <Link
              to="/commander-carte"
              className="mt-3 inline-block text-sm font-medium text-indigo-600"
            >
              Commander une carte
            </Link>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <Link
          to="/securite-carte"
          className="flex items-center justify-between px-4 py-3.5 transition hover:bg-slate-50"
        >
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-indigo-600" />
            <span className="font-medium text-slate-800">Sécurité carte (PIN · blocage)</span>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-400" />
        </Link>
      </div>
    </div>
  )
}
