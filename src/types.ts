import type { DetailKey } from './details'

export type Role = 'attacker' | 'gunner' | 'tank' | 'sprinter'
export type CacheStatus = 'saved' | 'without-image' | 'error'

export type ResumeData = {
  playerName: string
  pronunciation: string
  highestRank: string
  seasonHighestRank: string
  maxDeckLevel: string
  accountLevel: string
  friendCode: string
  guild: string
  playHistory: string
  gender: string
  applicationCode: string
  favoriteHero: string
  seriousLevel: number
  goldIconCount: string
  silverIconCount: string
  bronzeIconCount: string
  tournamentIconCount: string
  xId: string
  discordId: string
  customDetailLabel: string
  customDetailValue: string
  customDetailLabel2: string
  customDetailValue2: string
  selectedDetailKeys: DetailKey[]
  heroSelections: string[]
  comment: string
  playStyle: string
  activeTime: string
  avatarDataUrl: string
  showPlayerIcon: boolean
  themeHue: number
}

export const initialResumeData: ResumeData = {
  playerName: 'コンパスプレイヤー',
  pronunciation: 'こんぱすぷれいやー',
  highestRank: 'S4',
  seasonHighestRank: '',
  maxDeckLevel: '170',
  accountLevel: '334',
  friendCode: '1234567890',
  guild: '未所属',
  playHistory: '3年',
  gender: '未回答',
  applicationCode: 'A-bCdE',
  favoriteHero: '青春 アリス',
  seriousLevel: 4,
  goldIconCount: '0',
  silverIconCount: '8',
  bronzeIconCount: '12',
  tournamentIconCount: '0',
  xId: '@compass_player',
  discordId: 'compass_player',
  customDetailLabel: '好きなカード',
  customDetailValue: '全天首都防壁 Hum-Sphere LLIK',
  customDetailLabel2: '好きなステージ',
  customDetailValue2: 'でらクランクストリート',
  selectedDetailKeys: ['favoriteHero', 'seriousLevel', 'playHistory', 'guild', 'friendCode', 'accountLevel'],
  heroSelections: ['青春 アリス', '桜華 忠臣', 'リリカ'],
  comment: 'いっしょにバトルを楽しめるフレンド募集中！気軽に声をかけてください。',
  playStyle: '固定も野良も楽しみます',
  activeTime: '平日 21:00〜 / 休日',
  avatarDataUrl: '',
  showPlayerIcon: true,
  themeHue: 350,
}
