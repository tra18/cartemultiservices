import { useState } from 'react'
import { BackToHomeLink } from './BackToHomeLink'
import { Lock, X } from 'lucide-react'

interface CardPinModalProps {
  open: boolean
  title?: string
  description?: string
  error?: string
  onClose: () => void
  onSubmit: (pin: string) => void
}

export function CardPinModal({
  open,
  title = 'Code PIN carte',
  description = 'Saisissez votre code PIN à 4 chiffres pour confirmer.',
  error,
  onClose,
  onSubmit,
}: CardPinModalProps) {
  const [pin, setPin] = useState('')

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pin.length !== 4) return
    onSubmit(pin)
    setPin('')
  }

  const handleClose = () => {
    setPin('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500">{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            autoComplete="off"
            autoFocus
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            className="w-full rounded-xl border border-slate-200 px-4 py-4 text-center font-mono text-2xl tracking-[0.5em] outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />

          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={pin.length !== 4}
            className="mt-4 w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            Confirmer
          </button>

          <div className="mt-3 flex justify-center">
            <BackToHomeLink variant="link" />
          </div>
        </form>
      </div>
    </div>
  )
}
