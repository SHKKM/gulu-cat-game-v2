import { useMemo } from 'react'
import type { DecodedAsset } from '../game/assets/types.ts'
import type { Facing } from './clips.ts'
import { CanvasSprite } from './CanvasSprite.tsx'
import { playableAsset } from './resolveAnimation.ts'
import type { AnimationMarkerNotice } from './playback.ts'

/** Adapter for verified S2 bytes; playback is owned solely by CanvasSprite. */
export function ApprovedSprite({ asset, animationId = asset.definition.assetId, facing, reducedMotion, sequence, onFailure, onMarker, onComplete }: {
  asset: DecodedAsset; animationId?: string; facing: Facing; reducedMotion: boolean; sequence: number;
  onFailure: () => void; onMarker?: (notice: AnimationMarkerNotice) => void; onComplete?: () => void
}) {
  const definition = useMemo(() => playableAsset(asset.definition, animationId), [asset.definition, animationId])
  return <CanvasSprite className="approved-sprite" definition={definition} images={asset.images} facing={facing} reducedMotion={reducedMotion} playbackKey={sequence} onFailure={onFailure} onMarker={onMarker} onComplete={onComplete} />
}
