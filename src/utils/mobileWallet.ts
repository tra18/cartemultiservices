export type MobileWalletKind = 'apple' | 'google'

export interface WalletPlatformHint {
  isIOS: boolean
  isAndroid: boolean
  preferredWallet: MobileWalletKind | null
  isMobile: boolean
}

export function detectWalletPlatform(): WalletPlatformHint {
  if (typeof navigator === 'undefined') {
    return { isIOS: false, isAndroid: false, preferredWallet: null, isMobile: false }
  }

  const ua = navigator.userAgent
  const isIOS = /iPhone|iPad|iPod/i.test(ua)
  const isAndroid = /Android/i.test(ua)
  const isMobile = isIOS || isAndroid

  let preferredWallet: MobileWalletKind | null = null
  if (isIOS) preferredWallet = 'apple'
  else if (isAndroid) preferredWallet = 'google'

  return { isIOS, isAndroid, preferredWallet, isMobile }
}

export function formatWalletAddedDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
