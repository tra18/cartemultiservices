import { createContext, useContext, type ReactNode } from 'react'
import type { Category } from '../types'
import { formatCurrency } from '../utils/currency'
import { useAuth } from './AuthContext'

interface CardContextValue {
  cardNumber: string
  holderName: string
  balance: number
  transactions: import('../types').Transaction[]
  recharge: (amount: number, method: string, pin: string) => boolean
  pay: (
    category: Category,
    merchant: string,
    amount: number,
    pin: string,
    detail?: string
  ) => boolean
  formatCurrency: (amount: number) => string
}

const CardContext = createContext<CardContextValue | null>(null)

export function CardProvider({ children }: { children: ReactNode }) {
  const { currentUser, recharge, pay } = useAuth()

  if (!currentUser) return null

  const value: CardContextValue = {
    cardNumber: currentUser.cardNumber,
    holderName: currentUser.fullName,
    balance: currentUser.balance,
    transactions: currentUser.transactions,
    recharge,
    pay,
    formatCurrency,
  }

  return <CardContext.Provider value={value}>{children}</CardContext.Provider>
}

export function useCard() {
  const ctx = useContext(CardContext)
  if (!ctx) throw new Error('useCard must be used within CardProvider')
  return ctx
}
