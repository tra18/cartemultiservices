import type { UserAccount } from '../types/auth'

export function canOrderReplacementCard(user: UserAccount | null | undefined): boolean {
  return user?.cardStatus === 'blocked' && user?.blockReason === 'loss'
}

export function isBlockedForLoss(user: UserAccount | null | undefined): boolean {
  return user?.cardStatus === 'blocked' && user?.blockReason === 'loss'
}
