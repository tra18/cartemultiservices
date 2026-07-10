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

const DEFAULT_ERROR = 'Impossible de sécuriser le formulaire. Réessayez ou rechargez la page.'

function mapChallengeError(status: number, serverError?: string): string {
  if (serverError) return serverError
  if (status === 503) {
    return 'Service temporairement indisponible. Réessayez dans quelques instants.'
  }
  if (status === 429) {
    return 'Trop de tentatives. Réessayez plus tard.'
  }
  if (status === 404) {
    return 'Service de commande introuvable. Rechargez la page.'
  }
  return DEFAULT_ERROR
}

export async function fetchOrderFormChallenge(): Promise<{
  challenge: OrderFormChallenge | null
  error?: string
}> {
  try {
    const response = await fetch('/api/order-form-challenge', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })

    let data: Partial<OrderFormChallenge> & { error?: string } = {}
    try {
      data = (await response.json()) as typeof data
    } catch {
      if (!response.ok) {
        return { challenge: null, error: mapChallengeError(response.status) }
      }
      return { challenge: null, error: DEFAULT_ERROR }
    }

    if (!response.ok) {
      return { challenge: null, error: mapChallengeError(response.status, data.error) }
    }

    if (!data.token || typeof data.issuedAt !== 'number') {
      return { challenge: null, error: DEFAULT_ERROR }
    }

    return { challenge: data as OrderFormChallenge }
  } catch {
    return {
      challenge: null,
      error: 'Connexion au serveur impossible. Vérifiez votre réseau et réessayez.',
    }
  }
}
