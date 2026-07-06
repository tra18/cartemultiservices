import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Lock, ShieldCheck, ShieldOff } from 'lucide-react'
import { CardPinModal } from '../components/CardPinModal'
import { useAuth } from '../context/AuthContext'
import { maskCardNumber } from '../utils/card'
import { getEffectiveCardNumber, isCardUsable } from '../utils/cardStatus'

export function CardSecurity() {
  const { currentUser, blockCard, unblockCard } = useAuth()
  const [showUnblockPin, setShowUnblockPin] = useState(false)
  const [pinError, setPinError] = useState('')
  const [message, setMessage] = useState('')

  if (!currentUser) return null

  const isBlocked = currentUser.cardStatus === 'blocked'
  const canManageSecurity = isCardUsable(currentUser) || isBlocked

  const handleBlock = () => {
    setMessage('')
    const err = blockCard()
    if (err) {
      setMessage(err)
      return
    }
    setMessage('Carte bloquée. Aucun paiement ne pourra être effectué.')
  }

  const handleUnblock = (pin: string) => {
    setPinError('')
    const err = unblockCard(pin)
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
                Tous les paiements et recharges sont suspendus. Débloquez avec votre code PIN.
              </p>
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

      <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
        <div className="flex gap-2">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p>
            En cas de <strong>perte ou vol</strong>, bloquez immédiatement votre carte. Vous
            recevrez une confirmation par email.
          </p>
        </div>
      </div>

      {isCardUsable(currentUser) && !isBlocked && (
        <button
          type="button"
          onClick={handleBlock}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-red-200 bg-red-50 py-3.5 font-semibold text-red-700 hover:bg-red-100"
        >
          <ShieldOff className="h-5 w-5" />
          Bloquer ma carte (perte / vol)
        </button>
      )}

      {isBlocked && (
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
