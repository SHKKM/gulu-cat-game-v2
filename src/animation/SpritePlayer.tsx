import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { GULU_ANIMATIONS, GULU_FRAME } from './clips.ts'
import type { AnimationId, Facing } from './clips.ts'
import { preloadAnimations } from './assets.ts'
import type { AnimationAssets } from './assets.ts'
import { CanvasSprite } from './CanvasSprite.tsx'
import type { AnimationMarkerNotice } from './playback.ts'

let sharedAssets: Promise<AnimationAssets> | undefined
interface Props {
  animationId: AnimationId
  playbackKey?: number | string
  facing?: Facing
  reducedMotion?: boolean
  onComplete?: () => void
  onMarker?: (notice: AnimationMarkerNotice) => void
  accessoryLayer?: ReactNode
}
/** Legacy animation-lab adapter; never a bypass for the approved-only homepage. */
export function SpritePlayer({ animationId, playbackKey = 0, facing = 'right', reducedMotion = false, onComplete, onMarker, accessoryLayer }: Props) {
  const [assets, setAssets] = useState<AnimationAssets | null>(null)
  useEffect(() => {
    let active = true
    sharedAssets ??= preloadAnimations()
    void sharedAssets.then(result => { if (active) setAssets(result) })
    return () => { active = false }
  }, [])
  const clip = GULU_ANIMATIONS[animationId]
  const definition = useMemo(() => ({ ...clip, canvas: GULU_FRAME, facing: 'right' as const, mirrorAllowed: !clip.placeholder }), [clip])
  const images = useMemo(() => assets?.clips[animationId]?.map(frame => frame.image), [assets, animationId])
  return <div className="gulu-sprite" data-animation={animationId} data-assets={assets ? (assets.clips[animationId] ? 'ready' : 'fallback') : 'loading'} data-asset-errors={assets?.errors.length ?? 0}>
    <CanvasSprite definition={definition} images={images} playbackKey={playbackKey} facing={facing} reducedMotion={reducedMotion} onComplete={onComplete} onMarker={onMarker} />
    <div className="gulu-accessories" style={{ transform: facing === 'left' && definition.mirrorAllowed ? 'scaleX(-1)' : undefined }} aria-hidden="true">{accessoryLayer}</div>
  </div>
}
