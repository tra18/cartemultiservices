import {
  Baby,
  CreditCard,
  Fuel,
  Globe,
  History,
  Home,
  LayoutDashboard,
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
    id: 'espace',
    label: 'Mon espace',
    description: 'Vue d’ensemble et profil',
    items: [
      { to: CLIENT_DASHBOARD_PATH, label: 'Tableau de bord', icon: LayoutDashboard, end: true },
      { to: '/profil', label: 'Mon profil', icon: User },
      { to: '/ma-famille', label: 'Ma famille (mineurs)', icon: Baby },
    ],
  },
  {
    id: 'paiements',
    label: 'Paiements & transactions',
    description: 'Payer, recharger et suivre',
    items: [
      { to: '/scanner', label: 'Scanner QR', icon: QrCode, shortLabel: 'Paiement rapide' },
      { to: '/payer', label: 'Payer un commerçant', icon: ShoppingBag },
      { to: '/recharger', label: 'Recharger ma carte', icon: PlusCircle },
      { to: '/carburant', label: 'Achat carburant', icon: Fuel },
      { to: '/historique', label: 'Historique des opérations', icon: History },
    ],
  },
  {
    id: 'diaspora',
    label: 'Diaspora',
    description: 'Recharge depuis l’étranger',
    items: [
      { to: '/recharger-diaspora', label: 'Recharger depuis l’étranger', icon: Globe },
    ],
  },
  {
    id: 'carte',
    label: 'Carte & sécurité',
    description: 'Commande, activation et protection',
    items: [
      { to: '/ma-commande', label: 'Suivi de ma commande', icon: Package },
      { to: '/activer-carte', label: 'Activer ma carte', icon: CreditCard },
      { to: '/securite-carte', label: 'Sécurité & code PIN', icon: Shield },
      { to: '/commander-remplacement', label: 'Carte de remplacement', icon: CreditCard },
    ],
  },
]
