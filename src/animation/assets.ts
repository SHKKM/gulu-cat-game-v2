import { ANIMATION_IDS, GULU_ANIMATIONS, GULU_FRAME } from './clips.ts'
import { BEHAVIOR_CONFIG } from './behaviorConfig.ts'
import type { AnimationId } from './clips.ts'

export interface DecodedFrame { image: CanvasImageSource; width: number; height: number }
export type FrameLoader = (src: string) => Promise<DecodedFrame>
export interface AnimationAssets { clips: Record<AnimationId, readonly DecodedFrame[] | null>; errors: readonly string[] }
const cache = new Map<string, Promise<DecodedFrame>>()
function loadImage(src: string): Promise<DecodedFrame> {
  if (!cache.has(src)) cache.set(src, new Promise((resolve, reject) => {
    const image = new Image()
    const timeout = window.setTimeout(() => { image.onload = null; image.onerror = null; reject(new Error(`載入逾時：${src}`)) }, BEHAVIOR_CONFIG.assetTimeoutMs)
    const fail = () => { window.clearTimeout(timeout); reject(new Error(`影格無法解碼：${src}`)) }
    image.onerror = fail
    image.onload = async () => {
      try {
        await image.decode()
        window.clearTimeout(timeout)
        resolve({ image, width: image.naturalWidth, height: image.naturalHeight })
      } catch { fail() }
    }
    image.src = src
  }))
  return cache.get(src)!
}
/** Decode complete clips before displaying them. A failed clip uses a drawn fallback. */
export async function preloadAnimations(loader: FrameLoader = loadImage): Promise<AnimationAssets> {
  const errors: string[] = []
  const entries = await Promise.all(ANIMATION_IDS.map(async id => {
    try {
      const frames = await Promise.all(GULU_ANIMATIONS[id].frames.map(async src => {
        const frame = await loader(src)
        if (frame.width !== GULU_FRAME.width || frame.height !== GULU_FRAME.height) throw new Error(`畫布尺寸不一致：${src}`)
        return frame
      }))
      return [id, frames] as const
    } catch (error) { errors.push(String(error)); return [id, null] as const }
  }))
  return { clips: Object.fromEntries(entries) as AnimationAssets['clips'], errors }
}
