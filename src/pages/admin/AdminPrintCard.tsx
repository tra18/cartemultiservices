import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Printer } from 'lucide-react'
import { PhysicalCardPrint } from '../../components/admin/PhysicalCardPrint'
import { getCardOrderById } from '../../store/orderStore'

export function AdminPrintCard() {
  const { orderId } = useParams<{ orderId: string }>()
  const order = orderId ? getCardOrderById(orderId) : undefined

  if (!order?.cardNumber || !order.cardToken) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-600">Carte non produite — générez-la d&apos;abord.</p>
        <Link to={`/admin/commandes/${orderId}`} className="mt-4 inline-block text-violet-600">
          Retour à la commande
        </Link>
      </div>
    )
  }

  const handlePrint = () => window.print()

  return (
    <div className="space-y-6">
      <div className="no-print flex items-center justify-between gap-4">
        <Link
          to={`/admin/commandes/${orderId}`}
          className="flex items-center gap-1 text-sm font-medium text-violet-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
        <button
          type="button"
          onClick={handlePrint}
          className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 font-semibold text-white hover:bg-violet-700"
        >
          <Printer className="h-5 w-5" />
          Imprimer
        </button>
      </div>

      <PhysicalCardPrint
        holderName={order.userName}
        cardNumber={order.cardNumber}
        cardToken={order.cardToken}
        orderRef={order.id.slice(0, 8).toUpperCase()}
      />
    </div>
  )
}
