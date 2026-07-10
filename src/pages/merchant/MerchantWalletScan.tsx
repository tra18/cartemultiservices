import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { Camera, CheckCircle, Keyboard, RefreshCw, User, X } from 'lucide-react'
import { BackToHomeLink } from '../../components/BackToHomeLink'
import { useMerchantAuth } from '../../context/MerchantAuthContext'
import { useResponsiveQrSize } from '../../hooks/useResponsiveQrSize'
import {
  createWalletCharge,
  extractWalletPayToken,
  fetchWalletChargeStatus,
  lookupWalletPayToken,
  type WalletCharge,
  type WalletPayClient,
} from '../../services/walletCharge'
import type { Category } from '../../types'
import { CATEGORY_LABELS } from '../../types'
import { formatCurrency } from '../../utils/currency'

export function MerchantWalletScan() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { currentMerchant, refreshMerchant } = useMerchantAuth()
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const qrSize = useResponsiveQrSize(250, 0.7)

  const [mode, setMode] = useState<'camera' | 'manual'>('camera')
  const [scanning, setScanning] = useState(false)
  const [manualInput, setManualInput] = useState('')
  const [token, setToken] = useState<string | null>(null)
  const [client, setClient] = useState<WalletPayClient | null>(null)
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<Category | ''>('')
  const [activeCharge, setActiveCharge] = useState<WalletCharge | null>(null)
  const [error, setError] = useState('')
  const [lookupError, setLookupError] = useState('')

  const merchantCategories = currentMerchant?.categories ?? []
  const resolvedCategory = category || (merchantCategories.length === 1 ? merchantCategories[0] : '')

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

  const loadClient = async (walletToken: string) => {
    setLookupError('')
    const result = await lookupWalletPayToken(walletToken)
    if (!result.ok || !result.client) {
      setLookupError(result.error ?? 'Carte introuvable')
      return
    }
    setToken(walletToken)
    setClient(result.client)
    await stopScanner()
  }

  const handleScanResult = (decodedText: string) => {
    const walletToken = extractWalletPayToken(decodedText)
    if (walletToken) void loadClient(walletToken)
  }

  useEffect(() => {
    const prefilled = searchParams.get('token')
    if (prefilled && !token) {
      void loadClient(prefilled)
    }
  }, [searchParams, token]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mode !== 'camera' || token) {
      void stopScanner()
      return
    }

    let mounted = true
    const scanner = new Html5Qrcode('merchant-wallet-qr-reader')
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
      void stopScanner()
    }
  }, [mode, qrSize, token]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!activeCharge || activeCharge.status !== 'pending' || !currentMerchant) return

    const interval = setInterval(async () => {
      const updated = await fetchWalletChargeStatus(activeCharge.id, currentMerchant.id)
      if (updated) {
        setActiveCharge(updated)
        if (updated.status === 'paid') {
          refreshMerchant()
        }
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [activeCharge, currentMerchant, refreshMerchant])

  if (!currentMerchant) return null

  const resetScan = () => {
    setToken(null)
    setClient(null)
    setAmount('')
    setCategory('')
    setActiveCharge(null)
    setError('')
    setLookupError('')
    setManualInput('')
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const walletToken = extractWalletPayToken(manualInput)
    if (!walletToken) {
      setLookupError('Code invalide. Scannez le QR de la carte wallet ou collez le lien.')
      return
    }
    void loadClient(walletToken)
  }

  const handleCreateCharge = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!token || !client) return

    const parsed = parseInt(amount, 10)
    if (isNaN(parsed) || parsed <= 0) {
      setError('Saisissez un montant valide')
      return
    }
    if (!resolvedCategory) {
      setError('Sélectionnez la catégorie du paiement')
      return
    }

    const result = await createWalletCharge({
      token,
      merchantId: currentMerchant.id,
      merchantName: currentMerchant.businessName,
      category: resolvedCategory,
      amount: parsed,
    })

    if (!result.ok || !result.charge) {
      setError(result.error ?? 'Impossible de créer la demande')
      return
    }

    setActiveCharge(result.charge)
  }

  if (activeCharge?.status === 'paid') {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <CheckCircle className="h-16 w-16 text-emerald-500" />
        <h2 className="text-xl font-bold text-slate-900">Paiement reçu !</h2>
        <p className="text-slate-600">
          {formatCurrency(activeCharge.amount)} de {activeCharge.paidByUserName}
        </p>
        <button
          type="button"
          onClick={resetScan}
          className="mt-4 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700"
        >
          Nouveau paiement
        </button>
      </div>
    )
  }

  if (activeCharge) {
    const expiresAt = new Date(activeCharge.expiresAt)
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900">En attente du client</h2>
          <p className="mt-1 text-sm text-slate-500">
            Le client doit confirmer le paiement dans son application
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <p className="text-3xl font-bold text-slate-900">{formatCurrency(activeCharge.amount)}</p>
          <p className="mt-2 text-sm text-slate-600">{client?.fullName}</p>
          <p className="mt-1 text-xs text-amber-600">
            Expire à {expiresAt.toLocaleTimeString('fr-GN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
          <RefreshCw className="h-4 w-4 animate-spin" />
          En attente de confirmation PIN...
        </div>

        <button
          type="button"
          onClick={resetScan}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-slate-600 hover:bg-slate-50"
        >
          <X className="h-4 w-4" />
          Annuler
        </button>
      </div>
    )
  }

  if (client && token) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Encaisser via carte wallet</h2>
          <p className="mt-1 text-sm text-slate-500">Client identifié — saisissez le montant</p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <User className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">{client.fullName}</p>
            <p className="text-sm text-slate-500">{client.maskedCard}</p>
          </div>
        </div>

        <form onSubmit={handleCreateCharge} className="space-y-4">
          {merchantCategories.length > 1 && (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Catégorie</label>
              <div className="grid grid-cols-2 gap-2">
                {merchantCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`rounded-xl border py-2.5 text-sm font-medium transition ${
                      resolvedCategory === cat
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label htmlFor="wallet-amount" className="mb-2 block text-sm font-medium text-slate-700">
              Montant (GNF)
            </label>
            <input
              id="wallet-amount"
              type="number"
              min="1000"
              step="1000"
              required
              placeholder="Ex: 85000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-4 text-2xl font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            className="w-full rounded-xl bg-emerald-600 py-4 font-semibold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700"
          >
            Demander le paiement
          </button>

          <button
            type="button"
            onClick={resetScan}
            className="w-full rounded-xl border border-slate-200 py-3 text-sm text-slate-600 hover:bg-slate-50"
          >
            Scanner une autre carte
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Scanner la carte wallet</h2>
        <p className="mt-1 text-sm text-slate-500">
          Le client présente le QR code de sa carte Apple Wallet ou Google Wallet
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('camera')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium ${
            mode === 'camera'
              ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
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
              ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
              : 'border-slate-200 bg-white text-slate-600'
          }`}
        >
          <Keyboard className="h-4 w-4" />
          Manuel
        </button>
      </div>

      {mode === 'camera' && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-black">
          <div id="merchant-wallet-qr-reader" className="w-full" />
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
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Collez le lien wallet ou le code"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700"
          >
            Identifier le client
          </button>
        </form>
      )}

      {(error || lookupError) && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error || lookupError}</p>
      )}

      <button
        type="button"
        onClick={() => navigate('/commercant/encaisser')}
        className="w-full rounded-xl border border-slate-200 py-3 text-sm text-slate-600 hover:bg-slate-50"
      >
        Afficher un QR code à la place
      </button>

      <BackToHomeLink />
    </div>
  )
}
