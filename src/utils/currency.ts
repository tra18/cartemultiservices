export const CURRENCY = 'GNF'
export const MAX_RECHARGE = 5_000_000
export const PRESET_AMOUNTS = [100_000, 250_000, 500_000, 1_000_000]

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-GN', {
    style: 'currency',
    currency: CURRENCY,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatAmountShort(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}K`
  return amount.toString()
}
