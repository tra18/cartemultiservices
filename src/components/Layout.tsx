import { History, Home, LogOut, PlusCircle, QrCode, ShoppingBag, Store, User } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'
import { AppShell } from './AppShell'
import { PlatformLogo } from './PlatformLogo'
import { PLATFORM_NAME, CLIENT_DASHBOARD_PATH } from '../constants/brand'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: CLIENT_DASHBOARD_PATH, label: 'Accueil', icon: Home, end: true },
  { to: '/scanner', label: 'Scanner', icon: QrCode },
  { to: '/recharger', label: 'Recharger', icon: PlusCircle },
  { to: '/payer', label: 'Payer', icon: ShoppingBag },
  { to: '/historique', label: 'Historique', icon: History },
  { to: '/profil', label: 'Profil', icon: User },
]

export function Layout() {
  const { currentUser, logout } = useAuth()

  const header = (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <PlatformLogo size="sm" />
        <div className="min-w-0">
          <Link to="/profil" className="block hover:opacity-80">
            <h1 className="truncate text-sm font-bold text-slate-900 sm:text-base">
              {PLATFORM_NAME}
            </h1>
            <p className="truncate text-xs text-slate-500">
              {currentUser?.fullName} · GNF
            </p>
          </Link>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
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
  )

  return (
    <AppShell header={header} navItems={navItems} accent="indigo" width="app">
      <Outlet />
    </AppShell>
  )
}
