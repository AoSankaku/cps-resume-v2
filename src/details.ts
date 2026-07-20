export const DETAIL_LIMIT = 6

export const detailOptions = [
  { key: 'supportCode', label: '応援コード', description: '応援コードを掲載', slots: 1 },
  { key: 'gender', label: '性別', description: '設定した性別を掲載', slots: 1 },
  { key: 'accountLevel', label: 'アカウントレベル', description: '現在のレベルを掲載', slots: 1 },
  { key: 'friendCode', label: 'フレンドコード', description: 'フレンド申請用コードを掲載', slots: 1 },
  { key: 'guild', label: '所属ギルド', description: '所属先を掲載', slots: 1 },
  { key: 'seriousLevel', label: 'ガチ度', description: '炎の5段階でプレイ熱量を掲載', slots: 1 },
  { key: 'iconCounts', label: 'アイコン数', description: '金・銀・銅・大会の所持数を掲載', slots: 1 },
  { key: 'favoriteHero', label: '推し', description: '推しヒーローを掲載', slots: 1 },
  { key: 'playHistory', label: 'コンパス歴', description: 'プレイ歴を掲載', slots: 1 },
  { key: 'xId', label: 'X（Twitter）のID', description: 'X（Twitter）のIDを掲載', slots: 1 },
  { key: 'discordId', label: 'DiscordのID', description: 'DiscordのIDを掲載', slots: 1 },
  { key: 'playStyle', label: 'プレイスタイル', description: '固定・野良などの遊び方を掲載', slots: 1 },
  { key: 'activeTime', label: '主な活動時間', description: 'よく遊ぶ時間帯を掲載', slots: 1 },
  { key: 'custom', label: '自由項目 1', description: '見出しと内容を自由に設定', slots: 1 },
  { key: 'custom2', label: '自由項目 2', description: '2つ目の見出しと内容を自由に設定', slots: 1 },
  { key: 'custom3', label: '自由項目 3（横長）', description: '横幅いっぱいに表示・2枠使用', slots: 2 },
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

export const getDetailSlots = (key: DetailKey) =>
  detailOptions.find((option) => option.key === key)?.slots ?? 1

export const countDetailSlots = (keys: readonly DetailKey[]) =>
  keys.reduce((total, key) => total + getDetailSlots(key), 0)

export const limitDetailKeys = (keys: readonly DetailKey[]) => {
  const limited: DetailKey[] = []
  let usedSlots = 0
  keys.forEach((key) => {
    const slots = getDetailSlots(key)
    if (usedSlots + slots > DETAIL_LIMIT) return
    limited.push(key)
    usedSlots += slots
  })
  return limited
}

export type DetailLayoutItem = {
  key: DetailKey
  column: number
  row: number
  widthColumns: 1 | 2
}

export const getDetailLayout = (keys: readonly DetailKey[]): DetailLayoutItem[] => {
  const limited = limitDetailKeys(keys)
  const regularKeys = limited.filter((key) => getDetailSlots(key) === 1)
  const wideKeys = limited.filter((key) => getDetailSlots(key) === 2)
  const regularColumns = regularKeys.length === 1 && wideKeys.length === 0 ? 1 : 2

  return [
    ...regularKeys.map((key, index): DetailLayoutItem => ({
      key,
      column: index % regularColumns,
      row: Math.floor(index / regularColumns),
      widthColumns: regularColumns === 1 ? 2 : 1,
    })),
    ...wideKeys.map((key, index): DetailLayoutItem => ({
      key,
      column: 0,
      row: Math.ceil(regularKeys.length / 2) + index,
      widthColumns: 2,
    })),
  ]
}
