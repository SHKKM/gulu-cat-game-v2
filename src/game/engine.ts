import { GAME_CONFIG } from './config.ts'
import { INTERACTIONS, STAT_KEYS } from './types.ts'
import type { GameState, Interaction, InteractionResult, Season, Stats, TimeSettlement } from './types.ts'

export const MAX_TIMESTAMP = 8_640_000_000_000_000
export function isTimestamp(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= MAX_TIMESTAMP
}
function assertTimestamp(now: number): void {
  if (!isTimestamp(now)) throw new RangeError('時間必須是有效且非負的整數毫秒時間戳記')
}
export function createInitialState(now: number): GameState {
  assertTimestamp(now)
  return {
    schemaVersion: 1, createdAt: now, updatedAt: now, characterId: 'gulu',
    stats: { ...GAME_CONFIG.stats.initial }, activity: { kind: 'idle' },
    lastInteractions: { feed: null, pet: null, play: null, rest: null },
    memories: [], collectionIds: [], territory: { ...GAME_CONFIG.initialTerritory },
  }
}
function changeStats(stats: Stats, changes: Stats, scale = 1): Stats {
  return Object.fromEntries(STAT_KEYS.map(key => {
    const value = stats[key] + changes[key] * scale
    if (!Number.isFinite(value)) throw new RangeError('遊戲數值必須為有限數字')
    return [key, Math.min(GAME_CONFIG.stats.max, Math.max(GAME_CONFIG.stats.min, value))]
  })) as unknown as Stats
}

/** Shared online/offline calculation; O(1), even after a very long absence. */
export function settleTime(state: GameState, now: number): TimeSettlement {
  assertTimestamp(now)
  const elapsedMs = Math.max(0, now - state.updatedAt)
  if (now <= state.updatedAt) return { state, elapsedMs: 0, appliedMs: 0, skippedMs: 0, clockRolledBack: now < state.updatedAt }
  const appliedMs = Math.min(elapsedMs, GAME_CONFIG.maxProgressPerGapMs)
  const restMs = state.activity.kind === 'resting'
    ? Math.min(appliedMs, Math.max(0, state.activity.until - state.updatedAt)) : 0
  // Split recovery and awake decay at the rest boundary. Clamp each segment.
  let stats = changeStats(state.stats, GAME_CONFIG.stats.hourly.resting, restMs / 3_600_000)
  stats = changeStats(stats, GAME_CONFIG.stats.hourly.idle, (appliedMs - restMs) / 3_600_000)
  const activity = state.activity.kind === 'resting' && now >= state.activity.until
    ? { kind: 'idle' as const } : state.activity
  return {
    state: { ...state, stats, activity, updatedAt: now }, elapsedMs, appliedMs,
    skippedMs: elapsedMs - appliedMs, clockRolledBack: false,
  }
}

export function localDayKey(now: number): string {
  assertTimestamp(now)
  const date = new Date(now)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
export function getSeason(now: number): Season {
  assertTimestamp(now)
  return GAME_CONFIG.seasonByMonth[new Date(now).getMonth()]
}

/** Pure interaction API. Always settles time BEFORE checking eligibility. */
export function interact(input: GameState, action: Interaction, now: number): InteractionResult {
  const settlement = settleTime(input, now)
  const state = settlement.state
  const reject = (reason: Extract<InteractionResult, { ok: false }>['reason'], remainingMs?: number): InteractionResult => ({ state, settlement, ok: false, reason, remainingMs })
  if (!INTERACTIONS.includes(action)) return reject('unknown-interaction')
  if (settlement.clockRolledBack) return reject('clock-rollback')
  if (state.activity.kind === 'resting') return reject('resting')
  const rule = GAME_CONFIG.interactions[action]
  const previous = state.lastInteractions[action]
  if (previous !== null && now - previous < rule.cooldownMs) return reject('cooldown', rule.cooldownMs - (now - previous))
  if (state.stats.energy < rule.minEnergy) return reject('not-enough-energy')
  if (state.stats.satiety < rule.minSatiety) return reject('not-enough-satiety')
  const localDay = localDayKey(now)
  const id = `${localDay}:${action}`
  const memories = state.memories.some(memory => memory.id === id) ? state.memories
    : [...state.memories, { id, localDay, kind: action, occurredAt: now }].slice(-GAME_CONFIG.maxMemories)
  return {
    ok: true, settlement,
    state: {
      ...state, stats: changeStats(state.stats, rule.effects),
      activity: action === 'rest' ? { kind: 'resting', until: Math.min(MAX_TIMESTAMP, now + GAME_CONFIG.restDurationMs) } : state.activity,
      lastInteractions: { ...state.lastInteractions, [action]: now }, memories,
    },
  }
}
