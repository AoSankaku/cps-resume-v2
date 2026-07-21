import { describe, expect, test } from 'bun:test'
import { getTwemojiTextParts, getTwemojiUrls, measureCanvasText } from './canvasText'

const createMeasureContext = () => ({
  font: '18px sans-serif',
  measureText: (text: string) => ({ width: [...text].length * 10 }),
}) as unknown as CanvasRenderingContext2D

describe('canvas emoji text', () => {
  test('絵文字の直後に付いた異体字セレクタを幅として数えない', () => {
    const ctx = createMeasureContext()

    expect(measureCanvasText(ctx, '絵😀👍️結')).toBe(56)
  })

  test('異体字セレクタだけの画像URLを生成しない', () => {
    expect(getTwemojiUrls('😀👍️')).toEqual([
      '/twemoji/1f600.svg',
      '/twemoji/1f44d.svg',
    ])
  })

  test('入力文字列をTwemoji画像と通常テキストへ分割する', () => {
    expect(getTwemojiTextParts('確認😀👍️OK')).toEqual([
      { type: 'text', text: '確認' },
      { type: 'emoji', text: '😀', url: '/twemoji/1f600.svg' },
      { type: 'emoji', text: '👍', url: '/twemoji/1f44d.svg' },
      { type: 'text', text: 'OK' },
    ])
  })
})
