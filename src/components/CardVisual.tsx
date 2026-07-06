import { CreditCard } from 'lucide-react'
import { useCard } from '../context/CardContext'

export function CardVisual() {
  const { cardNumber, holderName, balance, formatCurrency } = useCard()

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-6 text-white shadow-xl shadow-indigo-200">
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
      <div className="absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-white/5" />

      <div className="relative">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-indigo-200">
              Carte Multiservice
            </p>
            <p className="mt-1 text-sm text-indigo-100">Tous vos achats du quotidien</p>
          </div>
          <CreditCard className="h-8 w-8 text-indigo-200" />
        </div>

        <p className="mb-6 font-mono text-lg tracking-widest">{cardNumber}</p>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-indigo-200">Titulaire</p>
            <p className="font-medium">{holderName}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-indigo-200">Solde disponible (GNF)</p>
            <p className="text-2xl font-bold">{formatCurrency(balance)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
