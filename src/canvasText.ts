import { parse, type EmojiEntity } from '@twemoji/parser'

export type EmojiImageMap = ReadonlyMap<string, HTMLImageElement>

const TWEMOJI_ASSET_PATH = '/twemoji'
const FONT_SIZE_PATTERN = /([\d.]+)px/
const graphemeSegmenter = new Intl.Segmenter('ja', { granularity: 'grapheme' })

const getFontSize = (ctx: CanvasRenderingContext2D) =>
  Number(ctx.font.match(FONT_SIZE_PATTERN)?.[1] ?? 16)

const getEmojiEntities = (text: string) => parse(text, {
  assetType: 'svg',
  buildUrl: (codepoints) => `${TWEMOJI_ASSET_PATH}/${codepoints}.svg`,
})

const getStartX = (
  ctx: CanvasRenderingContext2D,
  x: number,
  width: number,
) => {
  if (ctx.textAlign === 'center') return x - width / 2
  if (ctx.textAlign === 'right' || ctx.textAlign === 'end') return x - width
  return x
}

const measureEntities = (
  ctx: CanvasRenderingContext2D,
  text: string,
  entities: EmojiEntity[],
) => {
  const emojiSize = getFontSize(ctx)
  let cursor = 0
  let width = 0
  entities.forEach((entity) => {
    width += ctx.measureText(text.slice(cursor, entity.indices[0])).width + emojiSize
    cursor = entity.indices[1]
  })
  return width + ctx.measureText(text.slice(cursor)).width
}

export const getTwemojiUrls = (text: string) =>
  [...new Set(getEmojiEntities(text).map(({ url }) => url))]

export const measureCanvasText = (
  ctx: CanvasRenderingContext2D,
  text: string,
) => measureEntities(ctx, text, getEmojiEntities(text))

export const drawCanvasText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  emojiImages: EmojiImageMap,
) => {
  const entities = getEmojiEntities(text)
  if (entities.length === 0) {
    ctx.fillText(text, x, y)
    return
  }

  const emojiSize = getFontSize(ctx)
  let textCursor = 0
  let drawX = getStartX(ctx, x, measureEntities(ctx, text, entities))
  const originalTextAlign = ctx.textAlign
  ctx.textAlign = 'left'

  entities.forEach((entity) => {
    const plainText = text.slice(textCursor, entity.indices[0])
    ctx.fillText(plainText, drawX, y)
    drawX += ctx.measureText(plainText).width

    const image = emojiImages.get(entity.url)
    if (image) {
      ctx.drawImage(image, drawX, y - emojiSize * .9, emojiSize, emojiSize)
    } else {
      ctx.fillText(entity.text, drawX, y)
    }
    drawX += emojiSize
    textCursor = entity.indices[1]
  })

  ctx.fillText(text.slice(textCursor), drawX, y)
  ctx.textAlign = originalTextAlign
}

export const splitGraphemes = (text: string) =>
  [...graphemeSegmenter.segment(text)].map(({ segment }) => segment)

export const getFirstGrapheme = (text: string) =>
  graphemeSegmenter.segment(text)[Symbol.iterator]().next().value?.segment ?? ''
