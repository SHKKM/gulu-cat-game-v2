export const GULU_IDLE_FRAMES = [1, 2, 3].map(index =>
  `${import.meta.env?.BASE_URL ?? '/'}assets/characters/gulu/idle/gulu_idle_0${index}.png`)

// Normalized ground contact stays fixed as the frame changes.
export const GULU_IDLE_ANCHOR = { x: 0.5, y: 0.921875 } as const

export interface IdleTimer {
  schedule: (callback: () => void, delay: number) => () => void
}

// Each motion can later provide its own frames and durations.
export const IDLE_BLINK = [
  { frame: 1, duration: 70 },
  { frame: 2, duration: 90 },
  { frame: 1, duration: 70 },
  { frame: 0, duration: 70 },
] as const

export function startIdleBlink(onFrame: (frame: number) => void, timer: IdleTimer, random = Math.random) {
  let cancelled = false
  let cancelTimer = () => {}
  const schedule = (callback: () => void, delay: number) => {
    cancelTimer = timer.schedule(() => { if (!cancelled) callback() }, delay)
  }
  const wait = () => schedule(() => play(0), 3000 + random() * 4000)
  const play = (step: number) => {
    if (step === IDLE_BLINK.length) { wait(); return }
    const { frame, duration } = IDLE_BLINK[step]
    onFrame(frame)
    schedule(() => play(step + 1), duration)
  }
  onFrame(0)
  wait()
  return () => { cancelled = true; cancelTimer() }
}
