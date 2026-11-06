import { CONTENT_CATALOG } from './content.ts'
import { DIARY_CATALOG } from './collections.ts'
import { FURNITURE_ACTION_TYPES } from './furniture.ts'
import { CATALOG_DRAFT_CONFIG as D } from './config.ts'
import type { EventDefinition, EventTrigger, CalendarWindow, ContentCandidate } from '../types/catalog.ts'

function triggers(row: ContentCandidate): EventTrigger[] {
  if (row.category === 'seasonal' && row.season) return [{ kind: 'season', season: row.season }]
  if (row.category === 'interaction' && row.playerAction) return [{ kind: 'player_action', action: row.playerAction }]
  if (row.category === 'furniture') return [{ kind: row.id === 'F20' ? 'furniture_placed' : 'furniture_used', furnitureType: FURNITURE_ACTION_TYPES[row.id] ?? '*' }]
  if (row.id === 'S03') return [{ kind: 'furniture_used', furnitureType: 'sleep-mat' }]
  if (row.id === 'S05') return [{ kind: 'player_action', action: 'play' }]
  if (row.id === 'S07' || row.id === 'S08') return [{ kind: 'player_action', action: 'call' }]
  return [] // Other exact trigger mappings are not yet confirmed; source notes retained.
}
export const EVENT_CATALOG: readonly EventDefinition[] = CONTENT_CATALOG.filter(row => row.category !== 'general').map(row => {
  const diary = DIARY_CATALOG.find(item => item.eventId === row.id)
  const accessory = row.id === 'E08' ? 'accessory.summer-bandana' : row.id === 'E10' ? 'accessory.pumpkin-hat' : row.id === 'E14' ? 'accessory.christmas-hat' : undefined
  return {
    id: row.id as EventDefinition['id'], label: row.label, category: row.category as EventDefinition['category'],
    status: 'candidate', minVersion: row.minVersion, behaviorId: row.id,
    triggerAll: triggers(row), triggerStatus: 'unconfirmed', conditions: [`predicate.${row.id}.eligibility`],
    weight: D.eventWeight, cooldownMs: D.cooldownMs, offlineEligible: false, tuningStatus: 'unconfirmed',
    effectIds: ['effect.play-presentation', ...(diary ? ['effect.record-first-discovery', 'effect.grant-first-reward'] : [])],
    ...(diary ? { diaryId: diary.id, firstDiscoveryRewardId: `reward.first.${row.id}` } : {}),
    ...(accessory ? { accessoryIds: [accessory] } : {}),
  }
})
// Festival dates are intentionally unset; the CalendarWindow model supports cross-year ranges.
export const CALENDAR_WINDOWS: readonly CalendarWindow[] = []
