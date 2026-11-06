export type Version = 'v0.1' | 'v0.2' | 'v0.3' | 'v0.4' | 'v0.5+'
export type ContentStatus = 'candidate' | 'approved' | 'implemented' | 'disabled'
export type Category = 'general' | 'special' | 'furniture' | 'seasonal' | 'interaction'
export type Direction = 'left' | 'right'
export type Mood = 'relaxed' | 'curious' | 'sleepy' | 'playful' | 'not_interested'
export type Season = 'spring' | 'summer' | 'autumn' | 'winter'
export type ActionId = `G${number}` | `S${number}` | `F${number}` | `E${number}` | `I${number}`
export type EventId = Exclude<ActionId, `G${number}`>
export type AnimationId = string
export type PlayerAction = 'pet' | 'feed' | 'call' | 'play' | 'equip' | 'invite'
export interface ContentMetadata { readonly status: ContentStatus; readonly minVersion: Version }
export interface ContentCandidate extends ContentMetadata {
  readonly id: ActionId
  readonly label: string
  readonly category: Category
  readonly sourceAnimation: string
  readonly sourceCondition: string
  readonly diaryRecommendation: 'first_discovery' | 'none' | 'unspecified'
  readonly season?: Season
  readonly playerAction?: PlayerAction
  readonly interactionLabel?: string
}
export interface AnimationDefinition extends ContentMetadata {
  readonly id: AnimationId
  readonly frames: readonly string[]
  readonly fps: number
  readonly loop: boolean
  readonly playback: 'forward' | 'ping-pong'
  readonly canvas: { readonly width: number; readonly height: number }
  readonly anchor: { readonly x: number; readonly y: number }
  readonly facing: Direction
  readonly mirrorAllowed: boolean
  readonly fallbackAnimationId?: AnimationId
  readonly markers?: readonly { readonly frame: number; readonly key: string }[]
  readonly assetStatus: 'placeholder' | 'missing' | 'ready'
  readonly aliasOf?: AnimationId
  readonly legacyClipId?: string
}
export interface BehaviorDefinition extends ContentMetadata {
  readonly id: ActionId
  readonly label: string
  readonly category: Category
  readonly animationId: AnimationId
  readonly animationIds: readonly AnimationId[]
  readonly supportingArtIds: readonly string[]
  readonly furnitureAnchorRefs: readonly { readonly furnitureId: string; readonly anchorId: string }[]
  readonly presentation: { readonly source: string; readonly composition: 'unconfirmed' }
  readonly durationMs: { readonly min: number; readonly max: number }
  readonly baseWeight: number
  readonly interruptible: boolean
  readonly cooldownMs?: number
  readonly allowedFrom?: readonly ActionId[]
  readonly requiredTags?: readonly string[]
  readonly target?: 'none' | 'floor_point' | 'furniture_anchor' | 'player'
  readonly tuningStatus: 'unconfirmed' | 'confirmed'
}
export type EventTrigger =
  | { readonly kind: 'behavior_started' | 'behavior_completed'; readonly actionId: ActionId }
  | { readonly kind: 'player_action'; readonly action: PlayerAction }
  | { readonly kind: 'furniture_used' | 'furniture_placed'; readonly furnitureType: string }
  | { readonly kind: 'time_window'; readonly localHours: readonly [number, number] }
  | { readonly kind: 'season'; readonly season: Season }
  | { readonly kind: 'calendar'; readonly month: number; readonly dayFrom: number; readonly dayTo: number }
/** Year-independent calendar boundaries allow Dec -> Jan windows. No dates enabled yet. */
export interface CalendarWindow {
  readonly id: string
  readonly status: ContentStatus
  readonly start: { readonly month: number; readonly day: number }
  readonly end: { readonly month: number; readonly day: number }
}
export interface EventDefinition extends ContentMetadata {
  readonly id: EventId
  readonly label: string
  readonly category: Exclude<Category, 'general'>
  readonly behaviorId: ActionId
  readonly triggerAll?: readonly EventTrigger[]
  readonly triggerAny?: readonly EventTrigger[]
  readonly triggerStatus: 'unconfirmed' | 'confirmed'
  readonly conditions?: readonly string[]
  readonly weight: number
  readonly cooldownMs: number
  readonly maxOccurrencesPerLocalDay?: number
  readonly effectIds: readonly string[]
  readonly diaryId?: string
  readonly firstDiscoveryRewardId?: string
  readonly calendarWindowId?: string
  readonly accessoryIds?: readonly string[]
  readonly offlineEligible: boolean
  readonly tuningStatus: 'unconfirmed' | 'confirmed'
}
export interface FurnitureDefinition extends ContentMetadata {
  readonly id: string
  readonly label: string
  readonly type: string
  readonly zone: 'floor' | 'wall'
  readonly footprint: { readonly width: number; readonly height: number }
  readonly geometryStatus: 'unconfirmed' | 'confirmed'
  readonly anchors: readonly { readonly id: string; readonly x: number; readonly y: number; readonly facing?: Direction; readonly actionIds: readonly ActionId[] }[]
  readonly layer: 'behind_cat' | 'in_front_of_cat'
}
export interface AccessoryDefinition extends ContentMetadata {
  readonly id: string
  readonly label: string
  readonly slot: 'head' | 'neck' | 'body'
  readonly mode: 'overlay' | 'full_sprite'
  readonly artId: string
  readonly anchorId?: string
  readonly season?: Season
  readonly obtainable: 'shop' | 'event'
  readonly preferenceTag?: string
}
export interface DiaryDefinition extends ContentMetadata {
  readonly id: string
  readonly eventId: EventId
  readonly title: string
  readonly text: string
  readonly textStatus: 'draft' | 'approved'
  readonly imageId?: string
  readonly collectionMode: 'first_discovery' | 'milestone'
}
export interface ArtDefinition {
  readonly id: string
  readonly status: 'missing' | 'placeholder' | 'ready'
  readonly kind: 'accessory' | 'effect' | 'audio' | 'diary'
  readonly source: string | null
}
export interface RewardDefinition extends ContentMetadata {
  readonly id: string
  readonly currencyId: string
  readonly amount: number | null
}
export interface CurrencyDefinition { readonly id: string; readonly label: string | null; readonly tuningStatus: 'unconfirmed' | 'confirmed' }
export interface HandlerDefinition { readonly id: string; readonly status: 'unimplemented' | 'implemented'; readonly notes: string }
export interface CatalogBundle {
  readonly content: readonly ContentCandidate[]
  readonly animations: readonly AnimationDefinition[]
  readonly behaviors: readonly BehaviorDefinition[]
  readonly events: readonly EventDefinition[]
  readonly furniture: readonly FurnitureDefinition[]
  readonly accessories: readonly AccessoryDefinition[]
  readonly diaries: readonly DiaryDefinition[]
  readonly art: readonly ArtDefinition[]
  readonly rewards: readonly RewardDefinition[]
  readonly currencies: readonly CurrencyDefinition[]
  readonly predicates: readonly HandlerDefinition[]
  readonly effects: readonly HandlerDefinition[]
  readonly calendarWindows: readonly CalendarWindow[]
}

