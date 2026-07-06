import type { CardOrderFormData } from '../types/order'
import {
  sanitizeOrderFormData,
  validateEmail,
  validateFullName,
  validateGuineaPhone,
  validatePassword,
  validateAddress,
  validateCity,
  normalizeEmail,
} from './validation'
import { checkRateLimit } from './formSecurity'

export function validateAndSanitizeOrderData(
  data: CardOrderFormData & { needsAddress: boolean; addressFallback: string }
): { success: true; data: CardOrderFormData } | { success: false; error: string } {
  const rateErr = checkRateLimit()
  if (rateErr) return { success: false, error: rateErr }

  const errors = [
    validateFullName(data.fullName),
    validateEmail(data.email),
    validateGuineaPhone(data.phone),
    validatePassword(data.password),
    data.needsAddress ? validateAddress(data.address) : null,
    data.needsAddress ? validateCity(data.city) : null,
  ].filter(Boolean)

  if (errors.length > 0) {
    return { success: false, error: errors[0]! }
  }

  const sanitized = sanitizeOrderFormData({
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    password: data.password,
    confirmPassword: data.password,
    address: data.address,
    city: data.city,
    needsAddress: data.needsAddress,
    paymentNeedsPhone: false,
    deliveryMethod: data.deliveryMethod,
    paymentMethod: data.paymentMethod,
    addressFallback: data.addressFallback,
  })

  return {
    success: true,
    data: {
      fullName: sanitized.fullName,
      email: sanitized.email,
      phone: sanitized.phone,
      password: sanitized.password,
      address: sanitized.address,
      city: sanitized.city,
      deliveryMethod: data.deliveryMethod,
      paymentMethod: sanitized.paymentMethod,
    },
  }
}

export function isEmailTaken(email: string, existingEmails: string[]): boolean {
  const normalized = normalizeEmail(email)
  return existingEmails.some((e) => normalizeEmail(e) === normalized)
}
