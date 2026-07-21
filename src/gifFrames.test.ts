import { describe, expect, test } from 'bun:test'
import {
  detectAnimatedImageFormat,
  MAX_ANIMATION_EXPORT_FRAMES,
  selectAnimationFramesForExport,
} from './gifFrames'

const ascii = (value: string) => Array.from(value, (character) => character.charCodeAt(0))

const uint32 = (value: number, littleEndian = false) => {
  const bytes = new Uint8Array(4)
  new DataView(bytes.buffer).setUint32(0, value, littleEndian)
  return [...bytes]
}

describe('selectAnimationFramesForExport', () => {
  test('指定時間を超えるフレームを除外する', () => {
    const frames = Array.from({ length: 6 }, (_, index) => ({ index, delay: 100 }))

    expect(selectAnimationFramesForExport(frames, 10, 350)).toEqual([
      { index: 0, delay: 100 },
      { index: 1, delay: 100 },
      { index: 2, delay: 100 },
      { index: 3, delay: 50 },
    ])
  })

  test('間引いたフレームへ表示時間を合算する', () => {
    const frames = Array.from({ length: 8 }, (_, index) => ({ index, delay: 50 }))
    const selected = selectAnimationFramesForExport(frames, 4, 1_000)

    expect(selected.map(({ index }) => index)).toEqual([0, 2, 4, 6])
    expect(selected.map(({ delay }) => delay)).toEqual([100, 100, 100, 100])
  })

  test('既定では60フレームを超えない', () => {
    const frames = Array.from({ length: 100 }, (_, index) => ({ index, delay: 20 }))
    const selected = selectAnimationFramesForExport(frames)

    expect(MAX_ANIMATION_EXPORT_FRAMES).toBe(60)
    expect(selected).toHaveLength(60)
    expect(selected.reduce((total, frame) => total + frame.delay, 0)).toBe(2_000)
  })
})

describe('detectAnimatedImageFormat', () => {
  test('GIFシグネチャを判定する', () => {
    expect(detectAnimatedImageFormat(new Uint8Array(ascii('GIF89a')))).toBe('gif')
  })

  test('acTLチャンクを含むAPNGを判定する', () => {
    const bytes = new Uint8Array([
      137, 80, 78, 71, 13, 10, 26, 10,
      ...uint32(8), ...ascii('acTL'), ...uint32(2), ...uint32(0), 0, 0, 0, 0,
    ])
    expect(detectAnimatedImageFormat(bytes)).toBe('apng')
  })

  test('ANIMチャンクを含むWebPを判定する', () => {
    const bytes = new Uint8Array([
      ...ascii('RIFF'), ...uint32(18, true), ...ascii('WEBP'),
      ...ascii('ANIM'), ...uint32(6, true), 0, 0, 0, 0, 0, 0,
    ])
    expect(detectAnimatedImageFormat(bytes)).toBe('webp')
  })

  test('静止PNGと静止WebPはアニメーション扱いしない', () => {
    const png = new Uint8Array([
      137, 80, 78, 71, 13, 10, 26, 10,
      ...uint32(0), ...ascii('IEND'), 0, 0, 0, 0,
    ])
    const webp = new Uint8Array([
      ...ascii('RIFF'), ...uint32(12, true), ...ascii('WEBP'),
      ...ascii('VP8 '), ...uint32(0, true),
    ])
    expect(detectAnimatedImageFormat(png)).toBeNull()
    expect(detectAnimatedImageFormat(webp)).toBeNull()
  })
})
