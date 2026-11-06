import type { AccessoryDefinition, ArtDefinition, DiaryDefinition, RewardDefinition, CurrencyDefinition } from '../types/catalog.ts'
import { CONTENT_CATALOG } from './content.ts'
import { supportingArt } from './source.ts'
import { CATALOG_DRAFT_CONFIG as D } from './config.ts'

export const ACCESSORY_CATALOG: readonly AccessoryDefinition[] = [
  { id: 'accessory.summer-bandana', label: '夏日小領巾', slot: 'neck', season: 'summer' },
  { id: 'accessory.pumpkin-hat', label: '南瓜帽', slot: 'head', season: 'autumn' },
  { id: 'accessory.christmas-hat', label: '聖誕帽', slot: 'head', season: 'winter' },
].map(item => ({ ...item, status: 'candidate', minVersion: 'v0.5+', mode: 'overlay', obtainable: 'event', artId: `art.${item.id}` })) as readonly AccessoryDefinition[]
export const ART_CATALOG: readonly ArtDefinition[] = [
  ...CONTENT_CATALOG.flatMap(row => supportingArt(row).map(art => ({ id: art.id, kind: art.kind, status: 'missing' as const, source: null }))),
  ...ACCESSORY_CATALOG.map(item => ({ id: item.artId, kind: 'accessory' as const, status: 'missing' as const, source: null })),
]
export const DIARY_CATALOG: readonly DiaryDefinition[] = CONTENT_CATALOG.filter(row => row.diaryRecommendation === 'first_discovery').map(row => ({
  id: `diary.${row.id}`, eventId: row.id as DiaryDefinition['eventId'], status: 'candidate', minVersion: row.minVersion,
  title: row.label, text: `待撰寫：${row.label}`, textStatus: 'draft', collectionMode: 'first_discovery',
}))
export const CURRENCY_CATALOG: readonly CurrencyDefinition[] = [{ id: D.currencyId, label: null, tuningStatus: 'unconfirmed' }]
// Reward IDs are reservation slots, not promises of a particular reward amount.
export const REWARD_CATALOG: readonly RewardDefinition[] = DIARY_CATALOG.map(diary => ({
  id: `reward.first.${diary.eventId}`, status: 'candidate', minVersion: diary.minVersion, currencyId: D.currencyId, amount: null,
}))

