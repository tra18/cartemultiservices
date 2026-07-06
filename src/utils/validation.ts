const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
const GUINEA_PHONE_REGEX = /^(\+224|00224)?[6-7]\d{8}$/
const NAME_REGEX = /^[\p{L}\s'-]{2,80}$/u
const CITY_REGEX = /^[\p{L}\s'-]{2,60}$/u
const SAFE_TEXT_REGEX = /^[\p{L}\p{N}\s.,'°/-]{5,200}$/u

export function sanitizeText(value: string, maxLength = 200): string {
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/[<>"'`;(){}[\]\\]/g, '')
    .trim()
    .slice(0, maxLength)
}

export function normalizeEmail(email: string): string {
  return sanitizeText(email, 254).toLowerCase()
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\s/g, '')
  if (digits.startsWith('00224')) return `+${digits.slice(2)}`
  if (digits.startsWith('224') && !digits.startsWith('+')) return `+${digits}`
  if (digits.startsWith('6') || digits.startsWith('7')) return `+224${digits}`
  return digits
}

export function validateFullName(name: string): string | null {
  const clean = sanitizeText(name, 80)
  if (clean.length < 2) return 'Le nom doit contenir au moins 2 caractères'
  if (!NAME_REGEX.test(clean)) return 'Le nom contient des caractères non autorisés'
  return null
}

export function validateEmail(email: string): string | null {
  const clean = normalizeEmail(email)
  if (!clean) return 'L\'email est requis'
  if (clean.length > 254) return 'Email trop long'
  if (!EMAIL_REGEX.test(clean)) return 'Format d\'email invalide'
  return null
}

export function validateGuineaPhone(phone: string): string | null {
  const normalized = normalizePhone(phone)
  const test = normalized.replace(/\s/g, '')
  if (!GUINEA_PHONE_REGEX.test(test)) {
    return 'Numéro invalide. Format attendu : +224 6XX XX XX XX'
  }
  return null
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return 'Le mot de passe doit contenir au moins 8 caractères'
  }
  if (password.length > 128) return 'Mot de passe trop long'
  if (!/[a-zA-Z]/.test(password)) return 'Le mot de passe doit contenir une lettre'
  if (!/[0-9]/.test(password)) return 'Le mot de passe doit contenir un chiffre'
  if (/\s/.test(password)) return 'Le mot de passe ne doit pas contenir d\'espaces'
  return null
}

export function validateAddress(address: string): string | null {
  const clean = sanitizeText(address, 200)
  if (clean.length < 5) return 'Adresse trop courte (5 caractères minimum)'
  if (!SAFE_TEXT_REGEX.test(clean)) return 'L\'adresse contient des caractères non autorisés'
  return null
}

export function validateCity(city: string): string | null {
  const clean = sanitizeText(city, 60)
  if (!CITY_REGEX.test(clean)) return 'Nom de ville invalide'
  return null
}

export interface OrderFormValidationInput {
  fullName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  address: string
  city: string
  needsAddress: boolean
  paymentPhone?: string
  paymentNeedsPhone: boolean
}

export function validateOrderStep1(input: Pick<
  OrderFormValidationInput,
  'fullName' | 'email' | 'phone' | 'password' | 'confirmPassword'
>): string | null {
  return (
    validateFullName(input.fullName) ??
    validateEmail(input.email) ??
    validateGuineaPhone(input.phone) ??
    validatePassword(input.password) ??
    (input.password !== input.confirmPassword
      ? 'Les mots de passe ne correspondent pas'
      : null)
  )
}

export function validateOrderStep2(input: OrderFormValidationInput): string | null {
  if (input.needsAddress) {
    const addrErr = validateAddress(input.address) ?? validateCity(input.city)
    if (addrErr) return addrErr
  }
  if (input.paymentNeedsPhone && input.paymentPhone) {
    const phoneErr = validateGuineaPhone(input.paymentPhone)
    if (phoneErr) return `Téléphone paiement : ${phoneErr}`
  }
  return null
}

export function sanitizeOrderFormData(input: OrderFormValidationInput & {
  deliveryMethod: string
  paymentMethod: string
  addressFallback: string
}) {
  return {
    fullName: sanitizeText(input.fullName, 80),
    email: normalizeEmail(input.email),
    phone: normalizePhone(input.phone),
    password: input.password,
    address: input.needsAddress
      ? sanitizeText(input.address, 200)
      : sanitizeText(input.addressFallback, 200),
    city: sanitizeText(input.city, 60),
    deliveryMethod: input.deliveryMethod,
    paymentMethod: sanitizeText(input.paymentMethod, 50),
  }
}
