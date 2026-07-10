import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Clock,
  CreditCard,
  Globe,
  Heart,
  MapPin,
  Shield,
  Sparkles,
} from 'lucide-react'

const DIASPORA_COUNTRIES_PREVIEW = ['France', 'États-Unis', 'Canada', 'Belgique', 'Sénégal']

const FEATURES = [
  { icon: Clock, label: 'Crédit instantané', detail: 'Solde mis à jour en quelques secondes' },
  { icon: Shield, label: 'Paiement sécurisé', detail: 'Visa, Mastercard et virement international' },
  { icon: Heart, label: 'Sans compte requis', detail: 'L’expéditeur n’a pas besoin de s’inscrire' },
]

interface DiasporaPromoSectionProps {
  variant?: 'home' | 'page'
}

export function DiasporaPromoSection({ variant = 'home' }: DiasporaPromoSectionProps) {
  const isHome = variant === 'home'

  return (
    <section
      id={isHome ? 'diaspora' : undefined}
      className={isHome ? 'py-20 lg:py-28' : undefined}
    >
      <div className={isHome ? 'mx-auto max-w-7xl px-5 lg:px-10' : undefined}>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-950 text-white shadow-2xl shadow-indigo-950/30">
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-sky-400/10 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '28px 28px',
            }}
            aria-hidden
          />

          <div className="relative grid lg:grid-cols-12 lg:items-center">
            <div className="p-8 sm:p-12 lg:col-span-7 lg:p-14 xl:p-16">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-100 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Recharge diaspora
              </div>

              <h2
                className={`mt-6 font-[family-name:var(--font-display)] font-semibold leading-[1.08] tracking-tight ${
                  isHome ? 'text-4xl sm:text-5xl lg:text-[3.25rem]' : 'text-3xl sm:text-4xl'
                }`}
              >
                Soutenez vos proches en Guinée, où que vous soyez.
              </h2>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-indigo-100/90 sm:text-lg">
                Créditez une carte multiservice depuis l&apos;étranger par carte bancaire
                internationale. Simple, rapide et traçable — idéal pour la famille, les études ou
                les dépenses du quotidien.
              </p>

              <ul className="mt-8 space-y-4">
                {FEATURES.map(({ icon: Icon, label, detail }) => (
                  <li key={label} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                      <Icon className="h-4 w-4 text-indigo-200" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-white">{label}</span>
                      <span className="mt-0.5 block text-sm text-indigo-200/80">{detail}</span>
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  to="/recharger-diaspora"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-indigo-950 transition hover:bg-indigo-50"
                >
                  <Globe className="h-4 w-4" />
                  Recharger maintenant
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <p className="text-sm text-indigo-200/70">
                  Dès <strong className="text-white">10 000 GNF</strong> · confirmation par email
                </p>
              </div>
            </div>

            <div className="border-t border-white/10 p-8 sm:p-10 lg:col-span-5 lg:border-l lg:border-t-0 lg:p-12">
              <div className="relative mx-auto max-w-sm">
                <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-sky-400/20 to-violet-500/20 blur-2xl" />

                <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md sm:p-7">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm text-indigo-100">
                      <MapPin className="h-4 w-4" />
                      Paris
                    </div>
                    <ArrowRight className="h-4 w-4 text-indigo-300" />
                    <div className="flex items-center gap-2 text-sm font-medium text-white">
                      <span className="text-lg" aria-hidden>
                        🇬🇳
                      </span>
                      Conakry
                    </div>
                  </div>

                  <div className="mt-6 rounded-xl border border-white/15 bg-stone-950/40 p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-indigo-300">
                      Carte bénéficiaire
                    </p>
                    <p className="mt-2 font-mono text-lg tracking-widest text-white">
                      2121 •••• •••• 4829
                    </p>
                    <div className="mt-5 flex items-end justify-between border-t border-white/10 pt-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-indigo-300">
                          Recharge envoyée
                        </p>
                        <p className="mt-1 text-2xl font-semibold text-white">500 000 GNF</p>
                      </div>
                      <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                        Crédité
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
                      <CreditCard className="h-3.5 w-3.5" />
                      Visa
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
                      <CreditCard className="h-3.5 w-3.5" />
                      Mastercard
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-indigo-100">
                      Virement SEPA
                    </span>
                  </div>
                </div>

                <p className="mt-5 text-center text-xs text-indigo-200/70">
                  Depuis{' '}
                  {DIASPORA_COUNTRIES_PREVIEW.slice(0, 3).join(', ')}
                  {' '}et plus encore
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
