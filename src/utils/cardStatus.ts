import { getCardOrderByUserId } from '../store/orderStore'
import type { CardStatus } from '../types/order'
import type { UserAccount } from '../types/auth'

/** Statut réel en croisant compte client et commande carte */
export function resolveCardStatus(
  user: Pick<UserAccount, 'id' | 'cardStatus'> | null | undefined
): CardStatus {
  if (!user) return 'none'

  if (user.cardStatus === 'blocked') return 'blocked'

  const order = getCardOrderByUserId(user.id)

  if (user.cardStatus === 'active' || order?.cardActivated) {
    return 'active'
  }
  if (order?.status === 'shipped' || order?.status === 'delivered') {
    return 'shipped'
  }
  if (order?.status === 'processing' || order?.status === 'paid') {
    return 'ordered'
  }

  return user.cardStatus
}

export function isPhysicalCardActive(
  user: Pick<UserAccount, 'id' | 'cardStatus'> | null | undefined
): boolean {
  return resolveCardStatus(user) === 'active' && user?.cardStatus !== 'blocked'
}

export function isDigitalCardActive(
  user: Pick<UserAccount, 'id' | 'cardStatus' | 'digitalCardEnabledAt' | 'digitalCardNumber'> | null | undefined
): boolean {
  if (!user || user.cardStatus === 'blocked') return false
  if (isPhysicalCardActive(user)) return false
  return Boolean(user.digitalCardEnabledAt && user.digitalCardNumber)
}

/** Carte utilisable : physique activée ou carte numérique active */
export function isCardUsable(
  user: Pick<
    UserAccount,
    'id' | 'cardStatus' | 'digitalCardEnabledAt' | 'digitalCardNumber'
  > | null | undefined
): boolean {
  if (!user || user.cardStatus === 'blocked') return false
  return isPhysicalCardActive(user) || isDigitalCardActive(user)
}

/** @deprecated Préférer isPhysicalCardActive ou isCardUsable */
export function isCardActive(
  user: Pick<UserAccount, 'id' | 'cardStatus'> | null | undefined
): boolean {
  return isPhysicalCardActive(user)
}

export function canEnableDigitalCard(
  user: Pick<UserAccount, 'id' | 'cardStatus' | 'digitalCardEnabledAt'> | null | undefined
): boolean {
  if (!user || user.digitalCardEnabledAt) return false
  if (isPhysicalCardActive(user)) return false

  const order = getCardOrderByUserId(user.id)
  if (!order || order.cardActivated) return false

  return ['paid', 'processing', 'shipped', 'delivered'].includes(order.status)
}

export function getEffectiveCardNumber(
  user: Pick<UserAccount, 'id' | 'cardStatus' | 'cardNumber' | 'digitalCardNumber' | 'digitalCardEnabledAt'> | null | undefined
): string {
  if (!user) return '•••• •••• •••• ••••'
  if (isPhysicalCardActive(user) && user.cardNumber && user.cardNumber !== 'En attente de carte') {
    return user.cardNumber
  }
  if (user.digitalCardNumber) return user.digitalCardNumber
  return user.cardNumber
}
