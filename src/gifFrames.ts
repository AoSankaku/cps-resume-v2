export const MAX_ANIMATED_IMAGE_SOURCE_BYTES = 15 * 1024 * 1024
export const MAX_ANIMATED_IMAGE_DECODED_PIXELS = 40_000_000
export const MAX_ANIMATION_EXPORT_BYTES = 15 * 1024 * 1024
export const MAX_ANIMATION_EXPORT_FRAMES = 60
export const MAX_ANIMATION_EXPORT_DURATION_MS = 10_000

export type AnimatedImageFormat = 'gif' | 'apng' | 'webp'

export type TimedAnimationFrame = {
  delay: number
}

const hasBytes = (bytes: Uint8Array, offset: number, expected: readonly number[]) =>
  expected.every((value, index) => bytes[offset + index] === value)

const readAscii = (bytes: Uint8Array, offset: number, length: number) =>
  String.fromCharCode(...bytes.subarray(offset, offset + length))

export const detectAnimatedImageFormat = (bytes: Uint8Array): AnimatedImageFormat | null => {
  if (bytes.length >= 6 && (readAscii(bytes, 0, 6) === 'GIF87a' || readAscii(bytes, 0, 6) === 'GIF89a')) {
    return 'gif'
  }

  const isPng = bytes.length >= 8 && hasBytes(bytes, 0, [137, 80, 78, 71, 13, 10, 26, 10])
  if (isPng) {
    let offset = 8
    while (offset + 12 <= bytes.length) {
      const view = new DataView(bytes.buffer, bytes.byteOffset + offset, 4)
      const chunkLength = view.getUint32(0)
      const chunkType = readAscii(bytes, offset + 4, 4)
      if (chunkType === 'acTL') return 'apng'
      if (chunkType === 'IEND' || chunkLength > bytes.length - offset - 12) break
      offset += 12 + chunkLength
    }
    return null
  }

  const isWebp = bytes.length >= 12
    && readAscii(bytes, 0, 4) === 'RIFF'
    && readAscii(bytes, 8, 4) === 'WEBP'
  if (isWebp) {
    let offset = 12
    while (offset + 8 <= bytes.length) {
      const chunkType = readAscii(bytes, offset, 4)
      const view = new DataView(bytes.buffer, bytes.byteOffset + offset + 4, 4)
      const chunkLength = view.getUint32(0, true)
      if (chunkType === 'ANIM' || chunkType === 'ANMF') return 'webp'
      if (chunkLength > bytes.length - offset - 8) break
      offset += 8 + chunkLength + (chunkLength % 2)
    }
  }
  return null
}

let cachedDataUrl = ''
let cachedDataUrlFormat: AnimatedImageFormat | null = null

export const getAnimatedImageFormatFromDataUrl = (value: string): AnimatedImageFormat | null => {
  if (value === cachedDataUrl) return cachedDataUrlFormat
  cachedDataUrl = value
  cachedDataUrlFormat = null
  const commaIndex = value.indexOf(',')
  if (commaIndex < 0 || !/^data:image\/(?:gif|png|apng|webp);base64$/i.test(value.slice(0, commaIndex))) return null
  try {
    const binary = atob(value.slice(commaIndex + 1))
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
    cachedDataUrlFormat = detectAnimatedImageFormat(bytes)
  } catch {
    cachedDataUrlFormat = null
  }
  return cachedDataUrlFormat
}

export const selectAnimationFramesForExport = <T extends TimedAnimationFrame>(
  frames: readonly T[],
  maxFrames = MAX_ANIMATION_EXPORT_FRAMES,
  maxDuration = MAX_ANIMATION_EXPORT_DURATION_MS,
): Array<T & { delay: number }> => {
  const durationLimited: Array<T & { delay: number }> = []
  let elapsed = 0
  for (const frame of frames) {
    if (elapsed >= maxDuration) break
    const delay = Math.max(20, Math.min(frame.delay || 100, maxDuration - elapsed))
    durationLimited.push({ ...frame, delay })
    elapsed += delay
  }
  if (durationLimited.length <= maxFrames) return durationLimited

  const selected: Array<T & { delay: number }> = []
  for (let index = 0; index < maxFrames; index += 1) {
    const start = Math.floor(index * durationLimited.length / maxFrames)
    const end = Math.floor((index + 1) * durationLimited.length / maxFrames)
    const delay = durationLimited
      .slice(start, Math.max(start + 1, end))
      .reduce((total, frame) => total + frame.delay, 0)
    selected.push({ ...durationLimited[start], delay })
  }
  return selected
}
