import { useEffect, useRef, useState } from 'react'
import { useResponsiveQrSize } from '../hooks/useResponsiveQrSize'
import { useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { Camera, Keyboard } from 'lucide-react'

export function ScanPay() {
  const navigate = useNavigate()
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [scanning, setScanning] = useState(false)
  const [manualId, setManualId] = useState('')
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'camera' | 'manual'>('camera')
  const qrSize = useResponsiveQrSize(250, 0.7)

  const extractPaymentId = (text: string): string | null => {
    const urlMatch = text.match(/paiement-qr\/([a-f0-9-]+)/i)
    if (urlMatch) return urlMatch[1]
    if (/^[a-f0-9-]{36}$/i.test(text.trim())) return text.trim()
    return null
  }

  const handleScanResult = (decodedText: string) => {
    const paymentId = extractPaymentId(decodedText)
    if (paymentId) {
      stopScanner()
      navigate(`/paiement-qr/${paymentId}`)
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current?.isScanning) {
      try {
        await scannerRef.current.stop()
      } catch {
        /* ignore */
      }
    }
    scannerRef.current = null
    setScanning(false)
  }

  useEffect(() => {
    if (mode !== 'camera') {
      stopScanner()
      return
    }

    let mounted = true
    const scanner = new Html5Qrcode('qr-reader')
    scannerRef.current = scanner

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: qrSize, height: qrSize } },
        (text) => {
          if (mounted) handleScanResult(text)
        },
        () => {}
      )
      .then(() => {
        if (mounted) setScanning(true)
      })
      .catch(() => {
        if (mounted) {
          setError('Impossible d\'accéder à la caméra. Utilisez la saisie manuelle.')
          setMode('manual')
        }
      })

    return () => {
      mounted = false
      stopScanner()
    }
  }, [mode, qrSize]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const paymentId = extractPaymentId(manualId)
    if (!paymentId) {
      setError('Code invalide. Scannez le QR ou collez le lien de paiement.')
      return
    }
    navigate(`/paiement-qr/${paymentId}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Scanner un QR Code</h2>
        <p className="mt-1 text-sm text-slate-500">
          Scannez le QR code affiché par le commerçant pour payer.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('camera')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium ${
            mode === 'camera'
              ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
              : 'border-slate-200 bg-white text-slate-600'
          }`}
        >
          <Camera className="h-4 w-4" />
          Caméra
        </button>
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium ${
            mode === 'manual'
              ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
              : 'border-slate-200 bg-white text-slate-600'
          }`}
        >
          <Keyboard className="h-4 w-4" />
          Manuel
        </button>
      </div>

      {mode === 'camera' && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-black">
          <div id="qr-reader" className="w-full" />
          {!scanning && !error && (
            <p className="bg-slate-900 py-8 text-center text-sm text-white">
              Initialisation de la caméra...
            </p>
          )}
        </div>
      )}

      {mode === 'manual' && (
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <input
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            placeholder="Collez le lien ou l'ID du paiement"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
          )}
          <button
            type="submit"
            className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700"
          >
            Continuer
          </button>
        </form>
      )}

      {error && mode === 'camera' && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</p>
      )}
    </div>
  )
}
