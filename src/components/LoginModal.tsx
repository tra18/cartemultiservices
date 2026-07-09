import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, LogIn, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { PLATFORM_HERO_IMAGE, PLATFORM_TAGLINE } from '../constants/brand'

interface LoginModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function LoginModal({ open, onClose, onSuccess }: LoginModalProps) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) {
      setEmail('')
      setPassword('')
      setError('')
      setShowPassword(false)
      setLoading(false)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const err = await login(email, password)
    if (err) {
      setError(err)
      setLoading(false)
      return
    }

    onSuccess?.()
    onClose()
  }

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#004431] focus:ring-2 focus:ring-[#004431]/15'

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#001a14]/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[96dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[92dvh] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-b from-[#f4faf7] to-white px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#E51D2E] via-[#FDB913] to-[#009640]" />

          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 text-slate-500 shadow-sm ring-1 ring-slate-200/80 transition hover:bg-white hover:text-slate-800"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="mx-auto max-w-[320px]">
            <img
              src={PLATFORM_HERO_IMAGE}
              alt="Guinée Multiservices — une seule carte, tous vos services"
              className="mx-auto h-auto w-full object-contain drop-shadow-md"
            />
          </div>

          <div className="mt-3 text-center">
            <h2 id="login-modal-title" className="text-lg font-bold tracking-tight text-[#004431] sm:text-xl">
              Connexion à votre espace
            </h2>
            <p className="mt-1 text-sm text-slate-600">{PLATFORM_TAGLINE}</p>
          </div>
        </div>

        <div className="overflow-y-auto px-5 pb-6 pt-2 sm:px-8 sm:pb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-modal-email" className="mb-1.5 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="login-modal-email"
                type="email"
                required
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.gn"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="login-modal-password" className="mb-1.5 block text-sm font-medium text-slate-700">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="login-modal-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:text-[#004431]"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <Link
                to="/mot-de-passe-oublie"
                onClick={onClose}
                className="text-sm font-medium text-[#004431] underline-offset-2 hover:underline"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#004431] py-3.5 font-semibold text-white shadow-lg shadow-[#004431]/20 transition hover:bg-[#003528] disabled:opacity-60"
            >
              <LogIn className="h-5 w-5" />
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-center text-sm text-slate-600">
            Pas encore de compte ?{' '}
            <Link
              to="/commander-carte"
              onClick={onClose}
              className="font-semibold text-[#004431] underline-offset-2 hover:underline"
            >
              Commander une carte
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
