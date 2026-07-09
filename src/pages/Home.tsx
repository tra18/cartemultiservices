import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
} from 'lucide-react'
import { PlatformLogo } from '../components/PlatformLogo'
import { LoginModal } from '../components/LoginModal'
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
  },
  {
    icon: UtensilsCrossed,
    title: 'Restaurants',
    description: 'Réglez vos repas chez les partenaires du réseau.',
  },
  {
    icon: Bus,
    title: 'Transport',
    description: 'Tickets et déplacements simplifiés au quotidien.',
  },
  {
    icon: ShoppingCart,
    title: 'Courses & shopping',
    description: 'Achats du quotidien avec un solde centralisé.',
  },
  {
    icon: QrCode,
    title: 'Paiement QR',
    description: 'Scannez, validez, c’est payé — rapide et sécurisé.',
  },
  {
    icon: Smartphone,
    title: 'Carte numérique',
    description: 'Utilisez votre carte en attendant la livraison physique.',
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
  const navigate = useNavigate()
  const [loginOpen, setLoginOpen] = useState(false)

  const openLogin = () => setLoginOpen(true)

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={() => navigate(CLIENT_DASHBOARD_PATH)}
      />
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm safe-top">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <PlatformLogo size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900 sm:text-base">{PLATFORM_NAME}</p>
              <p className="hidden text-xs text-slate-500 sm:block">{PLATFORM_TAGLINE}</p>
            </div>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/commercant/connexion"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:inline-flex"
            >
              Commerçant
            </Link>
            {!isAuthenticated && (
              <button
                type="button"
                onClick={openLogin}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Connexion
              </button>
            )}
            <Link
              to={isAuthenticated ? CLIENT_DASHBOARD_PATH : '/commander-carte'}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 sm:px-4"
            >
              {isAuthenticated ? 'Mon espace' : 'Commander'}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-slate-200">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <p className="mb-6 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-sm font-medium text-slate-600">
              La carte multiservice de référence en Guinée
            </p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Une carte.
              <span className="block text-slate-600">Tous vos services.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
              {PLATFORM_NAME} simplifie vos paiements au quotidien : carburant, restaurants,
              transport, courses et plus encore — avec une seule carte rechargeable.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/commander-carte"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-6 py-3.5 text-base font-semibold text-white transition hover:bg-slate-800"
              >
                <CreditCard className="h-5 w-5" />
                Commander ma carte — {formatCurrency(CARD_PRICE)}
              </Link>
              {isAuthenticated ? (
                <Link
                  to={CLIENT_DASHBOARD_PATH}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3.5 text-base font-semibold text-slate-900 transition hover:bg-slate-50"
                >
                  Accéder à mon espace
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={openLogin}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3.5 text-base font-semibold text-slate-900 transition hover:bg-slate-50"
                >
                  J’ai déjà un compte
                </button>
              )}
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2">
              {TRUST_POINTS.map((point) => (
                <li key={point} className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-slate-900" />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {/* Carte visuelle */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="overflow-hidden rounded-2xl bg-slate-900 p-6 shadow-xl sm:p-8">
              <div className="mb-8 flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Multiservice
                  </p>
                  <p className="mt-2 text-2xl font-bold text-white">{PLATFORM_NAME}</p>
                </div>
                <div className="rounded-lg bg-white/10 p-2">
                  <Shield className="h-6 w-6 text-white" />
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
                  <p className="text-2xl font-bold text-white">250 000 GNF</p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-4 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg sm:-left-6">
              <p className="text-xs text-slate-500">Paiement validé</p>
              <p className="font-semibold text-slate-900">Station Total — 85 000 GNF</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Tout ce dont vous avez besoin</h2>
            <p className="mt-4 text-lg text-slate-600">
              Une solution complète pour vos dépenses quotidiennes, sans multiplier les cartes ni
              les applications.
            </p>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-xl border border-slate-200 bg-white p-6 transition hover:border-slate-300 hover:shadow-sm"
              >
                <div className="mb-4 inline-flex rounded-lg bg-slate-100 p-3">
                  <Icon className="h-6 w-6 text-slate-900" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Comment ça marche ?</h2>
            <p className="mt-4 text-lg text-slate-600">
              Trois étapes simples pour rejoindre le réseau {PLATFORM_NAME}.
            </p>
          </div>
          <div className="mt-14 grid gap-8 lg:grid-cols-3">
            {STEPS.map(({ step, title, description }) => (
              <div key={step} className="rounded-xl border border-slate-200 bg-white p-8">
                <span className="text-4xl font-bold text-slate-200">{step}</span>
                <h3 className="mt-4 text-xl font-semibold text-slate-900">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Commander */}
      <section className="bg-slate-900 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Prêt à simplifier vos paiements ?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
            Rejoignez des milliers d’utilisateurs qui font confiance à {PLATFORM_NAME} pour leurs
            dépenses du quotidien en Guinée.
          </p>
          <Link
            to="/commander-carte"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-8 py-3.5 text-base font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            Commander ma carte maintenant
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Commerçants */}
      <section className="border-b border-slate-200 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="grid lg:grid-cols-2">
              <div className="p-8 sm:p-12">
                <div className="inline-flex rounded-lg bg-slate-100 p-3 text-slate-900">
                  <Store className="h-6 w-6" />
                </div>
                <h2 className="mt-6 text-3xl font-bold text-slate-900">Vous êtes commerçant ?</h2>
                <p className="mt-4 leading-relaxed text-slate-600">
                  Acceptez les paiements {PLATFORM_NAME}, gérez vos encaissements et développez
                  votre activité au sein d’un réseau fiable et moderne.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    to="/commercant/inscription"
                    className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-800"
                  >
                    Devenir partenaire
                  </Link>
                  <Link
                    to="/commercant/connexion"
                    className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-900 transition hover:bg-slate-50"
                  >
                    Espace commerçant
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center border-t border-slate-200 bg-slate-50 p-8 sm:p-12 lg:border-l lg:border-t-0">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: 'QR', label: 'Paiement instantané' },
                    { value: '24/7', label: 'Suivi des ventes' },
                    { value: '100%', label: 'Sécurisé' },
                    { value: 'GNF', label: 'Monnaie locale' },
                  ].map(({ value, label }) => (
                    <div
                      key={label}
                      className="rounded-xl border border-slate-200 bg-white p-5 text-center"
                    >
                      <p className="text-2xl font-bold text-slate-900">{value}</p>
                      <p className="mt-1 text-xs text-slate-500">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center sm:p-12">
            <div className="mx-auto inline-flex rounded-full bg-slate-100 p-4 text-slate-900">
              <Mail className="h-8 w-8" />
            </div>
            <h2 className="mt-6 text-2xl font-bold text-slate-900 sm:text-3xl">Besoin d’aide ?</h2>
            <p className="mt-3 text-slate-600">
              Notre équipe support est à votre disposition pour toute question sur votre carte,
              votre compte ou votre commande.
            </p>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-6 py-3 text-base font-semibold text-white transition hover:bg-slate-800"
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
      <footer className="border-t border-slate-200 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6">
          <PlatformLogo size="sm" showName />
          <p className="text-center text-sm text-slate-500">
            © {new Date().getFullYear()} {PLATFORM_NAME}. {PLATFORM_TAGLINE}.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-600">
            {!isAuthenticated && (
              <button
                type="button"
                onClick={openLogin}
                className="hover:text-slate-900"
              >
                Connexion
              </button>
            )}
            <Link to="/commander-carte" className="hover:text-slate-900">
              Commander
            </Link>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-slate-900">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
