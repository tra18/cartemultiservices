import { Outlet } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { AppShell } from '../AppShell'
import { PlatformLogo } from '../PlatformLogo'
import { PLATFORM_NAME } from '../../constants/brand'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { adminMobileBar, adminNavGroups } from '../../navigation/adminNav'

export function AdminLayout() {
  const { adminEmail, logout } = useAdminAuth()

  const header = (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <PlatformLogo size="sm" />
        <div className="min-w-0">
          <h1 className="truncate text-sm font-bold text-slate-900 sm:text-base">Administration</h1>
          <p className="truncate text-xs text-slate-500">
            {PLATFORM_NAME} · {adminEmail}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => void logout()}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600"
        title="Déconnexion"
      >
        <LogOut className="h-5 w-5" />
      </button>
    </div>
  )

  return (
    <AppShell
      header={header}
      navGroups={adminNavGroups}
      mobileBar={adminMobileBar}
      accent="violet"
      width="admin"
    >
      <Outlet />
    </AppShell>
  )
}
