import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'

type BackToHomeLinkProps = {
  variant?: 'link' | 'button'
  className?: string
}

export function BackToHomeLink({ variant = 'button', className = '' }: BackToHomeLinkProps) {
  const base =
    variant === 'button'
      ? 'flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50'
      : 'inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-800'

  return (
    <Link to="/" className={`${base} ${className}`.trim()}>
      <Home className="h-4 w-4" />
      Retour à l&apos;accueil
    </Link>
  )
}
