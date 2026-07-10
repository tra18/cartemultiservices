import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail } from 'lucide-react'
import { AuthLayout } from '../components/AuthLayout'
import { BackToHomeLink } from '../components/BackToHomeLink'
import { sendPasswordReminderEmail } from '../services/emailService'
import { normalizeEmail } from '../utils/validation'

const USERS_KEY = 'carte-multiservice-users'

function findUserByEmail(email: string) {
  try {
    const stored = localStorage.getItem(USERS_KEY)
    if (!stored) return undefined
    const users = JSON.parse(stored) as { email: string; fullName: string }[]
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase())
  } catch {
    return undefined
  }
}

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const cleanEmail = normalizeEmail(email)
    if (!cleanEmail) {
      setError('Email invalide')
      return
    }

    const user = findUserByEmail(cleanEmail)
    if (user) {
      sendPasswordReminderEmail(cleanEmail, user.fullName)
    }
    setSent(true)
  }

  if (sent) {
    return (
      <AuthLayout
        title="Email envoyé"
        subtitle="Consultez votre boîte de réception"
      >
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <p>
            Un rappel de connexion a été envoyé à{' '}
            <span className="font-semibold">{normalizeEmail(email)}</span>.
          </p>
          <p className="mt-2">
            Votre mot de passe est celui choisi lors de la commande de carte. Il n&apos;est jamais
            envoyé par email pour votre sécurité.
          </p>
        </div>
        <Link
          to="/connexion"
          className="mt-6 block w-full rounded-xl bg-indigo-600 py-3.5 text-center font-semibold text-white hover:bg-indigo-700"
        >
          Retour à la connexion
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Mot de passe oublié"
      subtitle="Rappel de votre identifiant de connexion"
      showHomeButton={false}
    >
      <p className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-800">
        Si vous avez commandé une carte, votre compte a été créé à ce moment-là. Votre mot de passe
        est celui que vous avez défini sur le formulaire de commande.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
            Email du compte
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.gn"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 font-semibold text-white hover:bg-indigo-700"
        >
          <Mail className="h-5 w-5" />
          Recevoir un rappel par email
        </button>

        <BackToHomeLink className="mt-2" />
      </form>

      <div className="mt-6 space-y-3 text-center text-sm">
        <Link
          to="/connexion"
          className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la connexion
        </Link>
        <p className="text-slate-600">
          Pas encore de compte ?{' '}
          <Link to="/commander-carte" className="font-medium text-indigo-600">
            Commander ma carte
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
