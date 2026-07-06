import { Mail } from 'lucide-react'
import type { SimulatedEmail } from '../services/emailService'

interface EmailPreviewProps {
  email: SimulatedEmail
  onClose: () => void
}

export function EmailPreview({ email, onClose }: EmailPreviewProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <Mail className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase text-slate-400">Email simulé (démo)</p>
            <p className="truncate text-sm font-semibold text-slate-900">{email.subject}</p>
          </div>
        </div>
        <div className="space-y-2 px-5 py-3 text-sm text-slate-500">
          <p>
            <span className="font-medium text-slate-700">À :</span> {email.to}
          </p>
          <p>
            <span className="font-medium text-slate-700">Envoyé :</span>{' '}
            {new Date(email.sentAt).toLocaleString('fr-GN')}
          </p>
        </div>
        <pre className="mx-5 mb-5 max-h-64 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm text-slate-800">
          {email.body}
        </pre>
        <div className="border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
