import { useMemo, useState } from 'react'
import { Menu } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { MobileNavSheet } from './MobileNavSheet'
import { NavGroupPanel } from './NavGroupPanel'
import type { NavGroup, ShellNavItem } from '../navigation/types'

export type { ShellNavItem } from '../navigation/types'

type ShellAccent = 'indigo' | 'emerald' | 'violet'

const accentStyles: Record<
  ShellAccent,
  { active: string; menuActive: string }
> = {
  indigo: {
    active: 'bg-indigo-50 text-indigo-600',
    menuActive: 'bg-indigo-50 text-indigo-600',
  },
  emerald: {
    active: 'bg-emerald-50 text-emerald-600',
    menuActive: 'bg-emerald-50 text-emerald-600',
  },
  violet: {
    active: 'bg-violet-50 text-violet-600',
    menuActive: 'bg-violet-50 text-violet-600',
  },
}

interface AppShellProps {
  header: React.ReactNode
  navGroups: NavGroup[]
  mobileBar: ShellNavItem[]
  menuTitle?: string
  accent?: ShellAccent
  width?: 'app' | 'admin'
  children: React.ReactNode
}

function pathMatches(pathname: string, to: string, end?: boolean) {
  if (end) return pathname === to
  return pathname === to || pathname.startsWith(`${to}/`)
}

export function AppShell({
  header,
  navGroups,
  mobileBar,
  menuTitle = 'Menu',
  accent = 'indigo',
  width = 'app',
  children,
}: AppShellProps) {
  const styles = accentStyles[accent]
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const maxWidth =
    width === 'admin'
      ? 'max-w-7xl'
      : 'max-w-lg md:max-w-2xl lg:max-w-6xl'

  const menuActive = useMemo(
    () =>
      navGroups.some((group) =>
        group.items.some((item) => pathMatches(location.pathname, item.to, item.end))
      ),
    [navGroups, location.pathname]
  )

  const shortcutActive = useMemo(
    () =>
      mobileBar.some((item) => pathMatches(location.pathname, item.to, item.end)),
    [mobileBar, location.pathname]
  )

  return (
    <div className={`mx-auto flex min-h-screen w-full flex-col ${maxWidth} lg:min-h-screen lg:flex-row`}>
      {/* Navigation latérale — tablette / desktop */}
      <aside className="hidden lg:flex lg:w-60 lg:shrink-0 lg:flex-col lg:border-r lg:border-slate-200 lg:bg-slate-50/60 xl:w-72">
        <div className="border-b border-slate-200/80 bg-white p-4">{header}</div>
        <nav className="flex flex-1 flex-col overflow-y-auto p-3">
          <NavGroupPanel groups={navGroups} accent={accent} variant="sidebar" />
        </nav>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {/* En-tête mobile / tablette */}
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur-md safe-top sm:px-6 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">{header}</div>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                menuActive && !shortcutActive ? styles.menuActive : 'text-slate-500 hover:bg-slate-100'
              }`}
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="shell-main flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          {children}
        </main>

        {/* Barre du bas — raccourcis mobiles */}
        <nav className="sticky bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur-md safe-bottom lg:hidden">
          <div className="flex justify-around gap-0.5 px-1 py-1.5 sm:px-2 sm:py-2">
            {mobileBar.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                title={label}
                className={({ isActive }) =>
                  `flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium leading-tight transition sm:gap-1 sm:px-2 sm:py-2 sm:text-xs ${
                    isActive ? styles.active : 'text-slate-500 hover:text-slate-700'
                  }`
                }
              >
                <Icon className="h-5 w-5 shrink-0 sm:h-[1.35rem] sm:w-[1.35rem]" />
                <span className="max-w-[4.25rem] truncate text-center">{label}</span>
              </NavLink>
            ))}
            <button
              type="button"
              title="Menu complet"
              onClick={() => setMenuOpen(true)}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium leading-tight transition sm:gap-1 sm:px-2 sm:py-2 sm:text-xs ${
                menuActive && !shortcutActive ? styles.menuActive : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Menu className="h-5 w-5 shrink-0 sm:h-[1.35rem] sm:w-[1.35rem]" />
              <span className="max-w-[4.25rem] truncate text-center">Menu</span>
            </button>
          </div>
        </nav>
      </div>

      <MobileNavSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        groups={navGroups}
        accent={accent}
        title={menuTitle}
        subtitle="Sections regroupées par famille"
      />
    </div>
  )
}
