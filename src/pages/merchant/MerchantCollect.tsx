import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { CheckCircle, Copy, RefreshCw, X } from 'lucide-react'
import { BackToHomeLink } from '../../components/BackToHomeLink'
import { useMerchantAuth } from '../../context/MerchantAuthContext'
import {
  cancelPaymentRequest,
  createPaymentRequest,
  getPaymentRequest,
  getQrPaymentUrl,
} from '../../store/platformStore'
import type { PaymentRequest } from '../../types/merchant'
import type { Category } from '../../types'
import { CATEGORY_LABELS } from '../../types'
import { formatCurrency } from '../../utils/currency'
import { useResponsiveQrSize } from '../../hooks/useResponsiveQrSize'

export function MerchantCollect() {
  const { currentMerchant, refreshMerchant } = useMerchantAuth()
  const [amount, setAmount] = useState('')
  const [paymentCategory, setPaymentCategory] = useState<Category | ''>('')
  const [activePayment, setActivePayment] = useState<PaymentRequest | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const qrSize = useResponsiveQrSize(220, 0.65)

  useEffect(() => {
    if (!activePayment || activePayment.status !== 'pending') return

    const interval = setInterval(() => {
      const updated = getPaymentRequest(activePayment.id)
      if (updated) {
        setActivePayment(updated)
        if (updated.status === 'paid') {
          refreshMerchant()
        }
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [activePayment, refreshMerchant])

  if (!currentMerchant) return null

  const merchantCategories = currentMerchant.categories
  const needsCategoryPick = merchantCategories.length > 1
  const resolvedCategory =
    paymentCategory || (merchantCategories.length === 1 ? merchantCategories[0] : '')

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const parsed = parseInt(amount, 10)
    if (isNaN(parsed) || parsed <= 0) {
      setError('Saisissez un montant valide')
      return
    }
    if (!resolvedCategory) {
      setError('Sélectionnez la catégorie du paiement')
      return
    }

    try {
      const request = createPaymentRequest(currentMerchant, parsed, resolvedCategory)
      setActivePayment(request)
    } catch {
      setError('Catégorie de paiement invalide')
    }
  }

  const handleCancel = () => {
    if (activePayment) {
      cancelPaymentRequest(activePayment.id, currentMerchant.id)
    }
    setActivePayment(null)
    setAmount('')
  }

  const handleCopy = async () => {
    if (!activePayment) return
    await navigator.clipboard.writeText(getQrPaymentUrl(activePayment.id))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (activePayment?.status === 'paid') {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <CheckCircle className="h-16 w-16 text-emerald-500" />
        <h2 className="text-xl font-bold text-slate-900">Paiement reçu !</h2>
        <p className="text-slate-600">
          {formatCurrency(activePayment.amount)} de {activePayment.paidByUserName}
        </p>
        <button
          type="button"
          onClick={() => {
            setActivePayment(null)
            setAmount('')
            refreshMerchant()
          }}
          className="mt-4 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700"
        >
          Nouveau paiement
        </button>
      </div>
    )
  }

  if (activePayment) {
    const qrUrl = getQrPaymentUrl(activePayment.id)
    const expiresAt = new Date(activePayment.expiresAt)

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900">QR Code de paiement</h2>
          <p className="mt-1 text-sm text-slate-500">
            Le client scanne ce code avec son application
          </p>
        </div>

        <div className="mx-auto w-fit max-w-full rounded-2xl border-4 border-emerald-500 bg-white p-3 shadow-lg sm:p-4">
          <QRCodeSVG value={qrUrl} size={qrSize} level="M" includeMargin />
        </div>

        <div className="text-center">
          <p className="text-3xl font-bold text-slate-900">
            {formatCurrency(activePayment.amount)}
          </p>
          <p className="mt-1 text-sm text-slate-500">{currentMerchant.businessName}</p>
          <p className="mt-2 text-xs text-amber-600">
            Expire à {expiresAt.toLocaleTimeString('fr-GN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-3">
          <p className="flex-1 truncate text-xs text-slate-600">{qrUrl}</p>
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 rounded-lg bg-white p-2 text-slate-600 hover:text-emerald-600"
          >
            {copied ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
          <RefreshCw className="h-4 w-4 animate-spin" />
          En attente du paiement client...
        </div>

        <button
          type="button"
          onClick={handleCancel}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-slate-600 hover:bg-slate-50"
        >
          <X className="h-4 w-4" />
          Annuler
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Encaisser un paiement</h2>
        <p className="mt-1 text-sm text-slate-500">
          Saisissez le montant, puis affichez le QR code au client.
        </p>
      </div>

      <form onSubmit={handleGenerate} className="space-y-4">
        {needsCategoryPick && (
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Catégorie du paiement
            </label>
            <div className="grid grid-cols-2 gap-2">
              {merchantCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setPaymentCategory(cat)}
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
          <label htmlFor="amount" className="mb-2 block text-sm font-medium text-slate-700">
            Montant à encaisser (GNF)
          </label>
          <input
            id="amount"
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
          Générer le QR Code
        </button>

        <Link
          to="/commercant/encaisser-carte"
          className="flex w-full items-center justify-center rounded-xl border border-emerald-200 bg-white py-3 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
        >
          Scanner la carte wallet du client
        </Link>

        <BackToHomeLink className="mt-3" />
      </form>

      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
        <p className="font-medium">Comment ça marche ?</p>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-emerald-700">
          <li>Saisissez le montant de la vente</li>
          <li>Affichez votre QR code, ou scannez la carte wallet du client</li>
          <li>Le client confirme le paiement avec son code PIN</li>
          <li>L&apos;argent est crédité sur votre solde commerçant</li>
        </ol>
      </div>
    </div>
  )
}
