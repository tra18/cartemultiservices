import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Store, User } from 'lucide-react'

interface ClientAccessMenuProps {
  variant: 'desktop' | 'mobile' | 'hero' | 'footer'
  onParticulier: () => void
  onNavigate?: () => void
}

const MERCHANT_LOGIN_PATH = '/commercant/connexion'

export function ClientAccessMenu({ variant, onParticulier, onNavigate }: ClientAccessMenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const close = () => setOpen(false)

  const handleParticulier = () => {
    close()
    onNavigate?.()
    onParticulier()
  }

  const handleMerchantNavigate = () => {
    close()
    onNavigate?.()
  }

  if (variant === 'footer') {
    return (
      <ul className="mt-4 space-y-2 text-sm text-stone-600">
        <li>
          <button
            type="button"
            onClick={handleParticulier}
            className="font-medium text-indigo-600 hover:text-indigo-800"
          >
            Particulier
          </button>
        </li>
        <li>
          <Link
            to={MERCHANT_LOGIN_PATH}
            onClick={handleMerchantNavigate}
            className="hover:text-stone-900"
          >
            Commerçant
          </Link>
        </li>
      </ul>
    )
  }

  if (variant === 'mobile') {
    return (
      <section className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <div className="border-b border-stone-100 px-4 py-3">
          <p className="text-sm font-semibold text-stone-800">Accès clients</p>
          <p className="mt-0.5 text-[11px] text-stone-400">Particulier ou commerçant</p>
        </div>
        <div className="space-y-0.5 p-2">
          <button
            type="button"
            onClick={handleParticulier}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-indigo-600 hover:bg-indigo-50"
          >
            <User className="h-5 w-5" />
            Particulier
          </button>
          <Link
            to={MERCHANT_LOGIN_PATH}
            onClick={handleMerchantNavigate}
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            <Store className="h-5 w-5 text-stone-500" />
            Commerçant
          </Link>
        </div>
      </section>
    )
  }

  const triggerClass =
    variant === 'hero'
      ? 'inline-flex items-center justify-center gap-2 rounded-full border border-indigo-300/60 bg-indigo-500/20 px-7 py-3.5 text-sm font-semibold text-indigo-100 transition hover:bg-indigo-500/30'
      : 'inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50'

  const panelClass =
    variant === 'hero'
      ? 'absolute left-0 top-full z-50 mt-2 min-w-[12rem] rounded-xl border border-indigo-200/40 bg-stone-900/95 py-1.5 shadow-xl backdrop-blur-md'
      : 'absolute right-0 top-full z-50 mt-1 min-w-[12rem] rounded-xl border border-stone-200 bg-white py-1.5 shadow-lg'

  return (
    <div
      ref={containerRef}
      className={`relative ${variant === 'hero' ? 'inline-flex' : 'hidden sm:inline-flex'}`}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={triggerClass}
      >
        Accès clients
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className={panelClass} role="menu">
          <p
            className={`px-3 pb-1 pt-2 text-[11px] ${
              variant === 'hero' ? 'text-stone-400' : 'text-stone-400'
            }`}
          >
            Choisir votre espace
          </p>
          <button
            type="button"
            role="menuitem"
            onClick={handleParticulier}
            className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium transition ${
              variant === 'hero'
                ? 'text-indigo-100 hover:bg-white/10'
                : 'text-indigo-600 hover:bg-indigo-50'
            }`}
          >
            <User className="h-4 w-4 shrink-0 opacity-80" />
            Particulier
          </button>
          <Link
            to={MERCHANT_LOGIN_PATH}
            role="menuitem"
            onClick={handleMerchantNavigate}
            className={`flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition ${
              variant === 'hero'
                ? 'text-stone-200 hover:bg-white/10'
                : 'text-stone-700 hover:bg-stone-50'
            }`}
          >
            <Store className="h-4 w-4 shrink-0 opacity-80" />
            Commerçant
          </Link>
        </div>
      )}
    </div>
  )
}
