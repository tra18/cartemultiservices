import { randomUUID } from 'crypto'
import { isValidEmail, sanitizeText } from './security.js'

export const JOBS_KEY = 'career-jobs'
export const APPLICATIONS_KEY = 'career-applications'
const MAX_APPLICATIONS = 500

const CONTRACT_TYPES = new Set(['cdi', 'cdd', 'stage', 'freelance'])
const JOB_STATUSES = new Set(['draft', 'published', 'archived'])
const APPLICATION_STATUSES = new Set(['new', 'reviewed', 'shortlisted', 'rejected', 'hired'])

export async function loadJobs(redis) {
  return (await redis.get(JOBS_KEY)) ?? []
}

export async function saveJobs(redis, jobs) {
  await redis.set(JOBS_KEY, jobs)
}

export async function loadApplications(redis) {
  return (await redis.get(APPLICATIONS_KEY)) ?? []
}

export async function saveApplications(redis, applications) {
  await redis.set(APPLICATIONS_KEY, applications.slice(0, MAX_APPLICATIONS))
}

export function getPublishedJobs(jobs) {
  return jobs
    .filter((job) => job.status === 'published')
    .sort((a, b) => new Date(b.publishedAt ?? b.createdAt).getTime() - new Date(a.publishedAt ?? a.createdAt).getTime())
}

export function getJobById(jobs, jobId) {
  return jobs.find((job) => job.id === jobId) ?? null
}

export function isValidJobPayload(payload, { partial = false } = {}) {
  if (!payload || typeof payload !== 'object') return false

  const checkString = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.length <= max

  if (!partial) {
    return (
      checkString(payload.title, 120) &&
      checkString(payload.department, 80) &&
      checkString(payload.location, 80) &&
      CONTRACT_TYPES.has(payload.contractType) &&
      checkString(payload.description, 8000) &&
      checkString(payload.requirements, 4000)
    )
  }

  if (payload.title !== undefined && !checkString(payload.title, 120)) return false
  if (payload.department !== undefined && !checkString(payload.department, 80)) return false
  if (payload.location !== undefined && !checkString(payload.location, 80)) return false
  if (payload.contractType !== undefined && !CONTRACT_TYPES.has(payload.contractType)) return false
  if (payload.description !== undefined && !checkString(payload.description, 8000)) return false
  if (payload.requirements !== undefined && !checkString(payload.requirements, 4000)) return false
  if (payload.status !== undefined && !JOB_STATUSES.has(payload.status)) return false

  return true
}

export function normalizeJobPayload(payload) {
  const now = new Date().toISOString()
  return {
    title: sanitizeText(payload.title, 120),
    department: sanitizeText(payload.department, 80),
    location: sanitizeText(payload.location, 80),
    contractType: CONTRACT_TYPES.has(payload.contractType) ? payload.contractType : 'cdi',
    description: sanitizeText(payload.description, 8000),
    requirements: sanitizeText(payload.requirements, 4000),
    status: JOB_STATUSES.has(payload.status) ? payload.status : 'draft',
    updatedAt: now,
  }
}

export function createJob(payload) {
  const now = new Date().toISOString()
  const normalized = normalizeJobPayload(payload)
  return {
    id: randomUUID(),
    ...normalized,
    createdAt: now,
    publishedAt: normalized.status === 'published' ? now : undefined,
  }
}

export function updateJob(existing, payload) {
  const normalized = normalizeJobPayload({ ...existing, ...payload })
  const wasPublished = existing.status === 'published'
  const isPublished = normalized.status === 'published'
  return {
    ...existing,
    ...normalized,
    publishedAt:
      isPublished && !wasPublished
        ? new Date().toISOString()
        : isPublished
          ? existing.publishedAt ?? new Date().toISOString()
          : undefined,
  }
}

export function isValidApplicationPayload(payload) {
  if (!payload || typeof payload !== 'object') return false
  if (typeof payload.jobId !== 'string' || !payload.jobId.trim()) return false
  if (typeof payload.fullName !== 'string' || payload.fullName.trim().length < 2 || payload.fullName.length > 120) return false
  if (!isValidEmail(payload.email)) return false
  if (typeof payload.phone !== 'string' || payload.phone.trim().length < 8 || payload.phone.length > 30) return false
  if (typeof payload.coverLetter !== 'string' || payload.coverLetter.trim().length < 20 || payload.coverLetter.length > 4000) return false
  if (payload.cvLink !== undefined && payload.cvLink !== null && payload.cvLink !== '') {
    if (typeof payload.cvLink !== 'string' || payload.cvLink.length > 300) return false
  }
  if (payload.linkedIn !== undefined && payload.linkedIn !== null && payload.linkedIn !== '') {
    if (typeof payload.linkedIn !== 'string' || payload.linkedIn.length > 300) return false
  }
  return true
}

export function createApplication(job, payload) {
  const now = new Date().toISOString()
  return {
    id: randomUUID(),
    jobId: job.id,
    jobTitle: job.title,
    fullName: sanitizeText(payload.fullName, 120),
    email: sanitizeText(payload.email, 80).toLowerCase(),
    phone: sanitizeText(payload.phone, 30),
    coverLetter: sanitizeText(payload.coverLetter, 4000),
    cvLink: payload.cvLink ? sanitizeText(payload.cvLink, 300) : undefined,
    linkedIn: payload.linkedIn ? sanitizeText(payload.linkedIn, 300) : undefined,
    status: 'new',
    createdAt: now,
  }
}

export function isValidApplicationStatus(status) {
  return APPLICATION_STATUSES.has(status)
}
