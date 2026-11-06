import type { DecodedAsset } from '../game/assets/types.ts'

/** Artwork and scene coordinates must describe the same aspect before placement. */
export function compatibleSceneImage(asset: DecodedAsset | undefined, size: { width: number; height: number }): DecodedAsset | undefined {
  return asset && asset.definition.kind === 'image' && Math.abs(asset.definition.canvas.width / asset.definition.canvas.height - size.width / size.height) < 0.0001 ? asset : undefined
}
