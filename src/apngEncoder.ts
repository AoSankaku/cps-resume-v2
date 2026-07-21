type EncodeApngResponse =
  | { ok: true; buffer: ArrayBuffer }
  | { ok: false; message: string }

export const encodeApng = (
  frames: ArrayBuffer[],
  delays: number[],
  width: number,
  height: number,
) => new Promise<ArrayBuffer>((resolve, reject) => {
  const worker = new Worker(new URL('./apngEncoder.worker.ts', import.meta.url), { type: 'module' })
  const finish = () => worker.terminate()
  worker.onmessage = (event: MessageEvent<EncodeApngResponse>) => {
    finish()
    if (event.data.ok) resolve(event.data.buffer)
    else reject(new Error(event.data.message))
  }
  worker.onerror = () => {
    finish()
    reject(new Error('APNGの作成処理を開始できませんでした。'))
  }
  worker.postMessage(
    { frames, delays, width, height },
    { transfer: frames },
  )
})
