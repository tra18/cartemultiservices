import { useEffect, useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import type { NavGroup } from '../navigation/types'

type ShellAccent = 'indigo' | 'emerald' | 'violet'

const accentStyles: Record<
  ShellAccent,
  { active: string; idle: string; hover: string; parentActive: string; parentIdle: string; submenu: string }
> = {
  indigo: {
    active: 'bg-indigo-50 text-indigo-700 font-medium',
    idle: 'text-slate-600',
    hover: 'hover:bg-indigo-50/60 hover:text-indigo-700',
    parentActive: 'bg-indigo-50/80 text-indigo-800',
    parentIdle: 'text-slate-700 hover:bg-slate-100/80',
    submenu: 'border-indigo-100',
  },
  emerald: {
    active: 'bg-emerald-50 text-emerald-700 font-medium',
    idle: 'text-slate-600',
    hover: 'hover:bg-emerald-50/60 hover:text-emerald-700',
    parentActive: 'bg-emerald-50/80 text-emerald-800',
    parentIdle: 'text-slate-700 hover:bg-slate-100/80',
    submenu: 'border-emerald-100',
  },
  violet: {
    active: 'bg-violet-50 text-violet-700 font-medium',
    idle: 'text-slate-600',
    hover: 'hover:bg-violet-50/60 hover:text-violet-700',
    parentActive: 'bg-violet-50/80 text-violet-800',
    parentIdle: 'text-slate-700 hover:bg-slate-100/80',
    submenu: 'border-violet-100',
  },
}

function pathMatches(pathname: string, to: string, end?: boolean) {
  if (end) return pathname === to
  return pathname === to || pathname.startsWith(`${to}/`)
}

interface NavGroupPanelProps {
  groups: NavGroup[]
  accent: ShellAccent
  variant?: 'sidebar' | 'sheet'
  onNavigate?: () => void
}

export function NavGroupPanel({
  groups,
  accent,
  variant = 'sidebar',
  onNavigate,
}: NavGroupPanelProps) {
  const styles = accentStyles[accent]
  const location = useLocation()
  const itemPadding = variant === 'sheet' ? 'px-3 py-2.5' : 'px-3 py-2'

  const activeGroupId = useMemo(() => {
    for (const group of groups) {
      if (group.items.some((item) => pathMatches(location.pathname, item.to, item.end))) {
        return group.id
      }
    }
    return null
  }, [groups, location.pathname])

  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    if (activeGroupId) initial.add(activeGroupId)
    else if (groups[0]) initial.add(groups[0].id)
    return initial
  })

  useEffect(() => {
    if (activeGroupId) {
      setExpanded((prev) => new Set([...prev, activeGroupId]))
    }
  }, [activeGroupId])

  const toggleGroup = (groupId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  return (
    <nav className={variant === 'sidebar' ? 'space-y-1' : 'space-y-1.5'} aria-label="Navigation principale">
      {groups.map((group) => {
        const isOpen = expanded.has(group.id)
        const groupActive = group.items.some((item) =>
          pathMatches(location.pathname, item.to, item.end)
        )

        return (
          <div key={group.id} className="overflow-hidden rounded-xl">
            <button
              type="button"
              onClick={() => toggleGroup(group.id)}
              aria-expanded={isOpen}
              className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                groupActive ? styles.parentActive : styles.parentIdle
              }`}
            >
              <span className="min-w-0">
                <span className="block truncate">{group.label}</span>
                {group.description && variant === 'sheet' && (
                  <span className="mt-0.5 block truncate text-[11px] font-normal text-slate-400">
                    {group.description}
                  </span>
                )}
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isOpen && (
              <ul
                className={`ml-3 mt-0.5 space-y-0.5 border-l-2 pl-2 ${styles.submenu}`}
                role="group"
                aria-label={group.label}
              >
                {group.items.map(({ to, label, icon: Icon, end, shortLabel }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={end}
                      title={label}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 rounded-lg text-sm transition ${itemPadding} ${
                          isActive ? styles.active : `${styles.idle} ${styles.hover}`
                        }`
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0 opacity-75" />
                      <span className="min-w-0 flex-1 leading-snug">
                        <span className="block truncate">{label}</span>
                        {shortLabel && variant === 'sheet' && (
                          <span className="block truncate text-[10px] font-normal text-slate-400">
                            {shortLabel}
                          </span>
                        )}
                      </span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </nav>
  )
}
