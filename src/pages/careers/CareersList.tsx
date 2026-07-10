import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Briefcase, MapPin } from 'lucide-react'
import { CareersPublicShell } from '../../components/careers/CareersPublicShell'
import { fetchPublishedJobs } from '../../services/careersServer'
import { JOB_CONTRACT_LABELS } from '../../types/career'
import type { JobListing } from '../../types/career'

export function CareersList() {
  const [jobs, setJobs] = useState<JobListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    void (async () => {
      setLoading(true)
      const result = await fetchPublishedJobs()
      setJobs(result.jobs)
      if (result.error) setError(result.error)
      setLoading(false)
    })()
  }, [])

  return (
    <CareersPublicShell backTo="/" backLabel="Accueil">
      <div className="space-y-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
            Carrière chez nous
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold text-stone-900 sm:text-5xl">
            Rejoignez notre équipe
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-stone-600">
            Découvrez nos opportunités et contribuez au développement des services de paiement
            multiservice en Guinée.
          </p>
        </div>

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-sm text-stone-500">Chargement des offres…</p>
        ) : jobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-white px-6 py-16 text-center">
            <Briefcase className="mx-auto h-10 w-10 text-stone-300" />
            <p className="mt-4 font-medium text-stone-800">Aucune offre publiée pour le moment</p>
            <p className="mt-2 text-sm text-stone-500">
              Revenez prochainement ou contactez-nous pour une candidature spontanée.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {jobs.map((job) => (
              <Link
                key={job.id}
                to={`/carrieres/${job.id}`}
                className="group rounded-2xl border border-stone-200 bg-white p-6 transition hover:border-stone-300 hover:shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                      {job.department}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-stone-900 group-hover:text-stone-700">
                      {job.title}
                    </h2>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-stone-500">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </span>
                      <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700">
                        {JOB_CONTRACT_LABELS[job.contractType]}
                      </span>
                    </div>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-stone-900">
                    Voir l&apos;offre
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </CareersPublicShell>
  )
}
