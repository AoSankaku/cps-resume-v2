import { hasResumeDataFields, normalizeResumeData } from './resumeData'
import type { ResumeData } from './types'

export const RESUME_JSON_FORMAT = 'cps-resume'
export const RESUME_JSON_VERSION = 2

export type ResumeParseErrorCode = 'empty' | 'invalid-json' | 'unsupported-format' | 'unsupported-version' | 'invalid-data'

export type ResumeParseResult =
  | { ok: true; data: ResumeData; corrected: boolean }
  | { ok: false; error: ResumeParseErrorCode }

const parseErrorMessages: Record<ResumeParseErrorCode, string> = {
  empty: 'バックアップの文字を入力するか、ファイルを選んでください。',
  'invalid-json': '内容を読み取れませんでした。文字が欠けていないか確認してください。',
  'unsupported-format': 'このアプリのバックアップではないため読み込めません。',
  'unsupported-version': '新しいバージョンで作られたバックアップのため読み込めません。',
  'invalid-data': '履歴書の入力内容が見つかりませんでした。',
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const stripCodeFence = (text: string) => text
  .trim()
  .replace(/^```(?:json)?\s*/i, '')
  .replace(/\s*```$/, '')
  .replace(/^\uFEFF/, '')
  .trim()

const normalizeJsonPunctuation = (text: string) => text.replace(
  /[｛｝［］：，＂“”]/g,
  (character) => ({
    '｛': '{',
    '｝': '}',
    '［': '[',
    '］': ']',
    '：': ':',
    '，': ',',
    '＂': '"',
    '“': '"',
    '”': '"',
  })[character] ?? character,
)

const normalizeFullWidthAscii = (text: string) => [...text].map((character) => {
  const codePoint = character.codePointAt(0) ?? 0
  if (codePoint >= 0xff01 && codePoint <= 0xff5e) return String.fromCodePoint(codePoint - 0xfee0)
  return character === '　' ? ' ' : character
}).join('')

const removeTrailingCommas = (text: string) => {
  let result = ''
  let inString = false
  let escaped = false
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (inString) {
      result += character
      if (escaped) escaped = false
      else if (character === '\\') escaped = true
      else if (character === '"') inString = false
      continue
    }
    if (character === '"') {
      inString = true
      result += character
      continue
    }
    if (character === ',') {
      let nextIndex = index + 1
      while (/\s/.test(text[nextIndex] ?? '')) nextIndex += 1
      if (text[nextIndex] === '}' || text[nextIndex] === ']') continue
    }
    result += character
  }
  return result
}

const getParseCandidates = (text: string) => {
  const stripped = stripCodeFence(text)
  const punctuationCorrected = removeTrailingCommas(normalizeJsonPunctuation(stripped))
  const fullWidthCorrected = removeTrailingCommas(normalizeFullWidthAscii(punctuationCorrected))
  return [...new Set([stripped, punctuationCorrected, fullWidthCorrected])]
}

export const getResumeParseErrorMessage = (code: ResumeParseErrorCode) => parseErrorMessages[code]

export const parseResumeText = (text: string): ResumeParseResult => {
  if (!text.trim()) return { ok: false, error: 'empty' }
  const candidates = getParseCandidates(text)
  let parsed: unknown
  let corrected = false
  let parsedSuccessfully = false
  for (const [index, candidate] of candidates.entries()) {
    try {
      parsed = JSON.parse(candidate)
      corrected = index > 0
      parsedSuccessfully = true
      break
    } catch {
      // Try the next narrowly-scoped correction before reporting a parse error.
    }
  }
  if (!parsedSuccessfully) return { ok: false, error: 'invalid-json' }
  if (!isRecord(parsed)) return { ok: false, error: 'invalid-data' }

  let resumeSource: unknown = parsed
  if ('format' in parsed || 'data' in parsed) {
    if (parsed.format !== undefined && parsed.format !== RESUME_JSON_FORMAT) {
      return { ok: false, error: 'unsupported-format' }
    }
    const version = Number(parsed.version)
    if (Number.isFinite(version) && version > RESUME_JSON_VERSION) {
      return { ok: false, error: 'unsupported-version' }
    }
    resumeSource = parsed.data
  }
  if (!hasResumeDataFields(resumeSource)) return { ok: false, error: 'invalid-data' }
  const data = normalizeResumeData(resumeSource, 'cover')
  if (!data) return { ok: false, error: 'invalid-data' }
  return { ok: true, data, corrected }
}

export const serializeResumeData = (data: ResumeData, savedAt = new Date()) => JSON.stringify({
  format: RESUME_JSON_FORMAT,
  version: RESUME_JSON_VERSION,
  savedAt: savedAt.toISOString(),
  origin: 'https://cpsresume.aosankaku.net/',
  data,
}, null, 2)
