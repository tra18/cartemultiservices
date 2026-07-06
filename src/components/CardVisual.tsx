import { useCard } from '../context/CardContext'
import { PLATFORM_NAME, PLATFORM_TAGLINE, PLATFORM_LOGO } from '../constants/brand'

export function CardVisual() {
  const { cardNumber, holderName, balance, formatCurrency, isDigital } = useCard()

  if (isDigital) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-800 via-green-800 to-emerald-900 p-4 text-white shadow-xl shadow-emerald-200 sm:p-6">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-white/5" />

        <div className="relative">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <span className="inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                Carte numérique
              </span>
              <p className="mt-2 text-xs font-medium uppercase tracking-wider text-emerald-100">
                {PLATFORM_NAME}
              </p>
              <p className="mt-1 text-sm text-cyan-50">Utilisable en attendant la carte physique</p>
            </div>
            <SmartphoneBadge />
          </div>

          <p className="mb-4 font-mono text-base tracking-widest sm:mb-6 sm:text-lg">{cardNumber}</p>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-emerald-100">Titulaire</p>
              <p className="font-medium">{holderName}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-emerald-100">Solde disponible (GNF)</p>
              <p className="text-xl font-bold sm:text-2xl">{formatCurrency(balance)}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-800 via-green-800 to-emerald-900 p-4 text-white shadow-xl shadow-emerald-200 sm:p-6">
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
      <div className="absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-white/5" />

      <div className="relative">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-emerald-200">
              {PLATFORM_NAME}
            </p>
            <p className="mt-1 text-sm text-emerald-100">{PLATFORM_TAGLINE}</p>
          </div>
          <img src={PLATFORM_LOGO} alt="" className="h-10 w-10 rounded-lg object-contain" />
        </div>

        <p className="mb-4 font-mono text-base tracking-widest sm:mb-6 sm:text-lg">{cardNumber}</p>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs text-emerald-200">Titulaire</p>
            <p className="truncate font-medium">{holderName}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs text-emerald-200">Solde disponible (GNF)</p>
            <p className="text-xl font-bold sm:text-2xl">{formatCurrency(balance)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function SmartphoneBadge() {
  return (
    <svg className="h-8 w-8 text-cyan-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <line x1="12" y1="18" x2="12" y2="18.01" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
