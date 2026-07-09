import { useEffect, useRef } from 'react'
import {
  IDLE_ACTIVITY_EVENTS,
  IDLE_TIMEOUT_MS,
  clearUserActivity,
  getIdleElapsedMs,
  markUserActivity,
} from '../constants/session'

const ACTIVITY_THROTTLE_MS = 30_000
const CHECK_INTERVAL_MS = 60_000

interface UseIdleTimeoutOptions {
  enabled: boolean
  timeoutMs?: number
  onIdle: () => void
}

export function useIdleTimeout({
  enabled,
  timeoutMs = IDLE_TIMEOUT_MS,
  onIdle,
}: UseIdleTimeoutOptions) {
  const onIdleRef = useRef(onIdle)
  onIdleRef.current = onIdle

  useEffect(() => {
    if (!enabled) {
      clearUserActivity()
      return
    }

    if (getIdleElapsedMs() === 0) {
      markUserActivity()
    }

    const triggerIdle = () => {
      clearUserActivity()
      onIdleRef.current()
    }

    const checkIdle = () => {
      const elapsed = getIdleElapsedMs()
      if (elapsed >= timeoutMs) {
        triggerIdle()
      }
    }

    let lastBump = 0
    const onActivity = () => {
      const now = Date.now()
      if (now - lastBump < ACTIVITY_THROTTLE_MS) return
      lastBump = now
      markUserActivity(now)
    }

    checkIdle()

    for (const eventName of IDLE_ACTIVITY_EVENTS) {
      window.addEventListener(eventName, onActivity, { passive: true })
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkIdle()
      }
    }

    document.addEventListener('visibilitychange', onVisibility)
    const interval = window.setInterval(checkIdle, CHECK_INTERVAL_MS)

    return () => {
      for (const eventName of IDLE_ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, onActivity)
      }
      document.removeEventListener('visibilitychange', onVisibility)
      window.clearInterval(interval)
    }
  }, [enabled, timeoutMs])
}
