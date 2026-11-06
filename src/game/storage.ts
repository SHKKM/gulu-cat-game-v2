import { GAME_CONFIG } from './config.ts'
import { isTimestamp } from './engine.ts'
import { INTERACTIONS, STAT_KEYS } from './types.ts'
import type { GameState, Interaction, Memory, Stats } from './types.ts'

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}
export type LoadStatus = 'loaded' | 'empty' | 'unavailable' | 'read-error' | 'invalid' | 'unsupported-version'
export interface LoadResult { status: LoadStatus; state: GameState | null; raw: string | null }
export type SaveResult = { ok: true; raw: string } | { ok: false; reason: 'unavailable' | 'write-error' | 'conflict' | 'invalid-state' }
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const identifier = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length <= 128
const isInteraction = (value: unknown): value is Interaction => typeof value === 'string' && INTERACTIONS.some(action => action === value)

/** Never trust JSON from localStorage. Reject invalid data instead of applying it. */
export function validateState(input: unknown): GameState | null {
  if (!record(input) || input.schemaVersion !== 1 || input.characterId !== 'gulu') return null
  if (!isTimestamp(input.createdAt) || !isTimestamp(input.updatedAt) || input.createdAt > input.updatedAt) return null
  if (!record(input.stats) || !record(input.lastInteractions) || !record(input.activity) || !record(input.territory)) return null
  const stats = input.stats
  if (!STAT_KEYS.every(key => typeof stats[key] === 'number' && Number.isFinite(stats[key]) && stats[key] >= GAME_CONFIG.stats.min && stats[key] <= GAME_CONFIG.stats.max)) return null
  const actions = input.lastInteractions
  const createdAt = input.createdAt
  const updatedAt = input.updatedAt
  if (!INTERACTIONS.every(key => actions[key] === null || (isTimestamp(actions[key]) && actions[key] >= createdAt && actions[key] <= updatedAt))) return null
  if (input.activity.kind !== 'idle' && input.activity.kind !== 'resting') return null
  if (input.activity.kind === 'resting' && (!isTimestamp(input.activity.until) || input.activity.until < updatedAt)) return null
  if (!identifier(input.territory.roomId) || !(input.territory.preferredSpotId === null || identifier(input.territory.preferredSpotId))) return null
  if (!Array.isArray(input.collectionIds) || !input.collectionIds.every(identifier) || new Set(input.collectionIds).size !== input.collectionIds.length) return null
  if (!Array.isArray(input.memories) || input.memories.length > GAME_CONFIG.maxMemories) return null
  const memories: Memory[] = []
  for (const memory of input.memories) {
    if (!record(memory) || !isInteraction(memory.kind) || typeof memory.localDay !== 'string' || !/^\d{4,6}-\d{2}-\d{2}$/.test(memory.localDay)) return null
    if (memory.id !== `${memory.localDay}:${memory.kind}` || !isTimestamp(memory.occurredAt) || memory.occurredAt < createdAt || memory.occurredAt > updatedAt) return null
    memories.push({ id: memory.id, localDay: memory.localDay, kind: memory.kind, occurredAt: memory.occurredAt })
  }
  if (new Set(memories.map(memory => memory.id)).size !== memories.length) return null
  return {
    schemaVersion: 1, characterId: 'gulu', createdAt, updatedAt,
    stats: Object.fromEntries(STAT_KEYS.map(key => [key, stats[key]])) as unknown as Stats,
    activity: input.activity.kind === 'idle' ? { kind: 'idle' } : { kind: 'resting', until: input.activity.until as number },
    lastInteractions: Object.fromEntries(INTERACTIONS.map(key => [key, actions[key]])) as unknown as GameState['lastInteractions'],
    memories, collectionIds: [...input.collectionIds],
    territory: { roomId: input.territory.roomId, preferredSpotId: input.territory.preferredSpotId },
  }
}

export function loadGame(storage?: StorageLike): LoadResult {
  if (!storage) return { status: 'unavailable', state: null, raw: null }
  let raw: string | null
  try { raw = storage.getItem(GAME_CONFIG.storage.key) }
  catch { return { status: 'read-error', state: null, raw: null } }
  if (raw === null) return { status: 'empty', state: null, raw }
  if (raw.length > GAME_CONFIG.storage.maxCharacters) return { status: 'invalid', state: null, raw }
  try {
    const input: unknown = JSON.parse(raw)
    if (record(input) && Number.isInteger(input.schemaVersion) && input.schemaVersion !== GAME_CONFIG.storage.schemaVersion) return { status: 'unsupported-version', state: null, raw }
    const state = validateState(input)
    return { status: state ? 'loaded' : 'invalid', state, raw }
  } catch { return { status: 'invalid', state: null, raw } }
}

/** Optimistic conflict guard. Never silently replace another tab's checkpoint. */
export function saveGame(storage: StorageLike | undefined, state: GameState, expectedRaw: string | null): SaveResult {
  if (!storage) return { ok: false, reason: 'unavailable' }
  if (!validateState(state)) return { ok: false, reason: 'invalid-state' }
  try {
    const raw = JSON.stringify(state)
    if (raw.length > GAME_CONFIG.storage.maxCharacters) return { ok: false, reason: 'write-error' }
    if (storage.getItem(GAME_CONFIG.storage.key) !== expectedRaw) return { ok: false, reason: 'conflict' }
    storage.setItem(GAME_CONFIG.storage.key, raw)
    return { ok: true, raw }
  } catch { return { ok: false, reason: 'write-error' } }
}
