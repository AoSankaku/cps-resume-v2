import { useEffect, useRef, useState } from 'react'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import { hero } from '../data/main'
import attackerIcon from '../assets/roles/attacker.png'
import gunnerIcon from '../assets/roles/gunner.png'
import tankIcon from '../assets/roles/tank.png'
import sprinterIcon from '../assets/roles/sprinter.png'
import {
  drawCanvasText,
  getFirstGrapheme,
  getTwemojiUrls,
  measureCanvasText,
  splitGraphemes,
  type EmojiImageMap,
} from '../canvasText'
import { getDetailLayout, type DetailKey } from '../details'
import { normalizeComment } from '../resumeData'
import type { AvatarFit, ResumeData, Role } from '../types'
import { getThemeColor, getThemeContrastColor } from '../theme'

const WIDTH = 1200
const HEIGHT = 675
const STANDARD_EXPORT_SCALE = 1.5
const HIGH_QUALITY_EXPORT_SCALE = STANDARD_EXPORT_SCALE * 2
const RENDER_WIDTH = Math.round(WIDTH * HIGH_QUALITY_EXPORT_SCALE)
const RENDER_HEIGHT = Math.round(HEIGHT * HIGH_QUALITY_EXPORT_SCALE)
const RESUME_FONT_FAMILY = '"Noto Sans JP", sans-serif'
const RESUME_FONT_WEIGHTS = [600, 700, 800, 900] as const
const RESUME_FONT_STATIC_TEXT = '#コンパス 履歴書 よみ 呼び方 最高デッキレベル デキレ 使用ヒーロー 未選択 応援コード 性別 アカウントレベル フレンドコード 所属ギルド ガチ度 アイコン数 推し コンパス歴 X（Twitter）のID DiscordのID プレイスタイル 主な活動時間 自由項目A 自由項目B 自由項目L 金銀銅大 ひとこと よろしくお願いします'
const roleIcons: Record<Role, string> = { attacker: attackerIcon, gunner: gunnerIcon, tank: tankIcon, sprinter: sprinterIcon }
const roleColors: Record<Role, string> = { attacker: '#ff3855', gunner: '#2ccf75', tank: '#ffbd27', sprinter: '#4c6fff' }
const CANVAS_RENDER_REVISION = import.meta.hot
  ? ((import.meta.hot.data.canvasRenderRevision as number | undefined) ?? 0) + 1
  : 0

if (import.meta.hot) import.meta.hot.data.canvasRenderRevision = CANVAS_RENDER_REVISION

type Props = {
  data: ResumeData
  headingId?: string
}

const imageCache = new Map<string, Promise<HTMLImageElement>>()

const loadImage = (source: string) => {
  const cached = imageCache.get(source)
  if (cached) return cached
  const pending = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = source
  })
  imageCache.set(source, pending)
  pending.catch(() => imageCache.delete(source))
  return pending
}

const roleIconImages = Promise.all(
  (Object.keys(roleIcons) as Role[]).map(async (role) => [role, await loadImage(roleIcons[role])] as const),
).then((entries) => Object.fromEntries(entries) as Record<Role, HTMLImageElement>)

const loadResumeFonts = (data: ResumeData) => {
  const userText = Object.entries(data).flatMap(([key, value]) => {
    if (key === 'avatarDataUrl') return []
    if (typeof value === 'string') return [value]
    if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string')
    return []
  }).join('')
  const fontText = `${RESUME_FONT_STATIC_TEXT}${userText}`
  return Promise.allSettled(
    RESUME_FONT_WEIGHTS.map((weight) => document.fonts.load(`${weight} 96px ${RESUME_FONT_FAMILY}`, fontText)),
  )
}

const loadTwemojiImages = async (data: ResumeData): Promise<EmojiImageMap> => {
  const userText = Object.entries(data).flatMap(([key, value]) => {
    if (key === 'avatarDataUrl') return []
    if (typeof value === 'string') return [value]
    if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string')
    return []
  }).join('') + (data.practicingHeroes.length > 0 ? '🔰' : '')
  const entries = await Promise.all(getTwemojiUrls(userText).map(async (url) => {
    const image = await loadImage(url).catch(() => null)
    return [url, image] as const
  }))
  return new Map(entries.filter((entry): entry is readonly [string, HTMLImageElement] => entry[1] !== null))
}

const findRole = (heroName: string): Role => {
  const keys = Object.keys(hero) as Role[]
  return keys.find((key) => hero[key].some((item) => item.fullName === heroName)) ?? 'attacker'
}

const roundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
  ctx.beginPath()
  ctx.roundRect(x, y, width, height, radius)
}

const fitText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  initialSize: number,
  weight = 800,
  minimumSize = 18,
) => {
  let size = initialSize
  const effectiveMinimumSize = Math.min(initialSize, minimumSize)
  ctx.font = `${weight} ${size}px ${RESUME_FONT_FAMILY}`
  while (measureCanvasText(ctx, text) > maxWidth && size > effectiveMinimumSize) {
    size -= 1
    ctx.font = `${weight} ${size}px ${RESUME_FONT_FAMILY}`
  }
}

const drawFittedImage = (
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  fit: AvatarFit,
) => {
  const imageWidth = image.naturalWidth || image.width
  const imageHeight = image.naturalHeight || image.height
  if (fit === 'cover') {
    const ratio = Math.max(width / imageWidth, height / imageHeight)
    const sourceWidth = width / ratio
    const sourceHeight = height / ratio
    const sourceX = (imageWidth - sourceWidth) / 2
    const sourceY = (imageHeight - sourceHeight) / 2
    ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height)
    return
  }
  const ratio = Math.min(width / imageWidth, height / imageHeight)
  const targetWidth = imageWidth * ratio
  const targetHeight = imageHeight * ratio
  const targetX = x + (width - targetWidth) / 2
  const targetY = y + (height - targetHeight) / 2
  ctx.drawImage(image, targetX, targetY, targetWidth, targetHeight)
}

const drawWrappedText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  containerY: number,
  containerHeight: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
  emojiImages: EmojiImageMap,
) => {
  const characters = splitGraphemes(text.replace(/\r\n?/g, '\n'))
  const lines: string[] = []
  let line = ''
  let truncated = false
  for (let index = 0; index < characters.length; index += 1) {
    const character = characters[index]
    if (character === '\n') {
      lines.push(line)
      line = ''
      if (lines.length === maxLines) {
        truncated = index < characters.length - 1
        break
      }
      continue
    }
    const candidate = line + character
    if (measureCanvasText(ctx, candidate) > maxWidth && line) {
      lines.push(line)
      if (lines.length === maxLines) {
        truncated = true
        break
      }
      line = character
    } else {
      line = candidate
    }
  }
  if (line && lines.length < maxLines) lines.push(line)
  if (lines.length === 0) lines.push('')
  if (truncated) {
    const lastIndex = lines.length - 1
    let lastLine = lines[lastIndex]
    while (lastLine && measureCanvasText(ctx, `${lastLine}…`) > maxWidth) {
      lastLine = splitGraphemes(lastLine).slice(0, -1).join('')
    }
    lines[lastIndex] = `${lastLine}…`
  }

  const metrics = lines.map((item) => ctx.measureText(item || 'あ'))
  const ascent = Math.max(...metrics.map((item) => item.actualBoundingBoxAscent))
  const descent = Math.max(...metrics.map((item) => item.actualBoundingBoxDescent))
  const textHeight = ascent + descent + lineHeight * (lines.length - 1)
  const firstBaseline = containerY + (containerHeight - textHeight) / 2 + ascent
  lines.forEach((item, index) => drawCanvasText(ctx, item, x, firstBaseline + index * lineHeight, emojiImages))
}

const awardIconStyles = [
  { key: 'gold', mark: '金', base: '#f2c94c', dark: '#8a6500', ink: '#211800' },
  { key: 'silver', mark: '銀', base: '#d9e0e6', dark: '#697681', ink: '#141a1f' },
  { key: 'bronze', mark: '銅', base: '#d48759', dark: '#783d1e', ink: '#241007' },
  { key: 'tournament', mark: '大', base: '#6842a5', dark: '#351c61', ink: '#fff' },
] as const

const drawIconCounts = (
  ctx: CanvasRenderingContext2D,
  counts: string[],
  x: number,
  y: number,
  maxWidth: number,
) => {
  const visibleIcons = awardIconStyles
    .map((style, index) => ({ ...style, count: counts[index] || '0' }))
    .filter(({ count }) => /[1-9]/.test(count))
  if (visibleIcons.length === 0) return
  let tileSize = visibleIcons.length >= 4 ? 18 : 20
  let countSize = visibleIcons.length <= 2 ? 22 : visibleIcons.length === 3 ? 19 : 17
  const minimumItemGap = 6
  const measureItems = () => {
    ctx.font = `900 ${countSize}px ${RESUME_FONT_FAMILY}`
    return visibleIcons.map(({ count }) => tileSize + 4 + ctx.measureText(count).width)
  }
  let itemWidths = measureItems()
  const getRequiredWidth = () => itemWidths.reduce((total, width) => total + width, 0)
    + minimumItemGap * (visibleIcons.length - 1)
  while (getRequiredWidth() > maxWidth && countSize > 8) {
    countSize -= 1
    itemWidths = measureItems()
  }
  while (getRequiredWidth() > maxWidth && tileSize > 12) {
    tileSize -= 1
    itemWidths = measureItems()
  }
  const unusedWidth = maxWidth - itemWidths.reduce((total, width) => total + width, 0)
  const itemGap = visibleIcons.length > 1
    ? Math.max(0, Math.min(24, unusedWidth / (visibleIcons.length - 1)))
    : 0
  let tileX = x
  visibleIcons.forEach((style, index) => {
    const tileY = y
    const textBottom = tileY + tileSize - 2
    ctx.fillStyle = style.base
    ctx.fillRect(tileX, tileY, tileSize, tileSize)
    ctx.strokeStyle = style.dark
    ctx.lineWidth = 1
    ctx.strokeRect(tileX + .5, tileY + .5, tileSize - 1, tileSize - 1)
    ctx.fillStyle = style.ink
    const markSize = Math.max(9, Math.round(tileSize * .68))
    ctx.font = `900 ${markSize}px ${RESUME_FONT_FAMILY}`
    const markBaseline = textBottom - ctx.measureText(style.mark).actualBoundingBoxDescent
    ctx.textAlign = 'center'
    ctx.fillText(style.mark, tileX + tileSize / 2, markBaseline)
    ctx.textAlign = 'left'
    ctx.fillStyle = '#161616'
    ctx.font = `900 ${countSize}px ${RESUME_FONT_FAMILY}`
    const countBaseline = textBottom - ctx.measureText(style.count).actualBoundingBoxDescent
    ctx.fillText(style.count, tileX + tileSize + 4, countBaseline)
    tileX += itemWidths[index] + itemGap
  })
}

const drawFlame = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
) => {
  ctx.beginPath()
  ctx.moveTo(x + 9, y + 19)
  ctx.bezierCurveTo(x + 3, y + 18, x, y + 14, x + 2, y + 9)
  ctx.bezierCurveTo(x + 3, y + 6, x + 6, y + 4, x + 7, y + 1)
  ctx.bezierCurveTo(x + 8, y + 5, x + 11, y + 7, x + 12, y + 10)
  ctx.bezierCurveTo(x + 14, y + 7, x + 14, y + 4, x + 13, y)
  ctx.bezierCurveTo(x + 19, y + 5, x + 21, y + 11, x + 18, y + 16)
  ctx.bezierCurveTo(x + 16, y + 18, x + 13, y + 19, x + 9, y + 19)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
}

const drawSeriousLevel = (
  ctx: CanvasRenderingContext2D,
  level: number,
  x: number,
  y: number,
  activeColor: string,
) => {
  const clampedLevel = Math.max(1, Math.min(5, Math.round(level)))
  for (let index = 0; index < 5; index += 1) {
    drawFlame(ctx, x + index * 27, y, index < clampedLevel ? activeColor : '#d6cec2')
  }
}

function ResumeCanvas({ data, headingId = 'preview-title' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [renderedData, setRenderedData] = useState<ResumeData | null>(null)
  const renderRevision = CANVAS_RENDER_REVISION
  const isReady = renderedData === data
  const hasRenderedPreview = renderedData !== null

  useEffect(() => {
    let cancelled = false

    const draw = async () => {
      const nextCanvas = document.createElement('canvas')
      nextCanvas.width = RENDER_WIDTH
      nextCanvas.height = RENDER_HEIGHT
      const ctx = nextCanvas.getContext('2d')
      if (!ctx) return
      ctx.scale(HIGH_QUALITY_EXPORT_SCALE, HIGH_QUALITY_EXPORT_SCALE)

      const [, icons, emojiImages] = await Promise.all([
        loadResumeFonts(data),
        roleIconImages,
        loadTwemojiImages(data),
      ])
      const avatar = data.showPlayerIcon && data.avatarDataUrl ? await loadImage(data.avatarDataUrl).catch(() => null) : null
      if (cancelled) return
      const accent = getThemeColor(data.themeHue)
      const accentContrast = getThemeContrastColor(data.themeHue)
      const now = new Date()
      const issueDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

      ctx.clearRect(0, 0, WIDTH, HEIGHT)
      ctx.fillStyle = '#f4efe6'
      ctx.fillRect(0, 0, WIDTH, HEIGHT)

      ctx.fillStyle = '#161616'
      ctx.fillRect(0, 0, WIDTH, 82)
      ctx.fillStyle = accent
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(470, 0)
      ctx.lineTo(430, 82)
      ctx.lineTo(0, 82)
      ctx.closePath()
      ctx.fill()

      ctx.fillStyle = accentContrast
      ctx.font = `900 27px ${RESUME_FONT_FAMILY}`
      ctx.save()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 4
      ctx.lineJoin = 'round'
      ctx.strokeText('#コンパス履歴書', 44, 49)
      ctx.fillText('#コンパス履歴書', 44, 49)
      ctx.restore()
      ctx.font = `700 13px ${RESUME_FONT_FAMILY}`
      ctx.fillStyle = '#bcbcbc'
      ctx.letterSpacing = '4px'
      ctx.fillText(`PLAYER RESUME // ${issueDate}`, 792, 48)
      ctx.letterSpacing = '0px'

      ctx.fillStyle = accent
      ctx.fillRect(44, 115, 7, 92)
      ctx.fillStyle = '#77736d'
      ctx.font = `700 16px ${RESUME_FONT_FAMILY}`
      drawCanvasText(ctx, data.pronunciation, 72, 130, emojiImages)
      ctx.fillStyle = '#161616'
      fitText(ctx, data.playerName || 'NO NAME', 700, 60, 900)
      drawCanvasText(ctx, data.playerName || 'NO NAME', 70, 193, emojiImages)

      const metrics: Array<[string, string]> = [
        ...(data.highestRank ? [['最高ランク', data.highestRank] as [string, string]] : []),
        ...(data.seasonHighestRank ? [['最高シーズンランク', data.seasonHighestRank] as [string, string]] : []),
        ['最高デッキレベル', data.maxDeckLevel || '---'],
      ]
      const metricY = 234
      const metricGap = 12
      const metricWidth = (687 - metricGap * (metrics.length - 1)) / metrics.length
      metrics.forEach(([label, value], index) => {
        const x = 44 + index * (metricWidth + metricGap)
        roundedRect(ctx, x, metricY, metricWidth, 82, 8)
        ctx.fillStyle = index === 0 ? '#161616' : '#e5ddd2'
        ctx.fill()
        ctx.fillStyle = index === 0 ? '#aaa' : '#77736d'
        ctx.font = `800 12px ${RESUME_FONT_FAMILY}`
        ctx.fillText(label, x + 18, metricY + 23)
        ctx.fillStyle = index === 0 ? '#fff' : '#161616'
        fitText(ctx, value, metricWidth - 36, 35, 900)
        drawCanvasText(ctx, value, x + 18, metricY + 64, emojiImages)
      })

      ctx.fillStyle = '#161616'
      ctx.font = `900 16px ${RESUME_FONT_FAMILY}`
      ctx.fillText('使用ヒーロー', 44, 378)
      const selectedHeroes = data.heroSelections.length > 0 ? data.heroSelections.slice(0, 6) : ['']
      const heroCount = selectedHeroes.length
      const twoColumnHeroes = heroCount >= 4
      const heroAreaHeight = 176
      const heroColumns = twoColumnHeroes ? 2 : 1
      const heroRows = Math.ceil(heroCount / heroColumns)
      const heroColumnGap = twoColumnHeroes ? 12 : 0
      const heroRowGap = twoColumnHeroes ? 8 : 12
      const heroCardWidth = (687 - heroColumnGap * (heroColumns - 1)) / heroColumns
      const heroRowHeight = twoColumnHeroes
        ? Math.min(62, Math.floor((heroAreaHeight - heroRowGap * (heroRows - 1)) / heroRows))
        : 49
      const usedHeroHeight = heroRowHeight * heroRows + heroRowGap * (heroRows - 1)
      const heroStartY = 396 + (twoColumnHeroes ? (heroAreaHeight - usedHeroHeight) / 2 : 0)
      selectedHeroes.forEach((heroName, index) => {
        const role = findRole(heroName)
        const displayName = `${data.practicingHeroes.includes(heroName) ? '🔰 ' : ''}${heroName || '未選択'}`
        const column = index % heroColumns
        const row = Math.floor(index / heroColumns)
        const x = 44 + column * (heroCardWidth + heroColumnGap)
        const y = heroStartY + row * (heroRowHeight + heroRowGap)
        const roleIconSize = twoColumnHeroes ? Math.min(36, heroRowHeight - 12) : 35
        const roleIconY = y + (heroRowHeight - roleIconSize) / 2
        const heroNameX = x + 17 + roleIconSize + (twoColumnHeroes ? 9 : 15)
        const heroFontSize = twoColumnHeroes ? 18 : 21
        roundedRect(ctx, x, y, heroCardWidth, heroRowHeight, twoColumnHeroes ? 5 : 7)
        ctx.fillStyle = '#fffaf3'
        ctx.fill()
        ctx.fillStyle = roleColors[role]
        ctx.fillRect(x, y, 7, heroRowHeight)
        ctx.drawImage(icons[role], x + 17, roleIconY, roleIconSize, roleIconSize)
        ctx.fillStyle = '#161616'
        fitText(ctx, displayName, x + heroCardWidth - heroNameX - 12, heroFontSize, 800, 11)
        drawCanvasText(ctx, displayName, heroNameX, y + heroRowHeight / 2 + (twoColumnHeroes ? 6 : 8), emojiImages)
      })

      if (data.showPlayerIcon) {
        const avatarFrameY = 110
        const avatarFrameHeight = 268
        const avatarFrameRight = 1154
        const avatarFrameWidth = data.avatarFrame === 'square' ? avatarFrameHeight : 386
        const avatarFrameX = avatarFrameRight - avatarFrameWidth
        const avatarFrameBottom = avatarFrameY + avatarFrameHeight
        const avatarLabelWidth = data.avatarFrame === 'square' ? 172 : 244
        const avatarLabelX = avatarFrameRight - avatarLabelWidth

        ctx.fillStyle = '#ded6cb'
        ctx.fillRect(avatarFrameX, avatarFrameY, avatarFrameWidth, avatarFrameHeight)
        ctx.save()
        roundedRect(ctx, avatarFrameX, avatarFrameY, avatarFrameWidth, avatarFrameHeight, 12)
        ctx.clip()
        if (avatar) {
          drawFittedImage(ctx, avatar, avatarFrameX, avatarFrameY, avatarFrameWidth, avatarFrameHeight, data.avatarFit)
        } else {
          const gradient = ctx.createLinearGradient(avatarFrameX, avatarFrameY, avatarFrameRight, avatarFrameBottom)
          gradient.addColorStop(0, '#292929')
          gradient.addColorStop(1, accent)
          ctx.fillStyle = gradient
          ctx.fillRect(avatarFrameX, avatarFrameY, avatarFrameWidth, avatarFrameHeight)
          ctx.strokeStyle = 'rgba(255,255,255,.22)'
          ctx.lineWidth = 2
          for (let x = avatarFrameX - 58; x < avatarFrameRight + 66; x += 32) {
            ctx.beginPath()
            ctx.moveTo(x, avatarFrameY)
            ctx.lineTo(x + 220, avatarFrameBottom)
            ctx.stroke()
          }
          ctx.fillStyle = '#fff'
          ctx.font = `900 96px ${RESUME_FONT_FAMILY}`
          ctx.textAlign = 'center'
          drawCanvasText(
            ctx,
            getFirstGrapheme(data.playerName.trim()) || '#',
            avatarFrameX + avatarFrameWidth / 2,
            277,
            emojiImages,
          )
          ctx.textAlign = 'left'
        }
        ctx.restore()
        ctx.strokeStyle = '#161616'
        ctx.lineWidth = 4
        roundedRect(ctx, avatarFrameX, avatarFrameY, avatarFrameWidth, avatarFrameHeight, 12)
        ctx.stroke()
        ctx.fillStyle = '#161616'
        ctx.fillRect(avatarLabelX, 354, avatarLabelWidth, 24)
        ctx.fillStyle = '#fff'
        ctx.font = `800 11px ${RESUME_FONT_FAMILY}`
        ctx.fillText('PLAYER ICON', 1066, 370)
      }

      const detailMap: Record<DetailKey, { label: string; value: string; icons?: string[]; seriousLevel?: number }> = {
        supportCode: { label: '応援コード', value: data.applicationCode },
        gender: { label: '性別', value: data.gender },
        accountLevel: { label: 'アカウントレベル', value: data.accountLevel },
        friendCode: { label: 'フレンドコード', value: data.friendCode },
        guild: { label: '所属ギルド', value: data.guild },
        seriousLevel: { label: 'ガチ度', value: '', seriousLevel: data.seriousLevel },
        iconCounts: {
          label: 'アイコン数',
          value: '',
          icons: [data.goldIconCount, data.silverIconCount, data.bronzeIconCount, data.tournamentIconCount],
        },
        favoriteHero: { label: '推し', value: data.favoriteHero },
        playHistory: { label: 'コンパス歴', value: data.playHistory },
        xId: { label: 'X（Twitter）のID', value: data.xId },
        discordId: { label: 'DiscordのID', value: data.discordId },
        playStyle: { label: 'プレイスタイル', value: data.playStyle },
        activeTime: { label: '主な活動時間', value: data.activeTime },
        custom: { label: data.customDetailLabel.trim() || '自由項目A', value: data.customDetailValue },
        custom2: { label: data.customDetailLabel2.trim() || '自由項目B', value: data.customDetailValue2 },
        custom3: { label: data.customDetailLabel3.trim() || '自由項目L', value: data.customDetailValue3 },
      }
      const positionedDetails = getDetailLayout(data.selectedDetailKeys).map(({ key, column, row, widthColumns }) => ({
        ...detailMap[key],
        x: 768 + column * 199,
        y: 409 + row * 63,
        width: widthColumns === 2 ? 386 : 180,
      }))
      positionedDetails.forEach(({ label, value, icons: iconCounts, seriousLevel, x, y, width: detailWidth }) => {
        ctx.fillStyle = '#858079'
        ctx.font = `700 11px ${RESUME_FONT_FAMILY}`
        fitText(ctx, label, detailWidth, 11, 700, 8)
        drawCanvasText(ctx, label, x, y, emojiImages)
        if (iconCounts) {
          drawIconCounts(ctx, iconCounts, x, y + 10, detailWidth)
        } else if (seriousLevel !== undefined) {
          drawSeriousLevel(ctx, seriousLevel, x, y + 8, accent)
        } else {
          ctx.fillStyle = '#161616'
          fitText(ctx, value || '—', detailWidth, 17, 800)
          drawCanvasText(ctx, value || '—', x, y + 24, emojiImages)
        }
        ctx.fillStyle = '#d6cec2'
        ctx.fillRect(x, y + 35, detailWidth, 2)
      })

      ctx.fillStyle = '#161616'
      ctx.fillRect(0, 590, WIDTH, 85)

      ctx.fillStyle = accent
      roundedRect(ctx, 44, 602, 98, 49, 7)
      ctx.fill()
      ctx.fillStyle = accentContrast
      ctx.font = `900 13px ${RESUME_FONT_FAMILY}`
      ctx.textAlign = 'center'
      ctx.fillText('ひとこと', 93, 632)

      ctx.fillStyle = '#242424'
      roundedRect(ctx, 154, 602, 1002, 49, 7)
      ctx.fill()
      ctx.fillStyle = '#fff'
      const comment = normalizeComment(data.comment) || 'よろしくお願いします！'
      ctx.font = `800 18px ${RESUME_FONT_FAMILY}`
      ctx.textAlign = 'left'
      drawWrappedText(ctx, comment, 174, 602, 49, 962, 22, 2, emojiImages)

      ctx.fillStyle = '#77736e'
      ctx.font = `600 9px ${RESUME_FONT_FAMILY}`
      ctx.textAlign = 'right'
      ctx.fillText('Twemoji graphics: github.com/jdecked/twemoji · CC BY 4.0  ·  コンパス履歴書ジェネレーターV2 by @Ao_Sankaku  ·  https://cpsresume.aosankaku.net', 1156, 669)
      ctx.textAlign = 'left'

      if (cancelled) return
      const canvas = canvasRef.current
      const visibleContext = canvas?.getContext('2d')
      if (!canvas || !visibleContext) return
      visibleContext.clearRect(0, 0, RENDER_WIDTH, RENDER_HEIGHT)
      visibleContext.drawImage(nextCanvas, 0, 0)
      setRenderedData(data)
    }

    const frame = window.requestAnimationFrame(() => draw().catch(() => {
      if (!cancelled) setRenderedData(null)
    }))
    return () => {
      cancelled = true
      window.cancelAnimationFrame(frame)
    }
  }, [data, renderRevision])

  const download = (scale: number) => {
    const canvas = canvasRef.current
    if (!canvas || !isReady) return
    const exportCanvas = document.createElement('canvas')
    exportCanvas.width = Math.round(WIDTH * scale)
    exportCanvas.height = Math.round(HEIGHT * scale)
    const exportContext = exportCanvas.getContext('2d')
    if (!exportContext) return
    exportContext.imageSmoothingEnabled = true
    exportContext.imageSmoothingQuality = 'high'
    exportContext.drawImage(canvas, 0, 0, exportCanvas.width, exportCanvas.height)
    exportCanvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const safeName = data.playerName.trim().replace(/[\\/:*?"<>|]/g, '_') || 'compass-resume'
      link.href = url
      link.download = `${safeName}-履歴書${scale === HIGH_QUALITY_EXPORT_SCALE ? '-高画質' : ''}.png`
      link.click()
      URL.revokeObjectURL(url)
    }, 'image/png')
  }

  return (
    <section className="preview-panel" aria-labelledby={headingId}>
      <div className="preview-heading">
        <div>
          <span className="eyebrow">LIVE PREVIEW</span>
          <h2 id={headingId}>完成イメージ</h2>
        </div>
        <div className="download-actions" aria-label="保存画質を選択">
          <button className="download-button download-button-standard" type="button" onClick={() => download(STANDARD_EXPORT_SCALE)} disabled={!isReady}>
            <DownloadRoundedIcon />
            <span>PNGで保存<small>1800 × 1013</small></span>
          </button>
          <button className="download-button" type="button" onClick={() => download(HIGH_QUALITY_EXPORT_SCALE)} disabled={!isReady}>
            <DownloadRoundedIcon />
            <span>高画質で保存<small>3600 × 2025</small></span>
          </button>
        </div>
      </div>
      <div className="canvas-frame" aria-busy={!isReady}>
        {!hasRenderedPreview && (
          <div className="canvas-loading" role="status" aria-live="polite">
            <span className="canvas-loading-spinner" aria-hidden="true" />
            <span className="canvas-loading-copy">
              <strong>フォントを読み込み中…</strong>
              <small>プレビュー画像を準備しています</small>
            </span>
          </div>
        )}
        <canvas ref={canvasRef} width={RENDER_WIDTH} height={RENDER_HEIGHT} aria-label={`${data.playerName}さんのコンパス履歴書プレビュー`} />
      </div>
    </section>
  )
}

export default ResumeCanvas
