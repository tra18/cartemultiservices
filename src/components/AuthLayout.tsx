import { Link } from 'react-router-dom'
import { PlatformLogo } from './PlatformLogo'
import { PLATFORM_NAME, PLATFORM_TAGLINE } from '../constants/brand'

export function AuthLayout({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode
  title: string
  subtitle: string
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-slate-50">
      <div className="flex flex-1 flex-col justify-center px-6 py-12">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <PlatformLogo size="lg" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
        </div>
        {children}
      </div>
      <p className="pb-6 text-center text-xs text-slate-400">
        {PLATFORM_NAME} · {PLATFORM_TAGLINE}
      </p>
    </div>
  )
}

export function AuthLink({
  to,
  children,
}: {
  to: string
  children: React.ReactNode
}) {
  return (
    <Link to={to} className="font-medium text-indigo-600 hover:text-indigo-700">
      {children}
    </Link>
  )
}
