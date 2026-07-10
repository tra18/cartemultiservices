import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, Globe, Heart } from 'lucide-react'
import { PlatformLogo } from '../components/PlatformLogo'
import {
  DIASPORA_COUNTRIES,
  DIASPORA_PAYMENT_METHODS,
  getDiasporaPaymentLabel,
  type DiasporaPaymentMethodId,
} from '../data/diasporaPaymentMethods'
import { PLATFORM_NAME } from '../constants/brand'
import { submitDiasporaRecharge } from '../services/diasporaRechargeServer'
import { formatAmountShort, formatCurrency, MAX_RECHARGE, PRESET_AMOUNTS } from '../utils/currency'

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
      <div className="page-container">
        <div className="mx-auto max-w-lg rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
          <CheckCircle className="mx-auto h-14 w-14 text-emerald-500" />
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Recharge envoyée</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            <strong>{formatCurrency(success.amount)}</strong> ont été crédités sur la carte de{' '}
            <strong>{success.beneficiaryName}</strong>.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Nouveau solde : {formatCurrency(success.newBalance)}
          </p>
          <Link
            to="/"
            className="mt-8 inline-flex rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="flex items-center gap-3">
          <PlatformLogo size="sm" />
          <div>
            <p className="text-sm font-semibold text-slate-900">{PLATFORM_NAME}</p>
            <p className="text-xs text-slate-500">Recharge diaspora en ligne</p>
          </div>
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-indigo-100 p-2.5 text-indigo-700">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Recharger une carte depuis l&apos;étranger</h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Depuis la diaspora, créditez instantanément la carte d&apos;un proche en Guinée par carte
                bancaire internationale ou virement. Aucun compte client requis pour l&apos;expéditeur.
              </p>
            </div>
          </div>
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

          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <Heart className="h-5 w-5 text-rose-500" />
              <h2 className="font-semibold text-slate-900">Bénéficiaire en Guinée</h2>
            </div>
            <p className="mb-4 text-sm text-slate-500">
              Renseignez au moins un identifiant : email, téléphone ou numéro de carte.
            </p>
            <div className="space-y-3">
              <input
                type="email"
                value={beneficiaryEmail}
                onChange={(e) => setBeneficiaryEmail(e.target.value)}
                placeholder="Email du bénéficiaire"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
              />
              <input
                type="tel"
                value={beneficiaryPhone}
                onChange={(e) => setBeneficiaryPhone(e.target.value)}
                placeholder="Téléphone du bénéficiaire (+224…)"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
              />
              <input
                type="text"
                value={beneficiaryCard}
                onChange={(e) => setBeneficiaryCard(e.target.value)}
                placeholder="Numéro de carte multiservice"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="font-semibold text-slate-900">Vos coordonnées (expéditeur)</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                required
                value={payerName}
                onChange={(e) => setPayerName(e.target.value)}
                placeholder="Votre nom complet *"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 sm:col-span-2"
              />
              <input
                type="email"
                required
                value={payerEmail}
                onChange={(e) => setPayerEmail(e.target.value)}
                placeholder="Votre email *"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
              />
              <select
                required
                value={payerCountry}
                onChange={(e) => setPayerCountry(e.target.value)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
              >
                {DIASPORA_COUNTRIES.map(({ code, label }) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="font-semibold text-slate-900">Montant à envoyer (GNF)</h2>
            <div className="mt-4 grid grid-cols-2 gap-2">
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
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  {formatAmountShort(preset)} GNF
                </button>
              ))}
            </div>
            <input
              type="number"
              min="10000"
              max={MAX_RECHARGE}
              step="1000"
              placeholder="Autre montant"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
            />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="font-semibold text-slate-900">Paiement international</h2>
            <div className="mt-4 space-y-2">
              {DIASPORA_PAYMENT_METHODS.map(({ id, label, description, icon: Icon, color }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPaymentMethod(id)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${
                    paymentMethod === id ? `${color} ring-2 ring-indigo-600 ring-offset-1` : 'border-slate-200'
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0 text-slate-600" />
                  <div>
                    <p className="font-semibold text-slate-900">{label}</p>
                    <p className="text-xs text-slate-500">{description}</p>
                  </div>
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              En production, vous seriez redirigé vers la passerelle sécurisée{' '}
              {getDiasporaPaymentLabel(paymentMethod)}.
            </p>
          </section>

          <textarea
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message pour le bénéficiaire (optionnel)"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
          />

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-60"
          >
            {submitting
              ? 'Traitement en cours…'
              : `Envoyer ${formatCurrency(selectedAmount || 0)}`}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500">
          Vous êtes en Guinée ?{' '}
          <Link to="/connexion" className="font-medium text-indigo-600 hover:underline">
            Rechargez depuis votre espace client
          </Link>
        </p>
      </div>
    </div>
  )
}
