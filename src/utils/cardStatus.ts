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

export function isCardActive(
  user: Pick<UserAccount, 'id' | 'cardStatus'> | null | undefined
): boolean {
  return resolveCardStatus(user) === 'active' && user?.cardStatus !== 'blocked'
}
