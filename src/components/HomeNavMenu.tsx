import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { HomeNavGroup } from '../navigation/homeNav'

interface HomeNavMenuProps {
  groups: HomeNavGroup[]
  variant: 'desktop' | 'mobile'
  onNavigate?: () => void
}

function NavLinkItem({
  href,
  label,
  external,
  className,
  onClick,
}: {
  href: string
  label: string
  external?: boolean
  className: string
  onClick?: () => void
}) {
  if (external) {
    return (
      <Link to={href} className={className} onClick={onClick}>
        {label}
      </Link>
    )
  }
  return (
    <a href={href} className={className} onClick={onClick}>
      {label}
    </a>
  )
}

export function HomeNavMenu({ groups, variant, onNavigate }: HomeNavMenuProps) {
  const [openDesktop, setOpenDesktop] = useState<string | null>(null)
  const [expandedMobile, setExpandedMobile] = useState<Set<string>>(() => new Set([groups[0]?.id]))

  if (variant === 'desktop') {
    return (
      <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigation principale">
        {groups.map((group) => (
          <div
            key={group.id}
            className="relative"
            onMouseEnter={() => setOpenDesktop(group.id)}
            onMouseLeave={() => setOpenDesktop(null)}
          >
            <button
              type="button"
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 hover:text-stone-900"
              aria-expanded={openDesktop === group.id}
              aria-haspopup="true"
              onClick={() => setOpenDesktop((id) => (id === group.id ? null : group.id))}
            >
              {group.label}
              <ChevronDown
                className={`h-4 w-4 text-stone-400 transition-transform ${openDesktop === group.id ? 'rotate-180' : ''}`}
              />
            </button>

            {openDesktop === group.id && (
              <div className="absolute left-0 top-full z-50 mt-1 min-w-[13rem] rounded-xl border border-stone-200 bg-white py-1.5 shadow-lg">
                {group.description && (
                  <p className="px-3 pb-1 pt-2 text-[11px] text-stone-400">{group.description}</p>
                )}
                <ul role="menu">
                  {group.links.map(({ href, label, external }) => (
                    <li key={href} role="none">
                      <NavLinkItem
                        href={href}
                        label={label}
                        external={external}
                        className="block px-3 py-2.5 text-sm font-medium text-stone-600 transition hover:bg-stone-50 hover:text-stone-900"
                        onClick={() => {
                          setOpenDesktop(null)
                          onNavigate?.()
                        }}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </nav>
    )
  }

  return (
    <div className="space-y-1">
      {groups.map((group) => {
        const isOpen = expandedMobile.has(group.id)
        return (
          <div key={group.id} className="overflow-hidden rounded-xl border border-stone-200 bg-white">
            <button
              type="button"
              onClick={() =>
                setExpandedMobile((prev) => {
                  const next = new Set(prev)
                  if (next.has(group.id)) next.delete(group.id)
                  else next.add(group.id)
                  return next
                })
              }
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold text-stone-800"
            >
              <span>
                {group.label}
                {group.description && (
                  <span className="mt-0.5 block text-[11px] font-normal text-stone-400">
                    {group.description}
                  </span>
                )}
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isOpen && (
              <ul className="border-t border-stone-100 py-1" role="group" aria-label={group.label}>
                {group.links.map(({ href, label, external }) => (
                  <li key={href}>
                    <NavLinkItem
                      href={href}
                      label={label}
                      external={external}
                      className="block px-4 py-2.5 pl-6 text-sm font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                      onClick={onNavigate}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}
