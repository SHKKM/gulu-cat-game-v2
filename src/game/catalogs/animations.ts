import { CONTENT_CATALOG } from './content.ts'
import { animationTokens } from './source.ts'
import { GULU_ANIMATIONS, GULU_FRAME } from '../../animation/clips.ts'
import type { AnimationId as LegacyAnimationId } from '../../animation/clips.ts'
import type { AnimationDefinition, Version } from '../types/catalog.ts'

const legacy: Readonly<Record<string, LegacyAnimationId>> = { idle: 'idle', walk: 'walk', rest: 'rest', sleep: 'sleep', sleep_curl: 'sleep', stretch: 'stretch', turn: 'turn' }
const ids = [...new Set(CONTENT_CATALOG.flatMap(animationTokens))].sort()
export const ANIMATION_CATALOG: readonly AnimationDefinition[] = ids.map(id => {
  const legacyClipId = legacy[id]
  const existing = legacyClipId ? GULU_ANIMATIONS[legacyClipId] : undefined
  const minVersion = CONTENT_CATALOG.filter(row => animationTokens(row).includes(id)).map(row => row.minVersion).sort()[0] as Version
  return {
    id, status: 'candidate', minVersion, frames: existing?.frames ?? [GULU_ANIMATIONS.idle.frames[0]],
    fps: existing?.fps ?? 1, loop: existing?.loop ?? false, playback: existing?.playback ?? 'forward',
    canvas: { width: GULU_FRAME.width, height: GULU_FRAME.height }, anchor: { ...GULU_FRAME.anchor },
    facing: 'right', mirrorAllowed: false, assetStatus: 'placeholder', markers: [],
    ...(id !== 'idle' ? { fallbackAnimationId: 'idle' } : {}),
    ...(id === 'sleep' ? { aliasOf: 'sleep_curl' } : {}),
    ...(legacyClipId ? { legacyClipId } : {}),
  }
})
