const PIN_REGEX = /^\d{4}$/

export function validateCardPin(pin: string): string | null {
  if (!PIN_REGEX.test(pin)) {
    return 'Le code PIN doit contenir exactement 4 chiffres'
  }
  if (pin === '0000' || pin === '1234') {
    return 'Choisissez un code PIN plus sécurisé (évitez 0000, 1234)'
  }
  return null
}

export function pinsMatch(pin: string, confirm: string): string | null {
  if (pin !== confirm) return 'Les codes PIN ne correspondent pas'
  return validateCardPin(pin)
}
