import { useEffect, useState } from 'react'
import { GULU_IDLE_FRAMES, startIdleBlink } from './idleMotion.ts'

interface Props {
  active?: boolean
  reducedMotion?: boolean
}

/** Full, uncropped square canvases; the parent positions the ground anchor. */
export function GuluIdleAnimation({ active = true, reducedMotion = false }: Props) {
  const [frame, setFrame] = useState(0)
  const [loaded, setLoaded] = useState<readonly number[]>([])
  const [failed, setFailed] = useState(false)
  const ready = loaded.length === GULU_IDLE_FRAMES.length
  useEffect(() => {
    if (!active || reducedMotion || !ready || failed) return
    return startIdleBlink(setFrame, {
      schedule(callback, delay) {
        const id = window.setTimeout(callback, delay)
        return () => window.clearTimeout(id)
      },
    })
  }, [active, reducedMotion, ready, failed])
  const visibleFrame = active && !reducedMotion && !failed ? frame : 0
  return <div className="gulu-idle-animation" data-frame={visibleFrame + 1} data-assets={failed ? 'error' : ready ? 'ready' : 'loading'}>
    {GULU_IDLE_FRAMES.map((src, index) => <img key={src} src={src} alt="" draggable={false}
      width={512} height={512} aria-hidden="true"
      style={{ opacity: index === visibleFrame ? 1 : 0 }}
      onLoad={() => setLoaded(current => current.includes(index) ? current : [...current, index])}
      onError={() => setFailed(true)} />)}
    {failed && <span role="status">咕嚕待機素材載入失敗</span>}
  </div>
}
