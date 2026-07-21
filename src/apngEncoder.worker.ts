import * as UPNG from 'upng-js'

type EncodeApngRequest = {
  width: number
  height: number
  frames: ArrayBuffer[]
  delays: number[]
}

type EncodeApngResponse =
  | { ok: true; buffer: ArrayBuffer }
  | { ok: false; message: string }

self.onmessage = (event: MessageEvent<EncodeApngRequest>) => {
  try {
    const { width, height, frames, delays } = event.data
    const buffer = UPNG.encode(frames, width, height, 0, delays)
    const response: EncodeApngResponse = { ok: true, buffer }
    self.postMessage(response, { transfer: [buffer] })
  } catch {
    const response: EncodeApngResponse = { ok: false, message: 'APNGの圧縮に失敗しました。' }
    self.postMessage(response)
  }
}
