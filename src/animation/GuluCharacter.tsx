import { GameCharacter } from './GameCharacter.tsx'
import { useGame } from '../game/useGame.ts'
import { INITIAL_ROOM } from '../scene/rooms.ts'
import type { RoomDefinition } from '../scene/rooms.ts'
import type { SceneItem } from '../scene/roomLayout.ts'
import { GULU_ANIMATIONS, GULU_FRAME } from './clips.ts'
import { SpritePlayer } from './SpritePlayer.tsx'
import { GuluIdleAnimation } from './GuluIdleAnimation.tsx'
import { GULU_IDLE_ANCHOR } from './idleMotion.ts'
import { useAutonomousBehavior } from './useAutonomousBehavior.ts'
import { useReducedMotion } from './useReducedMotion.ts'

export function GuluCharacter({ item, room = INITIAL_ROOM, approvedOnly = false }: { item: SceneItem; room?: RoomDefinition; approvedOnly?: boolean }) {
  return approvedOnly ? <GameCharacter item={item} room={room} /> : <LegacyGuluCharacter item={item} room={room} />
}
function LegacyGuluCharacter({ item, room }: { item: SceneItem; room: RoomDefinition }) {
  const { state } = useGame()
  const reducedMotion = useReducedMotion()
  const width = item.width
  const height = width * GULU_FRAME.height / GULU_FRAME.width
  const floorY = item.y + item.height
  const bounds = {
    minX: room.zones.activity.x + width * GULU_FRAME.anchor.x,
    maxX: room.zones.activity.x + room.zones.activity.width - width * (1 - GULU_FRAME.anchor.x),
    floorY,
  }
  const behavior = useAutonomousBehavior({ bounds, coreResting: state.activity.kind === 'resting', reducedMotion }, item.x + width / 2)
  const clip = GULU_ANIMATIONS[behavior.mode]
  const idle = behavior.mode === 'idle'
  const anchor = idle ? GULU_IDLE_ANCHOR : clip.anchor
  return <div className="scene-object object-character gulu-character" role="img" aria-label={`咕嚕：${clip.label}${!idle && clip.placeholder ? '（動畫占位素材）' : ''}`}
    data-behavior={behavior.mode} data-sequence={behavior.sequence} data-x={behavior.x.toFixed(2)} data-y={behavior.y.toFixed(2)}
    data-event-id={behavior.eventId} data-interaction-point={behavior.interactionPointId ?? ''} data-facing={behavior.facing}
    style={{ left: `${behavior.x / room.size.width * 100}%`, top: `${behavior.y / room.size.height * 100}%`, width: `${width / room.size.width * 100}%`, height: `${(idle ? width : height) / room.size.height * 100}%`, zIndex: item.layer,
      transform: `translate(${-anchor.x * 100}%, ${-anchor.y * 100}%)` }}>
    {idle ? <GuluIdleAnimation reducedMotion={reducedMotion} /> : <SpritePlayer animationId={behavior.mode} playbackKey={behavior.sequence} facing={behavior.facing} reducedMotion={reducedMotion} />}
  </div>
}



