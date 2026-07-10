import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Baby, ChevronRight, Plus, Users } from 'lucide-react'
import { BackToHomeLink } from '../components/BackToHomeLink'
import { createMinorProfile, fetchFamilyMinors } from '../services/familyServer'
import type { UserAccount } from '../types/auth'
import { formatCurrency } from '../utils/currency'

const CARD_STATUS_DISPLAY: Record<string, string> = {
  none: 'Sans carte',
  ordered: 'Commandée',
  shipped: 'Expédiée',
  active: 'Active',
  blocked: 'Bloquée',
}

export function FamilyMinors() {
  const [minors, setMinors] = useState<UserAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [fullName, setFullName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)

  const refresh = async () => {
    setLoading(true)
    setError('')
    const result = await fetchFamilyMinors()
    setMinors(result.minors)
    if (result.error) setError(result.error)
    setLoading(false)
  }

  useEffect(() => {
    void refresh()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const result = await createMinorProfile({ fullName, dateOfBirth, phone: phone || undefined })
    setSaving(false)
    if (!result.ok) {
      setError(result.error ?? 'Création échouée')
      return
    }
    setShowForm(false)
    setFullName('')
    setDateOfBirth('')
    setPhone('')
    await refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Ma famille</h2>
          <p className="mt-1 text-sm text-slate-500">
            Créez et gérez les cartes de vos enfants mineurs. Vous gardez le contrôle total.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Ajouter un mineur
        </button>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="space-y-4 rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5">
          <h3 className="font-semibold text-slate-900">Nouveau compte mineur</h3>
          <p className="text-sm text-slate-600">
            Le mineur n&apos;a pas de connexion séparée. Vous commandez la carte et pilotez toutes les opérations.
          </p>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Prénom et nom du mineur *"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
          />
          <input
            type="date"
            required
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Téléphone (optionnel)"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? 'Création…' : 'Créer le profil'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600"
            >
              Annuler
            </button>
          </div>

          <BackToHomeLink className="mt-3" />
        </form>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Chargement…</p>
      ) : minors.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center">
          <Users className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-4 font-medium text-slate-800">Aucun compte mineur</p>
          <p className="mt-2 text-sm text-slate-500">
            Ajoutez un enfant pour lui commander une carte sous votre supervision.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {minors.map((minor) => (
            <Link
              key={minor.id}
              to={`/ma-famille/${minor.id}`}
              className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-indigo-200 hover:shadow-sm"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <Baby className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">{minor.fullName}</p>
                <p className="text-sm text-slate-500">
                  {CARD_STATUS_DISPLAY[minor.cardStatus] ?? minor.cardStatus} ·{' '}
                  {formatCurrency(minor.balance)}
                </p>
                {minor.dateOfBirth && (
                  <p className="text-xs text-slate-400">Né(e) le {minor.dateOfBirth}</p>
                )}
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
