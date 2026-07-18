import heroesDocument from './heroes.yaml'
import type { Role } from '../types'

export const ranks = [
  'F',
  'E',
  'D',
  'C',
  'B',
  'A',
  'S1',
  'S2',
  'S3',
  'S4',
  'S5',
  'S6',
  'S7',
  'S8',
  'S9',
]

export type Hero = {
  fullName: string
  name: string
}

export type HeroData = Record<Role, Hero[]>

const roles: Role[] = ['attacker', 'gunner', 'tank', 'sprinter']

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isRole = (value: unknown): value is Role =>
  typeof value === 'string' && roles.some((role) => role === value)

const createHeroData = (document: unknown): HeroData => {
  if (!isRecord(document) || !Array.isArray(document.heroes)) {
    throw new Error('heroes.yaml: ルートに heroes の配列が必要です。')
  }

  const result: HeroData = { attacker: [], gunner: [], tank: [], sprinter: [] }
  const fullNames = new Set<string>()

  document.heroes.forEach((entry, index) => {
    const location = `heroes.yaml: heroes[${index}]`
    if (!isRecord(entry)) throw new Error(`${location} はオブジェクトで指定してください。`)
    if (!isRole(entry.role)) throw new Error(`${location}.role は attacker / gunner / tank / sprinter のいずれかです。`)
    if (typeof entry.fullName !== 'string' || !entry.fullName.trim()) throw new Error(`${location}.fullName が必要です。`)
    if (typeof entry.name !== 'string' || !entry.name.trim()) throw new Error(`${location}.name が必要です。`)

    const fullName = entry.fullName.trim()
    const name = entry.name.trim()
    if (fullNames.has(fullName)) throw new Error(`${location}.fullName「${fullName}」が重複しています。`)
    fullNames.add(fullName)
    result[entry.role].push({ fullName, name })
  })

  return result
}

export const hero = createHeroData(heroesDocument)
