import type { AnimationDefinition } from '../game/types/catalog.ts'

export type TimelineDefinition = Pick<AnimationDefinition, 'frames' | 'fps' | 'loop' | 'playback' | 'markers'>
export type PlayableAnimation = TimelineDefinition & Pick<AnimationDefinition, 'id' | 'canvas' | 'anchor' | 'facing' | 'mirrorAllowed'>
export interface MarkerNotice { readonly frame: number; readonly key: string; readonly cycle: number }
export interface AnimationMarkerNotice extends MarkerNotice { readonly animationId: string }
export function animationPlaybackSignature(definition: PlayableAnimation, playbackKey: number | string): string {
  return JSON.stringify([{ id: definition.id, frames: definition.frames, fps: definition.fps, loop: definition.loop, playback: definition.playback,
    canvas: { width: definition.canvas.width, height: definition.canvas.height }, anchor: { x: definition.anchor.x, y: definition.anchor.y },
    facing: definition.facing, mirrorAllowed: definition.mirrorAllowed, markers: definition.markers }, playbackKey])
}
export function validateTimeline(clip: TimelineDefinition): void {
  if (!clip.frames.length || clip.frames.length > 256 || !Number.isFinite(clip.fps) || clip.fps <= 0 || clip.fps > 60) throw new RangeError('動畫需要 1–256 格與有效 FPS（0–60，不含 0）')
  if (typeof clip.loop !== 'boolean' || !['forward', 'ping-pong'].includes(clip.playback)) throw new RangeError('播放模式無效')
  for (const marker of clip.markers ?? []) if (!Number.isInteger(marker.frame) || marker.frame < 0 || marker.frame >= clip.frames.length || typeof marker.key !== 'string' || !marker.key) throw new RangeError('動畫 marker 無效')
}

export function frameSequence(clip: TimelineDefinition): number[] {
  const forward = clip.frames.map((_, index) => index)
  return clip.playback === 'ping-pong' && forward.length > 2
    ? [...forward, ...forward.slice(1, -1).reverse()] : forward
}
export function clipDurationMs(clip: TimelineDefinition): number {
  validateTimeline(clip)
  return frameSequence(clip).length / clip.fps * 1000
}
/** Stateless sampler: once clips hold their final frame and report completion. */
export function sampleAnimation(clip: TimelineDefinition, elapsedMs: number) {
  validateTimeline(clip)
  const sequence = frameSequence(clip)
  const elapsed = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0
  const step = Math.floor(elapsed * clip.fps / 1000)
  const completed = !clip.loop && step >= sequence.length
  const slot = clip.loop ? step % sequence.length : Math.min(step, sequence.length - 1)
  return { frameIndex: sequence[slot], completed }
}

/** Marker keys are opaque notification data, never executable instructions.
 * An occurrence is (frame,key,cycle); ping-pong revisits fire only once per cycle.
 */
export function createPlaybackController(clip: TimelineDefinition) {
  validateTimeline(clip)
  const sequence = frameSequence(clip), emitted = new Map<string, number>()
  let elapsed = 0, previousStep = -1, completed = false
  return {
    isLoop: clip.loop,
    snapshot: () => sampleAnimation(clip, elapsed),
    advance(deltaMs: number, reducedMotion = false) {
      if (Number.isFinite(deltaMs) && deltaMs > 0 && !(reducedMotion && clip.loop)) elapsed += Math.min(250, deltaMs)
      const sampled = sampleAnimation(clip, elapsed), markers: MarkerNotice[] = []
      const step = Math.floor(elapsed * clip.fps / 1000)
      for (let cursor = previousStep + 1; cursor <= Math.min(step, clip.loop ? step : sequence.length - 1); cursor++) {
        const cycle = clip.loop ? Math.floor(cursor / sequence.length) : 0
        const frame = sequence[cursor % sequence.length]
        for (const marker of clip.markers ?? []) {
          const identity = JSON.stringify([marker.frame, marker.key])
          if (marker.frame !== frame || emitted.get(identity) === cycle) continue
          emitted.set(identity, cycle)
          // Static reduced-motion playback only notifies the first displayed frame.
          if (!reducedMotion || cursor === 0) markers.push({ ...marker, cycle })
        }
      }
      previousStep = step
      const justCompleted = sampled.completed && !completed
      completed ||= sampled.completed
      return { ...sampled, frameIndex: reducedMotion ? 0 : sampled.frameIndex, markers, justCompleted }
    },
  }
}
