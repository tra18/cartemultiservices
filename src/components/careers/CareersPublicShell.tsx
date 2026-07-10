import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PlatformLogo } from '../PlatformLogo'
import { PLATFORM_NAME } from '../../constants/brand'

interface CareersPublicShellProps {
  children: React.ReactNode
  backTo?: string
  backLabel?: string
}

export function CareersPublicShell({
  children,
  backTo = '/carrieres',
  backLabel = 'Toutes les offres',
}: CareersPublicShellProps) {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur-md safe-top">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <PlatformLogo size="sm" />
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-semibold text-stone-900">{PLATFORM_NAME}</p>
              <p className="truncate text-[11px] uppercase tracking-[0.16em] text-stone-500">
                Carrières
              </p>
            </div>
          </Link>
          <Link
            to={backTo}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{backLabel}</span>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8 sm:py-10">{children}</main>
    </div>
  )
}
