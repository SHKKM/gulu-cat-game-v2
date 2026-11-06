import { BEHAVIOR_CATALOG } from '../game/catalogs/behaviors.ts'
import { ANIMATION_CATALOG } from '../game/catalogs/animations.ts'
import type { ActionId, BehaviorDefinition } from '../game/types/catalog.ts'
import type { AnimationId } from './clips.ts'
import { BEHAVIOR_CONFIG as C } from './behaviorConfig.ts'

/** Implementation registry, not another event catalog. All labels/animation IDs come from S1. */
export const V01_IMPLEMENTATIONS: Readonly<Partial<Record<ActionId, { mode: AnimationId; role: 'main' | 'micro' | 'transition' }>>> = {
  G01: { mode: 'idle', role: 'main' }, G02: { mode: 'rest', role: 'main' }, G03: { mode: 'idle', role: 'main' },
  G04: { mode: 'idle', role: 'micro' }, G07: { mode: 'walk', role: 'main' }, G08: { mode: 'turn', role: 'transition' },
  G09: { mode: 'walk', role: 'main' }, G11: { mode: 'stretch', role: 'main' }, G13: { mode: 'sleep', role: 'main' },
}
type Tuning = Pick<BehaviorDefinition, 'durationMs' | 'baseWeight' | 'cooldownMs' | 'interruptible' | 'requiredTags' | 'allowedFrom'>
const tune = (baseWeight: number, min: number, max: number, cooldownMs: number, interruptible: boolean, requiredTags: readonly string[] = [], allowedFrom?: readonly ActionId[]): Tuning => ({ baseWeight, durationMs: { min, max }, cooldownMs, interruptible, requiredTags, ...(allowedFrom ? { allowedFrom } : {}) })
/** PROVISIONAL TEST PROFILE. These are not confirmed balancing values or S1 master edits. */
export const V01_TEST_TUNING: Readonly<Partial<Record<ActionId, Tuning>>> = {
  G01: tune(15, ...C.durationMs.idle, 0, true),
  G02: tune(30, ...C.durationMs.rest, 10_000, true, ['stationary']),
  G03: tune(20, ...C.durationMs.idle, 0, true),
  G04: tune(1, 500, 1000, 5000, true, ['stationary', 'awake'], ['G01', 'G02', 'G03']),
  G07: tune(5, 1000, 90_000, 5000, true, ['awake', 'walkable_floor', 'motion_allowed']),
  G08: tune(0, C.turnMs, C.turnMs, 0, false, ['awake', 'walkable_floor', 'motion_allowed']),
  G09: tune(8, 1000, 90_000, 15_000, true, ['awake', 'walkable_floor', 'motion_allowed']),
  G11: tune(2, C.stretchMs, C.stretchMs, 30_000, false, ['stationary'], ['G01', 'G02', 'G03', 'G13']),
  G13: tune(20, ...C.durationMs.sleep, 120_000, false, ['stationary']),
}
export interface BehaviorPolicy {
  readonly profileId: string
  readonly version: 'v0.1'
  readonly definitions: readonly BehaviorDefinition[]
  readonly idleWaitMs: number
}
export interface BehaviorConditions { readonly from: ActionId | null; readonly tags: ReadonlySet<string> }
export function createV01BehaviorPolicy(source: readonly BehaviorDefinition[] = BEHAVIOR_CATALOG, tuning = V01_TEST_TUNING): BehaviorPolicy {
  return { profileId: 'v0.1-provisional-test', version: 'v0.1', idleWaitMs: C.durationMs.idle[0],
    definitions: source.filter(row => V01_IMPLEMENTATIONS[row.id] && tuning[row.id]).map<BehaviorDefinition>(row => {
      const settings = row.tuningStatus === 'confirmed' ? row : tuning[row.id]!
      const sourceFrom = row.allowedFrom, testFrom = settings.allowedFrom
      const allowedFrom = sourceFrom && testFrom ? sourceFrom.filter(id => testFrom.includes(id)) : sourceFrom ?? testFrom
      return { ...row, ...settings,
        requiredTags: [...new Set([...(row.requiredTags ?? []), ...(settings.requiredTags ?? [])])],
        ...(allowedFrom ? { allowedFrom } : {}),
        // Code availability enables only these nine IDs; source disabling always wins.
        status: row.status === 'disabled' ? 'disabled' : 'implemented',
        tuningStatus: row.tuningStatus === 'confirmed' ? 'confirmed' : 'unconfirmed',
      }
    }) }
}
export const V01_BEHAVIOR_POLICY = createV01BehaviorPolicy()
export function behaviorEligible(definition: BehaviorDefinition, conditions: BehaviorConditions, cooldowns: Readonly<Record<string, number>>, now: number): boolean {
  return !!V01_IMPLEMENTATIONS[definition.id] && definition.status === 'implemented' && definition.minVersion === 'v0.1'
    && ANIMATION_CATALOG.some(animation => animation.id === definition.animationId)
    && Number.isFinite(definition.baseWeight) && definition.baseWeight >= 0
    && Number.isFinite(definition.durationMs.min) && definition.durationMs.min > 0 && Number.isFinite(definition.durationMs.max) && definition.durationMs.max >= definition.durationMs.min
    && Number.isFinite(definition.cooldownMs ?? 0) && (definition.cooldownMs ?? 0) >= 0
    && now >= (cooldowns[definition.id] ?? 0)
    && (!definition.allowedFrom || (!!conditions.from && definition.allowedFrom.includes(conditions.from)))
    && (definition.requiredTags ?? []).every(tag => conditions.tags.has(tag))
}
export function chooseCatalogBehavior(policy: BehaviorPolicy, conditions: BehaviorConditions, cooldowns: Readonly<Record<string, number>>, now: number, random: () => number): BehaviorDefinition | null {
  const choices = policy.definitions.filter(definition => V01_IMPLEMENTATIONS[definition.id]?.role === 'main' && definition.baseWeight > 0 && behaviorEligible(definition, conditions, cooldowns, now))
  const total = choices.reduce((sum, definition) => sum + definition.baseWeight, 0)
  if (!Number.isFinite(total) || total <= 0) return null
  const value = random(), unit = Number.isFinite(value) ? Math.max(0, Math.min(.999999, value)) : .5
  let ticket = unit * total
  for (const choice of choices) { ticket -= choice.baseWeight; if (ticket < 0) return choice }
  return null
}
