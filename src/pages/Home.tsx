import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Bus,
  ChevronRight,
  CreditCard,
  Fuel,
  Globe,
  Hospital,
  Lock,
  Mail,
  Menu,
  Pill,
  QrCode,
  Shield,
  ShoppingCart,
  Smartphone,
  Stethoscope,
  Store,
  UtensilsCrossed,
  X,
} from 'lucide-react'
import { HomeNavMenu } from '../components/HomeNavMenu'
import { PlatformLogo } from '../components/PlatformLogo'
import { LoginModal } from '../components/LoginModal'
import {
  CLIENT_DASHBOARD_PATH,
  PLATFORM_HERO_IMAGE,
  PLATFORM_NAME,
  PLATFORM_TAGLINE,
  SUPPORT_EMAIL,
} from '../constants/brand'
import { useAuth } from '../context/AuthContext'
import { CARD_PRICE } from '../utils/pricing'
import { formatCurrency } from '../utils/currency'

import { HOME_NAV_GROUPS } from '../navigation/homeNav'

interface ServiceItem {
  icon: typeof Fuel
  title: string
  description: string
  href?: string
  cta?: string
}

const SERVICES: ServiceItem[] = [
  {
    icon: Fuel,
    title: 'Carburant',
    description: 'Réglez à la station en quelques secondes, sans espèces ni attente.',
  },
  {
    icon: UtensilsCrossed,
    title: 'Restaurants',
    description: 'Payez chez les établissements partenaires du réseau national.',
  },
  {
    icon: Bus,
    title: 'Transport',
    description: 'Simplifiez tickets, courses et déplacements du quotidien.',
  },
  {
    icon: ShoppingCart,
    title: 'Courses',
    description: 'Centralisez vos achats avec un solde unique et traçable.',
  },
  {
    icon: QrCode,
    title: 'Paiement QR',
    description: 'Scannez, confirmez avec votre PIN — paiement instantané.',
  },
  {
    icon: Smartphone,
    title: 'Carte numérique',
    description: 'Activez une carte provisoire en attendant la livraison physique.',
    href: '/commander-carte',
    cta: 'Commander ma carte',
  },
  {
    icon: Hospital,
    title: 'Hôpitaux',
    description: 'Réglez consultations et soins dans les établissements partenaires.',
  },
  {
    icon: Stethoscope,
    title: 'Cliniques',
    description: 'Payez vos visites médicales en toute simplicité.',
  },
  {
    icon: Pill,
    title: 'Pharmacies',
    description: 'Achetez vos médicaments sans espèces chez les pharmacies agréées.',
  },
  {
    icon: Globe,
    title: 'Recharge diaspora',
    description: 'Créditez une carte en Guinée depuis l’étranger par carte bancaire internationale.',
    href: '/recharger-diaspora',
    cta: 'Recharger maintenant',
  },
]

const STEPS = [
  {
    step: '01',
    title: 'Ouvrez votre compte',
    description: 'Commandez en ligne et créez vos identifiants sécurisés en quelques minutes.',
  },
  {
    step: '02',
    title: 'Activez votre carte',
    description: 'Recevez votre carte, puis validez l’activation avec le code envoyé par email.',
  },
  {
    step: '03',
    title: 'Payez en confiance',
    description: 'Rechargez, scannez et réglez chez l’ensemble des commerçants agréés.',
  },
]

const METRICS = [
  { value: formatCurrency(CARD_PRICE), label: 'Émission carte' },
  { value: 'QR', label: 'Paiement instantané' },
  { value: 'PIN', label: 'Sécurité renforcée' },
  { value: 'GNF', label: 'Monnaie locale' },
]

export function Home() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [loginOpen, setLoginOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const primaryCta = isAuthenticated ? CLIENT_DASHBOARD_PATH : '/commander-carte'
  const primaryLabel = isAuthenticated ? 'Mon espace client' : 'Commander ma carte'

  return (
    <div className="min-h-screen bg-white text-stone-900">
      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={() => navigate(CLIENT_DASHBOARD_PATH)}
      />

      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-white/90 backdrop-blur-md safe-top">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 lg:px-10">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <PlatformLogo size="sm" />
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-semibold tracking-tight text-stone-900">
                {PLATFORM_NAME}
              </p>
              <p className="truncate text-[11px] uppercase tracking-[0.18em] text-stone-500">
                {PLATFORM_TAGLINE}
              </p>
            </div>
          </Link>

          <HomeNavMenu groups={HOME_NAV_GROUPS} variant="desktop" />

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/commercant/connexion"
              className="hidden rounded-full px-4 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100 hover:text-stone-900 md:inline-flex"
            >
              Espace commerçant
            </Link>
            {!isAuthenticated && (
              <button
                type="button"
                onClick={() => setLoginOpen(true)}
                className="hidden rounded-full px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50 sm:inline-flex"
              >
                Accès clients
              </button>
            )}
            <Link
              to={primaryCta}
              className="hidden items-center gap-2 rounded-full bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 sm:inline-flex sm:px-5"
            >
              {primaryLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-stone-700 transition hover:bg-stone-100 lg:hidden"
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-stone-900/40 backdrop-blur-[2px]"
            aria-label="Fermer le menu"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute inset-x-0 top-0 max-h-[90vh] overflow-y-auto rounded-b-2xl bg-white shadow-2xl safe-top">
            <div className="flex items-start justify-between gap-3 border-b border-stone-100 px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-stone-900">Menu</p>
                <p className="mt-0.5 text-xs text-stone-500">Menus et sous-menus</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-5 p-5">
              <HomeNavMenu
                groups={HOME_NAV_GROUPS}
                variant="mobile"
                onNavigate={() => setMobileMenuOpen(false)}
              />

              <section className="overflow-hidden rounded-xl border border-stone-200 bg-white">
                <div className="border-b border-stone-100 px-4 py-3">
                  <p className="text-sm font-semibold text-stone-800">Accès</p>
                  <p className="mt-0.5 text-[11px] text-stone-400">Espaces client et commerçant</p>
                </div>
                <div className="space-y-0.5 p-2">
                  <Link
                    to="/commercant/connexion"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50"
                  >
                    <Store className="h-5 w-5 text-stone-500" />
                    Espace commerçant
                  </Link>
                  {!isAuthenticated && (
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false)
                        setLoginOpen(true)
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-indigo-600 hover:bg-indigo-50"
                    >
                      Accès clients
                    </button>
                  )}
                  <Link
                    to={primaryCta}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between rounded-xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white"
                  >
                    {primaryLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-stone-200">
        <div className="absolute inset-0">
          <img
            src={PLATFORM_HERO_IMAGE}
            alt=""
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950/95 via-stone-950/80 to-stone-950/40" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-12 lg:items-end lg:px-10 lg:py-28">
          <div className="lg:col-span-7">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-300">
              Services financiers · Guinée
            </p>
            <h1 className="mt-6 font-[family-name:var(--font-display)] text-5xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
              La référence du paiement multiservice en Guinée.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-stone-300 sm:text-xl">
              {PLATFORM_NAME} regroupe carburant, restauration, transport et courses dans une
              carte rechargeable, sécurisée et pensée pour le quotidien.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/commander-carte"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-stone-900 transition hover:bg-stone-100"
              >
                <CreditCard className="h-4 w-4" />
                Commander — {formatCurrency(CARD_PRICE)}
              </Link>
              {isAuthenticated ? (
                <Link
                  to={CLIENT_DASHBOARD_PATH}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Accéder à mon espace
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setLoginOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-indigo-300/60 bg-indigo-500/20 px-7 py-3.5 text-sm font-semibold text-indigo-100 transition hover:bg-indigo-500/30"
                >
                  Accès clients
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur-md sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-300">
                    Carte multiservice
                  </p>
                  <p className="mt-2 font-[family-name:var(--font-display)] text-3xl text-white">
                    {PLATFORM_NAME}
                  </p>
                </div>
                <Shield className="h-8 w-8 shrink-0 text-white/80" />
              </div>
              <p className="mt-8 font-mono text-xl tracking-[0.22em] text-white/90">
                2121 •••• •••• 4829
              </p>
              <div className="mt-8 flex items-end justify-between border-t border-white/15 pt-6">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400">Titulaire</p>
                  <p className="mt-1 text-sm font-medium text-white">Client Guinée Multiservices</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400">Solde</p>
                  <p className="mt-1 text-2xl font-semibold text-white">250 000 GNF</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="border-b border-stone-200 bg-stone-50">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-stone-200 lg:grid-cols-4">
          {METRICS.map(({ value, label }) => (
            <div key={label} className="px-5 py-8 text-center sm:px-8">
              <p className="font-[family-name:var(--font-display)] text-3xl font-semibold text-stone-900 sm:text-4xl">
                {value}
              </p>
              <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-stone-500">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
              Nos capacités
            </p>
            <h2 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
              Un écosystème de paiement complet
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-stone-600">
              Une infrastructure unique pour couvrir vos besoins essentiels, avec la rigueur d’un
              établissement financier et la simplicité d’une application moderne.
            </p>
          </div>

          <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-stone-200 bg-stone-200 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map(({ icon: Icon, title, description, href, cta }) => {
              const content = (
                <>
                  <div className="mb-6 inline-flex rounded-full border border-stone-200 p-3 text-stone-900 transition group-hover:border-stone-900">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-xl font-semibold text-stone-900">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-stone-600">{description}</p>
                  {href ? (
                    <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 transition group-hover:gap-2">
                      {cta ?? 'En savoir plus'}
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  ) : (
                    <span className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-stone-900 opacity-0 transition group-hover:opacity-100">
                      En savoir plus
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  )}
                </>
              )

              if (href) {
                return (
                  <Link
                    key={title}
                    to={href}
                    className="group block bg-white p-8 transition hover:bg-indigo-50/40 lg:p-10"
                  >
                    {content}
                  </Link>
                )
              }

              return (
                <article
                  key={title}
                  className="group bg-white p-8 transition hover:bg-stone-50 lg:p-10"
                >
                  {content}
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* Editorial band */}
      <section className="bg-stone-900 py-24 text-white lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-2 lg:items-center lg:px-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-400">
              Notre conviction
            </p>
            <h2 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-semibold leading-tight sm:text-5xl">
              Simplifier les paiements, structurer la confiance.
            </h2>
          </div>
          <div className="space-y-6 text-lg leading-relaxed text-stone-300">
            <p>
              {PLATFORM_NAME} accompagne particuliers et commerçants avec des outils fiables :
              carte physique et numérique, paiement QR, contrôle PIN et suivi des opérations.
            </p>
            <div className="flex flex-wrap gap-6 text-sm text-stone-400">
              <span className="inline-flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Chiffrement & session sécurisée
              </span>
              <span className="inline-flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Vérification anti-fraude
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Parcours */}
      <section id="parcours" className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                Parcours client
              </p>
              <h2 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
                Trois étapes pour rejoindre le réseau
              </h2>
            </div>
            <Link
              to="/commander-carte"
              className="inline-flex items-center gap-2 text-sm font-semibold text-stone-900 hover:underline"
            >
              Démarrer ma commande
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-14 grid gap-8 lg:grid-cols-3">
            {STEPS.map(({ step, title, description }) => (
              <div key={step} className="border-t-2 border-stone-900 pt-8">
                <span className="text-sm font-semibold tracking-[0.2em] text-stone-400">{step}</span>
                <h3 className="mt-4 text-2xl font-semibold text-stone-900">{title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-stone-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-y border-stone-200 bg-stone-50 py-20">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-5 lg:flex-row lg:items-center lg:px-10">
          <div className="max-w-2xl">
            <h2 className="font-[family-name:var(--font-display)] text-4xl font-semibold text-stone-900 sm:text-5xl">
              Prêt à passer au paiement nouvelle génération ?
            </h2>
            <p className="mt-4 text-lg text-stone-600">
              Commandez votre carte dès aujourd’hui et accédez à un réseau conçu pour la Guinée.
            </p>
          </div>
          <Link
            to="/commander-carte"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-stone-900 px-8 py-4 text-sm font-semibold text-white transition hover:bg-stone-800"
          >
            Commander ma carte
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Commerçants */}
      <section id="commercants" className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <div className="overflow-hidden rounded-3xl bg-stone-900 text-white">
            <div className="grid lg:grid-cols-2">
              <div className="p-10 sm:p-14 lg:p-16">
                <div className="inline-flex rounded-full border border-white/20 p-3">
                  <Store className="h-6 w-6" />
                </div>
                <h2 className="mt-8 font-[family-name:var(--font-display)] text-4xl font-semibold sm:text-5xl">
                  Vous êtes commerçant ?
                </h2>
                <p className="mt-5 max-w-lg text-lg leading-relaxed text-stone-300">
                  Intégrez le réseau {PLATFORM_NAME}, encaissez par QR et pilotez votre activité
                  depuis un espace professionnel dédié.
                </p>
                <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                  <Link
                    to="/commercant/inscription"
                    className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-stone-900 transition hover:bg-stone-100"
                  >
                    Devenir partenaire
                  </Link>
                  <Link
                    to="/commercant/connexion"
                    className="inline-flex items-center justify-center rounded-full border border-white/30 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Connexion commerçant
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center border-t border-white/10 bg-stone-950/50 p-10 sm:p-14 lg:border-l lg:border-t-0">
                <div className="grid w-full max-w-md grid-cols-2 gap-4">
                  {[
                    { value: '100%', label: 'Paiements sécurisés' },
                    { value: '24/7', label: 'Suivi des ventes' },
                    { value: 'QR', label: 'Encaissement rapide' },
                    { value: 'GNF', label: 'Monnaie locale' },
                  ].map(({ value, label }) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center"
                    >
                      <p className="font-[family-name:var(--font-display)] text-3xl font-semibold">
                        {value}
                      </p>
                      <p className="mt-2 text-xs uppercase tracking-[0.14em] text-stone-400">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="border-t border-stone-200 bg-stone-50 py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <div className="flex flex-col items-start justify-between gap-8 rounded-3xl border border-stone-200 bg-white p-10 sm:flex-row sm:items-center sm:p-12">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                Assistance
              </p>
              <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold text-stone-900 sm:text-4xl">
                Une équipe à votre écoute
              </h2>
              <p className="mt-3 max-w-xl text-stone-600">
                Questions sur votre commande, votre carte ou votre compte — contactez notre support.
              </p>
            </div>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-stone-800"
            >
              <Mail className="h-4 w-4" />
              {SUPPORT_EMAIL}
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-14">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
            <div className="sm:col-span-2">
              <PlatformLogo size="sm" showName />
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-stone-500">
                {PLATFORM_TAGLINE}. Services de paiement multiservice pour particuliers et
                commerçants en République de Guinée.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Clients
              </p>
              <ul className="mt-4 space-y-2 text-sm text-stone-600">
                <li>
                  <Link to="/commander-carte" className="hover:text-stone-900">
                    Commander une carte
                  </Link>
                </li>
                {!isAuthenticated && (
                  <li>
                    <button
                      type="button"
                      onClick={() => setLoginOpen(true)}
                      className="font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      Accès clients
                    </button>
                  </li>
                )}
                {isAuthenticated && (
                  <li>
                    <Link to={CLIENT_DASHBOARD_PATH} className="hover:text-stone-900">
                      Mon espace
                    </Link>
                  </li>
                )}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Entreprise
              </p>
              <ul className="mt-4 space-y-2 text-sm text-stone-600">
                <li>
                  <Link to="/carrieres" className="hover:text-stone-900">
                    Carrière chez nous
                  </Link>
                </li>
                <li>
                  <Link to="/recharger-diaspora" className="hover:text-stone-900">
                    Recharge diaspora
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Partenaires
              </p>
              <ul className="mt-4 space-y-2 text-sm text-stone-600">
                <li>
                  <Link to="/commercant/inscription" className="hover:text-stone-900">
                    Devenir commerçant
                  </Link>
                </li>
                <li>
                  <Link to="/commercant/connexion" className="hover:text-stone-900">
                    Espace commerçant
                  </Link>
                </li>
                <li>
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-stone-900">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-stone-200 pt-8 text-sm text-stone-500 sm:flex-row">
            <p>© {new Date().getFullYear()} {PLATFORM_NAME}. Tous droits réservés.</p>
            <p className="text-xs uppercase tracking-[0.16em]">Conçu pour la Guinée</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
