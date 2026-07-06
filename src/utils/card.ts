export function generateCardNumber(): string {
  const digits = Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join('')
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ')
}

export function generateCardToken(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()
}

export function getCardActivationUrl(cardToken: string): string {
  return `${window.location.origin}/activer-carte?carte=${cardToken}`
}

export function maskCardNumber(cardNumber: string): string {
  const digits = cardNumber.replace(/\s/g, '')
  if (digits.length < 4) return cardNumber
  return `•••• •••• •••• ${digits.slice(-4)}`
}
