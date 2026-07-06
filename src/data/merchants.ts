import type { Category } from '../types'
import { loadMerchants } from '../store/platformStore'

export const MERCHANTS: Record<Category, string[]> = {
  restaurants: ['Riviera Restaurant', 'Le Damier', 'Café de Paris', 'Restaurant Le Loft'],
  transport: ['SOTRA', 'Taxi Conakry', 'Total Guinée', 'Shell Guinée'],
  vetements: ['Conakry Mall', 'Boutique Kaloum', 'Marché Madina', 'Fashion Guinée'],
  courses: ['Prodimar', 'Score', 'Enco', 'Marché Niger'],
}

export function getMerchantsForCategory(category: Category): string[] {
  const registered = loadMerchants()
    .filter((m) => m.registrationPaid && m.categories.includes(category))
    .map((m) => m.businessName)
  return [...new Set([...MERCHANTS[category], ...registered])]
}
