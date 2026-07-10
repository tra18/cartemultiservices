import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Store, UserPlus } from 'lucide-react'
import { PaymentMethodPicker } from '../../components/PaymentMethodPicker'
import { getPaymentMethodLabel, type PaymentMethodId } from '../../data/paymentMethods'
import { useMerchantAuth } from '../../context/MerchantAuthContext'
import type { Category } from '../../types'
import { CATEGORY_LABELS } from '../../types'
import { formatCurrency } from '../../utils/currency'
import { MERCHANT_REGISTRATION_PRICE, calculateMerchantRegistrationPrice } from '../../utils/pricing'

import { ALL_CATEGORIES } from '../../data/categories'

export function MerchantRegister() {
  const { register } = useMerchantAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [businessName, setBusinessName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [mobileMoneyNumber, setMobileMoneyNumber] = useState('')
  const [categories, setCategories] = useState<Category[]>(['courses'])
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('orange-money')
  const [paymentPhone, setPaymentPhone] = useState('')
  const [error, setError] = useState('')

  const registrationTotal = calculateMerchantRegistrationPrice(categories.length)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (step === 1) {
      if (password !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas')
        return
      }
      if (categories.length === 0) {
        setError('Sélectionnez au moins une catégorie')
        return
      }
      setStep(2)
      return
    }

    const err = register({
      businessName,
      email,
      phone,
      password,
      categories,
      mobileMoneyNumber: mobileMoneyNumber || phone,
      paymentMethod: getPaymentMethodLabel(paymentMethod),
    })
    if (err) {
      setError(err)
      return
    }
    navigate('/commercant')
  }

  return (
    <div className="page-container">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white">
          <Store className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Inscription commerçant</h1>
        <p className="mt-2 text-sm text-slate-500">
          Compte professionnel · à partir de{' '}
          <span className="font-semibold text-emerald-600">
            {formatCurrency(MERCHANT_REGISTRATION_PRICE)}
          </span>
          /catégorie
        </p>
      </div>

      <div className="mb-6 flex gap-2">
        {[1, 2].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full ${step >= s ? 'bg-emerald-600' : 'bg-slate-200'}`}
          />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {step === 1 && (
          <>
            <input
              required
              placeholder="Nom du commerce"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
            <input
              required
              type="email"
              placeholder="Email professionnel"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
            <input
              required
              type="tel"
              placeholder="Téléphone (+224...)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
            <input
              required
              type="tel"
              placeholder="Numéro Orange Money / MoMo pour retraits"
              value={mobileMoneyNumber}
              onChange={(e) => setMobileMoneyNumber(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Catégories d&apos;activité
              </label>
              <p className="mb-2 text-xs text-slate-500">
                {categories.length} sélectionnée(s) — total :{' '}
                <strong className="text-emerald-700">{formatCurrency(registrationTotal)}</strong>
              </p>
              <div className="grid grid-cols-2 gap-2">
                {ALL_CATEGORIES.map((cat) => {
                  const selected = categories.includes(cat)
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() =>
                        setCategories((prev) =>
                          selected ? prev.filter((c) => c !== cat) : [...prev, cat]
                        )
                      }
                      className={`rounded-xl border py-2.5 text-sm font-medium transition ${
                        selected
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      {CATEGORY_LABELS[cat]}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="relative">
              <input
                required
                type={showPassword ? 'text' : 'password'}
                minLength={6}
                placeholder="Mot de passe (6 caractères min.)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <input
              required
              type="password"
              placeholder="Confirmer le mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </>
        )}

        {step === 2 && (
          <>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
              <p className="font-semibold">Frais d&apos;ouverture de compte commerçant</p>
              <p className="mt-1 text-2xl font-bold text-emerald-900">
                {formatCurrency(registrationTotal)}
              </p>
              <p className="mt-1 text-xs text-emerald-600">
                {categories.length} catégorie(s) × {formatCurrency(MERCHANT_REGISTRATION_PRICE)}
              </p>
              <p className="mt-2 text-emerald-700">
                Accès au portail, encaissement QR code et demandes de retrait.
              </p>
            </div>

            <PaymentMethodPicker
              value={paymentMethod}
              onChange={setPaymentMethod}
              phone={paymentPhone || phone}
              onPhoneChange={setPaymentPhone}
              accent="emerald"
            />
          </>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}

        <div className="flex gap-3">
          {step === 2 && (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 rounded-xl border border-slate-200 py-3.5 font-medium text-slate-600"
            >
              Retour
            </button>
          )}
          <button
            type="submit"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 font-semibold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700"
          >
            <UserPlus className="h-5 w-5" />
            {step === 1 ? 'Continuer' : `Payer ${formatCurrency(registrationTotal)}`}
          </button>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Déjà inscrit ?{' '}
        <Link to="/commercant/connexion" className="font-medium text-emerald-600">
          Se connecter
        </Link>
      </p>
    </div>
  )
}
