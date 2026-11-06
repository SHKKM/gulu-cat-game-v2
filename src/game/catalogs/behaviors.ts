import { CONTENT_CATALOG } from './content.ts'
import { animationTokens, supportingArt } from './source.ts'
import { FURNITURE_CATALOG } from './furniture.ts'
import { CATALOG_DRAFT_CONFIG as D } from './config.ts'
import type { BehaviorDefinition } from '../types/catalog.ts'

export const BEHAVIOR_CATALOG: readonly BehaviorDefinition[] = CONTENT_CATALOG.map(row => ({
  id: row.id, label: row.label, category: row.category, status: row.status, minVersion: row.minVersion,
  animationId: animationTokens(row)[0], animationIds: animationTokens(row),
  supportingArtIds: supportingArt(row).map(art => art.id),
  furnitureAnchorRefs: FURNITURE_CATALOG.flatMap(item => item.anchors.filter(anchor => anchor.actionIds.includes(row.id)).map(anchor => ({ furnitureId: item.id, anchorId: anchor.id }))),
  presentation: { source: row.sourceAnimation, composition: 'unconfirmed' },
  durationMs: { ...D.durationMs }, baseWeight: D.baseWeight, interruptible: false, cooldownMs: D.cooldownMs,
  target: row.category === 'furniture' ? 'furniture_anchor' : row.category === 'interaction' ? 'player' : row.id === 'G07' || row.id === 'G09' ? 'floor_point' : 'none',
  tuningStatus: 'unconfirmed',
}))
