import { useCallback, useLayoutEffect, useMemo, useRef } from 'react'
import { animationPlaybackSignature, createPlaybackController } from './playback.ts'
import type { AnimationMarkerNotice, PlayableAnimation } from './playback.ts'
import { startAnimationPlayback } from './playerRuntime.ts'

export interface CanvasSpriteProps {
  definition: PlayableAnimation
  images?: readonly CanvasImageSource[]
  playbackKey: number | string
  facing: 'left' | 'right'
  reducedMotion: boolean
  className?: string
  onMarker?: (notice: AnimationMarkerNotice) => void
  onComplete?: () => void
  onFailure?: () => void
}
export function CanvasSprite(props: CanvasSpriteProps) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const latest = useRef(props)
  const signature = animationPlaybackSignature(props.definition, props.playbackKey)
  const controller = useMemo(() => {
    try {
      const [definition] = JSON.parse(signature) as [PlayableAnimation, number | string]
      return createPlaybackController(definition)
    } catch { return null }
  }, [signature])
  const failure = useRef<string | null>(null)
  const notifyFailure = useCallback(() => {
    if (failure.current === signature) return
    failure.current = signature; latest.current.onFailure?.()
  }, [signature])
  const drawn = useRef<{ index: number; facing: string; images: CanvasSpriteProps['images']; signature: string } | null>(null)
  const draw = useCallback((index: number) => {
    const current = latest.current, definition = current.definition
    if (drawn.current?.index === index && drawn.current.facing === current.facing && drawn.current.images === current.images && drawn.current.signature === signature) return
    const context = canvas.current?.getContext('2d')
    if (!context) throw Error('Canvas unavailable')
    const { width, height } = definition.canvas
    context.clearRect(0, 0, width, height)
    context.save()
    try {
      if (current.facing !== definition.facing && definition.mirrorAllowed) { context.translate(width, 0); context.scale(-1, 1) }
      if (current.images) {
        if (current.images.length !== definition.frames.length || !current.images[index]) throw Error('Incomplete decoded frames')
        context.drawImage(current.images[index], 0, 0, width, height)
      } else {
        // Neutral technical pose, deliberately not a new character design.
        context.fillStyle = '#fff6e5'; context.strokeStyle = '#9d876e'; context.lineWidth = Math.max(1, width / 64)
        context.setLineDash([width / 22, width / 24])
        context.beginPath(); context.ellipse(width / 2, height / 2, width * .35, height * .4, 0, 0, Math.PI * 2); context.fill(); context.stroke()
      }
    } finally { context.restore() }
    drawn.current = { index, facing: current.facing, images: current.images, signature }
    if (canvas.current) canvas.current.dataset.frameIndex = String(index)
  }, [signature])
  const drawing = useRef(draw)
  useLayoutEffect(() => {
    latest.current = props; drawing.current = draw
    // Direction, callbacks, decoded image arrival and equivalent rerenders do not reset time.
    if (controller) {
      try { draw(props.reducedMotion ? 0 : controller.snapshot().frameIndex) } catch { notifyFailure() }
    }
  })
  useLayoutEffect(() => {
    if (!controller || failure.current === signature) { notifyFailure(); return }
    return startAnimationPlayback(controller, {
      request: callback => window.requestAnimationFrame(callback), cancel: id => window.cancelAnimationFrame(id),
      visible: () => document.visibilityState === 'visible',
      subscribe: reset => {
        document.addEventListener('visibilitychange', reset)
        window.addEventListener('pagehide', reset); window.addEventListener('pageshow', reset)
        return () => {
          document.removeEventListener('visibilitychange', reset)
          window.removeEventListener('pagehide', reset); window.removeEventListener('pageshow', reset)
        }
      },
    }, {
      draw: index => drawing.current(index), reducedMotion: () => latest.current.reducedMotion,
      onMarker: notice => latest.current.onMarker?.({ ...notice, animationId: latest.current.definition.id }),
      onComplete: () => latest.current.onComplete?.(), onFailure: notifyFailure,
    })
  }, [controller, props.reducedMotion, notifyFailure, signature])
  return <canvas className={props.className} data-animation-id={props.definition.id} ref={canvas} width={props.definition.canvas.width} height={props.definition.canvas.height} aria-hidden="true" />
}
