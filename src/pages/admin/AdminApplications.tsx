import { useEffect, useMemo, useState } from 'react'
import { Mail, Phone } from 'lucide-react'
import {
  adminUpdateApplication,
  fetchAdminCareers,
} from '../../services/careersServer'
import {
  APPLICATION_STATUS_LABELS,
  type ApplicationStatus,
  type JobApplication,
} from '../../types/career'

const STATUS_FILTERS: { value: 'all' | ApplicationStatus; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'new', label: 'Nouvelles' },
  { value: 'reviewed', label: 'Examinées' },
  { value: 'shortlisted', label: 'Présélectionnées' },
  { value: 'rejected', label: 'Refusées' },
  { value: 'hired', label: 'Recrutées' },
]

export function AdminApplications() {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filter, setFilter] = useState<'all' | ApplicationStatus>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [notes, setNotes] = useState('')

  const refresh = async () => {
    setLoading(true)
    setError('')
    const result = await fetchAdminCareers()
    setApplications(result.applications)
    if (result.error) setError(result.error)
    setLoading(false)
  }

  useEffect(() => {
    void refresh()
  }, [])

  const filtered = useMemo(() => {
    return applications.filter((item) => filter === 'all' || item.status === filter)
  }, [applications, filter])

  const selected = applications.find((item) => item.id === selectedId) ?? null

  useEffect(() => {
    setNotes(selected?.adminNotes ?? '')
  }, [selected])

  const handleStatusChange = async (applicationId: string, status: ApplicationStatus) => {
    setError('')
    setSuccess('')
    const result = await adminUpdateApplication(applicationId, status, notes)
    if (!result.ok) {
      setError(result.error ?? 'Mise à jour échouée')
      return
    }
    setSuccess('Candidature mise à jour')
    await refresh()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Candidatures</h2>
        <p className="mt-1 text-sm text-slate-500">
          {applications.length} candidature(s) reçue(s)
        </p>
      </div>

      {(error || success) && (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}
        >
          {error || success}
        </div>
      )}

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:overflow-visible sm:px-0">
        <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                filter === value
                  ? 'bg-violet-600 text-white'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          {loading ? (
            <p className="text-sm text-slate-500">Chargement…</p>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-500">
              Aucune candidature
            </div>
          ) : (
            filtered.map((application) => (
              <button
                key={application.id}
                type="button"
                onClick={() => setSelectedId(application.id)}
                className={`w-full rounded-xl border p-4 text-left transition ${
                  selectedId === application.id
                    ? 'border-violet-300 bg-violet-50'
                    : 'border-slate-200 bg-white hover:border-violet-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{application.fullName}</p>
                    <p className="truncate text-sm text-slate-500">{application.jobTitle}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(application.createdAt).toLocaleString('fr-GN')}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                    {APPLICATION_STATUS_LABELS[application.status]}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          {!selected ? (
            <p className="text-sm text-slate-500">Sélectionnez une candidature pour voir le détail</p>
          ) : (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{selected.fullName}</h3>
                <p className="text-sm text-violet-700">{selected.jobTitle}</p>
              </div>

              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2 text-slate-700">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <a href={`mailto:${selected.email}`} className="hover:underline">
                    {selected.email}
                  </a>
                </p>
                <p className="flex items-center gap-2 text-slate-700">
                  <Phone className="h-4 w-4 text-slate-400" />
                  {selected.phone}
                </p>
                {selected.cvLink && (
                  <p>
                    <a href={selected.cvLink} target="_blank" rel="noreferrer" className="text-violet-700 hover:underline">
                      Voir le CV
                    </a>
                  </p>
                )}
                {selected.linkedIn && (
                  <p>
                    <a href={selected.linkedIn} target="_blank" rel="noreferrer" className="text-violet-700 hover:underline">
                      Profil LinkedIn
                    </a>
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Lettre de motivation
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {selected.coverLetter}
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Notes internes
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {(['reviewed', 'shortlisted', 'rejected', 'hired'] as ApplicationStatus[]).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => void handleStatusChange(selected.id, status)}
                    className={`rounded-lg px-3 py-2 text-xs font-medium ${
                      selected.status === status
                        ? 'bg-violet-600 text-white'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {APPLICATION_STATUS_LABELS[status]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
