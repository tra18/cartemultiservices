import type { Transaction } from './index'
import type { CardStatus } from './order'

export interface UserAccount {
  id: string
  email: string
  /** @deprecated Jamais renvoyé par le serveur — auth côté API uniquement */
  password?: string
  fullName: string
  phone: string
  cardNumber: string
  balance: number
  transactions: Transaction[]
  cardStatus: CardStatus
  /** Code PIN carte — 4 chiffres */
  cardPin?: string
  pinFailedAttempts?: number
  /** Date d'ajout au portefeuille Apple */
  walletAppleAddedAt?: string
  /** Date d'ajout au portefeuille Google */
  walletGoogleAddedAt?: string
  /** Carte numérique provisoire (en attendant la carte physique) */
  digitalCardNumber?: string
  digitalCardEnabledAt?: string
}

export interface RegisterData {
  fullName: string
  email: string
  phone: string
  password: string
}
