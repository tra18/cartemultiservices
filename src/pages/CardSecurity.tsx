import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CreditCard, Lock, ShieldCheck, ShieldOff } from 'lucide-react'
import { CardPinModal } from '../components/CardPinModal'
import { ResetCardPinPanel } from '../components/ResetCardPinPanel'
import { useAuth } from '../context/AuthContext'
import { maskCardNumber } from '../utils/card'
import { isBlockedForLoss } from '../utils/cardReplacement'
import { getEffectiveCardNumber, isCardUsable } from '../utils/cardStatus'
import { formatCurrency } from '../utils/currency'
import { getReplacementCardPrice } from '../utils/pricing'

export function CardSecurity() {
  const { currentUser, blockCard, unblockCard } = useAuth()
  const [showUnblockPin, setShowUnblockPin] = useState(false)
  const [showBlockConfirm, setShowBlockConfirm] = useState(false)
  const [pinError, setPinError] = useState('')
  const [message, setMessage] = useState('')

  if (!currentUser) return null

  const isBlocked = currentUser.cardStatus === 'blocked'
  const blockedForLoss = isBlockedForLoss(currentUser)
  const canManageSecurity = isCardUsable(currentUser) || isBlocked
  const replacementPrice = getReplacementCardPrice()

  const handleBlock = async () => {
    setMessage('')
    const err = await blockCard()
    if (err) {
      setMessage(err)
      return
    }
    setShowBlockConfirm(false)
    setMessage('Perte ou vol déclaré. Votre carte est bloquée. Vous pouvez commander une carte de remplacement.')
  }

  const handleUnblock = async (pin: string) => {
    setPinError('')
    const err = await unblockCard(pin)
    if (err) {
      setPinError(err)
      return
    }
    setShowUnblockPin(false)
    setMessage('Carte débloquée. Vous pouvez à nouveau payer.')
  }

  if (!canManageSecurity && !isBlocked) {
    return (
      <div className="py-12 text-center">
        <Lock className="mx-auto h-12 w-12 text-slate-300" />
        <p className="mt-4 text-slate-600">
          Activez votre carte numérique ou physique pour gérer la sécurité.
        </p>
        <Link to="/profil" className="mt-4 inline-block text-indigo-600">
          Mon profil
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Sécurité de la carte</h2>
        <p className="mt-1 text-sm text-slate-500">
          {maskCardNumber(getEffectiveCardNumber(currentUser))} · {currentUser.fullName}
        </p>
      </div>

      {isBlocked && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex gap-3">
            <ShieldOff className="h-5 w-5 shrink-0 text-red-600" />
            <div className="text-sm text-red-800">
              <p className="font-semibold text-red-900">Carte bloquée</p>
              <p className="mt-1">
                {blockedForLoss
                  ? 'Perte ou vol déclaré. Tous les paiements sont suspendus. Commandez une nouvelle carte à tarif réduit.'
                  : 'Tous les paiements et recharges sont suspendus. Débloquez avec votre code PIN ou réinitialisez-le ci-dessous.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {blockedForLoss && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
          <div className="flex items-start gap-3">
            <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
            <div className="text-sm text-indigo-900">
              <p className="font-semibold">Commander une carte de remplacement</p>
              <p className="mt-1">
                Tarif : <strong>{formatCurrency(replacementPrice)}</strong> (50 % du prix initial).
                Votre solde est conservé.
              </p>
              <Link
                to="/commander-remplacement"
                className="mt-3 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Commander ma nouvelle carte
              </Link>
            </div>
          </div>
        </div>
      )}

      {message && (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2 text-slate-700">
          <ShieldCheck className="h-5 w-5 text-indigo-600" />
          <span className="font-medium">Code PIN carte</span>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          Votre PIN à 4 chiffres est demandé à chaque paiement et recharge pour protéger votre
          solde.
        </p>
        {currentUser.cardPin && (
          <p className="mt-2 text-xs text-slate-400">PIN configuré à l&apos;activation</p>
        )}
      </div>

      <ResetCardPinPanel />

      <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
        <div className="flex gap-2">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p>
            En cas de <strong>perte ou vol</strong>, bloquez immédiatement votre carte puis commandez
            une carte de remplacement à -50 %.
          </p>
        </div>
      </div>

      {isCardUsable(currentUser) && !isBlocked && (
        <button
          type="button"
          onClick={() => setShowBlockConfirm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-red-200 bg-red-50 py-3.5 font-semibold text-red-700 hover:bg-red-100"
        >
          <ShieldOff className="h-5 w-5" />
          Déclarer perte ou vol
        </button>
      )}

      {isBlocked && !blockedForLoss && (
        <button
          type="button"
          onClick={() => {
            setPinError('')
            setShowUnblockPin(true)
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 font-semibold text-white hover:bg-indigo-700"
        >
          <ShieldCheck className="h-5 w-5" />
          Débloquer ma carte
        </button>
      )}

      {showBlockConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Déclarer perte ou vol ?</h3>
            <p className="mt-2 text-sm text-slate-600">
              Votre carte sera immédiatement bloquée. Vous pourrez ensuite commander une nouvelle carte
              à <strong>{formatCurrency(replacementPrice)}</strong> (50 % du tarif initial).
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowBlockConfirm(false)}
                className="flex-1 rounded-xl border border-slate-200 py-3 font-medium text-slate-600"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleBlock}
                className="flex-1 rounded-xl bg-red-600 py-3 font-semibold text-white hover:bg-red-700"
              >
                Bloquer la carte
              </button>
            </div>
          </div>
        </div>
      )}

      <CardPinModal
        open={showUnblockPin}
        title="Débloquer la carte"
        description="Saisissez votre code PIN pour réactiver la carte."
        error={pinError}
        onClose={() => setShowUnblockPin(false)}
        onSubmit={handleUnblock}
      />
    </div>
  )
}
