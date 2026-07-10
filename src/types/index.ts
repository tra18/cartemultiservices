export type Category =
  | 'restaurants'
  | 'transport'
  | 'vetements'
  | 'courses'
  | 'hopitaux'
  | 'cliniques'
  | 'pharmacies'

export type TransactionType = 'recharge' | 'paiement'

export interface Transaction {
  id: string
  type: TransactionType
  category?: Category
  merchant?: string
  detail?: string
  amount: number
  date: string
  method?: string
}

export const CATEGORY_LABELS: Record<Category, string> = {
  restaurants: 'Restaurants',
  transport: 'Transport',
  vetements: 'Vêtements',
  courses: 'Courses',
  hopitaux: 'Hôpitaux',
  cliniques: 'Cliniques',
  pharmacies: 'Pharmacies',
}

export const CATEGORY_DESCRIPTIONS: Record<Category, string> = {
  restaurants: 'Restaurants, cafés et cantines',
  transport: 'Bus, métro, taxi et carburant',
  vetements: 'Boutiques et magasins de mode',
  courses: 'Supermarchés et épiceries',
  hopitaux: 'Hôpitaux publics et privés',
  cliniques: 'Cliniques et centres médicaux',
  pharmacies: 'Pharmacies et parapharmacies',
}

export function formatCategoryList(categories: Category[]): string {
  return categories.map((c) => CATEGORY_LABELS[c]).join(', ')
}
