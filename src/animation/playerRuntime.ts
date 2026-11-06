import { createPlaybackController } from './playback.ts'
import type { MarkerNotice } from './playback.ts'
import type { VisualLoopEnvironment } from './behaviorLoop.ts'

export interface PlaybackCallbacks {
  draw: (frame: number) => void
  reducedMotion: () => boolean
  onMarker?: (marker: MarkerNotice) => void
  onComplete?: () => void
  onFailure?: () => void
}
/** Sole animation RAF implementation, shared by approved and legacy adapters. */
export function startAnimationPlayback(controller: ReturnType<typeof createPlaybackController>, environment: VisualLoopEnvironment, callbacks: PlaybackCallbacks): () => void {
  let active = true, request = 0, last: number | null = null
  const unsubscribe = environment.subscribe(() => { last = null })
  const stop = () => {
    if (!active) return
    active = false; environment.cancel(request); unsubscribe()
  }
  const frame = (now: number) => {
    if (!active) return
    if (environment.visible()) {
      const delta = last === null ? 0 : Math.max(0, now - last)
      last = now
      const sampled = controller.advance(delta, callbacks.reducedMotion())
      try { callbacks.draw(sampled.frameIndex) }
      catch { stop(); callbacks.onFailure?.(); return }
      try {
        for (const marker of sampled.markers) {
          if (!active) return
          callbacks.onMarker?.(marker)
        }
        if (!active) return
        if (sampled.justCompleted) callbacks.onComplete?.()
      } catch { stop(); return } // Consumer failure must not leave an orphan RAF.
      if (sampled.completed || (callbacks.reducedMotion() && controller.isLoop)) { stop(); return }
    } else last = null
    if (active) request = environment.request(frame)
  }
  frame(0)
  last = null // The first real RAF establishes its own timestamp origin.
  return stop
}
