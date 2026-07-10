import { Briefcase, Store, User } from 'lucide-react'

export interface HomeNavLink {
  href: string
  label: string
  external?: boolean
}

export interface HomeNavGroup {
  id: string
  label: string
  description?: string
  links: HomeNavLink[]
}

export const HOME_NAV_GROUPS: HomeNavGroup[] = [
  {
    id: 'decouvrir',
    label: 'Découvrir',
    description: 'Services et parcours',
    links: [
      { href: '#services', label: 'Nos services' },
      { href: '#parcours', label: 'Parcours client' },
      { href: '#commercants', label: 'Devenir partenaire' },
      { href: '#diaspora', label: 'Recharge diaspora' },
      { href: '/recharger-diaspora', label: 'Envoyer maintenant', external: true },
    ],
  },
  {
    id: 'entreprise',
    label: 'Entreprise',
    description: 'Recrutement',
    links: [{ href: '/carrieres', label: 'Carrière chez nous', external: true }],
  },
]

export const HOME_ACCESS_LINKS = [
  { href: '/connexion', label: 'Particulier', icon: User, action: 'client' as const },
  { href: '/commercant/connexion', label: 'Commerçant', icon: Store, action: 'merchant' as const },
  { href: '/carrieres', label: 'Carrière chez nous', icon: Briefcase, external: true },
] as const
