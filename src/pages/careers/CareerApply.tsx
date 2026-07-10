import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { BackToHomeLink } from '../../components/BackToHomeLink'
import { CareersPublicShell } from '../../components/careers/CareersPublicShell'
import { fetchPublishedJob, submitJobApplication } from '../../services/careersServer'
import type { JobListing } from '../../types/career'

export function CareerApply() {
  const { jobId } = useParams<{ jobId: string }>()
  const navigate = useNavigate()
  const [job, setJob] = useState<JobListing | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [coverLetter, setCoverLetter] = useState('')
  const [cvLink, setCvLink] = useState('')
  const [linkedIn, setLinkedIn] = useState('')
  const [honeypot, setHoneypot] = useState('')

  useEffect(() => {
    if (!jobId) return
    void (async () => {
      setLoading(true)
      const result = await fetchPublishedJob(jobId)
      setJob(result.job)
      if (!result.job) setError(result.error ?? 'Offre introuvable')
      setLoading(false)
    })()
  }, [jobId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!jobId || !job) return
    setError('')
    setSubmitting(true)

    const result = await submitJobApplication({
      jobId,
      fullName,
      email,
      phone,
      coverLetter,
      cvLink: cvLink.trim() || undefined,
      linkedIn: linkedIn.trim() || undefined,
      _honeypot: honeypot,
    })

    setSubmitting(false)
    if (!result.ok) {
      setError(result.error ?? 'Envoi échoué')
      return
    }
    setSuccess(true)
  }

  if (loading) {
    return (
      <CareersPublicShell backTo={`/carrieres/${jobId}`} backLabel="Retour à l'offre">
        <p className="text-sm text-stone-500">Chargement…</p>
      </CareersPublicShell>
    )
  }

  if (!job) {
    return (
      <CareersPublicShell backTo="/carrieres">
        <p className="text-sm text-red-600">{error || 'Offre introuvable'}</p>
      </CareersPublicShell>
    )
  }

  if (success) {
    return (
      <CareersPublicShell backTo="/carrieres">
        <div className="mx-auto max-w-lg rounded-2xl border border-emerald-200 bg-white p-8 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
          <h1 className="mt-4 text-xl font-bold text-stone-900">Candidature envoyée</h1>
          <p className="mt-2 text-sm text-stone-600">
            Merci {fullName}. Nous avons bien reçu votre candidature pour le poste{' '}
            <strong>{job.title}</strong>. Notre équipe vous contactera si votre profil correspond.
          </p>
          <button
            type="button"
            onClick={() => navigate('/carrieres')}
            className="mt-6 rounded-full bg-stone-900 px-6 py-2.5 text-sm font-semibold text-white"
          >
            Voir les autres offres
          </button>
        </div>
      </CareersPublicShell>
    )
  }

  return (
    <CareersPublicShell backTo={`/carrieres/${job.id}`} backLabel="Retour à l'offre">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
            Candidature
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-stone-900">{job.title}</h1>
          <p className="mt-2 text-sm text-stone-600">
            Complétez le formulaire ci-dessous. Les champs marqués * sont obligatoires.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
          <input
            type="text"
            name="company"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">
              Nom complet *
            </label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-stone-400"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-stone-400"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">Téléphone *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-stone-400"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">
              Lettre de motivation *
            </label>
            <textarea
              required
              rows={6}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Présentez votre parcours et votre motivation pour ce poste…"
              className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-stone-400"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">
              Lien vers votre CV (Google Drive, LinkedIn, etc.)
            </label>
            <input
              type="url"
              value={cvLink}
              onChange={(e) => setCvLink(e.target.value)}
              placeholder="https://"
              className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-stone-400"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">
              Profil LinkedIn
            </label>
            <input
              type="url"
              value={linkedIn}
              onChange={(e) => setLinkedIn(e.target.value)}
              placeholder="https://linkedin.com/in/..."
              className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-stone-400"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-stone-900 py-3.5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-60"
          >
            {submitting ? 'Envoi en cours…' : 'Envoyer ma candidature'}
          </button>

          <BackToHomeLink className="mt-3" />

          <p className="text-center text-xs text-stone-500">
            En envoyant ce formulaire, vous acceptez que vos données soient traitées dans le cadre
            du recrutement.
          </p>
        </form>

        <p className="text-center text-sm text-stone-500">
          <Link to={`/carrieres/${job.id}`} className="font-medium text-stone-700 hover:underline">
            Retour à la description du poste
          </Link>
        </p>
      </div>
    </CareersPublicShell>
  )
}
