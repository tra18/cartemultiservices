import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Fuel } from 'lucide-react'
import { BackToHomeLink } from '../components/BackToHomeLink'
import { useCard } from '../context/CardContext'
import {
  calculateFuelAmount,
  FUEL_PRICES,
  FUEL_STATIONS,
  FUEL_TYPE_LABELS,
  MAX_FUEL_LITERS,
  MIN_FUEL_LITERS,
  type FuelType,
} from '../data/fuel'
import { useCardPinGate } from '../hooks/useCardPinGate'
import { CLIENT_DASHBOARD_PATH } from '../constants/brand'
import { formatCurrency } from '../utils/currency'

export function BuyFuel() {
  const { pay, balance } = useCard()
  const { requestPin, PinModal } = useCardPinGate()
  const navigate = useNavigate()

  const [stationId, setStationId] = useState(FUEL_STATIONS[0].id)
  const [fuelType, setFuelType] = useState<FuelType>('essence')
  const [liters, setLiters] = useState('10')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const station = FUEL_STATIONS.find((s) => s.id === stationId) ?? FUEL_STATIONS[0]
  const parsedLiters = parseFloat(liters)
  const pricePerLiter = FUEL_PRICES[fuelType]
  const total =
    !isNaN(parsedLiters) && parsedLiters > 0
      ? calculateFuelAmount(parsedLiters, fuelType)
      : 0
  const maxLitersByBalance = calculateFuelAmount(MAX_FUEL_LITERS, fuelType) <= balance
    ? MAX_FUEL_LITERS
    : Math.floor((balance / pricePerLiter) * 10) / 10

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (isNaN(parsedLiters) || parsedLiters < MIN_FUEL_LITERS) {
      setError(`Minimum ${MIN_FUEL_LITERS} litre`)
      return
    }
    if (parsedLiters > MAX_FUEL_LITERS) {
      setError(`Maximum ${MAX_FUEL_LITERS} litres par transaction`)
      return
    }
    if (total > balance) {
      setError(`Solde insuffisant. Disponible : ${formatCurrency(balance)}`)
      return
    }

    requestPin((pin) => {
      void (async () => {
        const detail = `${parsedLiters} L · ${FUEL_TYPE_LABELS[fuelType]}`
        const ok = await pay('transport', station.name, total, pin, detail)
        if (!ok) {
          setError('Le paiement a échoué. Vérifiez votre PIN ou que votre carte est active.')
          return
        }
        setSuccess(true)
        setTimeout(() => navigate(CLIENT_DASHBOARD_PATH), 2500)
      })()
    })
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <CheckCircle className="h-16 w-16 text-emerald-500" />
        <h2 className="text-xl font-bold text-slate-900">Carburant payé !</h2>
        <p className="text-slate-600">
          {parsedLiters} L de {FUEL_TYPE_LABELS[fuelType].toLowerCase()} chez {station.name}
        </p>
        <p className="text-lg font-semibold text-indigo-600">{formatCurrency(total)}</p>
        <p className="text-sm text-slate-500">
          Présentez votre carte à la station pour faire le plein.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex items-center gap-2 text-blue-600">
          <Fuel className="h-6 w-6" />
          <h2 className="text-xl font-bold text-slate-900">Acheter du carburant</h2>
        </div>
        <p className="text-sm text-slate-500">
          Payez à l&apos;avance avec votre carte, puis faites le plein à la station.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <section>
          <label className="mb-2 block text-sm font-medium text-slate-700">Station-service</label>
          <div className="space-y-2">
            {FUEL_STATIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStationId(s.id)}
                className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${
                  stationId === s.id
                    ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600 ring-offset-1'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <Fuel className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{s.name}</p>
                  <p className="text-xs text-slate-500">{s.location}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section>
          <label className="mb-2 block text-sm font-medium text-slate-700">Type de carburant</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(FUEL_TYPE_LABELS) as FuelType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFuelType(type)}
                className={`rounded-xl border py-3 text-sm font-medium transition ${
                  fuelType === type
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                {FUEL_TYPE_LABELS[type]}
                <span className="mt-0.5 block text-xs font-normal opacity-80">
                  {formatCurrency(FUEL_PRICES[type])}/L
                </span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <label htmlFor="liters" className="mb-2 block text-sm font-medium text-slate-700">
            Quantité (litres)
          </label>
          <input
            id="liters"
            type="number"
            min={MIN_FUEL_LITERS}
            max={maxLitersByBalance}
            step="0.5"
            required
            value={liters}
            onChange={(e) => setLiters(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {[5, 10, 20, 30].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setLiters(String(preset))}
                className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:border-blue-300 hover:bg-blue-50"
              >
                {preset} L
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Max. {maxLitersByBalance} L selon votre solde
          </p>
        </section>

        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <div className="flex justify-between text-sm text-blue-800">
            <span>
              {parsedLiters > 0 ? `${parsedLiters} L` : '—'} × {formatCurrency(pricePerLiter)}/L
            </span>
            <span className="font-semibold">{formatCurrency(total)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-blue-100 pt-2">
            <span className="font-semibold text-blue-900">Total à payer</span>
            <span className="text-lg font-bold text-blue-700">{formatCurrency(total)}</span>
          </div>
          <p className="mt-2 text-xs text-blue-600">
            Solde disponible : {formatCurrency(balance)}
          </p>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={total <= 0 || total > balance}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-semibold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Fuel className="h-5 w-5" />
          Payer {total > 0 ? formatCurrency(total) : 'le carburant'}
        </button>

        <BackToHomeLink className="mt-3" />
      </form>
      {PinModal}
    </div>
  )
}
