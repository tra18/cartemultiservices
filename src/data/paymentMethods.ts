import { CreditCard, Smartphone } from 'lucide-react'

export type PaymentMethodId = 'orange-money' | 'mobile-money' | 'visa' | 'mastercard'

export interface PaymentMethodOption {
  id: PaymentMethodId
  label: string
  description: string
  icon: typeof CreditCard | typeof Smartphone
  color: string
  needsPhone: boolean
}

export const PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    id: 'orange-money',
    label: 'Orange Money',
    description: 'Paiement via Orange Guinée',
    icon: Smartphone,
    color: 'border-orange-500 bg-orange-50',
    needsPhone: true,
  },
  {
    id: 'mobile-money',
    label: 'Mobile Money',
    description: 'MTN MoMo et autres opérateurs',
    icon: Smartphone,
    color: 'border-yellow-500 bg-yellow-50',
    needsPhone: true,
  },
  {
    id: 'visa',
    label: 'Visa',
    description: 'Carte Visa internationale',
    icon: CreditCard,
    color: 'border-blue-600 bg-blue-50',
    needsPhone: false,
  },
  {
    id: 'mastercard',
    label: 'Mastercard',
    description: 'Carte Mastercard internationale',
    icon: CreditCard,
    color: 'border-red-500 bg-red-50',
    needsPhone: false,
  },
]

export function getPaymentMethodLabel(id: PaymentMethodId): string {
  return PAYMENT_METHODS.find((m) => m.id === id)?.label ?? id
}
