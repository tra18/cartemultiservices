import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { AuthLayout } from '../components/AuthLayout'
import { BackToHomeLink } from '../components/BackToHomeLink'
import { useAuth } from '../context/AuthContext'
import { CLIENT_DASHBOARD_PATH } from '../constants/brand'

function getSafeRedirectPath(path: string | undefined): string {
  if (!path || !path.startsWith('/') || path.startsWith('//')) {
    return CLIENT_DASHBOARD_PATH
  }
  return path
}

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = getSafeRedirectPath((location.state as { from?: string } | null)?.from)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const err = login(email, password)
    if (err) {
      setError(err)
      setLoading(false)
      return
    }
    navigate(from, { replace: true })
  }

  return (
    <AuthLayout
      title="Connexion"
      subtitle="Connectez-vous ou commandez votre carte physique"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.gn"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
            Mot de passe
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="text-right">
          <Link
            to="/mot-de-passe-oublie"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-60"
        >
          <LogIn className="h-5 w-5" />
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>

      <div className="mt-6 space-y-4 text-center text-sm">
        <a
          href="/commander-carte"
          className="block w-full rounded-xl border-2 border-indigo-200 bg-indigo-50 py-3 text-center font-semibold text-indigo-700 transition hover:bg-indigo-100"
        >
          Commander ma carte — 100 000 GNF
        </a>

        <a
          href="/commercant/connexion"
          className="block w-full rounded-xl border-2 border-emerald-200 bg-emerald-50 py-3 text-center font-semibold text-emerald-700 transition hover:bg-emerald-100"
        >
          Ouvrir le portail commerçant
        </a>

        <p className="text-slate-600">
          Pas encore de compte ?{' '}
          <Link to="/inscription" className="font-medium text-indigo-600 hover:text-indigo-700">
            Créer un compte
          </Link>
        </p>

        <BackToHomeLink />
      </div>
    </AuthLayout>
  )
}
