export type FuelType = 'essence' | 'diesel'

export interface FuelStation {
  id: string
  name: string
  location: string
}

export const FUEL_STATIONS: FuelStation[] = [
  { id: 'total', name: 'Total Guinée', location: 'Kaloum, Conakry' },
  { id: 'shell', name: 'Shell Guinée', location: 'Ratoma, Conakry' },
  { id: 'oryx', name: 'Oryx Energies', location: 'Matam, Conakry' },
  { id: 'conakry-oil', name: 'Conakry Oil', location: 'Dixinn, Conakry' },
]

export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  essence: 'Essence',
  diesel: 'Diesel',
}

/** Prix au litre en GNF (indicatif) */
export const FUEL_PRICES: Record<FuelType, number> = {
  essence: 12_500,
  diesel: 11_800,
}

export const MIN_FUEL_LITERS = 1
export const MAX_FUEL_LITERS = 200

export function calculateFuelAmount(liters: number, fuelType: FuelType): number {
  return Math.round(liters * FUEL_PRICES[fuelType])
}

export function calculateFuelLiters(amount: number, fuelType: FuelType): number {
  return Math.round((amount / FUEL_PRICES[fuelType]) * 10) / 10
}
