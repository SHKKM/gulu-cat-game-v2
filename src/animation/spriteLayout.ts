import type { PlayableAnimation } from './playback.ts'
import type { Rect } from '../scene/furnitureLayout.ts'

export function spriteLayout(definition: Pick<PlayableAnimation, 'canvas' | 'anchor' | 'facing' | 'mirrorAllowed'>, facing: 'left' | 'right', floor: Rect, radius: number, room: { width: number; height: number }, maxWidth: number) {
  const mirrored = facing !== definition.facing && definition.mirrorAllowed
  const anchor = { x: mirrored ? 1 - definition.anchor.x : definition.anchor.x, y: definition.anchor.y }
  const { width, height } = definition.canvas
  const minX = floor.x + radius, maxX = floor.x + floor.width - radius
  const minY = floor.y + radius, maxY = floor.y + floor.height - radius
  const scale = Math.min(maxWidth / width, minX / Math.max(1, width * anchor.x),
    (room.width - maxX) / Math.max(1, width * (1 - anchor.x)), minY / Math.max(1, height * anchor.y),
    (room.height - maxY) / Math.max(1, height * (1 - anchor.y)))
  return { width: width * scale, height: height * scale, anchor, mirrored }
}
