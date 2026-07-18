export const DETAIL_LIMIT = 6

export const detailOptions = [
  { key: 'supportCode', label: '応援コード', description: '応援コードを掲載' },
  { key: 'gender', label: '性別', description: '設定した性別を掲載' },
  { key: 'accountLevel', label: 'アカウントレベル', description: '現在のレベルを掲載' },
  { key: 'friendCode', label: 'フレンドコード', description: 'フレンド申請用コードを掲載' },
  { key: 'guild', label: '所属ギルド', description: '所属先を掲載' },
  { key: 'seriousLevel', label: 'ガチ度', description: '炎の5段階でプレイ熱量を掲載' },
  { key: 'iconCounts', label: 'アイコン数', description: '金・銀・銅・大会を角型アイコンで表示' },
  { key: 'favoriteHero', label: '推し', description: '推しヒーローを掲載' },
  { key: 'playHistory', label: 'コンパス歴', description: 'プレイ歴を掲載' },
  { key: 'snsId', label: 'SNSのID', description: '交流用のSNS IDを掲載' },
  { key: 'playStyle', label: 'プレイスタイル', description: '固定・野良などの遊び方を掲載' },
  { key: 'activeTime', label: '主な活動時間', description: 'よく遊ぶ時間帯を掲載' },
  { key: 'custom', label: '自由項目 1', description: '見出しと内容を自由に設定' },
  { key: 'custom2', label: '自由項目 2', description: '2つ目の見出しと内容を自由に設定' },
] as const

export type DetailKey = (typeof detailOptions)[number]['key']

export const DEFAULT_DETAIL_KEYS: DetailKey[] = [
  'favoriteHero',
  'seriousLevel',
  'playHistory',
  'guild',
  'friendCode',
  'accountLevel',
]

export const isDetailKey = (value: unknown): value is DetailKey =>
  typeof value === 'string' && detailOptions.some(({ key }) => key === value)
