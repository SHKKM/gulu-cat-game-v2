import type { spriteLayout } from './spriteLayout.ts'
import type { Rect } from '../scene/furnitureLayout.ts'

/** Shared across all character animations so switches never change the allowed foot point. */
export const GULU_VISUAL_SAFE_BOUNDS: Readonly<Rect> = Object.freeze({ x: 80, y: 278, width: 230, height: 142 })

/** Presentation only; this table never grants approval or publishes an asset. */
export const CHARACTER_RENDER_SETTINGS: Readonly<Record<string, { displayMultiplier: number }>> = {
  'gulu.idle.art-v1': { displayMultiplier: 4 },
  'gulu.idle.art-v2': { displayMultiplier: 4 },
  'gulu.idle_blink.art-v1': { displayMultiplier: 4 },
  'gulu.walk.art-v1': { displayMultiplier: 4.5 },
  'gulu.rest.art-v1': { displayMultiplier: 4 },
  'gulu.sleep_curl.art-v1': { displayMultiplier: 4 },
  'gulu.stretch.art-v1': { displayMultiplier: 4 },
}

export function characterDisplayLayout(base: ReturnType<typeof spriteLayout>, assetId?: string) {
  const displayMultiplier = assetId ? CHARACTER_RENDER_SETTINGS[assetId]?.displayMultiplier ?? 1 : 1
  // CSS translates by the same fractional foot anchor on the enlarged canvas.
  // Scaling preserves the existing foot anchor rather than the canvas centre.
  return { ...base, width: base.width * displayMultiplier, height: base.height * displayMultiplier, displayMultiplier }
}
