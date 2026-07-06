import type { Category } from './index'

export type WithdrawalMethod = 'orange-money' | 'mobile-money' | 'bank'
export type WithdrawalStatus = 'pending' | 'completed' | 'rejected'
export type PaymentRequestStatus = 'pending' | 'paid' | 'expired' | 'cancelled'

export interface MerchantSale {
  id: string
  paymentRequestId: string
  amount: number
  customerName: string
  date: string
}

export interface WithdrawalRequest {
  id: string
  amount: number
  method: WithdrawalMethod
  accountNumber: string
  status: WithdrawalStatus
  createdAt: string
  processedAt?: string
}

export interface MerchantAccount {
  id: string
  businessName: string
  email: string
  password: string
  phone: string
  categories: Category[]
  balance: number
  mobileMoneyNumber: string
  bankAccount?: string
  sales: MerchantSale[]
  withdrawals: WithdrawalRequest[]
  registrationPaid: boolean
}

export interface MerchantRegisterData {
  businessName: string
  email: string
  phone: string
  password: string
  categories: Category[]
  mobileMoneyNumber: string
  paymentMethod: string
}

export interface PaymentRequest {
  id: string
  merchantId: string
  merchantName: string
  category: Category
  amount: number
  status: PaymentRequestStatus
  createdAt: string
  expiresAt: string
  paidAt?: string
  paidByUserId?: string
  paidByUserName?: string
}
