import {
  CreditCard,
  Fuel,
  History,
  Home,
  Package,
  PlusCircle,
  QrCode,
  Shield,
  ShoppingBag,
  User,
} from 'lucide-react'
import { CLIENT_DASHBOARD_PATH } from '../constants/brand'
import type { NavGroup, ShellNavItem } from './types'

export const clientMobileBar: ShellNavItem[] = [
  { to: CLIENT_DASHBOARD_PATH, label: 'Accueil', icon: Home, end: true },
  { to: '/scanner', label: 'Scanner', icon: QrCode },
  { to: '/payer', label: 'Payer', icon: ShoppingBag },
  { to: '/recharger', label: 'Recharger', icon: PlusCircle },
]

export const clientNavGroups: NavGroup[] = [
  {
    id: 'principal',
    label: 'Principal',
    items: [{ to: CLIENT_DASHBOARD_PATH, label: 'Tableau de bord', icon: Home, end: true }],
  },
  {
    id: 'paiements',
    label: 'Paiements',
    items: [
      { to: '/scanner', label: 'Scanner QR', icon: QrCode },
      { to: '/payer', label: 'Payer', icon: ShoppingBag },
      { to: '/recharger', label: 'Recharger', icon: PlusCircle },
      { to: '/carburant', label: 'Carburant', icon: Fuel },
      { to: '/historique', label: 'Historique', icon: History },
    ],
  },
  {
    id: 'carte',
    label: 'Ma carte',
    items: [
      { to: '/profil', label: 'Mon profil', icon: User },
      { to: '/ma-commande', label: 'Ma commande', icon: Package },
      { to: '/activer-carte', label: 'Activer la carte', icon: CreditCard },
      { to: '/securite-carte', label: 'Sécurité & PIN', icon: Shield },
      { to: '/commander-remplacement', label: 'Carte de remplacement', icon: CreditCard },
    ],
  },
]
