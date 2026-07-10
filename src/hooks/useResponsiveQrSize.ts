import { useEffect, useState } from 'react'

export function useResponsiveQrSize(maxSize = 220, viewportRatio = 0.65) {
  const [size, setSize] = useState(maxSize)

  useEffect(() => {
    const update = () => {
      setSize(Math.min(maxSize, Math.floor(window.innerWidth * viewportRatio)))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [maxSize, viewportRatio])

  return size
}
