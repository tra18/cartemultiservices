import { Outlet } from 'react-router-dom'
import {
  ArrowDownToLine,
  History,
  Layers,
  LayoutDashboard,
  LogOut,
  QrCode,
} from 'lucide-react'
import { AppShell } from '../AppShell'
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

  const header = (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <PlatformLogo size="sm" />
        <div className="min-w-0">
          <h1 className="truncate text-sm font-bold text-slate-900 sm:text-base">Portail Commerçant</h1>
          <p className="truncate text-xs text-slate-500">
            {PLATFORM_NAME} · {currentMerchant?.businessName}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={logout}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600"
        title="Déconnexion"
      >
        <LogOut className="h-5 w-5" />
      </button>
    </div>
  )

  return (
    <AppShell header={header} navItems={navItems} accent="emerald" width="app">
      <Outlet />
    </AppShell>
  )
}
