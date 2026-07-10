import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { AppShell } from '../AppShell'
import { PlatformLogo } from '../PlatformLogo'
import { PLATFORM_NAME } from '../../constants/brand'
import { useMerchantAuth } from '../../context/MerchantAuthContext'
import { merchantMobileBar, merchantNavGroups } from '../../navigation/merchantNav'

export function MerchantLayout() {
  const { currentMerchant, logout, refreshMerchant } = useMerchantAuth()
  const location = useLocation()

  useEffect(() => {
    if (!currentMerchant) return
    void refreshMerchant()
  }, [currentMerchant, refreshMerchant, location.pathname])

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
    <AppShell
      header={header}
      navGroups={merchantNavGroups}
      mobileBar={merchantMobileBar}
      accent="emerald"
      width="app"
    >
      <Outlet />
    </AppShell>
  )
}
