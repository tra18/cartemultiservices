import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight, MapPin } from 'lucide-react'
import { CareersPublicShell } from '../../components/careers/CareersPublicShell'
import { fetchPublishedJob } from '../../services/careersServer'
import { JOB_CONTRACT_LABELS } from '../../types/career'
import type { JobListing } from '../../types/career'

export function CareerDetail() {
  const { jobId } = useParams<{ jobId: string }>()
  const [job, setJob] = useState<JobListing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!jobId) return
    void (async () => {
      setLoading(true)
      const result = await fetchPublishedJob(jobId)
      setJob(result.job)
      if (result.error) setError(result.error)
      setLoading(false)
    })()
  }, [jobId])

  if (loading) {
    return (
      <CareersPublicShell>
        <p className="text-sm text-stone-500">Chargement de l&apos;offre…</p>
      </CareersPublicShell>
    )
  }

  if (!job) {
    return (
      <CareersPublicShell>
        <div className="rounded-2xl border border-dashed border-stone-200 bg-white px-6 py-16 text-center">
          <p className="font-medium text-stone-800">Offre introuvable</p>
          {error && <p className="mt-2 text-sm text-stone-500">{error}</p>}
          <Link
            to="/carrieres"
            className="mt-6 inline-flex rounded-full bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Retour aux offres
          </Link>
        </div>
      </CareersPublicShell>
    )
  }

  return (
    <CareersPublicShell>
      <article className="space-y-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
            {job.department}
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-semibold text-stone-900">
            {job.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-stone-600">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {job.location}
            </span>
            <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700">
              {JOB_CONTRACT_LABELS[job.contractType]}
            </span>
          </div>
        </div>

        <section className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-stone-900">Description du poste</h2>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
            {job.description}
          </p>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-stone-900">Profil recherché</h2>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
            {job.requirements}
          </p>
        </section>

        <Link
          to={`/carrieres/${job.id}/postuler`}
          className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-stone-800"
        >
          Postuler à cette offre
          <ArrowRight className="h-4 w-4" />
        </Link>
      </article>
    </CareersPublicShell>
  )
}
