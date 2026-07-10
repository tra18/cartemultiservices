import { X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import type { NavGroup } from '../navigation/types'

type ShellAccent = 'indigo' | 'emerald' | 'violet'

const accentActive: Record<ShellAccent, string> = {
  indigo: 'bg-indigo-50 text-indigo-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  violet: 'bg-violet-50 text-violet-700',
}

interface MobileNavSheetProps {
  open: boolean
  onClose: () => void
  groups: NavGroup[]
  accent: ShellAccent
  title?: string
}

export function MobileNavSheet({
  open,
  onClose,
  groups,
  accent,
  title = 'Menu',
}: MobileNavSheetProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        aria-label="Fermer le menu"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white shadow-2xl safe-bottom">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-5 p-4">
          {groups.map((group) => (
            <div key={group.id}>
              <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                {group.label}
              </p>
              <div className="mt-2 space-y-1">
                {group.items.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                        isActive ? accentActive[accent] : 'text-slate-700 hover:bg-slate-50'
                      }`
                    }
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
