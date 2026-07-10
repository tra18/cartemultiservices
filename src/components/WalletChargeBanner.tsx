import { useEffect, useState } from 'react'
import { CreditCard, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCardPinGate } from '../hooks/useCardPinGate'
import {
  cancelWalletChargeOnServer,
  fetchPendingWalletCharge,
  type WalletCharge,
} from '../services/walletCharge'
import { CATEGORY_LABELS } from '../types'
import { formatCurrency } from '../utils/currency'

export function WalletChargeBanner() {
  const { currentUser, confirmWalletCharge, refreshCurrentUser } = useAuth()
  const { requestPin, PinModal } = useCardPinGate()
  const [charge, setCharge] = useState<WalletCharge | null>(null)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (!currentUser) return

    let active = true

    const poll = async () => {
      const pending = await fetchPendingWalletCharge()
      if (active) setCharge(pending)
    }

    poll()
    const interval = setInterval(poll, 3000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [currentUser?.id])

  if (!charge) return null

  const handleConfirm = () => {
    setError('')
    requestPin(async (pin) => {
      setConfirming(true)
      try {
        const result = await confirmWalletCharge(charge.id, pin)
        if (!result.success) {
          setError(result.error ?? 'Paiement échoué')
          return
        }
        setCharge(null)
        await refreshCurrentUser()
      } finally {
        setConfirming(false)
      }
    })
  }

  const handleDecline = async () => {
    setError('')
    const result = await cancelWalletChargeOnServer(charge.id)
    if (!result.ok) {
      setError(result.error ?? 'Annulation échouée')
      return
    }
    setCharge(null)
  }

  const expiresAt = new Date(charge.expiresAt)

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 shadow-sm">
      {PinModal}
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
          <CreditCard className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-indigo-900">Paiement demandé</p>
          <p className="mt-1 text-sm text-indigo-800">
            <span className="font-medium">{charge.merchantName}</span> demande{' '}
            <span className="font-bold">{formatCurrency(charge.amount)}</span>
            {charge.category ? ` · ${CATEGORY_LABELS[charge.category]}` : ''}
          </p>
          <p className="mt-1 text-xs text-indigo-600">
            Expire à {expiresAt.toLocaleTimeString('fr-GN', { hour: '2-digit', minute: '2-digit' })}
          </p>

          {error && (
            <p className="mt-2 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={confirming}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {confirming ? 'Confirmation…' : 'Confirmer avec PIN'}
            </button>
            <button
              type="button"
              onClick={handleDecline}
              disabled={confirming}
              className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-white px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
            >
              <X className="h-4 w-4" />
              Refuser
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
