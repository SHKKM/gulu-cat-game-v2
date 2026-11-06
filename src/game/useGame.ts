import { useContext, useSyncExternalStore } from 'react'
import { GameContext } from './context.ts'

/** Future UI uses this adapter; gameplay never depends on image/animation assets. */
export function useGame() {
  const store = useContext(GameContext)
  if (!store) throw new Error('useGame 必須放在 GameProvider 內')
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
  return { ...snapshot, interact: store.interact, reload: store.reload }
}
