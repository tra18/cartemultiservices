import { Link } from 'react-router-dom'
import { CreditCard } from 'lucide-react'
import { AuthLayout } from '../components/AuthLayout'
import { formatCurrency } from '../utils/currency'
import { CARD_PRICE } from '../utils/pricing'

export function Register() {
  return (
    <AuthLayout
      title="Obtenir une carte"
      subtitle="La carte physique est obligatoire pour utiliser le service"
    >
      <div className="space-y-4 text-center">
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6">
          <CreditCard className="mx-auto h-12 w-12 text-indigo-600" />
          <p className="mt-4 text-2xl font-bold text-slate-900">{formatCurrency(CARD_PRICE)}</p>
          <p className="mt-2 text-sm text-slate-600">
            Carte multiservice physique · Livraison ou retrait en agence
          </p>
        </div>

        <a
          href="/commander-carte"
          className="block w-full rounded-xl bg-indigo-600 py-3.5 font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700"
        >
          Commander ma carte en ligne
        </a>

        <p className="text-sm text-slate-600">
          Déjà un compte ?{' '}
          <Link to="/connexion" className="font-medium text-indigo-600">
            Se connecter
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
