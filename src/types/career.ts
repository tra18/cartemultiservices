export type JobStatus = 'draft' | 'published' | 'archived'
export type JobContractType = 'cdi' | 'cdd' | 'stage' | 'freelance'
export type ApplicationStatus = 'new' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired'

export interface JobListing {
  id: string
  title: string
  department: string
  location: string
  contractType: JobContractType
  description: string
  requirements: string
  status: JobStatus
  createdAt: string
  updatedAt: string
  publishedAt?: string
}

export interface JobApplication {
  id: string
  jobId: string
  jobTitle: string
  fullName: string
  email: string
  phone: string
  coverLetter: string
  cvLink?: string
  linkedIn?: string
  status: ApplicationStatus
  adminNotes?: string
  createdAt: string
}

export const JOB_CONTRACT_LABELS: Record<JobContractType, string> = {
  cdi: 'CDI',
  cdd: 'CDD',
  stage: 'Stage',
  freelance: 'Freelance',
}

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  draft: 'Brouillon',
  published: 'Publiée',
  archived: 'Archivée',
}

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  new: 'Nouvelle',
  reviewed: 'Examinée',
  shortlisted: 'Présélectionnée',
  rejected: 'Refusée',
  hired: 'Recrutée',
}
