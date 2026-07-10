import { useState } from 'react'
import { Smartphone, Sparkles } from 'lucide-react'
import { BackToHomeLink } from './BackToHomeLink'
import { validateCardPin } from '../utils/cardPin'

interface EnableDigitalCardProps {
  onEnable: (pin: string) => Promise<string | null>
}

export function EnableDigitalCard({ onEnable }: EnableDigitalCardProps) {
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const pinErr = validateCardPin(pin)
    if (pinErr) {
      setError(pinErr)
      return
    }
    if (pin !== confirmPin) {
      setError('Les codes PIN ne correspondent pas')
      return
    }

    setLoading(true)
    const err = await onEnable(pin)
    setLoading(false)
    if (err) setError(err)
  }

  return (
    <section className="rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-sky-50 p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">Carte numérique immédiate</h3>
          <p className="mt-0.5 text-sm text-slate-600">
            En attendant votre carte physique, activez la version numérique pour recharger, payer et
            l&apos;ajouter à Apple Pay ou Google Pay.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Créez un code PIN (4 chiffres)
          </label>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="••••"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center font-mono text-lg tracking-[0.4em] outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Confirmez le PIN</label>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="••••"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center font-mono text-lg tracking-[0.4em] outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || pin.length !== 4 || confirmPin.length !== 4}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 py-3.5 font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-50"
        >
          <Smartphone className="h-5 w-5" />
          {loading ? 'Activation…' : 'Activer ma carte numérique'}
        </button>

        <BackToHomeLink className="mt-2" />
      </form>

      <p className="mt-3 text-xs text-slate-500">
        Vous conserverez ce PIN pour votre carte physique à réception. Le même solde s&apos;applique
        aux deux versions.
      </p>
    </section>
  )
}
