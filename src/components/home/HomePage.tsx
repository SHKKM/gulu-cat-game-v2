import { useCallback, useEffect, useState } from 'react'
import { INITIAL_ROOM } from '../../scene/rooms.ts'
import { GameArtProvider } from '../../game/assets/GameArtProvider.tsx'
import { HomeScene } from './HomeScene.tsx'
import { FeatureSheet } from './FeatureSheet.tsx'
import { HomeNavigation } from './HomeNavigation.tsx'
import type { HomeDestination, HomePanel } from './homeModel.ts'

export function HomePage() {
  const [panel, setPanel] = useState<HomePanel | null>(null)
  const [homeNotice, setHomeNotice] = useState(0)
  const closePanel = useCallback(() => setPanel(null), [])
  useEffect(() => {
    if (!homeNotice) return
    const timer = window.setTimeout(() => setHomeNotice(0), 3000)
    return () => window.clearTimeout(timer)
  }, [homeNotice])
  const navigate = (destination: HomeDestination) => {
    if (destination === 'home') setHomeNotice(value => value + 1)
    else { setHomeNotice(0); setPanel(destination) }
  }
  return <GameArtProvider>
    <main className="s3-app" aria-label="小屋遊戲">
      <div className="s3-home s3-home--with-navigation" data-stage="P0-2">
        <HomeScene room={INITIAL_ROOM} timeOfDay="day" onSettings={() => { setHomeNotice(0); setPanel('settings') }} />
        <HomeNavigation onNavigate={navigate} />
        {homeNotice > 0 && <p className="home-feedback" role="status">已在小屋，陪咕嚕待一會兒。</p>}
      </div>
      {panel && <FeatureSheet panel={panel} onClose={closePanel} />}
    </main>
  </GameArtProvider>
}
