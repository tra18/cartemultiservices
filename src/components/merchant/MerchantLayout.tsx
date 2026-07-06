import { NavLink, Outlet } from 'react-router-dom'
import { ArrowDownToLine, History, Layers, LayoutDashboard, LogOut, QrCode } from 'lucide-react'
import { PlatformLogo } from '../PlatformLogo'
import { PLATFORM_NAME } from '../../constants/brand'
import { useMerchantAuth } from '../../context/MerchantAuthContext'

const navItems = [
  { to: '/commercant', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/commercant/encaisser', label: 'Encaisser', icon: QrCode },
  { to: '/commercant/categories', label: 'Catégories', icon: Layers },
  { to: '/commercant/retraits', label: 'Retraits', icon: ArrowDownToLine },
  { to: '/commercant/historique', label: 'Ventes', icon: History },
]

export function MerchantLayout() {
  const { currentMerchant, logout } = useMerchantAuth()

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 px-4 py-4 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlatformLogo size="sm" />
            <div>
              <h1 className="text-base font-bold leading-tight text-slate-900">Portail Commerçant</h1>
              <p className="text-xs text-slate-500">{PLATFORM_NAME} · {currentMerchant?.businessName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600"
            title="Déconnexion"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-6">
        <Outlet />
      </main>

      <nav className="sticky bottom-0 border-t border-slate-200 bg-white/90 px-1 py-2 backdrop-blur-md">
        <div className="flex justify-around">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[10px] font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'text-slate-500 hover:text-slate-700'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
