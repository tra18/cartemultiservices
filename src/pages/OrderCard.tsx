import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle, CreditCard, Eye, EyeOff, KeyRound, Lock, Mail, Package, Shield, UserPlus } from 'lucide-react'
import { PaymentMethodPicker } from '../components/PaymentMethodPicker'
import { DELIVERY_OPTIONS } from '../data/deliveryMethods'
import { getPaymentMethodLabel, PAYMENT_METHODS, type PaymentMethodId } from '../data/paymentMethods'
import { useAuth } from '../context/AuthContext'
import type { DeliveryMethod } from '../types/order'
import { formatCurrency } from '../utils/currency'
import {
  checkFormTiming,
  checkHoneypot,
  checkRateLimit,
  clearFormToken,
  createFormToken,
  recordFailedAttempt,
  verifyFormToken,
} from '../utils/formSecurity'
import { validateOrderStep1, validateOrderStep2, validatePassword } from '../utils/validation'
import { CARD_PRICE } from '../utils/pricing'

export function OrderCard() {
  const { orderCard } = useAuth()
  const navigate = useNavigate()
  const formStartedAt = useRef(Date.now())
  const [formToken, setFormToken] = useState('')
  const [step, setStep] = useState(1)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('Conakry')
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('home')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('orange-money')
  const [paymentPhone, setPaymentPhone] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [honeypot, setHoneypot] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [orderEmail, setOrderEmail] = useState('')

  useEffect(() => {
    setFormToken(createFormToken())
    formStartedAt.current = Date.now()
  }, [])

  const needsAddress = deliveryMethod === 'home'
  const paymentNeedsPhone = PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.needsPhone ?? false

  const passwordChecks = {
    length: password.length >= 8,
    letter: /[a-zA-Z]/.test(password),
    digit: /[0-9]/.test(password),
    noSpace: !/\s/.test(password) && password.length > 0,
    match: password.length > 0 && password === confirmPassword,
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const rateErr = checkRateLimit()
    if (rateErr) {
      setError(rateErr)
      return
    }

    const honeypotErr = checkHoneypot(honeypot)
    if (honeypotErr) {
      setError(honeypotErr)
      recordFailedAttempt()
      return
    }

    if (!verifyFormToken(formToken)) {
      setError('Session expirée. Rechargez la page et réessayez.')
      return
    }

    if (step === 1) {
      const step1Err = validateOrderStep1({ fullName, email, phone, password, confirmPassword })
      if (step1Err) {
        setError(step1Err)
        return
      }
      setStep(2)
      return
    }

    const timingErr = checkFormTiming(formStartedAt.current)
    if (timingErr) {
      setError(timingErr)
      recordFailedAttempt()
      return
    }

    if (!acceptTerms) {
      setError('Vous devez accepter les conditions générales')
      return
    }

    const step2Err = validateOrderStep2({
      fullName,
      email,
      phone,
      password,
      confirmPassword,
      address,
      city,
      needsAddress,
      paymentPhone: paymentPhone || phone,
      paymentNeedsPhone,
    })
    if (step2Err) {
      setError(step2Err)
      return
    }

    setSubmitting(true)

    const result = orderCard({
      fullName,
      email,
      phone,
      password,
      address: needsAddress ? address : '',
      city,
      deliveryMethod,
      paymentMethod: getPaymentMethodLabel(paymentMethod),
      needsAddress,
      addressFallback: DELIVERY_OPTIONS.find((d) => d.id === deliveryMethod)?.label ?? '',
    })

    setSubmitting(false)

    if (!result.success) {
      setError(result.error ?? 'Commande échouée')
      recordFailedAttempt()
      return
    }

    clearFormToken()
    setOrderId(result.order?.id ?? '')
    setOrderEmail(email.trim().toLowerCase())
    setStep(3)
  }

  if (step === 3) {
    return (
      <div className="page-container flex flex-col items-center justify-center text-center">
        <CheckCircle className="h-16 w-16 text-emerald-500" />
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Commande confirmée !</h1>
        <p className="mt-2 text-slate-600">
          Votre carte a été commandée pour {formatCurrency(CARD_PRICE)}.
        </p>
        {orderId && (
          <p className="mt-2 text-sm text-slate-500">Référence : {orderId.slice(0, 8).toUpperCase()}</p>
        )}

        <div className="mt-6 w-full space-y-3 text-left">
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
            <div className="flex items-start gap-3">
              <UserPlus className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
              <div className="text-sm text-indigo-800">
                <p className="font-semibold text-indigo-900">Votre compte est créé</p>
                <p className="mt-1">
                  Connectez-vous plus tard avec <span className="font-medium">{orderEmail}</span> et
                  le mot de passe choisi à la commande.
                </p>
                <p className="mt-2 text-xs text-indigo-600">
                  Un email de bienvenue avec ces informations vous a été envoyé.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <div className="text-sm text-emerald-800">
                <p className="font-semibold text-emerald-900">Code d&apos;activation envoyé</p>
                <p className="mt-1">
                  Un second email contient votre code à 6 caractères pour activer la carte après
                  réception.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 w-full rounded-xl border border-slate-200 bg-white p-4 text-left text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Prochaines étapes</p>
          <ol className="mt-2 list-inside list-decimal space-y-1">
            <li>Conservez votre mot de passe en lieu sûr</li>
            <li>Attendez la livraison de votre carte (2-5 jours)</li>
            <li>Connectez-vous → Activez avec QR carte + code email</li>
          </ol>
        </div>
        <button
          type="button"
          onClick={() => navigate('/ma-commande')}
          className="mt-6 w-full rounded-xl bg-indigo-600 py-3.5 font-semibold text-white hover:bg-indigo-700"
        >
          Suivre ma commande
        </button>
      </div>
    )
  }

  const inputClass =
    'w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'

  return (
    <div className="page-container">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
          <CreditCard className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Commander ma carte</h1>
        <p className="mt-2 text-sm text-slate-500">
          Carte physique multiservice ·{' '}
          <span className="font-semibold text-indigo-600">{formatCurrency(CARD_PRICE)}</span>
        </p>
        <p className="mt-2 flex items-center justify-center gap-1 text-xs text-slate-400">
          <Shield className="h-3.5 w-3.5" />
          Formulaire sécurisé · Données chiffrées
        </p>
      </div>

      <div className="mb-6 flex gap-2">
        {[1, 2].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full ${step >= s ? 'bg-indigo-600' : 'bg-slate-200'}`}
          />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Honeypot anti-bot — champ caché */}
        <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
          <label htmlFor="website">Ne pas remplir</label>
          <input
            id="website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </div>

        {step === 1 && (
          <>
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
              <div className="flex items-start gap-3">
                <UserPlus className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                <div className="text-sm text-indigo-800">
                  <p className="font-semibold text-indigo-900">Création de votre compte client</p>
                  <p className="mt-1">
                    Ces identifiants vous serviront à vous connecter, suivre votre commande et
                    activer votre carte à réception.
                  </p>
                </div>
              </div>
            </div>

            <h2 className="font-semibold text-slate-800">1. Compte et coordonnées</h2>
            <div>
              <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-slate-700">
                Nom complet
              </label>
              <input
                id="fullName"
                required
                maxLength={80}
                autoComplete="name"
                placeholder="Mamadou Diallo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                Email de connexion
              </label>
              <input
                id="email"
                required
                type="email"
                maxLength={254}
                autoComplete="email"
                placeholder="vous@exemple.gn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-slate-500">
                Utilisé pour vous connecter à l&apos;application
              </p>
            </div>
            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-slate-700">
                Téléphone
              </label>
              <input
                id="phone"
                required
                type="tel"
                maxLength={20}
                autoComplete="tel"
                placeholder="+224 620 00 00 00"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-slate-400">Format Guinée : +224 6XX XX XX XX</p>
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                Mot de passe de connexion
              </label>
              <div className="relative">
                <input
                  id="password"
                  required
                  type={showPassword ? 'text' : 'password'}
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  placeholder="8 caractères, lettre + chiffre"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  aria-label={showPassword ? 'Masquer' : 'Afficher'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {password.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs">
                  <li className={passwordChecks.length ? 'text-emerald-600' : 'text-slate-400'}>
                    {passwordChecks.length ? '✓' : '○'} Au moins 8 caractères
                  </li>
                  <li className={passwordChecks.letter ? 'text-emerald-600' : 'text-slate-400'}>
                    {passwordChecks.letter ? '✓' : '○'} Une lettre
                  </li>
                  <li className={passwordChecks.digit ? 'text-emerald-600' : 'text-slate-400'}>
                    {passwordChecks.digit ? '✓' : '○'} Un chiffre
                  </li>
                  <li className={passwordChecks.noSpace ? 'text-emerald-600' : 'text-slate-400'}>
                    {passwordChecks.noSpace ? '✓' : '○'} Sans espaces
                  </li>
                </ul>
              )}
              {validatePassword(password) && password.length > 0 && (
                <p className="mt-1 text-xs text-amber-600">{validatePassword(password)}</p>
              )}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-slate-700">
                Confirmer le mot de passe
              </label>
              <input
                id="confirmPassword"
                required
                type="password"
                maxLength={128}
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
              />
              {confirmPassword.length > 0 && (
                <p
                  className={`mt-1 text-xs ${passwordChecks.match ? 'text-emerald-600' : 'text-red-500'}`}
                >
                  {passwordChecks.match
                    ? '✓ Les mots de passe correspondent'
                    : 'Les mots de passe ne correspondent pas'}
                </p>
              )}
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
              <KeyRound className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                <span className="font-semibold">Important :</span> notez ce mot de passe. Il ne
                sera pas renvoyé par email. Utilisez « Mot de passe oublié » sur la page de
                connexion si besoin.
              </p>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="font-semibold text-slate-800">2. Livraison et paiement</h2>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Mode de livraison</label>
              <div className="space-y-2">
                {DELIVERY_OPTIONS.map(({ id, label, description, delay }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setDeliveryMethod(id)}
                    className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${
                      deliveryMethod === id
                        ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600 ring-offset-1'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <Package className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                    <div>
                      <p className="font-semibold text-slate-900">{label}</p>
                      <p className="text-xs text-slate-500">{description}</p>
                      <p className="mt-0.5 text-xs font-medium text-indigo-600">{delay}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {needsAddress && (
              <>
                <div>
                  <label htmlFor="address" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Adresse complète
                  </label>
                  <input
                    id="address"
                    required
                    maxLength={200}
                    autoComplete="street-address"
                    placeholder="Quartier, rue, numéro..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="city" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Ville
                  </label>
                  <input
                    id="city"
                    required
                    maxLength={60}
                    autoComplete="address-level2"
                    placeholder="Conakry"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </>
            )}

            <PaymentMethodPicker
              value={paymentMethod}
              onChange={setPaymentMethod}
              phone={paymentPhone || phone}
              onPhoneChange={setPaymentPhone}
            />

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Carte multiservice</span>
                <span className="font-semibold">{formatCurrency(CARD_PRICE)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-slate-100 pt-2">
                <span className="font-semibold text-slate-900">Total</span>
                <span className="text-lg font-bold text-indigo-600">{formatCurrency(CARD_PRICE)}</span>
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <input
                type="checkbox"
                required
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-600">
                J&apos;accepte les{' '}
                <span className="font-medium text-slate-800">conditions générales</span> et la{' '}
                <span className="font-medium text-slate-800">politique de confidentialité</span>.
                Je certifie que les informations fournies sont exactes.
              </span>
            </label>

            <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-500">
              <Lock className="h-4 w-4 shrink-0" />
              Paiement sécurisé. Vos données ne sont jamais stockées en clair.
            </div>
          </>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          {step === 2 && (
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={submitting}
              className="flex-1 rounded-xl border border-slate-200 py-3.5 font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Retour
            </button>
          )}
          <button
            type="submit"
            disabled={submitting || (step === 2 && !acceptTerms)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              'Traitement sécurisé...'
            ) : step === 1 ? (
              'Continuer'
            ) : (
              `Payer ${formatCurrency(CARD_PRICE)}`
            )}
          </button>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Déjà un compte ?{' '}
        <Link to="/connexion" className="font-medium text-indigo-600">
          Se connecter
        </Link>
        <span className="mx-2 text-slate-300">·</span>
        <Link to="/mot-de-passe-oublie" className="font-medium text-slate-500 hover:text-indigo-600">
          Mot de passe oublié
        </Link>
      </p>
    </div>
  )
}
