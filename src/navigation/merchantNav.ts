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
    id: 'principal',
    label: 'Principal',
    items: [
      { to: '/commercant', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
    ],
  },
  {
    id: 'encaissement',
    label: 'Encaissement',
    items: [
      { to: '/commercant/encaisser', label: 'Encaisser', icon: QrCode },
      { to: '/commercant/historique', label: 'Historique des ventes', icon: History },
    ],
  },
  {
    id: 'gestion',
    label: 'Gestion',
    items: [
      { to: '/commercant/categories', label: 'Catégories', icon: Layers },
      { to: '/commercant/retraits', label: 'Retraits', icon: ArrowDownToLine },
    ],
  },
]
