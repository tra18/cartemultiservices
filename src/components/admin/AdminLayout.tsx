import { NavLink, Outlet } from 'react-router-dom'
import { ClipboardList, LogOut, Wallet } from 'lucide-react'
import { PlatformLogo } from '../PlatformLogo'
import { PLATFORM_NAME } from '../../constants/brand'
import { useAdminAuth } from '../../context/AdminAuthContext'

export function AdminLayout() {
  const { adminEmail, logout } = useAdminAuth()

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PlatformLogo size="sm" />
            <div>
              <h1 className="text-base font-bold leading-tight text-slate-900">Administration</h1>
              <p className="text-xs text-slate-500">{PLATFORM_NAME} · {adminEmail}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600"
            title="Déconnexion"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <nav className="flex gap-1 border-b border-slate-200 bg-white px-4">
        <NavLink
          to="/admin"
          end
          className={({ isActive }) =>
            `inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
              isActive
                ? 'border-violet-600 text-violet-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`
          }
        >
          <ClipboardList className="h-4 w-4" />
          Commandes cartes
        </NavLink>
        <NavLink
          to="/admin/finances"
          className={({ isActive }) =>
            `inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
              isActive
                ? 'border-violet-600 text-violet-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`
          }
        >
          <Wallet className="h-4 w-4" />
          Finances & retraits
        </NavLink>
      </nav>

      <main className="flex-1 px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
