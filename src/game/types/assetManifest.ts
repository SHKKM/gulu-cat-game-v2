import type { ActionId, AnimationDefinition, AnimationId } from './catalog.ts'

/** Independent of ContentStatus; approval does not enable gameplay. */
export type AssetWorkflowStatus = 'draft' | 'pending_review' | 'approved' | 'published'
export interface AssetFrame {
  readonly order: number // one-based, contiguous playback order
  readonly taskId: string
  readonly imagePath: string // source locally; package-relative PNG path on export
  readonly sha256?: string
}
export interface AnimationAsset {
  readonly assetId: string
  readonly animationId: AnimationId // canonical ID; aliases share assets
  readonly version: string // art revision, independent of game minVersion
  readonly status: AssetWorkflowStatus
  readonly frames: readonly AssetFrame[]
  readonly fps: number
  readonly canvas: AnimationDefinition['canvas']
  readonly anchor: AnimationDefinition['anchor']
  readonly facing: AnimationDefinition['facing']
  readonly mirrorAllowed: boolean
  readonly loop: boolean
  readonly playback: AnimationDefinition['playback']
  readonly markers: NonNullable<AnimationDefinition['markers']>
  readonly sourceSnapshot: string
  readonly approval?: { readonly by: string; readonly at: string }
  readonly publishedAt?: string
}
export interface AssetManifestV1 {
  readonly schemaVersion: 1
  readonly format: 'gulu-animation-assets'
  readonly exportedAt: string
  readonly assets: readonly AnimationAsset[]
  readonly animationBindings: readonly { readonly animationId: AnimationId; readonly assetId: string }[]
  readonly behaviorBindings: readonly { readonly actionId: ActionId; readonly animationIds: readonly AnimationId[] }[]
}

/** Future import adapter; use after package validation and hash verification.
 * Content status/version/fallback stay with the existing definition.
 * Markers are zero-based; AssetFrame.order is one-based.
 */
export function assetToAnimation(asset: AnimationAsset, definition: AnimationDefinition): AnimationDefinition {
  if (asset.status !== 'published' || !asset.approval || (definition.id !== asset.animationId && definition.aliasOf !== asset.animationId)) throw Error('素材未發布或動畫引用不符。')
  return { ...definition, frames: asset.frames.map(frame => frame.imagePath), fps: asset.fps,
    canvas: { ...asset.canvas }, anchor: { ...asset.anchor }, facing: asset.facing,
    mirrorAllowed: asset.mirrorAllowed, loop: asset.loop, playback: asset.playback,
    markers: asset.markers.map(marker => ({ ...marker })), assetStatus: 'ready' }
}
