import { useCallback, useRef, useState } from 'react'
import { CardPinModal } from '../components/CardPinModal'
import { useAuth } from '../context/AuthContext'

export function useCardPinGate() {
  const { verifyCardPin } = useAuth()
  const [open, setOpen] = useState(false)
  const [pinError, setPinError] = useState('')
  const callbackRef = useRef<((pin: string) => void) | null>(null)

  const requestPin = useCallback((onVerified: (pin: string) => void) => {
    callbackRef.current = onVerified
    setPinError('')
    setOpen(true)
  }, [])

  const handlePinSubmit = useCallback(
    (pin: string) => {
      const err = verifyCardPin(pin)
      if (err) {
        setPinError(err)
        return
      }
      setOpen(false)
      setPinError('')
      callbackRef.current?.(pin)
    },
    [verifyCardPin]
  )

  const PinModal = (
    <CardPinModal
      open={open}
      error={pinError}
      onClose={() => {
        setOpen(false)
        setPinError('')
      }}
      onSubmit={handlePinSubmit}
    />
  )

  return { requestPin, PinModal }
}
