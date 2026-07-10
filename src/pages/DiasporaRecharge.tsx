import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, Heart, Shield } from 'lucide-react'
import { BackToHomeLink } from '../components/BackToHomeLink'
import { DiasporaPromoSection } from '../components/DiasporaPromoSection'
import { PlatformLogo } from '../components/PlatformLogo'
import {
  DIASPORA_COUNTRIES,
  DIASPORA_PAYMENT_METHODS,
  type DiasporaPaymentMethodId,
} from '../data/diasporaPaymentMethods'
import { PLATFORM_NAME } from '../constants/brand'
import { submitDiasporaRecharge } from '../services/diasporaRechargeServer'
import { formatAmountShort, formatCurrency, MAX_RECHARGE, PRESET_AMOUNTS } from '../utils/currency'

const STEPS = [
  { num: '1', title: 'Bénéficiaire', hint: 'Email, téléphone ou n° de carte' },
  { num: '2', title: 'Montant', hint: 'Choisissez le montant en GNF' },
  { num: '3', title: 'Paiement', hint: 'Carte internationale ou virement' },
]

export function DiasporaRecharge() {
  const [beneficiaryEmail, setBeneficiaryEmail] = useState('')
  const [beneficiaryPhone, setBeneficiaryPhone] = useState('')
  const [beneficiaryCard, setBeneficiaryCard] = useState('')
  const [payerName, setPayerName] = useState('')
  const [payerEmail, setPayerEmail] = useState('')
  const [payerCountry, setPayerCountry] = useState('FR')
  const [amount, setAmount] = useState(PRESET_AMOUNTS[1])
  const [customAmount, setCustomAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<DiasporaPaymentMethodId>('visa')
  const [message, setMessage] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<{
    beneficiaryName: string
    newBalance: number
    amount: number
  } | null>(null)

  const selectedAmount = customAmount ? parseInt(customAmount, 10) : amount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!beneficiaryEmail.trim() && !beneficiaryPhone.trim() && !beneficiaryCard.trim()) {
      setError('Indiquez l’email, le téléphone ou le numéro de carte du bénéficiaire.')
      return
    }
    if (isNaN(selectedAmount) || selectedAmount < 10_000) {
      setError('Le montant minimum est de 10 000 GNF.')
      return
    }
    if (selectedAmount > MAX_RECHARGE) {
      setError(`Le montant maximum est de ${formatCurrency(MAX_RECHARGE)}.`)
      return
    }

    setSubmitting(true)
    const result = await submitDiasporaRecharge({
      beneficiaryEmail: beneficiaryEmail.trim() || undefined,
      beneficiaryPhone: beneficiaryPhone.trim() || undefined,
      beneficiaryCard: beneficiaryCard.trim() || undefined,
      payerName: payerName.trim(),
      payerEmail: payerEmail.trim(),
      payerCountry,
      amount: selectedAmount,
      paymentMethod,
      message: message.trim() || undefined,
      _honeypot: honeypot,
    })
    setSubmitting(false)

    if (!result.ok || !result.beneficiaryName) {
      setError(result.error ?? 'Recharge échouée')
      return
    }

    setSuccess({
      beneficiaryName: result.beneficiaryName,
      newBalance: result.newBalance ?? 0,
      amount: selectedAmount,
    })
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50/80 to-white">
        <div className="page-container flex min-h-screen items-center justify-center py-12">
          <div className="mx-auto w-full max-w-lg rounded-3xl border border-emerald-200/80 bg-white p-8 text-center shadow-xl shadow-emerald-100/50 sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle className="h-9 w-9 text-emerald-600" />
            </div>
            <h1 className="mt-6 text-2xl font-bold text-slate-900">Recharge envoyée avec succès</h1>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              <strong className="text-slate-900">{formatCurrency(success.amount)}</strong> ont été
              crédités sur la carte de{' '}
              <strong className="text-slate-900">{success.beneficiaryName}</strong>.
            </p>
            <p className="mt-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Nouveau solde :{' '}
              <span className="font-semibold text-indigo-700">
                {formatCurrency(success.newBalance)}
              </span>
            </p>
            <BackToHomeLink className="mt-8" />
          </div>
        </div>
      </div>
    )
  }

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/60 via-white to-white">
      <header className="border-b border-indigo-100/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <PlatformLogo size="sm" />
            <div>
              <p className="text-sm font-semibold text-slate-900">{PLATFORM_NAME}</p>
              <p className="text-xs text-indigo-600">Recharge diaspora</p>
            </div>
          </div>
          <BackToHomeLink variant="link" />
        </div>
      </header>

      <div className="mx-auto max-w-4xl space-y-8 px-5 py-8 sm:py-10">
        <DiasporaPromoSection variant="page" />

        <div className="grid gap-3 sm:grid-cols-3">
          {STEPS.map(({ num, title, hint }) => (
            <div
              key={num}
              className="rounded-2xl border border-indigo-100 bg-white px-4 py-4 shadow-sm"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                {num}
              </span>
              <p className="mt-3 text-sm font-semibold text-slate-900">{title}</p>
              <p className="mt-1 text-xs text-slate-500">{hint}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="text"
            name="company"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
          />

          <section className="rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50/80 to-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                <Heart className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-semibold text-slate-900">Bénéficiaire en Guinée</h2>
                <p className="text-xs text-slate-500">Étape 1 — au moins un identifiant requis</p>
              </div>
            </div>
            <div className="space-y-3">
              <input
                type="email"
                value={beneficiaryEmail}
                onChange={(e) => setBeneficiaryEmail(e.target.value)}
                placeholder="Email du bénéficiaire"
                className={inputClass}
              />
              <input
                type="tel"
                value={beneficiaryPhone}
                onChange={(e) => setBeneficiaryPhone(e.target.value)}
                placeholder="Téléphone du bénéficiaire (+224…)"
                className={inputClass}
              />
              <input
                type="text"
                value={beneficiaryCard}
                onChange={(e) => setBeneficiaryCard(e.target.value)}
                placeholder="Numéro de carte multiservice"
                className={inputClass}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="font-semibold text-slate-900">Vos coordonnées (expéditeur)</h2>
            <p className="mt-1 text-xs text-slate-500">Pour la confirmation et le reçu de paiement</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                required
                value={payerName}
                onChange={(e) => setPayerName(e.target.value)}
                placeholder="Votre nom complet *"
                className={`${inputClass} sm:col-span-2`}
              />
              <input
                type="email"
                required
                value={payerEmail}
                onChange={(e) => setPayerEmail(e.target.value)}
                placeholder="Votre email *"
                className={inputClass}
              />
              <select
                required
                value={payerCountry}
                onChange={(e) => setPayerCountry(e.target.value)}
                className={inputClass}
              >
                {DIASPORA_COUNTRIES.map(({ code, label }) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="font-semibold text-slate-900">Montant à envoyer (GNF)</h2>
            <p className="mt-1 text-xs text-slate-500">Étape 2 — minimum 10 000 GNF</p>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setAmount(preset)
                    setCustomAmount('')
                  }}
                  className={`rounded-xl border py-3 text-sm font-semibold transition ${
                    amount === preset && !customAmount
                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-200'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-indigo-200 hover:bg-indigo-50'
                  }`}
                >
                  {formatAmountShort(preset)}
                </button>
              ))}
            </div>
            <input
              type="number"
              min="10000"
              max={MAX_RECHARGE}
              step="1000"
              placeholder="Autre montant en GNF"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className={`mt-3 ${inputClass}`}
            />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="font-semibold text-slate-900">Paiement international</h2>
            <p className="mt-1 text-xs text-slate-500">Étape 3 — choisissez votre moyen de paiement</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {DIASPORA_PAYMENT_METHODS.map(({ id, label, description, icon: Icon, color }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPaymentMethod(id)}
                  className={`flex h-full flex-col items-start gap-3 rounded-2xl border p-4 text-left transition ${
                    paymentMethod === id
                      ? `${color} ring-2 ring-indigo-600 ring-offset-2`
                      : 'border-slate-200 bg-slate-50 hover:border-indigo-200 hover:bg-white'
                  }`}
                >
                  <Icon className="h-6 w-6 text-slate-600" />
                  <div>
                    <p className="font-semibold text-slate-900">{label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
                  </div>
                </button>
              ))}
            </div>
            <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
              <Shield className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
              Transaction chiffrée · confirmation envoyée à l&apos;expéditeur et au bénéficiaire
            </p>
          </section>

          <textarea
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message personnel pour le bénéficiaire (optionnel)"
            className={inputClass}
          />

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}

          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                  Total à envoyer
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {formatCurrency(selectedAmount || 0)}
                </p>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex min-w-[12rem] items-center justify-center rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-300/40 transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {submitting ? 'Traitement en cours…' : 'Confirmer la recharge'}
              </button>
            </div>
          </div>

          <BackToHomeLink />
        </form>

        <p className="pb-8 text-center text-sm text-slate-500">
          Vous êtes en Guinée ?{' '}
          <Link to="/connexion" className="font-semibold text-indigo-600 hover:underline">
            Rechargez depuis votre espace client
          </Link>
        </p>
      </div>
    </div>
  )
}
