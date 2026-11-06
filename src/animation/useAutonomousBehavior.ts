import { useEffect, useRef, useState } from 'react'
import { createBehavior, initializeCatalogBehavior, stepBehavior } from './behavior.ts'
import type { BehaviorInput } from './behavior.ts'
import { startBehaviorLoop } from './behaviorLoop.ts'

export function useAutonomousBehavior(input: BehaviorInput, initialX: number) {
  const [state, setState] = useState(() => initializeCatalogBehavior(createBehavior(0, input.bounds, initialX, input.random), 0, input))
  const latest = useRef(input)
  const current = useRef(state)
  const clock = useRef(0)
  useEffect(() => { latest.current = input }, [input])
  useEffect(() => startBehaviorLoop({
    request: frame => window.requestAnimationFrame(frame),
    cancel: id => window.cancelAnimationFrame(id),
    visible: () => document.visibilityState === 'visible',
    subscribe: reset => {
      document.addEventListener('visibilitychange', reset)
      window.addEventListener('pagehide', reset)
      window.addEventListener('pageshow', reset)
      return () => {
        document.removeEventListener('visibilitychange', reset)
        window.removeEventListener('pagehide', reset)
        window.removeEventListener('pageshow', reset)
      }
    },
  }, now => {
    clock.current = now
    const previous = current.current
    const next = stepBehavior(previous, now, latest.current)
    // Keep route progress even when its visible pose has not changed.
    current.current = next
    if (next.sequence !== previous.sequence || next.x !== previous.x || next.y !== previous.y || next.facing !== previous.facing || next.catalog?.sequence !== previous.catalog?.sequence || next.catalog?.micro?.sequence !== previous.catalog?.micro?.sequence) setState(next)
  }, clock.current), [])
  return state
}
