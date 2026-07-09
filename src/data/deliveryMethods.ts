import { Building2, MapPin, Truck } from 'lucide-react'
import type { DeliveryMethod } from '../types/order'

export interface DeliveryOption {
  id: DeliveryMethod
  label: string
  description: string
  delay: string
  icon: typeof Truck
}

export const DELIVERY_OPTIONS: DeliveryOption[] = [
  {
    id: 'home',
    label: 'Livraison à domicile',
    description: 'Conakry et environs',
    delay: '3 à 5 jours ouvrés',
    icon: Truck,
  },
  {
    id: 'agency_kaloum',
    label: 'Retrait agence Kaloum',
    description: 'Boulevard du Commerce, Kaloum',
    delay: '2 à 3 jours ouvrés',
    icon: Building2,
  },
  {
    id: 'agency_ratoma',
    label: 'Retrait agence Ratoma',
    description: 'Route de Donka, Ratoma',
    delay: '2 à 3 jours ouvrés',
    icon: Building2,
  },
  {
    id: 'agency_matam',
    label: 'Retrait agence Matam',
    description: 'Marché Matam, Conakry',
    delay: '2 à 3 jours ouvrés',
    icon: MapPin,
  },
]

export const DELIVERY_LABELS: Record<DeliveryMethod, string> = {
  home: 'Livraison à domicile',
  agency_kaloum: 'Agence Kaloum',
  agency_ratoma: 'Agence Ratoma',
  agency_matam: 'Agence Matam',
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending_review: 'En attente de validation',
  approved: 'Validée — en préparation',
  rejected: 'Refusée',
  paid: 'En attente de validation',
  processing: 'En préparation',
  shipped: 'Expédiée / prête au retrait',
  activated: 'Carte activée',
  delivered: 'Carte activée',
  cancelled: 'Annulée',
}
