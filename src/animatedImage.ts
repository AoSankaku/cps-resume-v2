import { decode, decodeFrames, type DecodedFrame } from 'modern-gif'
import workerUrl from 'modern-gif/worker?url'
import {
  MAX_ANIMATED_IMAGE_DECODED_PIXELS,
  MAX_ANIMATED_IMAGE_SOURCE_BYTES,
  type AnimatedImageFormat,
} from './gifFrames'

export type AnimatedImageFrame = DecodedFrame

export type AnimatedImage = {
  format: AnimatedImageFormat
  width: number
  height: number
  duration: number
  frames: AnimatedImageFrame[]
}

type NativeVideoFrame = {
  displayWidth: number
  displayHeight: number
  duration: number | null
  copyTo: (destination: BufferSource, options: { format: 'RGBA' }) => Promise<unknown>
  close: () => void
}

type NativeImageDecoder = {
  tracks: {
    ready: Promise<void>
    selectedTrack: { frameCount: number } | null
  }
  decode: (options: { frameIndex: number; completeFramesOnly: true }) => Promise<{ image: NativeVideoFrame }>
  close: () => void
}

type NativeImageDecoderConstructor = {
  new(options: { data: BufferSource; type: string; preferAnimation: true }): NativeImageDecoder
  isTypeSupported: (type: string) => Promise<boolean>
}

const animatedImageCache = new Map<string, Promise<AnimatedImage>>()

const normalizeFrames = (frames: AnimatedImageFrame[]) => frames.map((frame) => ({
  ...frame,
  delay: Math.max(20, frame.delay || 100),
}))

const assertDecodedPixelLimit = (width: number, height: number, frameCount: number) => {
  if (width * height * frameCount > MAX_ANIMATED_IMAGE_DECODED_PIXELS) {
    throw new Error('画像の解像度またはフレーム数が大きすぎます。短い画像か小さい画像をお試しください。')
  }
}

const createAnimatedImage = (
  format: AnimatedImageFormat,
  width: number,
  height: number,
  frames: AnimatedImageFrame[],
): AnimatedImage => {
  if (width <= 0 || height <= 0 || frames.length === 0) {
    throw new Error('画像情報を読み取れませんでした。')
  }
  assertDecodedPixelLimit(width, height, frames.length)
  const normalizedFrames = normalizeFrames(frames)
  return {
    format,
    width,
    height,
    duration: normalizedFrames.reduce((total, frame) => total + frame.delay, 0),
    frames: normalizedFrames,
  }
}

const decodeGif = async (buffer: ArrayBuffer): Promise<AnimatedImage> => {
  let gif: ReturnType<typeof decode>
  try {
    gif = decode(buffer)
  } catch {
    throw new Error('GIFの画像情報を読み取れませんでした。別のGIFをお試しください。')
  }
  assertDecodedPixelLimit(gif.width, gif.height, gif.frames.length)

  try {
    const frames = await decodeFrames(buffer, { gif, workerUrl })
    return createAnimatedImage('gif', gif.width, gif.height, frames)
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('画像情報')) throw error
    throw new Error('GIFのアニメーションを展開できませんでした。別のGIFをお試しください。')
  }
}

const getNativeImageDecoder = () => (
  globalThis as typeof globalThis & { ImageDecoder?: NativeImageDecoderConstructor }
).ImageDecoder

const decodeWithNativeImageDecoder = async (
  buffer: ArrayBuffer,
  format: Exclude<AnimatedImageFormat, 'gif'>,
): Promise<AnimatedImage | null> => {
  const ImageDecoder = getNativeImageDecoder()
  if (!ImageDecoder) return null
  const mimeTypes = format === 'apng' ? ['image/apng', 'image/png'] : ['image/webp']
  const mimeType = (await Promise.all(mimeTypes.map(async (type) => (
    await ImageDecoder.isTypeSupported(type).catch(() => false) ? type : null
  )))).find((type): type is string => type !== null)
  if (!mimeType) return null

  const decoder = new ImageDecoder({ data: new Uint8Array(buffer), type: mimeType, preferAnimation: true })
  try {
    await decoder.tracks.ready
    const frameCount = decoder.tracks.selectedTrack?.frameCount ?? 0
    if (frameCount <= 1) return null

    const frames: AnimatedImageFrame[] = []
    let width = 0
    let height = 0
    for (let index = 0; index < frameCount; index += 1) {
      const { image } = await decoder.decode({ frameIndex: index, completeFramesOnly: true })
      try {
        width = image.displayWidth
        height = image.displayHeight
        assertDecodedPixelLimit(width, height, frameCount)
        const data = new Uint8ClampedArray(width * height * 4)
        await image.copyTo(data, { format: 'RGBA' })
        frames.push({
          width,
          height,
          data,
          delay: Math.round((image.duration ?? 100_000) / 1_000),
        })
      } finally {
        image.close()
      }
    }
    return createAnimatedImage(format, width, height, frames)
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('画像の解像度')) throw error
    return null
  } finally {
    decoder.close()
  }
}

const decodeApng = async (buffer: ArrayBuffer): Promise<AnimatedImage> => {
  try {
    const UPNG = await import('upng-js')
    const image = UPNG.decode(buffer)
    assertDecodedPixelLimit(image.width, image.height, Math.max(1, image.frames.length))
    const rgbaFrames = UPNG.toRGBA8(image)
    const frames = rgbaFrames.map((data, index) => ({
      width: image.width,
      height: image.height,
      data: new Uint8ClampedArray(data),
      delay: image.frames[index]?.delay ?? 100,
    }))
    return createAnimatedImage('apng', image.width, image.height, frames)
  } catch (error) {
    if (error instanceof Error && (
      error.message.startsWith('画像情報')
      || error.message.startsWith('画像の解像度')
    )) throw error
    throw new Error('APNGのアニメーションを展開できませんでした。別のAPNGをお試しください。')
  }
}

const decodeAnimatedWebp = async (buffer: ArrayBuffer): Promise<AnimatedImage> => {
  try {
    const { decodeAnimation } = await import('wasm-webp')
    const decodedFrames = await decodeAnimation(new Uint8Array(buffer), true)
    if (!decodedFrames?.length) throw new Error('no frames')
    const frames = decodedFrames.map((frame) => ({
      width: frame.width,
      height: frame.height,
      data: new Uint8ClampedArray(frame.data),
      delay: frame.duration,
    }))
    return createAnimatedImage('webp', frames[0].width, frames[0].height, frames)
  } catch (error) {
    if (error instanceof Error && (
      error.message.startsWith('画像情報')
      || error.message.startsWith('画像の解像度')
    )) throw error
    throw new Error('アニメーションWebPを展開できませんでした。別のWebPをお試しください。')
  }
}

const decodeAnimatedImage = async (source: string, format: AnimatedImageFormat): Promise<AnimatedImage> => {
  const response = await fetch(source)
  const buffer = await response.arrayBuffer()
  if (buffer.byteLength > MAX_ANIMATED_IMAGE_SOURCE_BYTES) {
    throw new Error('アニメーション画像は15MB以下のファイルを選んでください。')
  }
  if (format === 'gif') return decodeGif(buffer)

  const nativeResult = await decodeWithNativeImageDecoder(buffer, format)
  if (nativeResult) return nativeResult
  return format === 'apng' ? decodeApng(buffer) : decodeAnimatedWebp(buffer)
}

export const loadAnimatedImage = (source: string, format: AnimatedImageFormat) => {
  const cacheKey = `${format}:${source}`
  const cached = animatedImageCache.get(cacheKey)
  if (cached) return cached
  const pending = decodeAnimatedImage(source, format)
  animatedImageCache.set(cacheKey, pending)
  pending.catch(() => animatedImageCache.delete(cacheKey))
  return pending
}

export const animatedGifWorkerUrl = workerUrl
