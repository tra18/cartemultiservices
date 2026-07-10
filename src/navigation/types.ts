import type { LucideIcon } from 'lucide-react'

export interface ShellNavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  shortLabel?: string
}

export interface NavGroup {
  id: string
  label: string
  description?: string
  items: ShellNavItem[]
}

export function filterNavGroups(groups: NavGroup[], excludePaths: Set<string>): NavGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !excludePaths.has(item.to)),
    }))
    .filter((group) => group.items.length > 0)
}
