import { History, Home, LogOut, PlusCircle, QrCode, ShoppingBag, Store, User } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { PlatformLogo } from './PlatformLogo'
import { PLATFORM_NAME } from '../constants/brand'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/', label: 'Accueil', icon: Home },
  { to: '/scanner', label: 'Scanner', icon: QrCode },
  { to: '/recharger', label: 'Recharger', icon: PlusCircle },
  { to: '/payer', label: 'Payer', icon: ShoppingBag },
  { to: '/historique', label: 'Historique', icon: History },
  { to: '/profil', label: 'Profil', icon: User },
]

export function Layout() {
  const { currentUser, logout } = useAuth()

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 px-4 py-4 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlatformLogo size="sm" />
            <div>
              <Link to="/profil" className="block hover:opacity-80">
                <h1 className="text-base font-bold leading-tight text-slate-900">{PLATFORM_NAME}</h1>
                <p className="text-xs text-slate-500">
                  {currentUser?.fullName} · GNF
                </p>
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <a
              href="/commercant/connexion"
              className="flex h-9 items-center gap-1 rounded-xl px-2 text-xs font-medium text-emerald-600 transition hover:bg-emerald-50"
              title="Portail commerçant"
            >
              <Store className="h-4 w-4" />
              <span className="hidden sm:inline">Commerçant</span>
            </a>
            <button
              type="button"
              onClick={logout}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600"
              title="Déconnexion"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6">
        <Outlet />
      </main>

      <nav className="sticky bottom-0 border-t border-slate-200 bg-white/90 px-2 py-2 backdrop-blur-md">
        <div className="flex justify-around">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600'
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
