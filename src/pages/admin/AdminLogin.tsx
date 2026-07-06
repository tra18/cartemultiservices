import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings, Shield } from 'lucide-react'
import { ADMIN_DEMO_CREDENTIALS, useAdminAuth } from '../../context/AdminAuthContext'

export function AdminLogin() {
  const { login } = useAdminAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const err = login(email, password)
    if (err) {
      setError(err)
      return
    }
    navigate('/admin')
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center bg-slate-50 px-6 py-12">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-white">
          <Settings className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Portail administration</h1>
        <p className="mt-2 text-sm text-slate-500">Commandes, production et impression des cartes</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          required
          type="email"
          placeholder="Email administrateur"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
        />
        <input
          required
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
        />

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3.5 font-semibold text-white hover:bg-violet-700"
        >
          <Shield className="h-5 w-5" />
          Connexion admin
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-400">
        Démo : {ADMIN_DEMO_CREDENTIALS.email} / {ADMIN_DEMO_CREDENTIALS.password}
      </p>
    </div>
  )
}
