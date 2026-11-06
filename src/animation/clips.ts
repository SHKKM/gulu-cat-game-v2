export const ANIMATION_IDS = ['idle', 'walk', 'rest', 'sleep', 'stretch', 'turn'] as const
export type AnimationId = typeof ANIMATION_IDS[number]
export type Facing = 'left' | 'right'
export interface AnimationClip {
  readonly id: AnimationId
  readonly label: string
  readonly frames: readonly string[]
  readonly fps: number
  readonly loop: boolean
  readonly playback: 'forward' | 'ping-pong'
  readonly anchor: { readonly x: number; readonly y: number }
  readonly placeholder: boolean
  readonly markers?: readonly { readonly frame: number; readonly key: string }[]
}
// All source frames must share this transparent canvas and ground contact point.
export const GULU_FRAME = { width: 96, height: 128, anchor: { x: 0.5, y: 0.9375 } } as const
const clip = (id: AnimationId, label: string, count: number, fps: number, loop: boolean, playback: AnimationClip['playback'] = 'forward'): AnimationClip => ({
  id, label, fps, loop, playback, anchor: GULU_FRAME.anchor, placeholder: true,
  frames: Array.from({ length: count }, (_, i) => `${import.meta.env?.BASE_URL ?? '/'}assets/characters/gulu/${id}/${String(i + 1).padStart(2, '0')}.svg`),
})
/** Provisional FPS and frame counts. Replace frame URLs with official PNG/WebP. */
export const GULU_ANIMATIONS: Readonly<Record<AnimationId, AnimationClip>> = {
  idle: clip('idle', '發呆', 2, 2, true, 'ping-pong'),
  walk: clip('walk', '走路', 4, 6, true),
  rest: clip('rest', '趴著休息', 2, 2, true, 'ping-pong'),
  sleep: clip('sleep', '睡覺', 2, 1, true, 'ping-pong'),
  stretch: clip('stretch', '伸懶腰', 4, 2, false),
  turn: clip('turn', '轉身', 4, 4, false),
}
