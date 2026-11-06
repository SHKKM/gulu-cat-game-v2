import { BEHAVIOR_CONFIG as C } from './behaviorConfig.ts'

export interface VisualLoopEnvironment {
  request: (frame: (now: number) => void) => number
  cancel: (id: number) => void
  visible: () => boolean
  subscribe: (reset: () => void) => () => void
}
/** The existing behavior clock's single RAF owner; injectable for lifecycle tests. */
export function startBehaviorLoop(environment: VisualLoopEnvironment, advance: (clock: number) => void, initialClock = 0): () => void {
  let request = 0, last: number | null = null, clock = initialClock, sinceUpdate = 0, stopped = false
  const unsubscribe = environment.subscribe(() => { last = null; sinceUpdate = 0 })
  const frame = (now: number) => {
    if (stopped) return
    if (environment.visible()) {
      const delta = last === null ? 0 : Math.min(C.maxVisualDeltaMs, Math.max(0, now - last))
      last = now
      clock += delta; sinceUpdate += delta
      if (sinceUpdate >= C.visualUpdateMs) { sinceUpdate = 0; advance(clock) }
    } else last = null
    request = environment.request(frame)
  }
  request = environment.request(frame)
  return () => {
    if (stopped) return
    stopped = true; environment.cancel(request); unsubscribe()
  }
}
