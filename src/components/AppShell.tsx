import { useMemo, useState } from 'react'
import { Menu } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { MobileNavSheet } from './MobileNavSheet'
import type { NavGroup, ShellNavItem } from '../navigation/types'

export type { ShellNavItem } from '../navigation/types'

type ShellAccent = 'indigo' | 'emerald' | 'violet'

const accentStyles: Record<
  ShellAccent,
  { active: string; sideActive: string; sideHover: string; menuActive: string }
> = {
  indigo: {
    active: 'bg-indigo-50 text-indigo-600',
    sideActive: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    sideHover: 'hover:bg-indigo-50/80 hover:text-indigo-700',
    menuActive: 'bg-indigo-50 text-indigo-600',
  },
  emerald: {
    active: 'bg-emerald-50 text-emerald-600',
    sideActive: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    sideHover: 'hover:bg-emerald-50/80 hover:text-emerald-700',
    menuActive: 'bg-emerald-50 text-emerald-600',
  },
  violet: {
    active: 'bg-violet-50 text-violet-600',
    sideActive: 'bg-violet-50 text-violet-700 border-violet-200',
    sideHover: 'hover:bg-violet-50/80 hover:text-violet-700',
    menuActive: 'bg-violet-50 text-violet-600',
  },
}

interface AppShellProps {
  header: React.ReactNode
  navGroups: NavGroup[]
  mobileBar: ShellNavItem[]
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

  const mobileBarPaths = useMemo(
    () => new Set(mobileBar.map((item) => item.to)),
    [mobileBar]
  )

  const overflowItems = useMemo(
    () =>
      navGroups.flatMap((group) =>
        group.items.filter((item) => !mobileBarPaths.has(item.to))
      ),
    [navGroups, mobileBarPaths]
  )

  const showMobileMenu = overflowItems.length > 0

  const overflowActive = overflowItems.some((item) =>
    pathMatches(location.pathname, item.to, item.end)
  )

  return (
    <div className={`mx-auto flex min-h-screen w-full flex-col ${maxWidth} lg:min-h-screen lg:flex-row`}>
      {/* Navigation latérale — tablette / desktop */}
      <aside className="hidden lg:flex lg:w-56 lg:shrink-0 lg:flex-col lg:border-r lg:border-slate-200 lg:bg-white xl:w-64">
        <div className="border-b border-slate-100 p-4">{header}</div>
        <nav className="flex flex-1 flex-col gap-5 overflow-y-auto p-3">
          {navGroups.map((group) => (
            <div key={group.id}>
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                        isActive
                          ? styles.sideActive
                          : `border-transparent text-slate-600 ${styles.sideHover}`
                      }`
                    }
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="truncate">{label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {/* En-tête mobile / tablette */}
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur-md safe-top sm:px-6 lg:hidden">
          {header}
        </header>

        <main className="shell-main flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          {children}
        </main>

        {/* Barre du bas — mobile */}
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
            {showMobileMenu && (
              <button
                type="button"
                title="Menu"
                onClick={() => setMenuOpen(true)}
                className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium leading-tight transition sm:gap-1 sm:px-2 sm:py-2 sm:text-xs ${
                  overflowActive || menuOpen
                    ? styles.menuActive
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Menu className="h-5 w-5 shrink-0 sm:h-[1.35rem] sm:w-[1.35rem]" />
                <span className="max-w-[4.25rem] truncate text-center">Menu</span>
              </button>
            )}
          </div>
        </nav>
      </div>

      {showMobileMenu && (
        <MobileNavSheet
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          groups={navGroups}
          accent={accent}
        />
      )}
    </div>
  )
}
