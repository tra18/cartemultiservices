import { useState } from 'react'
import { KeyRound, Mail } from 'lucide-react'
import { BackToHomeLink } from './BackToHomeLink'
import { useAuth } from '../context/AuthContext'
import { pinsMatch } from '../utils/cardPin'

type Step = 'idle' | 'code_sent' | 'done'

export function ResetCardPinPanel() {
  const { currentUser, requestCardPinReset, resetCardPin } = useAuth()
  const [step, setStep] = useState<Step>('idle')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')

  if (!currentUser) return null

  const canReset =
    Boolean(currentUser.digitalCardEnabledAt) ||
    Boolean(currentUser.cardNumber) ||
    currentUser.cardStatus === 'active' ||
    currentUser.cardStatus === 'blocked'

  if (!canReset) return null

  const handleRequest = async () => {
    setError('')
    setLoading(true)
    const result = await requestCardPinReset()
    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setMaskedEmail(result.maskedEmail ?? currentUser.email)
    setStep('code_sent')
    setOpen(true)
  }

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const pinErr = pinsMatch(newPin, confirmPin)
    if (pinErr) {
      setError(pinErr)
      return
    }

    setLoading(true)
    const err = await resetCardPin(code, newPin)
    setLoading(false)
    if (err) {
      setError(err)
      return
    }

    setCode('')
    setNewPin('')
    setConfirmPin('')
    setStep('done')
  }

  const handleClose = () => {
    setOpen(false)
    if (step === 'done') {
      setStep('idle')
    }
  }

  if (step === 'done') {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        <p className="font-semibold text-emerald-900">Code PIN réinitialisé</p>
        <p className="mt-1">
          Votre nouveau PIN est actif. Utilisez-le pour vos paiements et recharges.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-slate-700">
        <KeyRound className="h-5 w-5 text-indigo-600" />
        <span className="font-medium">PIN oublié ?</span>
      </div>
      <p className="mt-2 text-sm text-slate-500">
        Recevez un code de vérification par email pour définir un nouveau PIN à 4 chiffres.
      </p>

      {!open && (
        <button
          type="button"
          onClick={handleRequest}
          disabled={loading}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
        >
          <Mail className="h-4 w-4" />
          {loading ? 'Envoi…' : 'Recevoir un code par email'}
        </button>
      )}

      {open && step === 'code_sent' && (
        <form onSubmit={handleConfirm} className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          <p className="text-sm text-slate-600">
            Code envoyé à <span className="font-medium">{maskedEmail}</span> (valable 15 min).
          </p>

          <div>
            <label htmlFor="reset-code" className="mb-1 block text-xs font-medium text-slate-600">
              Code de vérification (6 chiffres)
            </label>
            <input
              id="reset-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center font-mono text-lg tracking-widest outline-none focus:border-indigo-500"
              placeholder="000000"
            />
          </div>

          <div>
            <label htmlFor="new-pin" className="mb-1 block text-xs font-medium text-slate-600">
              Nouveau PIN (4 chiffres)
            </label>
            <input
              id="new-pin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center font-mono text-lg tracking-widest outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="confirm-new-pin" className="mb-1 block text-xs font-medium text-slate-600">
              Confirmer le nouveau PIN
            </label>
            <input
              id="confirm-new-pin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center font-mono text-lg tracking-widest outline-none focus:border-indigo-500"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 6 || newPin.length !== 4 || confirmPin.length !== 4}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? 'Validation…' : 'Réinitialiser mon PIN'}
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="w-full py-2 text-sm text-slate-500 hover:text-slate-700"
          >
            Annuler
          </button>

          <BackToHomeLink className="mt-2" />
        </form>
      )}

      {error && !open && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
