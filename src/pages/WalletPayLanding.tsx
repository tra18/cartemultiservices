import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Store, User } from 'lucide-react'
import { useMerchantAuth } from '../context/MerchantAuthContext'
import { lookupWalletPayToken, type WalletPayClient } from '../services/walletCharge'

export function WalletPayLanding() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { currentMerchant, isLoading } = useMerchantAuth()
  const [client, setClient] = useState<WalletPayClient | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    lookupWalletPayToken(token).then((result) => {
      if (!result.ok || !result.client) {
        setError(result.error ?? 'Carte wallet introuvable')
        return
      }
      setClient(result.client)
    })
  }, [token])

  useEffect(() => {
    if (!isLoading && currentMerchant && token) {
      navigate(`/commercant/encaisser-carte?token=${encodeURIComponent(token)}`, { replace: true })
    }
  }, [isLoading, currentMerchant, token, navigate])

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        <Link to="/" className="mt-6 inline-block text-sm font-medium text-indigo-600">
          Retour à l&apos;accueil
        </Link>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-slate-500">
        Identification de la carte…
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-12">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
          <User className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-slate-900">Carte wallet client</h1>
        <p className="mt-2 text-slate-600">{client.fullName}</p>
        <p className="text-sm text-slate-500">{client.maskedCard}</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <Store className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div className="text-sm text-slate-600">
            <p className="font-medium text-slate-900">Espace commerçant requis</p>
            <p className="mt-1">
              Connectez-vous à votre compte commerçant pour saisir le montant et encaisser ce
              paiement.
            </p>
          </div>
        </div>

        <Link
          to={`/commercant/connexion?redirect=${encodeURIComponent(`/commercant/encaisser-carte?token=${token}`)}`}
          className="mt-4 flex w-full items-center justify-center rounded-xl bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700"
        >
          Connexion commerçant
        </Link>
      </div>

      <p className="text-center text-xs text-slate-400">
        Le client confirmera le paiement avec son code PIN dans l&apos;application MSCARTE.
      </p>
    </div>
  )
}
