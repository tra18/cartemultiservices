export interface WalletProvisionInput {
  userId: string
  email: string
  fullName: string
  cardNumber: string
}

async function readWalletError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string }
    return data.error ?? 'Impossible d’ajouter la carte au portefeuille'
  } catch {
    return 'Impossible d’ajouter la carte au portefeuille'
  }
}

export async function provisionAppleWallet(input: WalletProvisionInput): Promise<void> {
  const response = await fetch('/api/wallet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ platform: 'apple', ...input }),
  })

  if (!response.ok) {
    throw new Error(await readWalletError(response))
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)

  if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    window.location.assign(url)
  } else {
    const link = document.createElement('a')
    link.href = url
    link.download = 'guinee-multiservices.pkpass'
    link.click()
  }

  setTimeout(() => URL.revokeObjectURL(url), 15_000)
}

export async function provisionGoogleWallet(input: WalletProvisionInput): Promise<void> {
  const response = await fetch('/api/wallet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ platform: 'google', ...input }),
  })

  if (!response.ok) {
    throw new Error(await readWalletError(response))
  }

  const data = (await response.json()) as { saveUrl?: string }
  if (!data.saveUrl) {
    throw new Error('Lien Google Wallet indisponible')
  }

  window.location.assign(data.saveUrl)
}
