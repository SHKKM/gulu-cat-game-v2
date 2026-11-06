export const STAT_KEYS = ['satiety', 'energy', 'mood', 'bond'] as const
export type Stat = typeof STAT_KEYS[number]
export const INTERACTIONS = ['feed', 'pet', 'play', 'rest'] as const
export type Interaction = typeof INTERACTIONS[number]
export type Season = 'spring' | 'summer' | 'autumn' | 'winter'
export type Stats = Readonly<Record<Stat, number>>
export type Activity = { readonly kind: 'idle' } | { readonly kind: 'resting'; readonly until: number }
export interface Memory {
  readonly id: string
  readonly localDay: string
  readonly kind: Interaction
  readonly occurredAt: number
}
export interface GameState {
  readonly schemaVersion: 1
  readonly createdAt: number
  readonly updatedAt: number
  readonly characterId: 'gulu'
  readonly stats: Stats
  readonly activity: Activity
  readonly lastInteractions: Readonly<Record<Interaction, number | null>>
  readonly memories: readonly Memory[]
  /** Reserved for permanent collectibles. No unlock rules in this phase. */
  readonly collectionIds: readonly string[]
  /** Data placeholder only; no autonomous territory behavior yet. */
  readonly territory: { readonly roomId: string; readonly preferredSpotId: string | null }
}
export interface TimeSettlement {
  readonly state: GameState
  readonly elapsedMs: number
  readonly appliedMs: number
  readonly skippedMs: number
  readonly clockRolledBack: boolean
}
export type Rejection = 'cooldown' | 'resting' | 'not-enough-energy' | 'not-enough-satiety' | 'clock-rollback' | 'unknown-interaction'
export type InteractionResult = {
  readonly state: GameState
  readonly settlement: TimeSettlement
} & ({ readonly ok: true } | { readonly ok: false; readonly reason: Rejection; readonly remainingMs?: number })
