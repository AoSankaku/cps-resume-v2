import { DEFAULT_DETAIL_KEYS, DETAIL_LIMIT, isDetailKey } from './details'
import { normalizeThemeHue } from './theme'
import { initialResumeData, isAvatarFit, type AvatarFit, type ResumeData } from './types'

type ResumeDataRecord = Record<string, unknown>
type StringField = Exclude<{
  [K in keyof ResumeData]: ResumeData[K] extends string ? K : never
}[keyof ResumeData], 'avatarDataUrl' | 'avatarFit'>

const stringFields = [
  'playerName',
  'pronunciation',
  'highestRank',
  'seasonHighestRank',
  'maxDeckLevel',
  'accountLevel',
  'friendCode',
  'guild',
  'playHistory',
  'gender',
  'applicationCode',
  'favoriteHero',
  'goldIconCount',
  'silverIconCount',
  'bronzeIconCount',
  'tournamentIconCount',
  'xId',
  'discordId',
  'customDetailLabel',
  'customDetailValue',
  'customDetailLabel2',
  'customDetailValue2',
  'comment',
  'playStyle',
  'activeTime',
] as const satisfies readonly StringField[]

const knownResumeKeys = new Set<string>([
  ...stringFields,
  'avatarDataUrl',
  'avatarFit',
  'showPlayerIcon',
  'themeHue',
  'seriousLevel',
  'selectedDetailKeys',
  'heroSelections',
  'practicingHeroes',
  'rank',
  'enjoyRank',
  'iconCount',
  'snsId',
])

const isRecord = (value: unknown): value is ResumeDataRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const readString = (source: ResumeDataRecord, key: string, fallback: string) =>
  typeof source[key] === 'string' ? source[key] : fallback

const readNumber = (value: unknown, fallback: number) => {
  const number = typeof value === 'number' || typeof value === 'string' ? Number(value) : Number.NaN
  return Number.isFinite(number) ? number : fallback
}

export const hasResumeDataFields = (value: unknown): value is ResumeDataRecord =>
  isRecord(value) && Object.keys(value).some((key) => knownResumeKeys.has(key))

export const normalizeResumeData = (
  value: unknown,
  fallbackAvatarFit: AvatarFit = initialResumeData.avatarFit,
): ResumeData | null => {
  if (!isRecord(value)) return null
  const source = value
  const normalized: ResumeData = { ...initialResumeData }

  stringFields.forEach((key) => {
    const next = source[key]
    if (typeof next === 'string') normalized[key] = next
  })

  normalized.highestRank = readString(source, 'highestRank', readString(source, 'rank', initialResumeData.highestRank))
  normalized.seasonHighestRank = readString(
    source,
    'seasonHighestRank',
    readString(source, 'enjoyRank', initialResumeData.seasonHighestRank),
  )
  normalized.goldIconCount = readString(
    source,
    'goldIconCount',
    readString(source, 'iconCount', initialResumeData.goldIconCount),
  )
  normalized.xId = readString(source, 'xId', readString(source, 'snsId', initialResumeData.xId))
  normalized.avatarFit = isAvatarFit(source.avatarFit) ? source.avatarFit : fallbackAvatarFit
  normalized.showPlayerIcon = typeof source.showPlayerIcon === 'boolean'
    ? source.showPlayerIcon
    : initialResumeData.showPlayerIcon
  normalized.themeHue = normalizeThemeHue(readNumber(source.themeHue, initialResumeData.themeHue))
  normalized.seriousLevel = Math.max(1, Math.min(5, Math.round(
    readNumber(source.seriousLevel, initialResumeData.seriousLevel),
  )))

  normalized.selectedDetailKeys = Array.isArray(source.selectedDetailKeys)
    ? [...new Set(
      source.selectedDetailKeys
        .map((key) => key === 'snsId' ? 'xId' : key)
        .filter(isDetailKey),
    )].slice(0, DETAIL_LIMIT)
    : DEFAULT_DETAIL_KEYS
  const heroSelections = Array.isArray(source.heroSelections)
    ? [...new Set(
      source.heroSelections
        .filter((name): name is string => typeof name === 'string' && Boolean(name.trim()))
        .map((name) => name.trim()),
    )].slice(0, 6)
    : initialResumeData.heroSelections
  normalized.heroSelections = heroSelections.length > 0
    ? heroSelections
    : [initialResumeData.heroSelections[0]]
  normalized.practicingHeroes = Array.isArray(source.practicingHeroes)
    ? [...new Set(
      source.practicingHeroes.filter(
        (name): name is string => typeof name === 'string' && normalized.heroSelections.includes(name),
      ),
    )]
    : initialResumeData.practicingHeroes

  const avatarDataUrl = readString(source, 'avatarDataUrl', '')
  normalized.avatarDataUrl = avatarDataUrl === '' || /^data:image\/(?:png|jpeg|webp);base64,/i.test(avatarDataUrl)
    ? avatarDataUrl
    : ''

  return normalized
}
