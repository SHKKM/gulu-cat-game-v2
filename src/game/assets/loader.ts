import { parseAssetManifest } from './manifest.ts'
import type { AssetIssue, DecodedAsset, LoadedAssets, RuntimeAsset } from './types.ts'

export interface AssetIO {
  read: (url: string, signal: AbortSignal) => Promise<Uint8Array<ArrayBuffer>>
  hash: (bytes: Uint8Array<ArrayBuffer>) => Promise<string>
  decode: (bytes: Uint8Array<ArrayBuffer>, src: string) => Promise<{ image: CanvasImageSource; width: number; height: number; url: string; dispose: () => void }>
}
export const browserAssetIO: AssetIO = {
  async read(url, signal) {
    const response = await fetch(url, { signal, cache: 'no-cache', credentials: 'same-origin' })
    if (!response.ok) throw Error('load-failed')
    return new Uint8Array(await response.arrayBuffer())
  },
  async hash(bytes) { const digest = await crypto.subtle.digest('SHA-256', bytes); return [...new Uint8Array(digest)].map(n => n.toString(16).padStart(2, '0')).join('') },
  async decode(bytes, src) {
    const png = [137,80,78,71,13,10,26,10].every((n, i) => bytes[i] === n)
    const webp = new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' && new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP'
    if (!png && !webp) throw Error('decode-failed')
    const url = URL.createObjectURL(new Blob([bytes], { type: png ? 'image/png' : 'image/webp' }))
    try { const image = new Image(); image.src = url; await image.decode(); return { image, width: image.naturalWidth, height: image.naturalHeight, url, dispose: () => URL.revokeObjectURL(url) } }
    catch { URL.revokeObjectURL(url); throw Error(`decode-failed: ${src}`) }
  },
}
function abortable<T>(promise: Promise<T>, signal: AbortSignal, late?: (value: T) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    let finished = false
    const abort = () => { if (!finished) { finished = true; reject(Error('load-failed')) } }
    signal.addEventListener('abort', abort, { once: true })
    if (signal.aborted) abort()
    void promise.then(value => {
      signal.removeEventListener('abort', abort)
      if (finished) { late?.(value); return }
      finished = true; resolve(value)
    }, error => { signal.removeEventListener('abort', abort); if (!finished) { finished = true; reject(error) } })
  })
}
export async function loadApprovedAssets(input: unknown, base: string, io: AssetIO = browserAssetIO, signal = new AbortController().signal): Promise<LoadedAssets> {
  const parsed = parseAssetManifest(input, base)
  const assets: Record<string, DecodedAsset> = {}, issues: AssetIssue[] = [...parsed.issues]
  const loaded = new Map<string, DecodedAsset>()
  const failed = new Set<string>()
  for (const [key, definition] of Object.entries(parsed.assets)) {
    const identity = `${definition.assetId}@${definition.version}`
    if (failed.has(identity)) { issues.push({ key, code: 'load-failed', message: '此版本已失敗，不重複重試' }); continue }
    if (loaded.has(identity)) { assets[key] = loaded.get(identity)!; continue }
    const decoded: Awaited<ReturnType<AssetIO['decode']>>[] = []
    try {
      for (const frame of definition.frames) {
        if (signal.aborted) throw Error('load-failed')
        const bytes = await abortable(io.read(frame.src, signal), signal)
        if (bytes.byteLength > 16 * 1024 * 1024) throw Error('load-failed')
        if (await abortable(io.hash(bytes), signal) !== frame.sha256) throw Error('hash-mismatch')
        const image = await abortable(io.decode(bytes, frame.src), signal, image => image.dispose())
        decoded.push(image)
        if (image.width !== definition.canvas.width || image.height !== definition.canvas.height) throw Error('decode-failed')
      }
      const result = { definition, images: decoded.map(item => item.image), urls: decoded.map(item => item.url), dispose: () => decoded.forEach(item => item.dispose()) }
      loaded.set(identity, result); assets[key] = result
    } catch (error) {
      decoded.forEach(item => item.dispose())
      failed.add(identity)
      const code = String(error).includes('hash-mismatch') ? 'hash-mismatch' : String(error).includes('decode-failed') ? 'decode-failed' : 'load-failed'
      issues.push({ key, code, message: `素材未載入，使用占位：${definition.assetId}` })
    }
  }
  if (signal.aborted) { new Set(Object.values(assets)).forEach(asset => asset.dispose()); return { assets: {}, issues } }
  return { assets, issues }
}
export function disposeAssets(result: LoadedAssets) { new Set(Object.values(result.assets)).forEach(asset => asset.dispose()) }
export function animationKey(id: string) { return `animation.${id === 'sleep' ? 'sleep_curl' : id}` }
export type { RuntimeAsset }

