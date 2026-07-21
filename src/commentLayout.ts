import { wrapCanvasText } from './canvasText'

export const COMMENT_FONT_FAMILY = '"Noto Sans JP", sans-serif'
export const COMMENT_MAX_WIDTH = 962
export const COMMENT_NORMAL_FONT_SIZE = 18
export const COMMENT_NORMAL_LINE_HEIGHT = 22
export const COMMENT_COMPACT_FONT_SIZE = 13
export const COMMENT_COMPACT_LINE_HEIGHT = 15

export type CommentCanvasLayout = {
  lines: string[]
  truncated: boolean
  font: string
  lineHeight: number
  compact: boolean
}

const getCommentFont = (size: number) => `800 ${size}px ${COMMENT_FONT_FAMILY}`

export const getCommentCanvasLayout = (
  ctx: CanvasRenderingContext2D,
  text: string,
): CommentCanvasLayout => {
  const normalFont = getCommentFont(COMMENT_NORMAL_FONT_SIZE)
  ctx.font = normalFont
  const normalLayout = wrapCanvasText(ctx, text, COMMENT_MAX_WIDTH, 2)
  if (!normalLayout.truncated) {
    return {
      ...normalLayout,
      font: normalFont,
      lineHeight: COMMENT_NORMAL_LINE_HEIGHT,
      compact: false,
    }
  }

  const compactFont = getCommentFont(COMMENT_COMPACT_FONT_SIZE)
  ctx.font = compactFont
  return {
    ...wrapCanvasText(ctx, text, COMMENT_MAX_WIDTH, 3),
    font: compactFont,
    lineHeight: COMMENT_COMPACT_LINE_HEIGHT,
    compact: true,
  }
}
