import { PLATFORM_LOGO, PLATFORM_NAME } from '../constants/brand'

interface PlatformLogoProps {
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
  className?: string
}

const sizes = {
  sm: { img: 'h-9 w-9', text: 'text-sm' },
  md: { img: 'h-12 w-12', text: 'text-lg' },
  lg: { img: 'h-20 w-20', text: 'text-2xl' },
}

export function PlatformLogo({ size = 'md', showName = false, className = '' }: PlatformLogoProps) {
  const s = sizes[size]

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src={PLATFORM_LOGO}
        alt={PLATFORM_NAME}
        className={`${s.img} shrink-0 rounded-xl object-contain`}
      />
      {showName && (
        <span className={`font-bold leading-tight text-slate-900 ${s.text}`}>
          {PLATFORM_NAME}
        </span>
      )}
    </div>
  )
}
