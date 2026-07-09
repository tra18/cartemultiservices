export interface OrderFormSecurityPayload {
  challengeToken: string
  formStartedAt: number
  honeypot: string
  turnstileToken?: string
}

export interface OrderFormChallenge {
  token: string
  issuedAt: number
  minDurationMs: number
  turnstileRequired: boolean
}

export const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined

export async function fetchOrderFormChallenge(): Promise<{
  challenge: OrderFormChallenge | null
  error?: string
}> {
  const response = await fetch('/api/order-form-challenge')
  if (!response.ok) {
    try {
      const data = (await response.json()) as { error?: string }
      return { challenge: null, error: data.error ?? 'Impossible de sécuriser le formulaire' }
    } catch {
      return { challenge: null, error: 'Impossible de sécuriser le formulaire' }
    }
  }

  const challenge = (await response.json()) as OrderFormChallenge
  return { challenge }
}
