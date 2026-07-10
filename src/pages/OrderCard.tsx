import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle, CreditCard, Eye, EyeOff, KeyRound, Lock, Mail, Package, Shield, UserPlus } from 'lucide-react'
import { BackToHomeLink } from '../components/BackToHomeLink'
import { PaymentMethodPicker } from '../components/PaymentMethodPicker'
import { TurnstileField } from '../components/TurnstileField'
import { DELIVERY_OPTIONS } from '../data/deliveryMethods'
import { getPaymentMethodLabel, PAYMENT_METHODS, type PaymentMethodId } from '../data/paymentMethods'
import { useAuth } from '../context/AuthContext'
import type { DeliveryMethod } from '../types/order'
import { formatCurrency } from '../utils/currency'
import { fetchOrderFormChallenge } from '../services/orderFormSecurity'
import {
  checkFormTiming,
  checkHoneypot,
  checkRateLimit,
  recordFailedAttempt,
} from '../utils/formSecurity'
import { validateOrderStep1, validateOrderStep2, validatePassword } from '../utils/validation'
import { CARD_PRICE } from '../utils/pricing'

export function OrderCard() {
  const { orderCard, currentUser } = useAuth()
  const navigate = useNavigate()
  const isExistingAccount = Boolean(currentUser)
  const formStartedAt = useRef(Date.now())
  const [challengeToken, setChallengeToken] = useState('')
  const [turnstileRequired, setTurnstileRequired] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [challengeError, setChallengeError] = useState('')
  const [challengeLoading, setChallengeLoading] = useState(true)
  const [step, setStep] = useState(() => (currentUser ? 2 : 1))
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

  const loadChallenge = useCallback(async () => {
    setChallengeLoading(true)
    setChallengeError('')
    const result = await fetchOrderFormChallenge()
    if (!result.challenge) {
      setChallengeError(result.error ?? 'Impossible de sécuriser le formulaire')
      setChallengeToken('')
      setTurnstileRequired(false)
    } else {
      setChallengeToken(result.challenge.token)
      setTurnstileRequired(result.challenge.turnstileRequired)
      formStartedAt.current = Date.now()
    }
    setTurnstileToken('')
    setChallengeLoading(false)
  }, [])

  useEffect(() => {
    void loadChallenge()
  }, [loadChallenge])

  useEffect(() => {
    if (!currentUser) return
    setFullName(currentUser.fullName)
    setEmail(currentUser.email)
    setPhone(currentUser.phone)
    setStep(2)
  }, [currentUser])

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

    if (step === 1) {
      const step1Err = validateOrderStep1({ fullName, email, phone, password, confirmPassword })
      if (step1Err) {
        setError(step1Err)
        return
      }
      setStep(2)
      return
    }

    if (!challengeToken) {
      setError(challengeError || 'Formulaire non sécurisé. Rechargez la page.')
      return
    }

    if (turnstileRequired && !turnstileToken) {
      setError('Complétez la vérification anti-robot.')
      return
    }

    if (isExistingAccount && (!fullName.trim() || !phone.trim())) {
      setError('Nom et téléphone requis')
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

    const result = await orderCard(
      {
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
      },
      {
        challengeToken,
        formStartedAt: formStartedAt.current,
        honeypot,
        turnstileToken: turnstileToken || undefined,
      }
    )

    setSubmitting(false)

    if (!result.success) {
      setError(result.error ?? 'Commande échouée')
      recordFailedAttempt()
      await loadChallenge()
      return
    }

    setOrderId(result.order?.id ?? '')
    setOrderEmail(email.trim().toLowerCase())
    setStep(3)
  }

  if (step === 3) {
    return (
      <div className="page-container flex min-h-[70vh] items-center justify-center py-8">
        <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50 px-6 py-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white">
              <CheckCircle className="h-8 w-8" strokeWidth={2.25} />
            </div>
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">
              Commande confirmée
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Votre carte multiservice a été commandée pour{' '}
              <span className="font-semibold text-slate-900">{formatCurrency(CARD_PRICE)}</span>
            </p>
            {orderId && (
              <p className="mt-3 inline-block rounded-full border border-slate-200 bg-white px-3 py-1 font-mono text-xs text-slate-600">
                Réf. {orderId.slice(0, 8).toUpperCase()}
              </p>
            )}
          </div>

          <div className="space-y-4 px-6 py-6 text-left">
            {!isExistingAccount && (
              <div className="flex gap-3 rounded-xl border border-slate-200 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
                  <UserPlus className="h-4 w-4" />
                </div>
                <div className="min-w-0 text-sm">
                  <p className="font-semibold text-slate-900">Compte client créé</p>
                  <p className="mt-1 text-slate-600">
                    Connectez-vous avec <span className="font-medium text-slate-900">{orderEmail}</span>{' '}
                    et le mot de passe choisi à la commande.
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Un email de bienvenue vous a été envoyé.
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3 rounded-xl border border-slate-200 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <Mail className="h-4 w-4" />
              </div>
              <div className="min-w-0 text-sm">
                <p className="font-semibold text-slate-900">Code d&apos;activation envoyé</p>
                <p className="mt-1 text-slate-600">
                  Consultez votre boîte mail : un code à 6 caractères vous permettra d&apos;activer
                  la carte à réception.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">Prochaines étapes</p>
              <ol className="mt-3 space-y-3">
                {!isExistingAccount && (
                  <li className="flex gap-3 text-sm text-slate-600">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
                      1
                    </span>
                    <span>Conservez votre mot de passe en lieu sûr</span>
                  </li>
                )}
                <li className="flex gap-3 text-sm text-slate-600">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
                    {!isExistingAccount ? 2 : 1}
                  </span>
                  <span>Attendez la livraison de votre carte (2 à 5 jours ouvrés)</span>
                </li>
                <li className="flex gap-3 text-sm text-slate-600">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
                    {!isExistingAccount ? 3 : 2}
                  </span>
                  <span>Connectez-vous, puis activez la carte avec le QR et le code reçu par email</span>
                </li>
              </ol>
            </div>
          </div>

          <div className="border-t border-slate-100 px-6 py-5">
            <button
              type="button"
              onClick={() => navigate('/ma-commande')}
              className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Suivre ma commande
            </button>
          </div>
        </div>
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
        {(isExistingAccount ? [2] : [1, 2]).map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full ${step >= s ? 'bg-indigo-600' : 'bg-slate-200'}`}
          />
        ))}
      </div>

      {isExistingAccount && (
        <div className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-800">
          <p className="font-semibold text-indigo-900">Compte connecté</p>
          <p className="mt-1">
            Commande pour <span className="font-medium">{currentUser?.email}</span>. Complétez la
            livraison et le paiement ci-dessous.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {(challengeLoading || challengeError) && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              challengeError
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}
          >
            {challengeError ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span>{challengeError}</span>
                <button
                  type="button"
                  onClick={() => void loadChallenge()}
                  className="font-medium text-indigo-600 hover:text-indigo-700"
                >
                  Réessayer
                </button>
              </div>
            ) : (
              'Initialisation du formulaire sécurisé…'
            )}
          </div>
        )}

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
            <h2 className="font-semibold text-slate-800">
              {isExistingAccount ? 'Livraison et paiement' : '2. Livraison et paiement'}
            </h2>

            {isExistingAccount && (
              <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                <div>
                  <label htmlFor="existing-fullName" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Nom complet
                  </label>
                  <input
                    id="existing-fullName"
                    required
                    maxLength={80}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="existing-phone" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Téléphone
                  </label>
                  <input
                    id="existing-phone"
                    required
                    type="tel"
                    maxLength={20}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Email du compte : <span className="font-medium">{email}</span>
                </p>
              </div>
            )}

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

            <TurnstileField onToken={setTurnstileToken} />

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
          {step === 2 && !isExistingAccount && (
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
            disabled={
              submitting ||
              challengeLoading ||
              !challengeToken ||
              (step === 2 && !acceptTerms) ||
              (step === 2 && turnstileRequired && !turnstileToken)
            }
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

        <BackToHomeLink className="mt-3" />
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        {isExistingAccount ? (
          <>
            Besoin d&apos;aide ?{' '}
            <Link to="/ma-commande" className="font-medium text-indigo-600">
              Ma commande
            </Link>
          </>
        ) : (
          <>
            Déjà un compte ?{' '}
            <Link to="/connexion" className="font-medium text-indigo-600">
              Se connecter
            </Link>
            <span className="mx-2 text-slate-300">·</span>
            <Link to="/mot-de-passe-oublie" className="font-medium text-slate-500 hover:text-indigo-600">
              Mot de passe oublié
            </Link>
          </>
        )}
      </p>
    </div>
  )
}
