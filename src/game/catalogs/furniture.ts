import type { ActionId, FurnitureDefinition } from '../types/catalog.ts'
import { CONTENT_CATALOG } from './content.ts'
import { CATALOG_DRAFT_CONFIG as D } from './config.ts'

export const FURNITURE_ACTION_TYPES: Readonly<Partial<Record<ActionId, string>>> = {
  F01: 'sleep-mat', F02: 'cat-bed', F03: 'blanket', F04: 'sofa', F05: 'cardboard-box',
  F06: 'rug', F07: 'window-ledge', F08: 'cat-tree', F09: 'scratch-board', F10: 'teaser-wand',
  F11: 'ball', F12: 'toy-mouse', F13: 'tunnel', F14: 'small-table', F15: 'low-cabinet',
  F16: 'curtain', F17: 'food-bowl', F18: 'water-bowl', F19: 'pillow',
}
// F20 is a generic newly-placed-furniture reaction, not a twentieth furniture product.
export const FURNITURE_CATALOG: readonly FurnitureDefinition[] = CONTENT_CATALOG.filter(row => FURNITURE_ACTION_TYPES[row.id]).map(row => {
  const type = FURNITURE_ACTION_TYPES[row.id]!
  const id = `furniture.${type}`
  return {
    id, label: row.label, type, status: 'candidate', minVersion: row.minVersion,
    zone: row.id === 'F07' || row.id === 'F16' ? 'wall' : 'floor',
    footprint: { ...D.geometry }, geometryStatus: 'unconfirmed', layer: 'behind_cat',
    anchors: row.id === 'F13'
      ? [{ id: `${id}.entry`, x: 0, y: 1, actionIds: [row.id] }, { id: `${id}.exit`, x: 1, y: 1, actionIds: [row.id] }]
      : [{ id: `${id}.main`, x: 0.5, y: 1, actionIds: [row.id] }],
  }
})
