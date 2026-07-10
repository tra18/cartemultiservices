import type { LucideIcon } from 'lucide-react'

export interface ShellNavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

export interface NavGroup {
  id: string
  label: string
  items: ShellNavItem[]
}
