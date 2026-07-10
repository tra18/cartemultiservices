import { Building2, CreditCard, Globe, Wallet } from 'lucide-react'

export type DiasporaPaymentMethodId = 'visa' | 'mastercard' | 'paypal' | 'bank-transfer'

export interface DiasporaPaymentMethod {
  id: DiasporaPaymentMethodId
  label: string
  description: string
  icon: typeof CreditCard | typeof Building2 | typeof Globe | typeof Wallet
  color: string
}

export const DIASPORA_PAYMENT_METHODS: DiasporaPaymentMethod[] = [
  {
    id: 'visa',
    label: 'Visa',
    description: 'Carte Visa internationale (EUR, USD, etc.)',
    icon: CreditCard,
    color: 'border-blue-600 bg-blue-50',
  },
  {
    id: 'mastercard',
    label: 'Mastercard',
    description: 'Carte Mastercard internationale',
    icon: CreditCard,
    color: 'border-red-500 bg-red-50',
  },
  {
    id: 'paypal',
    label: 'PayPal',
    description: 'Compte PayPal (EUR, USD, CAD, GBP…)',
    icon: Wallet,
    color: 'border-sky-600 bg-sky-50',
  },
  {
    id: 'bank-transfer',
    label: 'Virement bancaire',
    description: 'Virement SEPA ou international vers la Guinée',
    icon: Building2,
    color: 'border-slate-400 bg-slate-50',
  },
]

export const DIASPORA_PAYMENT_LABELS: Record<DiasporaPaymentMethodId, string> = {
  visa: 'Visa diaspora',
  mastercard: 'Mastercard diaspora',
  paypal: 'PayPal diaspora',
  'bank-transfer': 'Virement diaspora',
}

export const DIASPORA_COUNTRIES = [
  { code: 'FR', label: 'France' },
  { code: 'US', label: 'États-Unis' },
  { code: 'CA', label: 'Canada' },
  { code: 'BE', label: 'Belgique' },
  { code: 'DE', label: 'Allemagne' },
  { code: 'ES', label: 'Espagne' },
  { code: 'IT', label: 'Italie' },
  { code: 'GB', label: 'Royaume-Uni' },
  { code: 'SN', label: 'Sénégal' },
  { code: 'CI', label: "Côte d'Ivoire" },
  { code: 'ML', label: 'Mali' },
  { code: 'OTHER', label: 'Autre pays' },
] as const

export function getDiasporaPaymentLabel(id: DiasporaPaymentMethodId): string {
  return DIASPORA_PAYMENT_LABELS[id] ?? id
}
