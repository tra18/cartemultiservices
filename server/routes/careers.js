import { sendTypedEmail } from '../lib/mailer.js'
import { pushAdminAlert } from '../lib/adminAlerts.js'
import {
  createApplication,
  createJob,
  getJobById,
  getPublishedJobs,
  isValidApplicationPayload,
  isValidApplicationStatus,
  isValidJobPayload,
  loadApplications,
  loadJobs,
  saveApplications,
  saveJobs,
  updateJob,
} from '../lib/careersStore.js'
import {
  getClientIp,
  getRedis,
  parseBody,
  rateLimit,
  verifyAdminSession,
} from '../lib/security.js'

function getPathname(req) {
  const forwarded = req.headers['x-forwarded-uri'] ?? req.headers['x-vercel-original-url']
  if (typeof forwarded === 'string' && forwarded.startsWith('/api/')) {
    return forwarded.split('?')[0]
  }

  const raw = req.url ?? ''
  if (typeof raw === 'string' && raw.startsWith('/')) return raw.split('?')[0]
  try {
    return new URL(raw, 'http://localhost').pathname
  } catch {
    return String(raw).split('?')[0]
  }
}

async function notifyAdminNewApplication(redis, application, job) {
  await pushAdminAlert(redis, {
    type: 'new_application',
    applicationId: application.id,
    jobId: job.id,
    jobTitle: job.title,
    candidateName: application.fullName,
    candidateEmail: application.email,
  })

  const emailResult = await sendTypedEmail('admin_application_notification', {
    candidateName: application.fullName,
    candidateEmail: application.email,
    jobTitle: job.title,
    applicationId: application.id,
  })

  if (!emailResult.ok) {
    console.error('Admin application notification failed', application.id, emailResult.error)
  }

  await sendTypedEmail('application_received', {
    email: application.email,
    fullName: application.fullName,
    jobTitle: job.title,
  })
}

async function handleCareersPublic(req, res, redis) {
  if (req.method === 'GET') {
    const jobs = await loadJobs(redis)
    const url = new URL(req.url ?? '/', 'http://localhost')
    const jobId = url.searchParams.get('jobId')

    if (jobId) {
      const job = getJobById(jobs, jobId)
      if (!job || job.status !== 'published') {
        return res.status(404).json({ error: 'Offre introuvable' })
      }
      return res.status(200).json({ job })
    }

    return res.status(200).json({ jobs: getPublishedJobs(jobs) })
  }

  if (req.method === 'POST') {
    const ip = getClientIp(req)
    const allowed = await rateLimit(redis, `rate:careers-apply:${ip}`, 10, 3600)
    if (!allowed) {
      return res.status(429).json({ error: 'Trop de candidatures. Réessayez plus tard.' })
    }

    const body = parseBody(req)
    if (body._honeypot) {
      return res.status(200).json({ ok: true })
    }

    if (!isValidApplicationPayload(body)) {
      return res.status(400).json({ error: 'Données de candidature invalides' })
    }

    const jobs = await loadJobs(redis)
    const job = getJobById(jobs, body.jobId)
    if (!job || job.status !== 'published') {
      return res.status(404).json({ error: 'Offre introuvable ou fermée' })
    }

    const email = body.email.trim().toLowerCase()
    const allowedEmail = await rateLimit(redis, `rate:careers-apply-email:${email}:${body.jobId}`, 2, 86_400)
    if (!allowedEmail) {
      return res.status(429).json({ error: 'Vous avez déjà postulé récemment à cette offre.' })
    }

    const applications = await loadApplications(redis)
    const application = createApplication(job, body)
    await saveApplications(redis, [application, ...applications])
    await notifyAdminNewApplication(redis, application, job)

    return res.status(200).json({ ok: true, applicationId: application.id })
  }

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'Method not allowed' })
}

async function handleCareersAdmin(req, res, redis) {
  const session = await verifyAdminSession(req, redis)
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const ip = getClientIp(req)
  const allowed = await rateLimit(redis, `rate:careers-admin:${ip}`, 120, 3600)
  if (!allowed) {
    return res.status(429).json({ error: 'Too many requests' })
  }

  if (req.method === 'GET') {
    const [jobs, applications] = await Promise.all([loadJobs(redis), loadApplications(redis)])
    return res.status(200).json({
      jobs: jobs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
      applications: applications.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    })
  }

  if (req.method === 'POST') {
    const body = parseBody(req)
    const action = body.action
    const jobs = await loadJobs(redis)
    const applications = await loadApplications(redis)

    if (action === 'create_job') {
      if (!isValidJobPayload(body.job)) {
        return res.status(400).json({ error: 'Données offre invalides' })
      }
      const job = createJob(body.job)
      await saveJobs(redis, [job, ...jobs])
      return res.status(200).json({ ok: true, job })
    }

    if (action === 'update_job') {
      const index = jobs.findIndex((item) => item.id === body.jobId)
      if (index === -1) return res.status(404).json({ error: 'Offre introuvable' })
      if (!isValidJobPayload(body.job, { partial: true })) {
        return res.status(400).json({ error: 'Données offre invalides' })
      }
      const updated = updateJob(jobs[index], body.job)
      const next = [...jobs]
      next[index] = updated
      await saveJobs(redis, next)
      return res.status(200).json({ ok: true, job: updated })
    }

    if (action === 'delete_job') {
      const next = jobs.filter((item) => item.id !== body.jobId)
      if (next.length === jobs.length) return res.status(404).json({ error: 'Offre introuvable' })
      await saveJobs(redis, next)
      return res.status(200).json({ ok: true })
    }

    if (action === 'update_application') {
      const index = applications.findIndex((item) => item.id === body.applicationId)
      if (index === -1) return res.status(404).json({ error: 'Candidature introuvable' })
      if (!isValidApplicationStatus(body.status)) {
        return res.status(400).json({ error: 'Statut invalide' })
      }
      const updated = {
        ...applications[index],
        status: body.status,
        adminNotes: typeof body.adminNotes === 'string' ? body.adminNotes.slice(0, 2000) : applications[index].adminNotes,
      }
      const next = [...applications]
      next[index] = updated
      await saveApplications(redis, next)
      return res.status(200).json({ ok: true, application: updated })
    }

    return res.status(400).json({ error: 'Action inconnue' })
  }

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'Method not allowed' })
}

export default async function handler(req, res) {
  const redis = getRedis()
  if (!redis) {
    return res.status(503).json({ error: 'Service indisponible' })
  }

  try {
    const path = getPathname(req)
    if (path.endsWith('/careers-admin')) {
      return handleCareersAdmin(req, res, redis)
    }
    return handleCareersPublic(req, res, redis)
  } catch (error) {
    console.error('careers api error', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
