export type DeliveryMethod =
  | 'home'
  | 'agency_kaloum'
  | 'agency_ratoma'
  | 'agency_matam'

export type CardOrderStatus =
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'activated'
  | 'delivered'
  | 'cancelled'

export type CardStatus = 'none' | 'ordered' | 'shipped' | 'active' | 'blocked'

export interface CardOrder {
  id: string
  userId: string
  userName: string
  email: string
  phone: string
  address: string
  city: string
  deliveryMethod: DeliveryMethod
  amount: number
  paymentMethod: string
  status: CardOrderStatus
  /** @deprecated Jamais renvoyé par le serveur — code envoyé par email uniquement */
  activationCode?: string
  activationEmailSentAt: string
  cardActivated: boolean
  createdAt: string
  adminApprovedAt?: string
  approvedBy?: string
  rejectedAt?: string
  rejectionReason?: string
  activatedAt?: string
  /** Numéro imprimé sur la carte physique */
  cardNumber?: string
  /** Token unique encodé dans le QR de la carte */
  cardToken?: string
  producedAt?: string
}

export interface CardOrderFormData {
  fullName: string
  email: string
  phone: string
  password: string
  address: string
  city: string
  deliveryMethod: DeliveryMethod
  paymentMethod: string
}
