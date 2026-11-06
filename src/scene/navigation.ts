import type { Point, Rect } from './furnitureLayout.ts'

export interface NavigationWorld {
  readonly floor: Rect
  readonly obstacles: readonly Rect[]
  readonly radius: number
  /** Allowed foot centres for visual containment; never expanded by collision radius. */
  readonly visualBounds?: Rect
}
const CLEARANCE = 0.01
const finiteRect = (rect: Rect) => [rect.x, rect.y, rect.width, rect.height].every(Number.isFinite) && rect.width > 0 && rect.height > 0
const expand = (rect: Rect, amount: number): Rect => ({ x: rect.x - amount, y: rect.y - amount, width: rect.width + amount * 2, height: rect.height + amount * 2 })
const inside = (point: Point, rect: Rect) => point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height
export const distance = (a: Point, b: Point) => Math.hypot(b.x - a.x, b.y - a.y)
export function navigationKey(world: NavigationWorld): string {
  return JSON.stringify([world.floor, world.obstacles, world.radius, world.visualBounds ?? null])
}
export function visuallySafePoint(point: Point, world: NavigationWorld): boolean {
  return !world.visualBounds || (finiteRect(world.visualBounds) && inside(point, world.visualBounds))
}
/** Sampling envelope only; obstacle collision remains an independent check. */
export function navigationFootBounds(world: NavigationWorld): Rect | null {
  if (!finiteRect(world.floor) || !Number.isFinite(world.radius) || world.radius < 0 || (world.visualBounds && !finiteRect(world.visualBounds))) return null
  const floor = expand(world.floor, -world.radius), visual = world.visualBounds ?? floor
  const x = Math.max(floor.x, visual.x), y = Math.max(floor.y, visual.y)
  const result = { x, y, width: Math.min(floor.x + floor.width, visual.x + visual.width) - x, height: Math.min(floor.y + floor.height, visual.y + visual.height) - y }
  return finiteRect(floor) && finiteRect(result) ? result : null
}
export function legalFootPoint(point: Point, world: NavigationWorld): boolean {
  return [point.x, point.y, world.radius].every(Number.isFinite) && world.radius >= 0
    && finiteRect(world.floor) && world.obstacles.every(finiteRect)
    && finiteRect(expand(world.floor, -world.radius)) && inside(point, expand(world.floor, -world.radius))
    && !world.obstacles.some(rect => inside(point, expand(rect, world.radius)))
    && visuallySafePoint(point, world)
}
/** Closed segment vs expanded AABB (slab test), including corners and tangencies. */
function intersects(a: Point, b: Point, rect: Rect): boolean {
  let lower = 0, upper = 1
  for (const axis of ['x', 'y'] as const) {
    const delta = b[axis] - a[axis], min = rect[axis], max = min + (axis === 'x' ? rect.width : rect.height)
    if (Math.abs(delta) < 1e-12) { if (a[axis] < min || a[axis] > max) return false }
    else {
      const t1 = (min - a[axis]) / delta, t2 = (max - a[axis]) / delta
      lower = Math.max(lower, Math.min(t1, t2)); upper = Math.min(upper, Math.max(t1, t2))
      if (lower > upper) return false
    }
  }
  return true
}
export function clearSegment(a: Point, b: Point, world: NavigationWorld): boolean {
  return legalFootPoint(a, world) && legalFootPoint(b, world)
    && !world.obstacles.some(rect => intersects(a, b, expand(rect, world.radius)))
}
/** Visibility graph + bounded Dijkstra; exact targets, no grid snapping or retries.
 * Expanded boxes conservatively contain the circular foot collision shape.
 */
export function planPath(start: Point, goal: Point, world: NavigationWorld): readonly Point[] | null {
  if (!legalFootPoint(start, world) || !legalFootPoint(goal, world) || world.obstacles.length > 64) return null
  const origin = { x: start.x, y: start.y }, destination = { x: goal.x, y: goal.y }
  if (clearSegment(start, goal, world)) return [origin, destination]
  const nodes: Point[] = [origin, destination]
  for (const obstacle of world.obstacles) {
    const rect = expand(obstacle, world.radius + CLEARANCE)
    for (const x of [rect.x, rect.x + rect.width]) for (const y of [rect.y, rect.y + rect.height]) {
      if (legalFootPoint({ x, y }, world)) nodes.push({ x, y })
    }
  }
  const costs = nodes.map(() => Infinity), previous = nodes.map(() => -1), visited = new Set<number>()
  costs[0] = 0
  for (let iteration = 0; iteration < nodes.length; iteration++) {
    let best = -1
    for (let i = 0; i < nodes.length; i++) if (!visited.has(i) && (best < 0 || costs[i] < costs[best])) best = i
    if (best < 0 || !Number.isFinite(costs[best])) return null
    if (best === 1) {
      const result: Point[] = []
      for (let i = best; i >= 0; i = previous[i]) result.unshift(nodes[i])
      return result
    }
    visited.add(best)
    for (let i = 0; i < nodes.length; i++) {
      if (visited.has(i) || !clearSegment(nodes[best], nodes[i], world)) continue
      const cost = costs[best] + distance(nodes[best], nodes[i])
      if (cost < costs[i]) { costs[i] = cost; previous[i] = best }
    }
  }
  return null
}
export function pathLength(path: readonly Point[]): number {
  return path.slice(1).reduce((sum, point, index) => sum + distance(path[index], point), 0)
}
