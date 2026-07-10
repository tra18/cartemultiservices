import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Briefcase, Pencil, Plus, Trash2 } from 'lucide-react'
import { BackToHomeLink } from '../../components/BackToHomeLink'
import {
  adminCreateJob,
  adminDeleteJob,
  adminUpdateJob,
  fetchAdminCareers,
} from '../../services/careersServer'
import {
  JOB_CONTRACT_LABELS,
  JOB_STATUS_LABELS,
  type JobContractType,
  type JobListing,
  type JobStatus,
} from '../../types/career'

const EMPTY_FORM = {
  title: '',
  department: '',
  location: 'Conakry',
  contractType: 'cdi' as JobContractType,
  description: '',
  requirements: '',
  status: 'draft' as JobStatus,
}

export function AdminCareers() {
  const [jobs, setJobs] = useState<JobListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const refresh = async () => {
    setLoading(true)
    setError('')
    const result = await fetchAdminCareers()
    setJobs(result.jobs)
    if (result.error) setError(result.error)
    setLoading(false)
  }

  useEffect(() => {
    void refresh()
  }, [])

  const counts = useMemo(() => {
    const c = { draft: 0, published: 0, archived: 0 }
    for (const job of jobs) c[job.status]++
    return c
  }, [jobs])

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormOpen(true)
    setSuccess('')
  }

  const openEdit = (job: JobListing) => {
    setEditingId(job.id)
    setForm({
      title: job.title,
      department: job.department,
      location: job.location,
      contractType: job.contractType,
      description: job.description,
      requirements: job.requirements,
      status: job.status,
    })
    setFormOpen(true)
    setSuccess('')
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    const result = editingId
      ? await adminUpdateJob(editingId, form)
      : await adminCreateJob(form)

    setSaving(false)
    if (!result.ok) {
      setError(result.error ?? 'Enregistrement échoué')
      return
    }

    setSuccess(editingId ? 'Offre mise à jour' : 'Offre créée')
    setFormOpen(false)
    await refresh()
  }

  const handleDelete = async (jobId: string) => {
    if (!window.confirm('Supprimer cette offre ?')) return
    const result = await adminDeleteJob(jobId)
    if (!result.ok) {
      setError(result.error ?? 'Suppression échouée')
      return
    }
    setSuccess('Offre supprimée')
    await refresh()
  }

  const togglePublish = async (job: JobListing) => {
    const nextStatus: JobStatus = job.status === 'published' ? 'archived' : 'published'
    const result = await adminUpdateJob(job.id, { status: nextStatus })
    if (!result.ok) {
      setError(result.error ?? 'Mise à jour échouée')
      return
    }
    setSuccess(nextStatus === 'published' ? 'Offre publiée' : 'Offre archivée')
    await refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Offres d&apos;emploi</h2>
          <p className="mt-1 text-sm text-slate-500">
            Publiez et gérez les postes visibles sur la page Carrières
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
        >
          <Plus className="h-4 w-4" />
          Nouvelle offre
        </button>
      </div>

      {(error || success) && (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}
        >
          {error || success}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
          <p className="text-2xl font-bold text-slate-800">{counts.published}</p>
          <p className="text-xs text-slate-500">Publiées</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-center">
          <p className="text-2xl font-bold text-amber-700">{counts.draft}</p>
          <p className="text-xs text-amber-600">Brouillons</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
          <p className="text-2xl font-bold text-slate-600">{counts.archived}</p>
          <p className="text-xs text-slate-500">Archivées</p>
        </div>
      </div>

      {formOpen && (
        <form onSubmit={handleSave} className="space-y-4 rounded-2xl border border-violet-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900">
            {editingId ? 'Modifier l\'offre' : 'Créer une offre'}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Intitulé du poste *"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500 sm:col-span-2"
            />
            <input
              required
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              placeholder="Département *"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500"
            />
            <input
              required
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Lieu *"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500"
            />
            <select
              value={form.contractType}
              onChange={(e) => setForm({ ...form, contractType: e.target.value as JobContractType })}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500"
            >
              {Object.entries(JOB_CONTRACT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as JobStatus })}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500"
            >
              {Object.entries(JOB_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <textarea
            required
            rows={5}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description du poste *"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500"
          />
          <textarea
            required
            rows={4}
            value={form.requirements}
            onChange={(e) => setForm({ ...form, requirements: e.target.value })}
            placeholder="Profil recherché *"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
            >
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
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
      ) : jobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-500">
          Aucune offre. Créez votre première offre d&apos;emploi.
        </div>
      ) : (
        <div className="space-y-2">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{job.title}</p>
                  <p className="truncate text-sm text-slate-500">
                    {job.department} · {job.location} · {JOB_CONTRACT_LABELS[job.contractType]}
                  </p>
                  <p className="mt-1 text-xs font-medium text-violet-700">
                    {JOB_STATUS_LABELS[job.status]}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void togglePublish(job)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                    job.status === 'published'
                      ? 'border border-slate-200 text-slate-600'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {job.status === 'published' ? 'Archiver' : 'Publier'}
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(job)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(job.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {jobs.length > 0 && (
        <p className="flex items-start gap-2 text-xs text-slate-500">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          Les offres publiées sont visibles sur{' '}
          <a href="/carrieres" target="_blank" rel="noreferrer" className="font-medium text-violet-700 hover:underline">
            /carrieres
          </a>
        </p>
      )}
    </div>
  )
}
