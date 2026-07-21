import { describe, expect, test } from 'bun:test'
import { getCommentCanvasLayout } from './commentLayout'

const createMeasureContext = () => ({
  font: '18px sans-serif',
  measureText(text: string) {
    const size = Number(this.font.match(/([\d.]+)px/)?.[1] ?? 16)
    const width = [...text].reduce((total, character) => (
      total + size * (character === '━' ? 1.1 : 1)
    ), 0)
    return { width }
  },
}) as unknown as CanvasRenderingContext2D

describe('comment canvas layout', () => {
  test('2行に収まる間は通常サイズで描画する', () => {
    const layout = getCommentCanvasLayout(createMeasureContext(), 'あ'.repeat(106))

    expect(layout.compact).toBe(false)
    expect(layout.lines).toHaveLength(2)
    expect(layout.truncated).toBe(false)
  })

  test('2行を超える場合は小さい文字で3行まで描画する', () => {
    const layout = getCommentCanvasLayout(createMeasureContext(), 'あ'.repeat(220))

    expect(layout.compact).toBe(true)
    expect(layout.lines).toHaveLength(3)
    expect(layout.truncated).toBe(false)
  })

  test('小さい文字でも3行を超える実幅を検出する', () => {
    const layout = getCommentCanvasLayout(createMeasureContext(), '━'.repeat(220))

    expect(layout.compact).toBe(true)
    expect(layout.lines).toHaveLength(3)
    expect(layout.truncated).toBe(true)
    expect(layout.lines[2]).toEndWith('…')
  })
})
