import { useCallback, useMemo, useState } from 'react'
import { useGameArt } from '../game/assets/useGameArt.ts'
import { S3_ACTION_ANIMATIONS } from '../game/assets/bindings.ts'
import type { SceneItem } from '../scene/roomLayout.ts'
import type { RoomDefinition } from '../scene/rooms.ts'
import { GULU_FRAME, GULU_ANIMATIONS } from './clips.ts'
import { useReducedMotion } from './useReducedMotion.ts'
import { useAutonomousBehavior } from './useAutonomousBehavior.ts'
import { TechnicalCharacter } from './TechnicalCharacter.tsx'
import { ApprovedSprite } from './ApprovedSprite.tsx'
import { BEHAVIOR_CONFIG as C } from './behaviorConfig.ts'
import { assetIdentity, playableAsset, resolveApprovedAnimation } from './resolveAnimation.ts'
import { clipDurationMs } from './playback.ts'
import type { AnimationMarkerNotice } from './playback.ts'
import { V01_BEHAVIOR_POLICY } from './v01BehaviorPolicy.ts'
import { spriteLayout } from './spriteLayout.ts'
import { characterDisplayLayout, GULU_VISUAL_SAFE_BOUNDS } from './characterDisplay.ts'

export function GameCharacter({ item, room, onAnimationMarker, onAnimationComplete }: { item: SceneItem; room: RoomDefinition; onAnimationMarker?: (notice: AnimationMarkerNotice) => void; onAnimationComplete?: () => void }) {
  const art = useGameArt()
  const reducedMotion = useReducedMotion()
  const [completedMicroSequence, setCompletedMicroSequence] = useState(0)
  const [failedIdentities, setFailedIdentities] = useState<ReadonlySet<string>>(() => new Set())
  const rejectAsset = useCallback((identity: string) => setFailedIdentities(previous => previous.has(identity) ? previous : new Set(previous).add(identity)), [])
  const floorY = item.y + item.height
  const navigation = useMemo(() => ({ floor: room.floorArea, radius: C.footRadius,
    visualBounds: room.navigationVisualBounds ?? GULU_VISUAL_SAFE_BOUNDS,
    obstacles: room.navigationObstacles ?? room.furniture.filter(furniture => furniture.blocksMovement).map(furniture => furniture.footprint),
  }), [room.floorArea, room.furniture, room.navigationObstacles, room.navigationVisualBounds])
  const animationIds = [...new Set([...Object.values(S3_ACTION_ANIMATIONS).map(binding => binding.animationId), ...V01_BEHAVIOR_POLICY.definitions.map(definition => definition.animationId)])]
  const minimumAnimationMs = Object.fromEntries(animationIds.map(animationId => {
    const durations = (['left', 'right'] as const).map(facing => {
      const result = resolveApprovedAnimation(animationId, facing, art.assets, failedIdentities)
      return result && !result.asset.definition.loop ? clipDurationMs(playableAsset(result.asset.definition, result.animationId)) : 0
    })
    return [animationId, Math.max(...durations)]
  }))
  const minimumDurationMs = Object.fromEntries(Object.entries(S3_ACTION_ANIMATIONS).map(([mode, binding]) => [mode, minimumAnimationMs[binding.animationId] ?? 0]))
  const blink = resolveApprovedAnimation('idle_blink', 'right', art.assets, failedIdentities)
  const microPlayback = { available: blink?.animationId === 'idle_blink' && !blink.asset.definition.loop, completedSequence: completedMicroSequence }
  const behavior = useAutonomousBehavior({ bounds: { minX: navigation.floor.x + navigation.radius, maxX: navigation.floor.x + navigation.floor.width - navigation.radius, floorY }, navigation, policy: V01_BEHAVIOR_POLICY, reducedMotion, minimumDurationMs, minimumAnimationMs, microPlayback }, item.x + item.width / 2)
  const primary = behavior.catalog?.primary, micro = behavior.catalog?.micro
  const animationId = primary?.animationId ?? 'idle'
  const mainResolved = resolveApprovedAnimation(animationId, behavior.facing, art.assets, failedIdentities)
  const microResolved = micro ? resolveApprovedAnimation(micro.animationId, behavior.facing, art.assets, failedIdentities) : null
  const distinctMicro = !!microResolved && (!mainResolved || assetIdentity(microResolved.asset) !== assetIdentity(mainResolved.asset))
  const resolved = distinctMicro ? microResolved : mainResolved
  const playbackSequence = distinctMicro && micro ? -micro.sequence : behavior.sequence
  const label = V01_BEHAVIOR_POLICY.definitions.find(definition => definition.id === primary?.id)?.label ?? GULU_ANIMATIONS[behavior.mode].label
  const asset = resolved?.asset
  const source = asset?.definition ?? { canvas: GULU_FRAME, anchor: GULU_FRAME.anchor, facing: 'right' as const, mirrorAllowed: false }
  const { width, height, anchor, displayMultiplier } = characterDisplayLayout(spriteLayout(source, behavior.facing, navigation.floor, navigation.radius, room.size, item.width), asset?.definition.assetId)
  const x = behavior.x, y = behavior.y
  return <div className="scene-object object-character gulu-character" role="img" aria-label={`咕嚕：${label}${asset ? '' : '（暫時占位）'}`}
    data-action-id={primary?.id ?? ''} data-micro-action-id={micro?.id ?? ''} data-behavior-profile={behavior.catalog?.profileId} data-event-id={behavior.eventId} data-facing={behavior.facing} data-interaction-point={behavior.interactionPointId ?? ''} data-behavior={behavior.mode} data-sequence={behavior.sequence} data-x={x.toFixed(2)} data-y={y.toFixed(2)} data-foot-radius={navigation.radius} data-target-x={behavior.targetX ?? ''} data-target-y={behavior.targetY ?? ''} data-art-state={asset ? 'approved' : 'placeholder'} data-asset-id={asset?.definition.assetId ?? 'placeholder.gulu'} data-asset-version={asset?.definition.version ?? 'technical-v1'}
    data-display-multiplier={displayMultiplier} data-primary-started-at={primary?.startedAt} data-primary-duration-ms={primary?.durationMs} data-micro-sequence={micro?.sequence} data-micro-started-at={micro?.startedAt} data-micro-duration-ms={micro?.durationMs}
    style={{ left: `${x / room.size.width * 100}%`, top: `${y / room.size.height * 100}%`, width: `${width / room.size.width * 100}%`, height: `${height / room.size.height * 100}%`, zIndex: item.layer, transform: `translate(${-anchor.x * 100}%, ${-anchor.y * 100}%)` }}>
    {asset ? <ApprovedSprite asset={asset} animationId={resolved.animationId} facing={behavior.facing} reducedMotion={reducedMotion} sequence={playbackSequence} onFailure={() => rejectAsset(assetIdentity(asset))} onMarker={onAnimationMarker} onComplete={() => {
      if (distinctMicro && micro?.animationId === 'idle_blink') setCompletedMicroSequence(micro.sequence)
      onAnimationComplete?.()
    }} /> : <TechnicalCharacter label={label} />}
  </div>
}





