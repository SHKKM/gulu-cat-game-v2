import { useEffect, useRef, useState } from 'react'
import { GameContext } from '../game/context.ts'
import { createGameStore } from '../game/store.ts'
import { RoomScene } from '../components/RoomScene.tsx'
import { ANIMATION_IDS, GULU_ANIMATIONS } from './clips.ts'
import type { AnimationId } from './clips.ts'
import { SpritePlayer } from './SpritePlayer.tsx'
import { roomItems, roomZones } from '../scene/roomLayout.ts'
import '../styles/app.css'
import './lab.css'

import { CanvasSprite } from './CanvasSprite.tsx'
import type { PlayableAnimation } from './playback.ts'

// Isolated geometric fixture, never an approved S2 asset or character redesign.
const MARKER_FIXTURE: PlayableAnimation = {
  id: 'lab.marker-fixture', frames: ['fixture-0', 'fixture-1', 'fixture-2'], fps: 4, loop: false, playback: 'forward',
  canvas: { width: 96, height: 128 }, anchor: { x: .3, y: .9375 }, facing: 'right', mirrorAllowed: true,
  markers: [{ frame: 0, key: 'start' }, { frame: 1, key: 'middle' }, { frame: 2, key: 'end' }],
}
// Developer-only entry, not imported by main.tsx and not a production build entry.
export function AnimationLab() {
  const [store] = useState(() => createGameStore()) // no browser storage; no real saves touched
  const room = useRef<HTMLDivElement>(null)
  const [preview, setPreview] = useState<AnimationId>('idle')
  const [run, setRun] = useState(0)
  const [completed, setCompleted] = useState(0)
  const [markerRun, setMarkerRun] = useState(0)
  const [markerFacing, setMarkerFacing] = useState<'left' | 'right'>('right')
  const [markerLoop, setMarkerLoop] = useState(false)
  const [markerLog, setMarkerLog] = useState<string[]>([])
  const [markerCompleted, setMarkerCompleted] = useState(0)
  const [rerenders, setRerenders] = useState(0)
  const [report, setReport] = useState({ seconds: 0, transitions: 0, violations: 0, assetErrors: 0, modes: '', current: 'idle' })
  const [log, setLog] = useState<string[]>([])
  useEffect(() => {
    let elapsed = 0
    let last = performance.now()
    let sequence = ''
    let transitions = 0
    let violations = 0
    const modes = new Set<string>()
    const resetClock = () => { last = performance.now() }
    const sample = () => {
      const now = performance.now()
      const delta = now - last
      last = now
      if (document.visibilityState !== 'visible') return
      elapsed += delta
      const character = room.current?.querySelector<HTMLElement>('.gulu-character')
      if (!character) return
      const item = roomItems.find(item => item.id === 'gulu')!
      const x = Number(character.dataset.x)
      const min = roomZones.activity.x + item.width / 2
      const max = roomZones.activity.x + roomZones.activity.width - item.width / 2
      if (!Number.isFinite(x) || x < min - 0.01 || x > max + 0.01) violations++
      const mode = character.dataset.behavior ?? ''
      modes.add(mode)
      if (sequence !== character.dataset.sequence) {
        if (sequence !== '') transitions++
        sequence = character.dataset.sequence ?? ''
        setLog(previous => [`${Math.floor(elapsed / 1000)}s · ${mode} · x=${x} · ${character.dataset.eventId}`, ...previous].slice(0, 20))
      }
      const sprite = character.querySelector<HTMLElement>('.gulu-sprite')
      setReport({ seconds: Math.floor(elapsed / 1000), transitions, violations, assetErrors: Number(sprite?.dataset.assetErrors ?? 0), modes: [...modes].join(' / '), current: mode })
    }
    const timer = window.setInterval(sample, 1000)
    document.addEventListener('visibilitychange', resetClock)
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', resetClock) }
  }, [])
  return <GameContext.Provider value={store}>
    <main className="animation-lab">
      <h1>咕嚕動畫驗收</h1>
      <p>獨立測試頁，不讀寫玩家存檔。前景累計 600 秒為一次 10 分鐘觀察。</p>
      <output aria-label="自主行為驗收結果">{report.seconds}s / 600s · {report.seconds >= 600 ? '觀察滿 10 分鐘' : '觀察中'} · 狀態 {report.current} · 切換 {report.transitions} · 越界 {report.violations} · 素材錯誤 {report.assetErrors}</output>
      <p>已觀察：{report.modes || '等待取樣'}</p>
      <div ref={room} className="lab-room"><RoomScene timeOfDay="day" /></div>
      <details><summary>最近狀態紀錄</summary><ol>{log.map((entry, index) => <li key={`${entry}-${index}`}>{entry}</li>)}</ol></details>
      <section aria-label="Marker 播放驗收">
        <h2>P0-5 共用播放器驗收</h2>
        <p>幾何占位，非正式咕嚕圖片。Marker 僅寫入此頁紀錄，不執行獎勵或存檔。</p>
        <button type="button" onClick={() => { setMarkerRun(value => value + 1); setMarkerLog([]); setMarkerCompleted(0) }}>重播 marker 測試</button>
        <button type="button" onClick={() => setMarkerFacing(value => value === 'left' ? 'right' : 'left')}>切換測試方向</button>
        <button type="button" onClick={() => { setMarkerLoop(value => !value); setMarkerLog([]); setMarkerCompleted(0) }}>切換循環測試</button>
        <button type="button" onClick={() => setRerenders(value => value + 1)}>重新渲染測試</button>
        <div className="lab-sprite"><CanvasSprite definition={{ ...MARKER_FIXTURE, loop: markerLoop }} playbackKey={markerRun} facing={markerFacing} reducedMotion={false}
          onMarker={notice => setMarkerLog(previous => [...previous, `${notice.frame}:${notice.key}@${notice.cycle}`].slice(-12))}
          onComplete={() => setMarkerCompleted(value => value + 1)} /></div>
        <output aria-label="Marker 測試結果">{markerLoop ? '循環' : '單次'} · 方向 {markerFacing} · 重渲染 {rerenders} · 完成 {markerCompleted} · markers {markerLog.join(' / ') || '等待'}</output>
      </section>
      <section className="lab-preview" aria-label="單一動畫預覽">
        <h2>逐格播放器獨立預覽</h2>
        <label>動畫 <select value={preview} onChange={event => { setPreview(event.target.value as AnimationId); setRun(value => value + 1); setCompleted(0) }}>
          {ANIMATION_IDS.map(id => <option key={id} value={id}>{id} · {GULU_ANIMATIONS[id].label}</option>)}
        </select></label>
        <button type="button" onClick={() => { setRun(value => value + 1); setCompleted(0) }}>重播</button>
        <div className="lab-sprite"><SpritePlayer animationId={preview} playbackKey={run} onComplete={() => setCompleted(value => value + 1)} /></div>
        <p>單次完成回呼：{completed}（循環動畫為 0，單次播放後應為 1 並停在末格）</p>
      </section>
    </main>
  </GameContext.Provider>
}


