import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, LogIn, Store } from 'lucide-react'
import { BackToHomeLink } from '../../components/BackToHomeLink'
import { useMerchantAuth } from '../../context/MerchantAuthContext'

export function MerchantLogin() {
  const { login } = useMerchantAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/commercant'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const tryLogin = (loginEmail: string, loginPassword: string) => {
    setError('')
    const err = login(loginEmail, loginPassword)
    if (err) {
      setError(err)
      return false
    }
    navigate(redirectTo, { replace: true })
    return true
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    tryLogin(email, password)
  }

  return (
    <div className="page-container-narrow flex flex-col">
      <div className="flex flex-1 flex-col justify-center px-6 py-12">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-200">
            <Store className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Espace Commerçant</h1>
          <p className="mt-2 text-sm text-slate-500">
            Encaissez les paiements et gérez vos retraits
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
              Email professionnel
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="commerce@exemple.gn"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 font-semibold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700"
          >
            <LogIn className="h-5 w-5" />
            Se connecter
          </button>

          <BackToHomeLink className="mt-2" />
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Nouveau commerçant ?{' '}
          <Link to="/commercant/inscription" className="font-medium text-emerald-600">
            S&apos;inscrire
          </Link>
        </p>

        <p className="mt-4 text-center text-sm text-slate-500">
          <Link to="/connexion" className="text-indigo-600 hover:text-indigo-700">
            ← Retour espace client
          </Link>
        </p>
      </div>
    </div>
  )
}
