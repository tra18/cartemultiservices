import { X } from 'lucide-react'
import { NavGroupPanel } from './NavGroupPanel'
import type { NavGroup } from '../navigation/types'

type ShellAccent = 'indigo' | 'emerald' | 'violet'

interface MobileNavSheetProps {
  open: boolean
  onClose: () => void
  groups: NavGroup[]
  accent: ShellAccent
  title?: string
  subtitle?: string
}

export function MobileNavSheet({
  open,
  onClose,
  groups,
  accent,
  title = 'Menu',
  subtitle = 'Navigation par famille',
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
      <div className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-3xl bg-slate-50 shadow-2xl safe-bottom">
        <div className="shrink-0 border-b border-slate-200 bg-white px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-slate-900">{title}</p>
              <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto p-4">
          <NavGroupPanel groups={groups} accent={accent} variant="sheet" onNavigate={onClose} />
        </div>
      </div>
    </div>
  )
}
