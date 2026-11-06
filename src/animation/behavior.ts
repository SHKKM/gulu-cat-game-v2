import { BEHAVIOR_CONFIG as C } from './behaviorConfig.ts'
import type { AnimationId, Facing } from './clips.ts'
import { clearSegment, distance, navigationFootBounds, navigationKey, pathLength, planPath } from '../scene/navigation.ts'
import type { NavigationWorld } from '../scene/navigation.ts'
import type { Point } from '../scene/furnitureLayout.ts'

import { behaviorEligible, chooseCatalogBehavior, V01_IMPLEMENTATIONS } from './v01BehaviorPolicy.ts'
import type { BehaviorConditions, BehaviorPolicy } from './v01BehaviorPolicy.ts'
import type { ActionId, BehaviorDefinition } from '../game/types/catalog.ts'
import { legalFootPoint } from '../scene/navigation.ts'

export interface CatalogBehaviorState {
  readonly profileId: string
  readonly sequence: number
  readonly primary: { readonly id: ActionId; readonly animationId: string; readonly startedAt: number; readonly durationMs: number } | null
  readonly cooldownUntil: Readonly<Record<string, number>>
  readonly pendingMoveId: ActionId | null
  readonly microSequence: number
  readonly micro: { readonly id: ActionId; readonly animationId: string; readonly startedAt: number; readonly durationMs: number; readonly sequence: number } | null
}
export interface PatrolBounds { minX: number; maxX: number; floorY: number }
export interface BehaviorState {
  readonly catalog?: CatalogBehaviorState
  readonly mode: AnimationId
  readonly enteredAt: number
  readonly durationMs: number
  readonly x: number
  readonly y: number
  readonly startX: number
  readonly targetX: number | null
  readonly targetY: number | null
  readonly route: { readonly points: readonly Point[]; readonly index: number; readonly worldKey: string } | null
  readonly updatedAt: number
  readonly facing: Facing
  readonly nextFacing: Facing | null
  readonly sequence: number
  readonly source: 'autonomous' | 'core'
  readonly eventId: string
  readonly interactionPointId: string | null
}
export interface BehaviorInput {
  bounds: PatrolBounds
  policy?: BehaviorPolicy
  behaviorTags?: ReadonlySet<string>
  random?: Random
  minimumAnimationMs?: Readonly<Record<string, number>>
  /** Published Blink waits for the existing CanvasSprite completion, on this same state machine. */
  microPlayback?: { available: boolean; completedSequence: number }
  requestPriority?: 'ordinary' | 'important'
  moveActionId?: ActionId
  navigation?: NavigationWorld
  /** A future important S1 behavior can hold this false without a second scheduler. */
  interruptible?: boolean
  coreResting?: boolean
  reducedMotion?: boolean
  minimumDurationMs?: Readonly<Partial<Record<AnimationId, number>>>
}
export type Random = () => number
const random = (rng: Random) => { const n = rng(); return Number.isFinite(n) ? Math.max(0, Math.min(0.999999, n)) : 0.5 }
const clamp = (x: number, bounds: PatrolBounds) => Math.max(bounds.minX, Math.min(bounds.maxX, x))
function duration(mode: 'idle' | 'rest' | 'sleep', rng: Random): number {
  const [min, max] = C.durationMs[mode]
  return min + random(rng) * (max - min)
}
function enter(state: BehaviorState, mode: AnimationId, now: number, durationMs: number, extra: Partial<BehaviorState> = {}): BehaviorState {
  return { ...state, mode, enteredAt: now, updatedAt: now, durationMs, startX: state.x, targetX: null, targetY: null, route: null, nextFacing: null,
    sequence: state.sequence + 1, source: 'autonomous', eventId: `gulu.${mode}`, interactionPointId: null, ...extra }
}
export function createBehavior(now: number, bounds: PatrolBounds, initialX: number, rng: Random = Math.random, initialY = bounds.floorY): BehaviorState {
  return { mode: 'idle', enteredAt: now, updatedAt: now, durationMs: duration('idle', rng), x: clamp(initialX, bounds), y: initialY,
    startX: clamp(initialX, bounds), targetX: null, targetY: null, route: null, facing: 'right', nextFacing: null, sequence: 0,
    source: 'autonomous', eventId: 'gulu.idle', interactionPointId: null }
}
function beginWalk(state: BehaviorState, now: number, target: number, facing: Facing): BehaviorState {
  return enter(state, 'walk', now, Math.abs(target - state.x) / C.walkSpeed * 1000, { targetX: target, facing })
}
/** Replace an ordinary route from the current position; never relocate the character.
 * Invalid/unreachable requests cancel ordinary walking once, with a full idle dwell.
 */
export function requestMove(state: BehaviorState, now: number, target: Point, input: BehaviorInput, rng: Random = input.random ?? Math.random): BehaviorState {
  if (!input.navigation || !Number.isFinite(now) || now < state.updatedAt || input.interruptible === false || (!input.policy && input.coreResting) || input.reducedMotion || (!input.policy && state.source === 'core')
    || !(['idle', 'rest', 'walk'].includes(state.mode) || (state.mode === 'turn' && state.route))) return state
  if (input.policy) {
    if (!state.catalog || assessCatalogInterruption(state, now, input, input.requestPriority) !== 'accept') return state
    const definition = input.policy.definitions.find(row => row.id === (input.moveActionId ?? 'G07'))
    if (!definition || V01_IMPLEMENTATIONS[definition.id]?.mode !== 'walk' || !behaviorEligible(definition, catalogConditions(state, input), state.catalog.cooldownUntil, now)) return state
  }
  const path = planPath(state, target, input.navigation)
  if (!path || pathLength(path) < 0.001) return enter(state, 'idle', now, duration('idle', rng))
  const facing: Facing = Math.abs(path[1].x - state.x) < 0.001 ? state.facing : path[1].x < state.x ? 'left' : 'right'
  const turning = facing !== state.facing
  const requested = enter(state, turning ? 'turn' : 'walk', now, turning ? C.turnMs : pathLength(path) / C.walkSpeed * 1000, {
    targetX: target.x, targetY: target.y,
    route: { points: path, index: 1, worldKey: navigationKey(input.navigation) },
    facing: turning ? state.facing : facing, nextFacing: turning ? facing : null,
  })
  return input.policy ? annotateMovement(requested, now, input, rng) : requested
}
function advanceRoute(state: BehaviorState, now: number, input: BehaviorInput, rng: Random): BehaviorState {
  const world = input.navigation!, route = state.route!
  if (route.worldKey !== navigationKey(world)) {
    const path = planPath(state, { x: state.targetX!, y: state.targetY! }, world)
    if (!path) return enter(state, 'idle', now, duration('idle', rng))
    // Replan at the current foot point. No movement occurs during this step.
    return { ...state, updatedAt: now, route: { points: path, index: 1, worldKey: navigationKey(world) } }
  }
  if (state.mode === 'turn') {
    const minimum = input.minimumDurationMs?.turn ?? 0
    if (now - state.enteredAt < Math.max(C.turnMs, Number.isFinite(minimum) ? minimum : 0)) return { ...state, updatedAt: now }
    return enter(state, 'walk', now, pathLength(route.points) / C.walkSpeed * 1000, { route, targetX: state.targetX, targetY: state.targetY, facing: state.nextFacing ?? state.facing })
  }
  const waypoint = route.points[route.index]
  if (!waypoint || !clearSegment(state, waypoint, world)) return enter(state, 'idle', now, duration('idle', rng))
  const length = distance(state, waypoint), step = Math.min(length, C.walkSpeed * Math.min(C.maxVisualDeltaMs, Math.max(0, now - state.updatedAt)) / 1000)
  const fraction = length > 0 ? step / length : 1
  const point = { x: state.x + (waypoint.x - state.x) * fraction, y: state.y + (waypoint.y - state.y) * fraction }
  const facing = Math.abs(waypoint.x - state.x) < 0.001 ? state.facing : waypoint.x < state.x ? 'left' : 'right'
  const reached = step >= length
  const next = { ...state, ...point, facing, updatedAt: now }
  if (reached && route.index === route.points.length - 1) return enter(next, 'idle', now, duration('idle', rng))
  // Never cut across a corner: stop exactly on each waypoint before the next leg.
  return { ...next, route: reached ? { ...route, index: route.index + 1 } : route }
}
/** Pure finite-state machine. No DOM, animation loading or gameplay-stat changes. */
export function stepBehavior(inputState: BehaviorState, now: number, input: BehaviorInput, rng: Random = input.random ?? Math.random): BehaviorState {
  if (!Number.isFinite(now) || now < inputState.updatedAt) return inputState
  if (input.policy) return stepCatalogBehavior(inputState, now, input, rng)
  const state = input.navigation ? inputState : { ...inputState, x: clamp(inputState.x, input.bounds), y: input.bounds.floorY }
  if (input.coreResting) return state.source === 'core' ? { ...state, updatedAt: now }
    : enter(state, 'rest', now, 0, { source: 'core', eventId: 'core.rest', interactionPointId: null })
  if (state.source === 'core') return enter(state, 'stretch', now, C.stretchMs, { eventId: 'gulu.wake-stretch' })
  if (input.reducedMotion && (state.mode === 'walk' || state.mode === 'turn')) return enter(state, 'idle', now, duration('idle', rng))
  if (input.navigation && state.route) return advanceRoute(state, now, input, rng)
  if (input.interruptible === false) return { ...state, updatedAt: now }
  const elapsed = now - state.enteredAt
  if (state.mode === 'walk' && state.targetX !== null) {
    const progress = Math.min(1, elapsed / Math.max(1, state.durationMs))
    const x = clamp(state.startX + (state.targetX - state.startX) * progress, input.bounds)
    return progress < 1 ? { ...state, x, updatedAt: now } : enter({ ...state, x }, 'idle', now, duration('idle', rng))
  }
  const configuredMinimum = input.minimumDurationMs?.[state.mode] ?? 0
  const minimum = Number.isFinite(configuredMinimum) && configuredMinimum > 0 ? configuredMinimum : 0
  if (elapsed < Math.max(state.durationMs, minimum)) return { ...state, updatedAt: now }
  if (state.mode === 'sleep') return enter(state, 'stretch', now, C.stretchMs, { eventId: 'gulu.wake-stretch' })
  if (state.mode === 'turn' && state.targetX !== null && state.nextFacing) return beginWalk(state, now, state.targetX, state.nextFacing)
  if (state.mode === 'stretch' || state.mode === 'rest') return enter(state, 'idle', now, duration('idle', rng))
  const choices = (Object.entries(C.weights) as [keyof typeof C.weights, number][]).filter(([mode]) => !(input.reducedMotion && mode === 'walk'))
  let ticket = random(rng) * choices.reduce((sum, [, weight]) => sum + weight, 0)
  let next: keyof typeof C.weights = 'idle'
  for (const [mode, weight] of choices) { ticket -= weight; if (ticket < 0) { next = mode; break } }
  if (next !== 'walk') return enter(state, next, now, duration(next, rng))
  if (input.navigation) return requestAutonomousMove(state, now, input, rng)
  let target = input.bounds.minX + random(rng) * (input.bounds.maxX - input.bounds.minX)
  if (Math.abs(target - state.x) < C.minimumTravel) target = state.x < (input.bounds.minX + input.bounds.maxX) / 2 ? input.bounds.maxX : input.bounds.minX
  target = clamp(target, input.bounds)
  if (Math.abs(target - state.x) < 1) return enter(state, 'idle', now, duration('idle', rng))
  const facing: Facing = target < state.x ? 'left' : 'right'
  return facing !== state.facing
    ? enter(state, 'turn', now, C.turnMs, { targetX: target, nextFacing: facing })
    : beginWalk(state, now, target, facing)
}


/** Same target selection and P0-4 route engine, shared by legacy and catalog decisions. */
function requestAutonomousMove(state: BehaviorState, now: number, input: BehaviorInput, rng: Random): BehaviorState {
  const world = input.navigation!
  const envelope = navigationFootBounds(world)
  if (!envelope) return enter(state, 'idle', now, duration('idle', rng))
  for (let attempt = 0; attempt < C.targetAttempts; attempt++) {
    const target = { x: envelope.x + random(rng) * envelope.width, y: envelope.y + random(rng) * envelope.height }
    if (distance(state, target) < C.minimumTravel || !planPath(state, target, world)) continue
    return requestMove(state, now, target, input, rng)
  }
  return enter(state, 'idle', now, duration('idle', rng))
}
function catalogConditions(state: BehaviorState, input: BehaviorInput): BehaviorConditions {
  const tags = new Set<string>()
  if (state.mode !== 'sleep') tags.add('awake')
  if (!state.route && state.mode !== 'turn') tags.add('stationary')
  if (input.navigation && legalFootPoint(state, input.navigation)) tags.add('walkable_floor')
  if (!input.reducedMotion) tags.add('motion_allowed')
  return { from: state.catalog?.primary?.id ?? null, tags: input.behaviorTags ?? tags }
}
function animationMinimum(definition: BehaviorDefinition | undefined, input: BehaviorInput): number {
  if (!definition) return 0
  const mode = V01_IMPLEMENTATIONS[definition.id]?.mode
  const value = input.minimumAnimationMs?.[definition.animationId] ?? (mode ? input.minimumDurationMs?.[mode] : 0) ?? 0
  return Number.isFinite(value) && value > 0 ? value : 0
}
function catalogDuration(definition: BehaviorDefinition, input: BehaviorInput, rng: Random): number {
  return Math.max(animationMinimum(definition, input), definition.durationMs.min + random(rng) * (definition.durationMs.max - definition.durationMs.min))
}
function finishCatalogAction(state: BehaviorState, now: number, input: BehaviorInput): BehaviorState {
  const metadata = state.catalog!, cooldownUntil = { ...metadata.cooldownUntil }
  for (const action of [metadata.primary, metadata.micro]) {
    if (!action) continue
    const definition = input.policy!.definitions.find(row => row.id === action.id)
    cooldownUntil[action.id] = now + (definition?.cooldownMs ?? 0)
  }
  return { ...state, catalog: { ...metadata, cooldownUntil, micro: null, pendingMoveId: null } }
}
function enterCatalogAction(state: BehaviorState, definition: BehaviorDefinition, now: number, input: BehaviorInput, rng: Random, fixedDuration?: number): BehaviorState {
  const metadata = state.catalog!, mode = V01_IMPLEMENTATIONS[definition.id]!.mode
  const durationMs = Math.max(animationMinimum(definition, input), fixedDuration ?? catalogDuration(definition, input, rng))
  const next = enter(state, mode, now, durationMs)
  return { ...next, sequence: state.mode === mode && metadata.primary?.id === definition.id && !state.route ? state.sequence : next.sequence,
    catalog: { ...metadata, sequence: metadata.sequence + 1, primary: { id: definition.id, animationId: definition.animationId, startedAt: now, durationMs }, pendingMoveId: null, micro: null } }
}
function safeCatalogIdle(state: BehaviorState, now: number, input: BehaviorInput): BehaviorState {
  return { ...enter(state, 'idle', now, input.policy!.idleWaitMs), catalog: { ...state.catalog!, primary: null, sequence: state.catalog!.sequence + 1, pendingMoveId: null, micro: null } }
}
export function initializeCatalogBehavior(state: BehaviorState, now: number, input: BehaviorInput, rng: Random = input.random ?? Math.random): BehaviorState {
  if (!input.policy || state.catalog) return state
  const initial = { ...state, catalog: { profileId: input.policy.profileId, sequence: 0, primary: null, cooldownUntil: {}, micro: null, pendingMoveId: null, microSequence: 0 } as CatalogBehaviorState }
  const blink = input.policy.definitions.find(row => row.id === 'G04')
  const seeded = { ...initial, catalog: { ...initial.catalog, cooldownUntil: { G04: now + (blink?.cooldownMs ?? 0) } } }
  const idle = input.policy.definitions.find(row => row.id === 'G03' && behaviorEligible(row, catalogConditions(seeded, input), seeded.catalog.cooldownUntil, now))
    ?? input.policy.definitions.find(row => row.id === 'G01' && behaviorEligible(row, catalogConditions(seeded, input), seeded.catalog.cooldownUntil, now))
  return idle ? enterCatalogAction(seeded, idle, now, input, rng) : safeCatalogIdle(seeded, now, input)
}
/** Future invitations may queue a deferred important request; no invitation/event is started here. */
export function assessCatalogInterruption(state: BehaviorState, now: number, input: BehaviorInput, priority: 'ordinary' | 'important' = 'ordinary'): 'accept' | 'defer' | 'reject' {
  if (input.interruptible === false) return priority === 'important' ? 'defer' : 'reject'
  if (blinkPlaybackPending(state, now, input)) return priority === 'important' ? 'defer' : 'reject'
  const primary = state.catalog?.primary
  if (!primary) return 'accept'
  const definition = input.policy?.definitions.find(row => row.id === primary.id)
  if (!definition || !V01_IMPLEMENTATIONS[primary.id]) return 'reject'
  if (!definition.interruptible && now < primary.startedAt + Math.max(primary.durationMs, animationMinimum(definition, input))) return priority === 'important' ? 'defer' : 'reject'
  return 'accept'
}
function annotateMovement(state: BehaviorState, now: number, input: BehaviorInput, rng: Random): BehaviorState {
  const moveId = input.moveActionId ?? 'G07'
  const id = state.mode === 'turn' ? 'G08' : moveId
  const definition = input.policy!.definitions.find(row => row.id === id)
  if (!definition || !behaviorEligible(definition, catalogConditions(state, input), state.catalog!.cooldownUntil, now)) return safeCatalogIdle(state, now, input)
  const metadata = state.catalog!
  const durationMs = state.mode === 'turn' ? catalogDuration(definition, input, rng) : Math.max(definition.durationMs.min, state.durationMs, animationMinimum(definition, input))
  if (state.mode === 'walk' && state.durationMs > definition.durationMs.max) return safeCatalogIdle(state, now, input)
  return { ...state, durationMs, catalog: { ...metadata, sequence: metadata.sequence + 1,
    primary: { id, animationId: definition.animationId, startedAt: now, durationMs }, micro: null, pendingMoveId: state.mode === 'turn' ? moveId : null } }
}
function blinkPlaybackPending(state: BehaviorState, now: number, input: BehaviorInput): boolean {
  const micro = state.catalog?.micro, playback = input.microPlayback
  return !!micro && !!playback?.available && (now < micro.startedAt + micro.durationMs || playback.completedSequence !== micro.sequence)
}
function stepCatalogMicro(state: BehaviorState, now: number, input: BehaviorInput, rng: Random): BehaviorState {
  const metadata = state.catalog!, definition = input.policy!.definitions.find(row => row.id === 'G04')
  if (metadata.micro) {
    if (input.microPlayback ? blinkPlaybackPending(state, now, input) : now < metadata.micro.startedAt + metadata.micro.durationMs) return state
    return { ...state, catalog: { ...metadata, micro: null, cooldownUntil: { ...metadata.cooldownUntil, G04: now + (definition?.cooldownMs ?? 0) } } }
  }
  // G04 is sitting blink artwork: never overlay prone Rest, moving, protected, or unlicensed left Idle.
  if (state.mode !== 'idle' || state.facing !== 'right' || state.route || !['G01', 'G03'].includes(metadata.primary?.id ?? '') || input.microPlayback?.available === false) return state
  if (!metadata.primary || !definition || definition.baseWeight <= 0 || !behaviorEligible(definition, catalogConditions(state, input), metadata.cooldownUntil, now)) return state
  const remaining = metadata.primary.startedAt + metadata.primary.durationMs - now
  const length = Math.max(definition.durationMs.min, animationMinimum(definition, input))
  if (remaining < length) return state
  const sequence = metadata.microSequence + 1
  return { ...state, catalog: { ...metadata, microSequence: sequence, micro: { id: definition.id, animationId: definition.animationId, startedAt: now, durationMs: Math.min(remaining, catalogDuration(definition, input, rng)), sequence } } }
}
function decideCatalogBehavior(state: BehaviorState, now: number, input: BehaviorInput, rng: Random): BehaviorState {
  const completed = finishCatalogAction(state, now, input), conditions = catalogConditions(completed, input)
  const waking = completed.catalog!.primary?.id === 'G13' ? input.policy!.definitions.find(row => row.id === 'G11' && behaviorEligible(row, conditions, completed.catalog!.cooldownUntil, now)) : undefined
  const definition = waking ?? chooseCatalogBehavior(input.policy!, conditions, completed.catalog!.cooldownUntil, now, rng)
  if (!definition) return safeCatalogIdle(completed, now, input)
  if (V01_IMPLEMENTATIONS[definition.id]?.mode === 'walk') {
    const ready = { ...completed, mode: 'idle' as const }
    const moved = requestAutonomousMove(ready, now, { ...input, moveActionId: definition.id }, rng)
    return moved.route ? moved : safeCatalogIdle(completed, now, input)
  }
  return enterCatalogAction(completed, definition, now, input, rng)
}
function stepCatalogBehavior(inputState: BehaviorState, now: number, input: BehaviorInput, rng: Random): BehaviorState {
  let state = initializeCatalogBehavior(inputState, now, input, rng)
  const primary = state.catalog!.primary
  if (input.interruptible === false) return { ...state, updatedAt: now }
  if (state.catalog!.micro && input.microPlayback) {
    state = stepCatalogMicro(state, now, input, rng)
    if (state.catalog!.micro) return { ...state, updatedAt: now }
  }
  if (state.route) {
    if (!input.navigation || input.reducedMotion) return safeCatalogIdle(finishCatalogAction(state, now, input), now, input)
    const minimum = primary?.id === 'G08' ? primary.durationMs : 0
    const advanced = advanceRoute(state, now, { ...input, minimumDurationMs: { ...input.minimumDurationMs, turn: Math.max(input.minimumDurationMs?.turn ?? 0, minimum) } }, rng)
    if (primary?.id === 'G08' && advanced.mode === 'walk') {
      const pending = state.catalog!.pendingMoveId
      state = finishCatalogAction(advanced, now, input)
      return pending ? annotateMovement(state, now, { ...input, moveActionId: pending }, rng) : safeCatalogIdle(state, now, input)
    }
    if (advanced.route) return advanced
    if (primary && now < primary.startedAt + primary.durationMs) return { ...advanced, mode: state.mode, enteredAt: state.enteredAt, durationMs: state.durationMs, sequence: state.sequence }
    return decideCatalogBehavior(advanced, now, input, rng)
  }
  const deadline = primary ? primary.startedAt + Math.max(primary.durationMs, animationMinimum(input.policy!.definitions.find(row => row.id === primary.id)!, input)) : state.enteredAt + state.durationMs
  if (now < deadline) return { ...stepCatalogMicro(state, now, input, rng), updatedAt: now }
  return decideCatalogBehavior(state, now, input, rng)
}
