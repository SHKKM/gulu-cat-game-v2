import { HOME_SCENE_HANDOFF as home } from './installedHomeData.ts'
import { ROOM_FURNITURE } from './furnitureLayout.ts'
import type { RoomFurniture, Rect } from './furnitureLayout.ts'
import { roomItems } from './roomLayout.ts'
import type { SceneItem } from './roomLayout.ts'

/** Exact package values. S2's original specification remains immutable for G04 snapshots. */
export const INSTALLED_HOME = home
/** Foot-centre limits measured against the installed day background in P0-7B-F1. */
export const HOME_NAVIGATION_VISUAL_BOUNDS: Readonly<Rect> = Object.freeze({ x: 80, y: 313, width: 230, height: 107 })
export const HOME_NAVIGATION_OBSTACLES: readonly Rect[] = [
  ...home.physics.collisions.sofa, ...home.physics.collisions['cat-bed'], home.physics.collisions.plant,
]
export const HOME_ITEMS: readonly SceneItem[] = [
  ...home.objects.filter(o => o.id !== 'background.day').map(o => {
    const base = roomItems.find(item => item.id === o.id)!
    return { ...base, label: `${o.id}（正式素材）`, ...o.displayRect, layer: o.renderLayer, assetId: o.assetId }
  }),
  roomItems.find(item => item.kind === 'character')!,
]
export const HOME_FURNITURE: readonly RoomFurniture[] = ROOM_FURNITURE.map(base => {
  const source = home.objects.find(o => o.id === base.id)!, point = home.physics.approaches[base.id as keyof typeof home.physics.approaches]
  return { ...base, label: `${base.id}（正式素材）`, assetId: source.assetId,
    position: { x: source.displayRect.x, y: source.displayRect.y }, size: { width: source.displayRect.width, height: source.displayRect.height },
    // Keep S1 identities/actions. Legacy footprint is reference-only; navigation uses exact contour arrays.
    anchors: base.anchors.map(anchor => ({ ...anchor, ...(point ?? {}) })),
  }
})
export const HOME_ZONES = {
  activity: home.physics.world.visualBounds,
  furniture: HOME_NAVIGATION_OBSTACLES.map((rect, index) => ({ id: `home-v3-contour-${index + 1}`, ...rect })),
  interactionPoints: HOME_FURNITURE.flatMap(item => item.anchors.map(anchor => ({ id: anchor.id, itemId: item.id, x: anchor.x, y: anchor.y }))),
}
