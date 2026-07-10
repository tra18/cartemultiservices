import type { LucideIcon } from 'lucide-react'
import {
  Bus,
  Hospital,
  Pill,
  Shirt,
  ShoppingCart,
  Stethoscope,
  UtensilsCrossed,
} from 'lucide-react'
import type { Category } from '../types'
import { CATEGORY_DESCRIPTIONS, CATEGORY_LABELS } from '../types'

export const ALL_CATEGORIES: Category[] = [
  'restaurants',
  'transport',
  'vetements',
  'courses',
  'hopitaux',
  'cliniques',
  'pharmacies',
]

export type PaymentFamilyId = 'quotidien' | 'sante'

export interface PaymentFamily {
  id: PaymentFamilyId
  label: string
  description: string
  categories: Category[]
}

export const PAYMENT_FAMILIES: PaymentFamily[] = [
  {
    id: 'quotidien',
    label: 'Vie quotidienne',
    description: 'Restauration, transport, mode et courses',
    categories: ['restaurants', 'transport', 'vetements', 'courses'],
  },
  {
    id: 'sante',
    label: 'Santé',
    description: 'Hôpitaux, cliniques et pharmacies',
    categories: ['hopitaux', 'cliniques', 'pharmacies'],
  },
]

export const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  restaurants: UtensilsCrossed,
  transport: Bus,
  vetements: Shirt,
  courses: ShoppingCart,
  hopitaux: Hospital,
  cliniques: Stethoscope,
  pharmacies: Pill,
}

export const CATEGORY_TILE_COLORS: Record<Category, string> = {
  restaurants: 'bg-orange-50 text-orange-600 border-orange-100',
  transport: 'bg-blue-50 text-blue-600 border-blue-100',
  vetements: 'bg-pink-50 text-pink-600 border-pink-100',
  courses: 'bg-green-50 text-green-600 border-green-100',
  hopitaux: 'bg-rose-50 text-rose-700 border-rose-100',
  cliniques: 'bg-teal-50 text-teal-700 border-teal-100',
  pharmacies: 'bg-violet-50 text-violet-700 border-violet-100',
}

export function getCategoryMeta(category: Category) {
  return {
    key: category,
    label: CATEGORY_LABELS[category],
    description: CATEGORY_DESCRIPTIONS[category],
    icon: CATEGORY_ICONS[category],
    color: CATEGORY_TILE_COLORS[category],
  }
}

export function getFamilyForCategory(category: Category): PaymentFamily | undefined {
  return PAYMENT_FAMILIES.find((family) => family.categories.includes(category))
}
