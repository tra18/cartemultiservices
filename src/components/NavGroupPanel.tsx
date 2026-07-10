import { NavLink } from 'react-router-dom'
import type { NavGroup } from '../navigation/types'

type ShellAccent = 'indigo' | 'emerald' | 'violet'

const accentStyles: Record<
  ShellAccent,
  { active: string; idle: string; hover: string; panel: string }
> = {
  indigo: {
    active: 'bg-white text-indigo-700 shadow-sm ring-1 ring-indigo-100',
    idle: 'text-slate-600',
    hover: 'hover:bg-white/80 hover:text-indigo-700',
    panel: 'border-indigo-100/80 bg-indigo-50/40',
  },
  emerald: {
    active: 'bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-100',
    idle: 'text-slate-600',
    hover: 'hover:bg-white/80 hover:text-emerald-700',
    panel: 'border-emerald-100/80 bg-emerald-50/40',
  },
  violet: {
    active: 'bg-white text-violet-700 shadow-sm ring-1 ring-violet-100',
    idle: 'text-slate-600',
    hover: 'hover:bg-white/80 hover:text-violet-700',
    panel: 'border-violet-100/80 bg-violet-50/40',
  },
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
  const itemPadding = variant === 'sheet' ? 'px-3 py-3' : 'px-3 py-2.5'

  return (
    <div className={variant === 'sidebar' ? 'space-y-4' : 'space-y-3'}>
      {groups.map((group) => (
        <section
          key={group.id}
          className={`rounded-2xl border p-2 ${styles.panel}`}
        >
          <div className="px-2 pb-2 pt-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
              {group.label}
            </p>
            {group.description && (
              <p className="mt-0.5 text-[11px] leading-snug text-slate-400">{group.description}</p>
            )}
          </div>
          <div className="space-y-0.5">
            {group.items.map(({ to, label, icon: Icon, end, shortLabel }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                title={label}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl text-sm font-medium transition ${itemPadding} ${
                    isActive ? styles.active : `${styles.idle} ${styles.hover}`
                  }`
                }
              >
                <Icon className="h-[1.15rem] w-[1.15rem] shrink-0 opacity-80" />
                <span className="min-w-0 flex-1 leading-snug">
                  <span className="block truncate">{label}</span>
                  {shortLabel && variant === 'sheet' && (
                    <span className="block truncate text-[10px] font-normal text-slate-400 sm:hidden">
                      {shortLabel}
                    </span>
                  )}
                </span>
              </NavLink>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
