import { Briefcase, ClipboardList, UserPlus, UserRound, Wallet } from 'lucide-react'
import { ADMIN_BASE_PATH } from '../constants/brand'
import type { NavGroup, ShellNavItem } from './types'

export const adminMobileBar: ShellNavItem[] = [
  { to: ADMIN_BASE_PATH, label: 'Commandes', icon: ClipboardList, end: true },
  { to: `${ADMIN_BASE_PATH}/comptes`, label: 'Comptes', icon: UserRound },
  { to: `${ADMIN_BASE_PATH}/carrieres`, label: 'Carrières', icon: Briefcase },
]

export const adminNavGroups: NavGroup[] = [
  {
    id: 'clients',
    label: 'Clients & commandes',
    items: [
      { to: ADMIN_BASE_PATH, label: 'Commandes cartes', icon: ClipboardList, end: true },
      { to: `${ADMIN_BASE_PATH}/comptes`, label: 'Comptes clients', icon: UserRound },
    ],
  },
  {
    id: 'finances',
    label: 'Finances',
    items: [{ to: `${ADMIN_BASE_PATH}/finances`, label: 'Finances & retraits', icon: Wallet }],
  },
  {
    id: 'carrieres',
    label: 'Carrières',
    items: [
      { to: `${ADMIN_BASE_PATH}/carrieres`, label: 'Offres d\'emploi', icon: Briefcase },
      { to: `${ADMIN_BASE_PATH}/candidatures`, label: 'Candidatures', icon: UserPlus },
    ],
  },
]
