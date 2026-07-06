import { Link } from 'react-router-dom'
import { ArrowDownToLine, QrCode, TrendingUp, Wallet } from 'lucide-react'
import { useMerchantAuth } from '../../context/MerchantAuthContext'
import { getMerchantAvailableBalance, getMerchantPendingBalance } from '../../store/platformStore'
import { formatCategoryList } from '../../types'
import { formatCurrency } from '../../utils/currency'

export function MerchantDashboard() {
  const { currentMerchant } = useMerchantAuth()

  if (!currentMerchant) return null

  const pending = getMerchantPendingBalance(currentMerchant)
  const available = getMerchantAvailableBalance(currentMerchant)
  const todaySales = currentMerchant.sales.filter((s) => {
    const d = new Date(s.date)
    const now = new Date()
    return d.toDateString() === now.toDateString()
  })
  const todayTotal = todaySales.reduce((sum, s) => sum + s.amount, 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Tableau de bord</h2>
        <p className="mt-1 text-sm text-slate-500">
          {formatCategoryList(currentMerchant.categories)} · {currentMerchant.businessName}
        </p>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-6 text-white shadow-xl shadow-emerald-200">
        <div className="flex items-center gap-2 text-emerald-100">
          <Wallet className="h-5 w-5" />
          <span className="text-sm font-medium">Solde disponible</span>
        </div>
        <p className="mt-2 text-3xl font-bold">{formatCurrency(available)}</p>
        {pending > 0 && (
          <p className="mt-2 text-sm text-emerald-100">
            {formatCurrency(pending)} en attente de retrait
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-medium">Ventes aujourd&apos;hui</span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900">{formatCurrency(todayTotal)}</p>
          <p className="text-xs text-slate-500">{todaySales.length} transaction(s)</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <Wallet className="h-4 w-4" />
            <span className="text-xs font-medium">Total encaissé</span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900">
            {formatCurrency(currentMerchant.balance)}
          </p>
          <p className="text-xs text-slate-500">{currentMerchant.sales.length} vente(s)</p>
        </div>
      </div>

      <Link
        to="/commercant/encaisser"
        className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-4 font-semibold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700"
      >
        <QrCode className="h-5 w-5" />
        Encaisser un paiement (QR Code)
      </Link>

      <Link
        to="/commercant/retraits"
        className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-3.5 font-semibold text-emerald-700 hover:bg-emerald-100"
      >
        <ArrowDownToLine className="h-5 w-5" />
        Demander un retrait
      </Link>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Dernières ventes
        </h3>
        <div className="space-y-2">
          {currentMerchant.sales.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
              Aucune vente pour le moment. Générez un QR code pour encaisser.
            </p>
          ) : (
            currentMerchant.sales.slice(0, 5).map((sale) => (
              <div
                key={sale.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4"
              >
                <div>
                  <p className="font-medium text-slate-900">{sale.customerName}</p>
                  <p className="text-sm text-slate-500">
                    {new Date(sale.date).toLocaleString('fr-GN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <p className="font-semibold text-emerald-600">+{formatCurrency(sale.amount)}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
