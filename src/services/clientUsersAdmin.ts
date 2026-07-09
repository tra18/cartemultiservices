import { getAdminAuthHeaders } from './apiClient'
import type { CardOrderStatus, CardOrderType, CardStatus } from '../types/order'

export interface AdminClientUser {
  id: string
  email: string
  fullName: string
  phone: string
  cardNumber: string
  balance: number
  cardStatus: CardStatus
  blockReason?: 'loss' | 'pin_attempts' | 'manual'
  blockedAt?: string
  cardReplacementCount?: number
  pinFailedAttempts?: number
  walletAppleAddedAt?: string
  walletGoogleAddedAt?: string
  digitalCardNumber?: string
  digitalCardEnabledAt?: string
  transactionCount: number
  hasPin: boolean
  hasOrder: boolean
  orderId?: string
  orderStatus?: CardOrderStatus | string
  orderType?: CardOrderType
}

export async function fetchAdminClientUsers(): Promise<{
  users: AdminClientUser[]
  total: number
  error?: string
}> {
  const response = await fetch('/api/client-users-admin', {
    headers: getAdminAuthHeaders(),
  })

  if (!response.ok) {
    try {
      const data = (await response.json()) as { error?: string }
      return { users: [], total: 0, error: data.error ?? 'Chargement des comptes échoué' }
    } catch {
      return { users: [], total: 0, error: 'Chargement des comptes échoué' }
    }
  }

  const data = (await response.json()) as { users: AdminClientUser[]; total: number }
  return { users: data.users ?? [], total: data.total ?? 0 }
}
