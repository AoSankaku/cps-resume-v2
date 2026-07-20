import type { ResumeData } from './types'

export const RESUME_JSON_FORMAT = 'cps-resume'
export const RESUME_JSON_VERSION = 2

export const serializeResumeData = (data: ResumeData, savedAt = new Date()) => JSON.stringify({
  format: RESUME_JSON_FORMAT,
  version: RESUME_JSON_VERSION,
  savedAt: savedAt.toISOString(),
  origin: 'https://cpsresume.aosankaku.net/',
  data,
}, null, 2)
