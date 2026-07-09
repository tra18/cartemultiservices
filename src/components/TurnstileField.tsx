import { useEffect, useRef } from 'react'
import { TURNSTILE_SITE_KEY } from '../services/orderFormSecurity'

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, options: Record<string, unknown>) => string
      remove: (id: string) => void
      reset: (id: string) => void
    }
    onTurnstileLoad?: () => void
  }
}

interface TurnstileFieldProps {
  onToken: (token: string) => void
}

let scriptLoading = false

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve()
  if (scriptLoading) {
    return new Promise((resolve) => {
      const previous = window.onTurnstileLoad
      window.onTurnstileLoad = () => {
        previous?.()
        resolve()
      }
    })
  }

  scriptLoading = true
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.onload = () => {
      window.onTurnstileLoad?.()
      resolve()
    }
    script.onerror = () => reject(new Error('Turnstile load failed'))
    document.head.appendChild(script)
  })
}

export function TurnstileField({ onToken }: TurnstileFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !containerRef.current) return

    let cancelled = false

    const mount = async () => {
      try {
        await loadTurnstileScript()
        if (cancelled || !containerRef.current || !window.turnstile) return

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: 'light',
          callback: (token: string) => onToken(token),
          'expired-callback': () => onToken(''),
          'error-callback': () => onToken(''),
        })
      } catch {
        onToken('')
      }
    }

    void mount()

    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = undefined
      }
    }
  }, [onToken])

  if (!TURNSTILE_SITE_KEY) return null

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="mb-2 text-center text-xs text-slate-500">Vérification anti-robot</p>
      <div ref={containerRef} className="flex justify-center" />
    </div>
  )
}
