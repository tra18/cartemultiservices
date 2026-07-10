import { Briefcase, ClipboardList, UserPlus, UserRound, Wallet } from 'lucide-react'
import { ADMIN_BASE_PATH } from '../constants/brand'
import type { NavGroup, ShellNavItem } from './types'

export const adminMobileBar: ShellNavItem[] = [
  { to: ADMIN_BASE_PATH, label: 'Commandes', icon: ClipboardList, end: true },
  { to: `${ADMIN_BASE_PATH}/comptes`, label: 'Comptes', icon: UserRound },
  { to: `${ADMIN_BASE_PATH}/finances`, label: 'Finances', icon: Wallet },
]

export const adminNavGroups: NavGroup[] = [
  {
    id: 'clients',
    label: 'Clients & cartes',
    description: 'Commandes et comptes utilisateurs',
    items: [
      { to: ADMIN_BASE_PATH, label: 'Commandes de cartes', icon: ClipboardList, end: true },
      { to: `${ADMIN_BASE_PATH}/comptes`, label: 'Comptes clients', icon: UserRound },
    ],
  },
  {
    id: 'finances',
    label: 'Finances',
    description: 'Trésorerie et retraits',
    items: [
      { to: `${ADMIN_BASE_PATH}/finances`, label: 'Finances & retraits', icon: Wallet },
    ],
  },
  {
    id: 'rh',
    label: 'Ressources humaines',
    description: 'Recrutement et candidatures',
    items: [
      { to: `${ADMIN_BASE_PATH}/carrieres`, label: 'Offres d’emploi', icon: Briefcase },
      { to: `${ADMIN_BASE_PATH}/candidatures`, label: 'Candidatures reçues', icon: UserPlus },
    ],
  },
]
