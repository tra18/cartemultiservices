import { useState } from 'react'
import { CheckCircle2, Smartphone } from 'lucide-react'
import { useCardPinGate } from '../hooks/useCardPinGate'
import { detectWalletPlatform, formatWalletAddedDate, type MobileWalletKind } from '../utils/mobileWallet'
import { PLATFORM_NAME } from '../constants/brand'

interface WalletAddSectionProps {
  appleAddedAt?: string
  googleAddedAt?: string
  onAdd: (wallet: MobileWalletKind) => Promise<string | null>
  disabled?: boolean
  isDigital?: boolean
}

function AppleWalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  )
}

function GooglePayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 20" aria-hidden>
      <path fill="#5F6368" d="M22.1 9.8v3.5h-1.1V2.3h2.9c.7 0 1.3.2 1.8.7.5.5.7 1.1.7 1.8 0 .7-.2 1.3-.7 1.8-.5.5-1.1.7-1.8.7h-1.8zm0-3.9v2.8h1.8c.4 0 .7-.1 1-.4.3-.3.4-.6.4-1 0-.4-.1-.7-.4-1-.3-.3-.6-.4-1-.4h-1.8z" />
      <path fill="#5F6368" d="M28.5 5.6c.8 0 1.4.2 1.9.7.5.5.7 1.1.7 1.9v4.1h-1v-.9c-.5.7-1.2 1.1-2.1 1.1-.7 0-1.3-.2-1.8-.6-.5-.4-.7-.9-.7-1.5 0-.6.2-1.1.7-1.5.5-.4 1.1-.6 1.9-.6.7 0 1.2.1 1.6.4v-.3c0-.4-.2-.8-.5-1.1-.3-.3-.7-.5-1.2-.5-.7 0-1.2.3-1.6.8l-.9-.6c.6-.7 1.4-1 2.4-1zm-1.5 4.8c0 .3.1.5.4.7.2.2.5.3.8.3.4 0 .8-.2 1.2-.5.4-.3.6-.7.6-1.2 0-.6-.4-1-1.1-1.3-.4-.2-.8-.3-1.1-.3-.4 0-.8.1-1.1.4-.3.2-.5.5-.5.9z" />
      <path fill="#5F6368" d="M33.6 5.8l3.6 9.3h-1.2l-.9-2.3h-3.6l-.9 2.3h-1.2l3.6-9.3h1.6zm.3 1.4l-1.4 3.6h2.8l-1.4-3.6z" />
      <path fill="#4285F4" d="M8.6 10.1l3.2 2.5c-.6 1.5-2.1 2.6-3.9 2.6-2.3 0-4.2-1.9-4.2-4.2S5.6 6.8 7.9 6.8c1 0 1.9.4 2.6 1l-1.1 1.1c-.5-.5-1.1-.7-1.8-.7-1.5 0-2.7 1.2-2.7 2.7s1.2 2.7 2.7 2.7c1.2 0 2.2-.8 2.5-1.9H7.9V10.1h.7z" />
      <path fill="#EA4335" d="M15.8 8.5h-2.5v1.3h2.4c-.1.6-.3 1.1-.7 1.5-.5.5-1.1.7-1.8.7-1.5 0-2.7-1.2-2.7-2.7s1.2-2.7 2.7-2.7c.7 0 1.3.3 1.8.7l.9-.9c-.7-.7-1.7-1.1-2.7-1.1-2.3 0-4.2 1.9-4.2 4.2s1.9 4.2 4.2 4.2c1.2 0 2.3-.5 3.1-1.3.8-.8 1.2-2 1.2-3.3 0-.3 0-.6-.1-.9z" />
    </svg>
  )
}

export function WalletAddSection({
  appleAddedAt,
  googleAddedAt,
  onAdd,
  disabled = false,
  isDigital = false,
}: WalletAddSectionProps) {
  const platform = detectWalletPlatform()
  const { requestPin, PinModal } = useCardPinGate()
  const [pendingWallet, setPendingWallet] = useState<MobileWalletKind | null>(null)
  const [loadingWallet, setLoadingWallet] = useState<MobileWalletKind | null>(null)
  const [error, setError] = useState('')

  const startAdd = (wallet: MobileWalletKind) => {
    if (disabled || loadingWallet) return
    setError('')
    requestPin(async () => {
      setLoadingWallet(wallet)
      try {
        const err = await onAdd(wallet)
        if (err) setError(err)
      } finally {
        setLoadingWallet(null)
        setPendingWallet(null)
      }
    })
    setPendingWallet(wallet)
  }

  const appleAdded = Boolean(appleAddedAt)
  const googleAdded = Boolean(googleAddedAt)

  return (
    <section id="wallet" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {PinModal}

      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <Smartphone className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">Portefeuille numérique</h3>
          <p className="mt-0.5 text-sm text-slate-500">
            {isDigital
              ? 'Ajoutez votre carte numérique. Présentez le QR code au commerçant pour payer.'
              : 'Présentez le QR code de votre carte wallet au commerçant pour payer en magasin.'}
          </p>
        </div>
      </div>

      {!platform.isMobile && (
        <p className="mb-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Sur mobile, ouvrez votre profil depuis Safari (iPhone) ou Chrome (Android) pour un ajout
          optimal au portefeuille.
        </p>
      )}

      <div className="space-y-3">
        {appleAdded ? (
          <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-green-900">Carte dans Apple Wallet</p>
              <p className="text-xs text-green-700">Ajoutée le {formatWalletAddedDate(appleAddedAt!)}</p>
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={disabled || loadingWallet !== null}
            onClick={() => startAdd('apple')}
            className={`flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-3.5 text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 ${
              platform.preferredWallet === 'apple' ? 'ring-2 ring-indigo-300 ring-offset-2' : ''
            }`}
          >
            <AppleWalletIcon className="h-5 w-5" />
            <span className="font-medium">
              {loadingWallet === 'apple' ? 'Ajout en cours…' : 'Ajouter à Apple Wallet'}
            </span>
          </button>
        )}

        {googleAdded ? (
          <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-green-900">Carte dans Google Wallet</p>
              <p className="text-xs text-green-700">Ajoutée le {formatWalletAddedDate(googleAddedAt!)}</p>
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={disabled || loadingWallet !== null}
            onClick={() => startAdd('google')}
            className={`flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 ${
              platform.preferredWallet === 'google' ? 'ring-2 ring-indigo-300 ring-offset-2' : ''
            }`}
          >
            <GooglePayIcon className="h-5 w-14 shrink-0" />
            <span className="font-medium text-slate-800">
              {loadingWallet === 'google' ? 'Ajout en cours…' : 'Ajouter à Google Wallet'}
            </span>
          </button>
        )}
      </div>

      {pendingWallet && !loadingWallet && (
        <p className="mt-3 text-center text-xs text-slate-500">Confirmez avec votre code PIN carte</p>
      )}

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <p className="mt-4 text-xs leading-relaxed text-slate-400">
        Le QR code sur votre carte wallet permet au commerçant de vous identifier. Vous confirmez
        chaque paiement avec votre code PIN dans l&apos;application {PLATFORM_NAME}.
      </p>
    </section>
  )
}
