import { createInitialState, interact, settleTime } from './engine.ts'
import { loadGame, saveGame } from './storage.ts'
import type { LoadStatus, StorageLike } from './storage.ts'
import type { GameState, Interaction, TimeSettlement } from './types.ts'

export type PersistenceStatus = 'ready' | Exclude<LoadStatus, 'loaded' | 'empty'> | 'write-error' | 'conflict'
export interface GameSnapshot {
  readonly state: GameState
  readonly persistence: PersistenceStatus
  readonly lastSettlement: TimeSettlement
}
export interface StoreOptions { getStorage?: () => StorageLike | undefined; now?: () => number }
function freezeDeep<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freezeDeep)
    Object.freeze(value)
  }
  return value
}

/** No React, DOM, timers, randomness or implicit clock reads in the engine. */
export function createGameStore(options: StoreOptions = {}) {
  const clock = options.now ?? Date.now
  const listeners = new Set<() => void>()
  let storage: StorageLike | undefined
  let expectedRaw: string | null = null
  let snapshot: GameSnapshot

  function load(): void {
    try { storage = options.getStorage?.() } catch { storage = undefined }
    const result = loadGame(storage)
    const now = clock()
    const settlement = settleTime(result.state ?? createInitialState(now), now)
    expectedRaw = result.raw
    snapshot = freezeDeep({
      state: settlement.state, lastSettlement: settlement,
      persistence: result.status === 'loaded' || result.status === 'empty' ? 'ready' : result.status,
    })
  }
  load() // Read-only: safe during React StrictMode initialization.

  function notify(): void { listeners.forEach(listener => listener()) }
  function persist(state: GameState, settlement: TimeSettlement): void {
    let persistence = snapshot.persistence
    // Invalid, newer, inaccessible or conflicting saves stay protected.
    if (persistence === 'ready' || persistence === 'write-error') {
      const saved = saveGame(storage, state, expectedRaw)
      if (saved.ok) { expectedRaw = saved.raw; persistence = 'ready' }
      else persistence = saved.reason === 'invalid-state' ? 'write-error' : saved.reason
    }
    snapshot = freezeDeep({ state, persistence, lastSettlement: settlement })
    notify()
  }
  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener) } },
    tick() {
      const settlement = settleTime(snapshot.state, clock())
      persist(settlement.state, settlement)
      return settlement
    },
    interact(action: Interaction) {
      const result = interact(snapshot.state, action, clock())
      persist(result.state, result.settlement)
      return result
    },
    /** Explicitly discards session-only progress and re-reads the saved checkpoint. */
    reload() { load(); notify(); return snapshot },
  }
}
export type GameStore = ReturnType<typeof createGameStore>
