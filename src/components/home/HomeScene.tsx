import { useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { RoomScene } from '../RoomScene.tsx'
import type { RoomDefinition } from '../../scene/rooms.ts'
import type { TimeOfDay } from '../../scene/timeOfDay.ts'
import { HomeIcon } from './HomeIcon.tsx'
import { useGameArt } from '../../game/assets/useGameArt.ts'
import { fitScene } from '../../scene/fitScene.ts'
import { compatibleSceneImage } from '../../scene/sceneAssets.ts'

export function HomeScene({ room, timeOfDay, eventLayer, onSettings }: { room: RoomDefinition; timeOfDay: TimeOfDay; eventLayer?: ReactNode; onSettings: () => void }) {
  const art = useGameArt()
  const hasBackground = !!compatibleSceneImage(art.assets[`image.room.${room.id}.background`], room.size)
  const showDebug = import.meta.env.DEV && new URLSearchParams(window.location.search).get('debug') === 'animation'
  const viewport = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState({ width: 0, floorDepth: 0 })
  useLayoutEffect(() => {
    const element = viewport.current
    if (!element) return
    const measure = () => {
      const fitted = fitScene(element.clientWidth, element.clientHeight, room.size)
      setFit({ width: fitted.width, floorDepth: fitted.height * 0.39 })
    }
    measure()
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    observer?.observe(element)
    window.addEventListener('resize', measure)
    return () => { observer?.disconnect(); window.removeEventListener('resize', measure) }
  }, [room.size])
  return <section className="home-scene-region" aria-label={room.label} data-room-id={room.id}>
    <button type="button" className="settings-button scene-settings" onClick={onSettings} aria-label="開啟設定說明" aria-haspopup="dialog"><HomeIcon name="settings" /></button>
    <div ref={viewport} className="home-room-viewport" style={{ '--stage-width': fit.width ? `${fit.width}px` : undefined, '--floor-depth': `${fit.floorDepth}px` } as CSSProperties}>
      <RoomScene room={room} timeOfDay={timeOfDay} variant="homepage" eventLayer={eventLayer} />
    </div>
    {showDebug && !hasBackground && <span className="home-placeholder-label scene-art-badge">暫時場景／角色依核准素材清單載入</span>}
  </section>
}







