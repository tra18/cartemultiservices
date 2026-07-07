import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Bus,
  CheckCircle2,
  CreditCard,
  Fuel,
  Mail,
  QrCode,
  Shield,
  ShoppingCart,
  Smartphone,
  Store,
  UtensilsCrossed,
  Zap,
} from 'lucide-react'
import { PlatformLogo } from '../components/PlatformLogo'
import {
  CLIENT_DASHBOARD_PATH,
  PLATFORM_NAME,
  PLATFORM_TAGLINE,
  SUPPORT_EMAIL,
} from '../constants/brand'
import { useAuth } from '../context/AuthContext'
import { CARD_PRICE } from '../utils/pricing'
import { formatCurrency } from '../utils/currency'

const SERVICES = [
  {
    icon: Fuel,
    title: 'Stations-service',
    description: 'Payez votre carburant sans espèces, en quelques secondes.',
    color: 'from-amber-500 to-orange-600',
  },
  {
    icon: UtensilsCrossed,
    title: 'Restaurants',
    description: 'Réglez vos repas chez les partenaires du réseau.',
    color: 'from-rose-500 to-red-600',
  },
  {
    icon: Bus,
    title: 'Transport',
    description: 'Tickets et déplacements simplifiés au quotidien.',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    icon: ShoppingCart,
    title: 'Courses & shopping',
    description: 'Achats du quotidien avec un solde centralisé.',
    color: 'from-emerald-500 to-green-600',
  },
  {
    icon: QrCode,
    title: 'Paiement QR',
    description: 'Scannez, validez, c’est payé — rapide et sécurisé.',
    color: 'from-violet-500 to-purple-600',
  },
  {
    icon: Smartphone,
    title: 'Carte numérique',
    description: 'Utilisez votre carte en attendant la livraison physique.',
    color: 'from-cyan-500 to-teal-600',
  },
]

const STEPS = [
  {
    step: '01',
    title: 'Commandez votre carte',
    description: 'Créez votre compte en ligne et réglez les frais d’émission en toute sécurité.',
  },
  {
    step: '02',
    title: 'Recevez & activez',
    description: 'À réception, activez votre carte avec le code envoyé par email.',
  },
  {
    step: '03',
    title: 'Payez partout',
    description: 'Rechargez, scannez et payez chez tous les commerçants partenaires.',
  },
]

const TRUST_POINTS = [
  'Paiements sécurisés',
  'Réseau de commerçants en expansion',
  'Support client dédié',
  'Conçu pour la Guinée',
]

export function Home() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl safe-top">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <PlatformLogo size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white sm:text-base">{PLATFORM_NAME}</p>
              <p className="hidden text-xs text-slate-400 sm:block">{PLATFORM_TAGLINE}</p>
            </div>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/commercant/connexion"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white sm:inline-flex"
            >
              Commerçant
            </Link>
            <Link
              to="/connexion"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              Connexion
            </Link>
            <Link
              to={isAuthenticated ? CLIENT_DASHBOARD_PATH : '/commander-carte'}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 sm:px-4"
            >
              {isAuthenticated ? 'Mon espace' : 'Commander'}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-indigo-600/30 blur-3xl" />
          <div className="absolute -right-20 top-20 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-violet-600/20 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-300">
              <Zap className="h-4 w-4" />
              La carte multiservice de référence en Guinée
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Une carte.
              <span className="block bg-gradient-to-r from-emerald-300 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
                Tous vos services.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
              {PLATFORM_NAME} simplifie vos paiements au quotidien : carburant, restaurants,
              transport, courses et plus encore — avec une seule carte rechargeable.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/commander-carte"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:brightness-110"
              >
                <CreditCard className="h-5 w-5" />
                Commander ma carte — {formatCurrency(CARD_PRICE)}
              </Link>
              <Link
                to={isAuthenticated ? CLIENT_DASHBOARD_PATH : '/connexion'}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-4 text-base font-semibold text-white transition hover:bg-white/10"
              >
                {isAuthenticated ? 'Accéder à mon espace' : 'J’ai déjà un compte'}
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2">
              {TRUST_POINTS.map((point) => (
                <li key={point} className="flex items-center gap-2 text-sm text-slate-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {/* Carte visuelle */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-emerald-500/20 to-indigo-500/20 blur-2xl" />
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 via-indigo-950 to-emerald-950 p-6 shadow-2xl ring-1 ring-white/10 sm:p-8">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
              <div className="absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-emerald-400/10" />
              <div className="relative">
                <div className="mb-8 flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/80">
                      Multiservice
                    </p>
                    <p className="mt-2 text-2xl font-bold">{PLATFORM_NAME}</p>
                  </div>
                  <div className="rounded-xl bg-white/10 p-2 backdrop-blur">
                    <Shield className="h-6 w-6 text-emerald-300" />
                  </div>
                </div>
                <p className="mb-8 font-mono text-xl tracking-[0.25em] text-white/90 sm:text-2xl">
                  •••• •••• •••• 4829
                </p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-400">Titulaire</p>
                    <p className="font-medium text-white">Votre nom</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wider text-slate-400">Solde</p>
                    <p className="text-2xl font-bold text-emerald-300">250 000 GNF</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-4 rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3 shadow-xl backdrop-blur sm:-left-6">
              <p className="text-xs text-slate-400">Paiement validé</p>
              <p className="font-semibold text-emerald-400">+ Station Total — 85 000 GNF</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="border-t border-white/10 bg-slate-900/50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Tout ce dont vous avez besoin</h2>
            <p className="mt-4 text-lg text-slate-400">
              Une solution complète pour vos dépenses quotidiennes, sans multiplier les cartes ni
              les applications.
            </p>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map(({ icon: Icon, title, description, color }) => (
              <div
                key={title}
                className="group rounded-2xl border border-white/10 bg-slate-900/80 p-6 transition hover:border-white/20 hover:bg-slate-900"
              >
                <div
                  className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${color} p-3 shadow-lg`}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Comment ça marche ?</h2>
            <p className="mt-4 text-lg text-slate-400">
              Trois étapes simples pour rejoindre le réseau {PLATFORM_NAME}.
            </p>
          </div>
          <div className="mt-14 grid gap-8 lg:grid-cols-3">
            {STEPS.map(({ step, title, description }) => (
              <div key={step} className="relative rounded-2xl border border-white/10 bg-white/5 p-8">
                <span className="text-5xl font-black text-white/10">{step}</span>
                <h3 className="mt-4 text-xl font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Commander */}
      <section className="border-y border-white/10 bg-gradient-to-r from-indigo-950 via-slate-900 to-emerald-950 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold sm:text-4xl">Prêt à simplifier vos paiements ?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
            Rejoignez des milliers d’utilisateurs qui font confiance à {PLATFORM_NAME} pour leurs
            dépenses du quotidien en Guinée.
          </p>
          <Link
            to="/commander-carte"
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            Commander ma carte maintenant
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Commerçants */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900">
            <div className="grid lg:grid-cols-2">
              <div className="p-8 sm:p-12">
                <div className="inline-flex rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
                  <Store className="h-6 w-6" />
                </div>
                <h2 className="mt-6 text-3xl font-bold">Vous êtes commerçant ?</h2>
                <p className="mt-4 text-slate-400 leading-relaxed">
                  Acceptez les paiements {PLATFORM_NAME}, gérez vos encaissements et développez
                  votre activité au sein d’un réseau fiable et moderne.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    to="/commercant/inscription"
                    className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white transition hover:bg-emerald-400"
                  >
                    Devenir partenaire
                  </Link>
                  <Link
                    to="/commercant/connexion"
                    className="inline-flex items-center justify-center rounded-xl border border-white/15 px-6 py-3 font-semibold text-white transition hover:bg-white/5"
                  >
                    Espace commerçant
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center bg-gradient-to-br from-emerald-600/20 to-indigo-600/20 p-8 sm:p-12">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: 'QR', label: 'Paiement instantané' },
                    { value: '24/7', label: 'Suivi des ventes' },
                    { value: '100%', label: 'Sécurisé' },
                    { value: 'GNF', label: 'Monnaie locale' },
                  ].map(({ value, label }) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-white/10 bg-slate-950/50 p-5 text-center"
                    >
                      <p className="text-2xl font-bold text-emerald-300">{value}</p>
                      <p className="mt-1 text-xs text-slate-400">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="border-t border-white/10 bg-slate-900/80 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-slate-950 p-8 text-center sm:p-12">
            <div className="mx-auto inline-flex rounded-full bg-indigo-500/10 p-4 text-indigo-300">
              <Mail className="h-8 w-8" />
            </div>
            <h2 className="mt-6 text-2xl font-bold sm:text-3xl">Besoin d’aide ?</h2>
            <p className="mt-3 text-slate-400">
              Notre équipe support est à votre disposition pour toute question sur votre carte,
              votre compte ou votre commande.
            </p>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              <Mail className="h-5 w-5" />
              {SUPPORT_EMAIL}
            </a>
            <p className="mt-4 text-sm text-slate-500">
              Contact à joindre pour le support client et les demandes d’assistance.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6">
          <PlatformLogo size="sm" showName />
          <p className="text-center text-sm text-slate-500">
            © {new Date().getFullYear()} {PLATFORM_NAME}. {PLATFORM_TAGLINE}.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-400">
            <Link to="/connexion" className="hover:text-white">
              Connexion
            </Link>
            <Link to="/commander-carte" className="hover:text-white">
              Commander
            </Link>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-white">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
