import { ROOM_FURNITURE } from './furnitureLayout.ts'

export const ROOM_SIZE = { width: 390, height: 440 } as const
export const SCENE_LAYERS = {
  background: 0, wall: 10, floor: 20, furniture: 30, character: 40, foreground: 50,
} as const
export type ArtworkKind = 'window' | 'shelf' | 'plant' | 'mat' | 'box' | 'rug' | 'cat-bed' | 'sofa' | 'character'
export interface SceneItem {
  id: string
  label: string
  kind: ArtworkKind
  x: number
  y: number
  width: number
  height: number
  layer: number
  assetId?: string
  /** Legacy preview URL; approved homepage art uses a manifest binding. */
  src?: string
}
// Derived compatibility views, never a second placement source.
export const roomItems: readonly SceneItem[] = [
  ...ROOM_FURNITURE.map(item => ({ id: item.id, label: item.label, kind: item.artwork,
    ...item.position, ...item.size, assetId: item.assetId,
    layer: item.zone === 'wall' ? SCENE_LAYERS.wall : item.layer === 'in_front_of_cat' ? SCENE_LAYERS.foreground : item.type === 'rug' ? SCENE_LAYERS.floor : SCENE_LAYERS.furniture })),
  { id: 'gulu', label: '咕嚕活動位置，正式角色素材待補', kind: 'character', x: 152, y: 261, width: 89, height: 112, layer: SCENE_LAYERS.character },
]
export const roomZones = {
  // Keep existing patrol bounds until P0-4 adopts the full floor.
  activity: { x: 133, y: 250, width: 149, height: 155 },
  furniture: ROOM_FURNITURE.filter(item => item.blocksMovement).map(item => ({ id: item.id, ...item.footprint })),
  interactionPoints: ROOM_FURNITURE.flatMap(item => item.anchors.map(anchor => ({ id: anchor.id, itemId: item.id, x: anchor.x, y: anchor.y }))),
} as const
