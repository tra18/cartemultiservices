import { useMerchantAuth } from '../../context/MerchantAuthContext'
import { formatCurrency } from '../../utils/currency'

export function MerchantHistory() {
  const { currentMerchant } = useMerchantAuth()

  if (!currentMerchant) return null

  const total = currentMerchant.sales.reduce((sum, s) => sum + s.amount, 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Historique des ventes</h2>
        <p className="mt-1 text-sm text-slate-500">
          {currentMerchant.sales.length} vente(s) · Total {formatCurrency(total)}
        </p>
      </div>

      <div className="space-y-2">
        {currentMerchant.sales.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
            Aucune vente enregistrée
          </p>
        ) : (
          currentMerchant.sales.map((sale) => (
            <div
              key={sale.id}
              className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4"
            >
              <div>
                <p className="font-medium text-slate-900">{sale.customerName}</p>
                <p className="text-sm text-slate-500">
                  Paiement QR ·{' '}
                  {new Date(sale.date).toLocaleString('fr-GN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
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
    </div>
  )
}
