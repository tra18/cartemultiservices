export const CARD_PRICE = 100_000
export const MERCHANT_REGISTRATION_PRICE = 200_000

/** Frais commerçant = prix de base × nombre de catégories */
export function calculateMerchantRegistrationPrice(categoryCount: number): number {
  const count = Math.max(1, categoryCount)
  return MERCHANT_REGISTRATION_PRICE * count
}

/** Coût d'une catégorie supplémentaire ajoutée après inscription */
export function calculateAdditionalCategoryPrice(): number {
  return MERCHANT_REGISTRATION_PRICE
}
