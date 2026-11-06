import type { Interaction, Season, Stat } from './types.ts'

/** All balancing values below are PROVISIONAL / 待確認, not final game rules. */
export const GAME_CONFIG = {
  rulesStatus: 'provisional',
  stats: {
    min: 0, max: 100,
    initial: { satiety: 75, energy: 75, mood: 70, bond: 10 },
    hourly: {
      idle: { satiety: -5, energy: -4, mood: -2, bond: 0 },
      resting: { satiety: -3, energy: 24, mood: -1, bond: 0 },
    },
  },
  interactions: {
    feed: { effects: { satiety: 25, energy: 0, mood: 3, bond: 0 }, cooldownMs: 60_000, minEnergy: 0, minSatiety: 0 },
    pet: { effects: { satiety: 0, energy: 0, mood: 8, bond: 2 }, cooldownMs: 15_000, minEnergy: 0, minSatiety: 0 },
    play: { effects: { satiety: -6, energy: -12, mood: 12, bond: 3 }, cooldownMs: 45_000, minEnergy: 12, minSatiety: 6 },
    rest: { effects: { satiety: 0, energy: 0, mood: 0, bond: 0 }, cooldownMs: 10_000, minEnergy: 0, minSatiety: 0 },
  } satisfies Record<Interaction, { effects: Record<Stat, number>; cooldownMs: number; minEnergy: number; minSatiety: number }>,
  restDurationMs: 30 * 60_000,
  maxProgressPerGapMs: 8 * 60 * 60_000,
  maxMemories: 100,
  memoryPolicy: 'first-successful-interaction-of-each-kind-per-local-day',
  initialTerritory: { roomId: 'cozy-room', preferredSpotId: 'mat' },
  // Northern hemisphere calendar mapping, without season events or unlocks.
  seasonByMonth: ['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter'] satisfies Season[],
  runtime: { tickMs: 15_000 },
  storage: { key: 'gulu.little-days.save', schemaVersion: 1, maxCharacters: 1_000_000 },
} as const

// Prevent accidental runtime changes, including through JavaScript consumers.
function freezeDeep(value: object): void {
  Object.values(value).forEach(child => {
    if (child && typeof child === 'object') freezeDeep(child)
  })
  Object.freeze(value)
}
freezeDeep(GAME_CONFIG)
