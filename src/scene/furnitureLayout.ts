import { FURNITURE_CATALOG } from '../game/catalogs/furniture.ts'
import type { FurnitureDefinition } from '../game/types/catalog.ts'

export interface Point { readonly x: number; readonly y: number }
export interface Rect extends Point { readonly width: number; readonly height: number }
/** Room instances reference S1; all geometry here uses absolute room coordinates. */
export interface RoomFurniture extends Pick<FurnitureDefinition, 'type' | 'zone' | 'layer' | 'anchors'> {
  readonly id: string
  readonly catalogId?: string
  readonly label: string
  readonly artwork: 'window' | 'shelf' | 'plant' | 'cat-bed' | 'sofa' | 'rug'
  readonly position: Point
  readonly size: { readonly width: number; readonly height: number }
  readonly footprint: Rect
  readonly blocksMovement: boolean
  readonly assetId?: string
}
type Placement = Omit<RoomFurniture, 'type' | 'zone' | 'layer' | 'anchors'> & {
  readonly anchorPositions?: Readonly<Record<string, Point>>
}
function place(catalogId: string, placement: Placement): RoomFurniture {
  const definition = FURNITURE_CATALOG.find(item => item.id === catalogId)
  if (!definition) throw Error(`未知家具：${catalogId}`)
  const { anchorPositions = {}, ...instance } = placement
  return { ...instance, catalogId, type: definition.type, zone: definition.zone, layer: definition.layer,
    anchors: definition.anchors.map(anchor => {
      const position = anchorPositions[anchor.id]
      if (!position) throw Error(`缺少房間互動點：${anchor.id}`)
      return { ...anchor, ...position }
    }) }
}
export const FLOOR_AREA: Rect = { x: 12, y: 270, width: 366, height: 158 }
export const ROOM_FURNITURE: readonly RoomFurniture[] = [
  { id: 'window', label: '木框窗戶（占位）', artwork: 'window', type: 'window', zone: 'wall', layer: 'behind_cat', position: { x: 33, y: 49 }, size: { width: 133, height: 151 }, footprint: { x: 33, y: 49, width: 133, height: 151 }, blocksMovement: false, anchors: [] },
  { id: 'shelf', label: '小木架（占位）', artwork: 'shelf', type: 'wall-shelf', zone: 'wall', layer: 'behind_cat', position: { x: 247, y: 114 }, size: { width: 106, height: 64 }, footprint: { x: 247, y: 114, width: 106, height: 64 }, blocksMovement: false, anchors: [] },
  place('furniture.rug', { id: 'rug', label: '小地毯（占位）', artwork: 'rug', position: { x: 95, y: 345 }, size: { width: 206, height: 79 }, footprint: { x: 95, y: 345, width: 206, height: 79 }, blocksMovement: false, anchorPositions: { 'furniture.rug.main': { x: 198, y: 395 } } }),
  place('furniture.cat-bed', { id: 'cat-bed', label: '貓窩（占位）', artwork: 'cat-bed', position: { x: 15, y: 310 }, size: { width: 110, height: 70 }, footprint: { x: 22, y: 330, width: 88, height: 25 }, blocksMovement: true, anchorPositions: { 'furniture.cat-bed.main': { x: 100, y: 370 } } }),
  place('furniture.sofa', { id: 'sofa', label: '淡紫色沙發（占位）', artwork: 'sofa', position: { x: 285, y: 235 }, size: { width: 95, height: 110 }, footprint: { x: 291, y: 280, width: 82, height: 45 }, blocksMovement: true, anchorPositions: { 'furniture.sofa.main': { x: 310, y: 340 } } }),
  { id: 'plant', label: '小盆栽（占位）', artwork: 'plant', type: 'plant', zone: 'floor', layer: 'in_front_of_cat', position: { x: 330, y: 360 }, size: { width: 48, height: 65 }, footprint: { x: 340, y: 408, width: 25, height: 15 }, blocksMovement: true, anchors: [] },
]
export function containsPoint(rect: Rect, point: Point): boolean {
  return point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height
}
/** Data validation only: no routing or movement-engine changes. */
export function validateFurnitureLayout(items: readonly RoomFurniture[], size: { width: number; height: number }, floor: Rect): string[] {
  const issues: string[] = [], ids = new Set<string>(), anchors = new Set<string>()
  const validRect = (rect: Rect) => [rect.x, rect.y, rect.width, rect.height].every(Number.isFinite) && rect.width > 0 && rect.height > 0
  const inside = (outer: Rect, inner: Rect) => validRect(inner) && containsPoint(outer, inner) && containsPoint(outer, { x: inner.x + inner.width, y: inner.y + inner.height })
  const room = { x: 0, y: 0, ...size }
  if (!inside(room, floor)) issues.push('floor:invalid')
  for (const item of items) {
    if (!item.id || ids.has(item.id)) issues.push(`${item.id}:duplicate-id`)
    ids.add(item.id)
    if (!inside(room, { ...item.position, ...item.size })) issues.push(`${item.id}:art-bounds`)
    if (!inside(room, item.footprint) || (item.blocksMovement && (item.zone !== 'floor' || !inside(floor, item.footprint)))) issues.push(`${item.id}:footprint`)
    const definition = item.catalogId ? FURNITURE_CATALOG.find(entry => entry.id === item.catalogId) : undefined
    if (item.catalogId && (!definition || definition.type !== item.type || definition.zone !== item.zone || definition.layer !== item.layer)) issues.push(`${item.id}:catalog`)
    if (definition && (definition.anchors.length !== item.anchors.length || definition.anchors.some(source => !item.anchors.some(anchor => anchor.id === source.id)))) issues.push(`${item.id}:missing-anchor`)
    for (const anchor of item.anchors) {
      if (anchors.has(anchor.id)) issues.push(`${item.id}:duplicate-anchor`)
      anchors.add(anchor.id)
      if (![anchor.x, anchor.y].every(Number.isFinite) || !containsPoint(floor, anchor)) issues.push(`${anchor.id}:outside-floor`)
      if (items.some(obstacle => obstacle.blocksMovement && containsPoint(obstacle.footprint, anchor))) issues.push(`${anchor.id}:blocked`)
      const source = definition?.anchors.find(entry => entry.id === anchor.id)
      if (!source || source.actionIds.join() !== anchor.actionIds.join()) issues.push(`${anchor.id}:catalog`)
    }
  }
  return issues
}
