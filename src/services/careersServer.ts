import { getAdminAuthHeaders } from './apiClient'
import type { JobApplication, JobListing } from '../types/career'

export async function fetchPublishedJobs(): Promise<{ jobs: JobListing[]; error?: string }> {
  try {
    const response = await fetch('/api/careers')
    if (!response.ok) {
      const data = (await response.json()) as { error?: string }
      return { jobs: [], error: data.error ?? 'Chargement des offres échoué' }
    }
    const data = (await response.json()) as { jobs: JobListing[] }
    return { jobs: data.jobs ?? [] }
  } catch {
    return { jobs: [], error: 'Chargement des offres échoué' }
  }
}

export async function fetchPublishedJob(jobId: string): Promise<{ job: JobListing | null; error?: string }> {
  try {
    const response = await fetch(`/api/careers?jobId=${encodeURIComponent(jobId)}`)
    if (!response.ok) {
      const data = (await response.json()) as { error?: string }
      return { job: null, error: data.error ?? 'Offre introuvable' }
    }
    const data = (await response.json()) as { job: JobListing }
    return { job: data.job ?? null }
  } catch {
    return { job: null, error: 'Offre introuvable' }
  }
}

export interface ApplicationPayload {
  jobId: string
  fullName: string
  email: string
  phone: string
  coverLetter: string
  cvLink?: string
  linkedIn?: string
  _honeypot?: string
}

export async function submitJobApplication(
  payload: ApplicationPayload
): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch('/api/careers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = (await response.json()) as { ok?: boolean; error?: string }
    if (!response.ok) {
      return { ok: false, error: data.error ?? 'Envoi de la candidature échoué' }
    }
    return { ok: Boolean(data.ok) }
  } catch {
    return { ok: false, error: 'Envoi de la candidature échoué' }
  }
}

export async function fetchAdminCareers(): Promise<{
  jobs: JobListing[]
  applications: JobApplication[]
  error?: string
}> {
  const response = await fetch('/api/careers-admin', {
    headers: getAdminAuthHeaders(),
  })

  if (!response.ok) {
    try {
      const data = (await response.json()) as { error?: string }
      return { jobs: [], applications: [], error: data.error ?? 'Chargement échoué' }
    } catch {
      return { jobs: [], applications: [], error: 'Chargement échoué' }
    }
  }

  const data = (await response.json()) as { jobs: JobListing[]; applications: JobApplication[] }
  return {
    jobs: data.jobs ?? [],
    applications: data.applications ?? [],
  }
}

export async function adminCreateJob(job: Omit<JobListing, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt'>): Promise<{
  ok: boolean
  job?: JobListing
  error?: string
}> {
  const response = await fetch('/api/careers-admin', {
    method: 'POST',
    headers: { ...getAdminAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create_job', job }),
  })
  const data = (await response.json()) as { ok?: boolean; job?: JobListing; error?: string }
  if (!response.ok) return { ok: false, error: data.error ?? 'Création échouée' }
  return { ok: true, job: data.job }
}

export async function adminUpdateJob(
  jobId: string,
  job: Partial<JobListing>
): Promise<{ ok: boolean; job?: JobListing; error?: string }> {
  const response = await fetch('/api/careers-admin', {
    method: 'POST',
    headers: { ...getAdminAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update_job', jobId, job }),
  })
  const data = (await response.json()) as { ok?: boolean; job?: JobListing; error?: string }
  if (!response.ok) return { ok: false, error: data.error ?? 'Mise à jour échouée' }
  return { ok: true, job: data.job }
}

export async function adminDeleteJob(jobId: string): Promise<{ ok: boolean; error?: string }> {
  const response = await fetch('/api/careers-admin', {
    method: 'POST',
    headers: { ...getAdminAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete_job', jobId }),
  })
  const data = (await response.json()) as { ok?: boolean; error?: string }
  if (!response.ok) return { ok: false, error: data.error ?? 'Suppression échouée' }
  return { ok: true }
}

export async function adminUpdateApplication(
  applicationId: string,
  status: JobApplication['status'],
  adminNotes?: string
): Promise<{ ok: boolean; error?: string }> {
  const response = await fetch('/api/careers-admin', {
    method: 'POST',
    headers: { ...getAdminAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update_application', applicationId, status, adminNotes }),
  })
  const data = (await response.json()) as { ok?: boolean; error?: string }
  if (!response.ok) return { ok: false, error: data.error ?? 'Mise à jour échouée' }
  return { ok: true }
}
