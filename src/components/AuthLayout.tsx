import { CreditCard } from 'lucide-react'
import { Link } from 'react-router-dom'

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
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
            <CreditCard className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
        </div>
        {children}
      </div>
      <p className="pb-6 text-center text-xs text-slate-400">
        Carte Multiservice · Guinée · GNF
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
