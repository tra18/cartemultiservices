import { PAYMENT_METHODS, type PaymentMethodId } from '../data/paymentMethods'

interface PaymentMethodPickerProps {
  value: PaymentMethodId
  onChange: (id: PaymentMethodId) => void
  phone?: string
  onPhoneChange?: (phone: string) => void
  accent?: 'indigo' | 'emerald'
}

export function PaymentMethodPicker({
  value,
  onChange,
  phone = '',
  onPhoneChange,
  accent = 'indigo',
}: PaymentMethodPickerProps) {
  const selected = PAYMENT_METHODS.find((m) => m.id === value)!
  const ringClass = accent === 'emerald' ? 'ring-emerald-600' : 'ring-indigo-600'

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-700">Mode de paiement</label>
      <div className="space-y-2">
        {PAYMENT_METHODS.map(({ id, label, description, icon: Icon, color }) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${
              value === id
                ? `${color} ring-2 ${ringClass} ring-offset-1`
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white ${
                id === 'orange-money'
                  ? 'bg-orange-500'
                  : id === 'mobile-money'
                    ? 'bg-yellow-500'
                    : id === 'visa'
                      ? 'bg-blue-700'
                      : 'bg-red-600'
              }`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">{label}</p>
              <p className="text-xs text-slate-500">{description}</p>
            </div>
          </button>
        ))}
      </div>

      {selected.needsPhone && onPhoneChange && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Numéro {selected.label}
          </label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="+224 620 00 00 00"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      )}
    </div>
  )
}
