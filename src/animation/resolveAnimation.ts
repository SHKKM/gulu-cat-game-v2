import { ANIMATION_CATALOG } from '../game/catalogs/animations.ts'
import type { AnimationDefinition } from '../game/types/catalog.ts'
import type { DecodedAsset, RuntimeAsset } from '../game/assets/types.ts'
import { validateTimeline } from './playback.ts'
import type { PlayableAnimation } from './playback.ts'

export const MAX_FALLBACK_DEPTH = 8
export const assetIdentity = (asset: DecodedAsset) => `${asset.definition.assetId}@${asset.definition.version}`
export function playableAsset(asset: RuntimeAsset, animationId: string): PlayableAnimation {
  return { id: animationId, frames: asset.frames.map(frame => frame.src), fps: asset.fps, loop: asset.loop, playback: asset.playback,
    canvas: asset.canvas, anchor: asset.anchor, facing: asset.facing, mirrorAllowed: asset.mirrorAllowed, markers: asset.markers }
}
function permitted(asset: DecodedAsset, facing: 'left' | 'right'): boolean {
  try {
  const definition = asset.definition
  if (definition.kind !== 'animation' || definition.status !== 'published' || !definition.approval?.by.trim() || !Number.isFinite(Date.parse(definition.approval.at)) || !Number.isFinite(Date.parse(definition.publishedAt))
    || (definition.facing !== facing && !definition.mirrorAllowed) || !['left', 'right'].includes(definition.facing) || typeof definition.mirrorAllowed !== 'boolean'
    || asset.images.length !== definition.frames.length || asset.images.some(image => !image)
    || definition.frames.some(frame => !/^[a-f0-9]{64}$/.test(frame.sha256))) return false
    validateTimeline(playableAsset(definition, 'validation'))
    return [definition.canvas.width, definition.canvas.height].every(value => Number.isFinite(value) && value > 0)
      && [definition.anchor.x, definition.anchor.y].every(value => Number.isFinite(value) && value >= 0 && value <= 1)
  } catch { return false }
}
/** Only already verified/decoded, published assets are considered. Never loads files,
 * changes approvals, follows JSON code, or re-enables a candidate event.
 */
export function resolveApprovedAnimation(animationId: string, facing: 'left' | 'right', assets: Readonly<Record<string, DecodedAsset>>, failed: ReadonlySet<string> = new Set(), catalog: readonly AnimationDefinition[] = ANIMATION_CATALOG, maxDepth = MAX_FALLBACK_DEPTH): { animationId: string; asset: DecodedAsset } | null {
  const visited = new Set<string>()
  let current: string | undefined = animationId
  for (let depth = 0; current && depth < Math.min(MAX_FALLBACK_DEPTH, maxDepth); depth++) {
    if (visited.has(current)) return null
    visited.add(current)
    const definition = catalog.find(item => item.id === current)
    if (!definition) return null
    if (definition.aliasOf) { current = definition.aliasOf; continue }
    const asset = assets[`animation.${current}`]
    if (asset && !failed.has(assetIdentity(asset)) && permitted(asset, facing)) return { animationId: current, asset }
    current = definition.fallbackAnimationId
  }
  return null
}
