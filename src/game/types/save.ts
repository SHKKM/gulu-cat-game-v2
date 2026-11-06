import type { ActionId, Direction, EventId, Mood, Season } from './catalog.ts'

/** New content save contract, NOT the legacy GameState schemaVersion:1 format. */
export interface GameSaveV1 {
  readonly schemaVersion: 1
  readonly savedAt: string
  readonly lastSettledAt: string
  readonly currency: number
  readonly discoveredEventIds: readonly EventId[]
  readonly diaryIds: readonly string[]
  readonly ownedAccessoryIds: readonly string[]
  readonly ownedFurnitureIds: readonly string[]
  readonly equippedAccessoryIds: readonly string[]
  readonly placedFurniture: readonly { readonly instanceId: string; readonly furnitureId: string; readonly zone: 'floor' | 'wall'; readonly x: number; readonly y: number }[]
  readonly currentCat?: { readonly actionId: ActionId; readonly x: number; readonly facing: Direction; readonly mood: Mood }
  readonly eventLastOccurredAt: Readonly<Record<string, string>>
  readonly eventDailyCount: Readonly<Record<string, { readonly localDate: string; readonly count: number }>>
  readonly lastDailyRewardDate?: string
}
export interface ContentSaveEnvelope { readonly format: 'gulu-content'; readonly data: GameSaveV1 }
export interface EventContext {
  readonly now: Date
  readonly localDate: string
  readonly season: Season
  readonly mood: Mood
  readonly currentBehaviorId: ActionId
  readonly furnitureTypes: ReadonlySet<string>
  readonly availableTargets: ReadonlySet<string>
}
export interface EventDecision { readonly eventId: EventId; readonly reason: string }
export type PredicateHandler = (context: EventContext, save: Readonly<GameSaveV1>) => boolean
export type EffectHandler = (context: EventContext, save: Readonly<GameSaveV1>, eventId: EventId) => GameSaveV1

export type GameSave = GameSaveV1
