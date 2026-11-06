import { ROOM_SIZE } from './roomLayout.ts'
import type { SceneItem } from './roomLayout.ts'
import { HOME_ITEMS, HOME_FURNITURE, HOME_ZONES, HOME_NAVIGATION_OBSTACLES, HOME_NAVIGATION_VISUAL_BOUNDS, INSTALLED_HOME } from './installedHome.ts'
import type { Rect, RoomFurniture } from './furnitureLayout.ts'

export interface RoomDefinition {
  readonly id: string
  readonly label: string
  readonly subtitle: string
  readonly assetStatus: 'placeholder' | 'approved'
  readonly size: { readonly width: number; readonly height: number }
  readonly items: readonly SceneItem[]
  readonly furniture: readonly RoomFurniture[]
  readonly floorArea: Rect
  /** Installed contour geometry; absent for legacy/demo rooms. */
  readonly navigationObstacles?: readonly Rect[]
  /** Optional foot-centre envelope, separate from the physical/rendering floor. */
  readonly navigationVisualBounds?: Rect
  readonly zones: {
    readonly activity: { readonly x: number; readonly y: number; readonly width: number; readonly height: number }
    readonly furniture: readonly { readonly id: string; readonly x: number; readonly y: number; readonly width: number; readonly height: number }[]
    readonly interactionPoints: readonly { readonly id: string; readonly itemId: string; readonly x: number; readonly y: number }[]
  }
}
/** One room only. A data boundary for future rooms, not a room-switching system. */
export const INITIAL_ROOM: RoomDefinition = {
  id: 'cozy-room', label: '咕嚕的小屋', subtitle: '一點平凡，一點可愛。',
  assetStatus: 'approved', size: ROOM_SIZE, items: HOME_ITEMS, zones: HOME_ZONES,
  furniture: HOME_FURNITURE, floorArea: INSTALLED_HOME.physics.world.floor, navigationObstacles: HOME_NAVIGATION_OBSTACLES,
  navigationVisualBounds: HOME_NAVIGATION_VISUAL_BOUNDS,
}
export const ROOM_DEFINITIONS: readonly RoomDefinition[] = [INITIAL_ROOM]

