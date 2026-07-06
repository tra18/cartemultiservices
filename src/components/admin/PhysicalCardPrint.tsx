import { QRCodeSVG } from 'qrcode.react'
import { PLATFORM_NAME, PLATFORM_LOGO } from '../../constants/brand'
import { getCardActivationUrl } from '../../utils/card'

interface PhysicalCardPrintProps {
  holderName: string
  cardNumber: string
  cardToken: string
  orderRef: string
}

export function PhysicalCardPrint({
  holderName,
  cardNumber,
  cardToken,
  orderRef,
}: PhysicalCardPrintProps) {
  const activationUrl = getCardActivationUrl(cardToken)

  return (
    <div className="print-card-sheet mx-auto max-w-md space-y-6">
      {/* Recto */}
      <div className="physical-card relative aspect-[1.586/1] overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-800 via-green-800 to-emerald-900 p-6 text-white shadow-xl">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-white/5" />

        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-200">
                {PLATFORM_NAME}
              </p>
              <p className="mt-0.5 text-xs text-emerald-100">GNF</p>
            </div>
            <img src={PLATFORM_LOGO} alt="" className="h-10 w-10 rounded-lg object-contain" />
          </div>

          <p className="font-mono text-lg tracking-[0.2em]">{cardNumber}</p>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] uppercase text-indigo-200">Titulaire</p>
              <p className="text-sm font-semibold uppercase">{holderName}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-indigo-200">Réf.</p>
              <p className="font-mono text-xs">{orderRef}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Verso — QR activation */}
      <div className="physical-card flex aspect-[1.586/1] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white p-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Scanner pour activer
        </p>
        <div className="my-4 rounded-xl border-4 border-violet-500 bg-white p-3">
          <QRCodeSVG value={activationUrl} size={140} level="M" includeMargin />
        </div>
        <p className="font-mono text-xs text-slate-600">{cardToken}</p>
        <p className="mt-2 max-w-xs text-[10px] leading-relaxed text-slate-400">
          Connectez-vous à l&apos;application, scannez ce QR, puis saisissez le code reçu par email.
        </p>
      </div>

      <p className="hidden text-center text-xs text-slate-400 print:block">
        Document d&apos;impression — {holderName} — {new Date().toLocaleDateString('fr-GN')}
      </p>
    </div>
  )
}
