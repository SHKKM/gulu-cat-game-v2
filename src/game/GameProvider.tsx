import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { GAME_CONFIG } from './config.ts'
import { GameContext } from './context.ts'
import { createGameStore } from './store.ts'

export function GameProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => createGameStore({ getStorage: () => window.localStorage }))
  useEffect(() => {
    const sync = () => { store.tick() }
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') sync()
    }, GAME_CONFIG.runtime.tickMs)
    sync()
    document.addEventListener('visibilitychange', sync)
    window.addEventListener('pagehide', sync)
    window.addEventListener('pageshow', sync)
    window.addEventListener('focus', sync)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', sync)
      window.removeEventListener('pagehide', sync)
      window.removeEventListener('pageshow', sync)
      window.removeEventListener('focus', sync)
    }
  }, [store])
  return <GameContext.Provider value={store}>{children}</GameContext.Provider>
}
