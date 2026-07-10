import {
  ArrowDownToLine,
  History,
  Layers,
  LayoutDashboard,
  QrCode,
} from 'lucide-react'
import type { NavGroup, ShellNavItem } from './types'

export const merchantMobileBar: ShellNavItem[] = [
  { to: '/commercant', label: 'Accueil', icon: LayoutDashboard, end: true },
  { to: '/commercant/encaisser', label: 'Encaisser', icon: QrCode },
  { to: '/commercant/historique', label: 'Ventes', icon: History },
]

export const merchantNavGroups: NavGroup[] = [
  {
    id: 'vue',
    label: 'Vue d’ensemble',
    description: 'Activité et indicateurs',
    items: [
      { to: '/commercant', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
    ],
  },
  {
    id: 'ventes',
    label: 'Ventes & encaissement',
    description: 'QR code et historique',
    items: [
      { to: '/commercant/encaisser', label: 'Encaisser un paiement', icon: QrCode },
      { to: '/commercant/historique', label: 'Historique des ventes', icon: History },
    ],
  },
  {
    id: 'compte',
    label: 'Gestion du compte',
    description: 'Catégories et retraits',
    items: [
      { to: '/commercant/categories', label: 'Catégories de vente', icon: Layers },
      { to: '/commercant/retraits', label: 'Demandes de retrait', icon: ArrowDownToLine },
    ],
  },
]
