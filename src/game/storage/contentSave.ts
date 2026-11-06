import type { GameSaveV1 } from '../types/save.ts'
import type { CatalogBundle } from '../types/catalog.ts'

// Reserved future key; this module NEVER reads or writes localStorage.
// Keep separate from legacy gulu.little-days.save even though both schemas say 1.
export const CONTENT_SAVE_PROTOCOL = { format: 'gulu-content', key: 'gulu.little-days.content.v1', schemaVersion: 1 } as const
export function createEmptyContentSave(now: Date): GameSaveV1 {
  if (!Number.isFinite(now.getTime())) throw new RangeError('無效存檔時間')
  const timestamp = now.toISOString()
  return {
    schemaVersion: 1, savedAt: timestamp, lastSettledAt: timestamp, currency: 0,
    discoveredEventIds: [], diaryIds: [], ownedAccessoryIds: [], ownedFurnitureIds: [],
    equippedAccessoryIds: [], placedFurniture: [], eventLastOccurredAt: {}, eventDailyCount: {},
  }
}
const iso = (value: string) => typeof value === 'string' && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value
const localDate = (value: string) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00.000Z`)) && new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value

/** Typed-save consistency checks for future storage work, not a JSON parser/migration. */
export function validateContentSave(save: GameSaveV1, catalogs: CatalogBundle): string[] {
  const issues: string[] = []
  const fail = (message: string) => { issues.push(message) }
  if (save.schemaVersion !== 1 || !iso(save.savedAt) || !iso(save.lastSettledAt) || Date.parse(save.lastSettledAt) > Date.parse(save.savedAt)) fail('存檔版本或 UTC 結算時間無效')
  if (!Number.isFinite(save.currency) || save.currency < 0) fail('貨幣必須為有限非負數')
  for (const [name, ids, allowed] of [
    ['discoveredEventIds', save.discoveredEventIds, catalogs.events.map(item => item.id)],
    ['diaryIds', save.diaryIds, catalogs.diaries.map(item => item.id)],
    ['ownedAccessoryIds', save.ownedAccessoryIds, catalogs.accessories.map(item => item.id)],
    ['ownedFurnitureIds', save.ownedFurnitureIds, catalogs.furniture.map(item => item.id)],
    ['equippedAccessoryIds', save.equippedAccessoryIds, catalogs.accessories.map(item => item.id)],
  ] as const) {
    if (new Set(ids).size !== ids.length || ids.some(id => !(allowed as readonly string[]).includes(id))) fail(`${name} 有重複或未知 ID`)
  }
  for (const id of save.diaryIds) {
    const diary = catalogs.diaries.find(item => item.id === id)
    if (diary && !save.discoveredEventIds.includes(diary.eventId)) fail(`日記未對應已發現事件：${id}`)
  }
  const slots = new Set<string>()
  for (const id of save.equippedAccessoryIds) {
    if (!save.ownedAccessoryIds.includes(id)) fail(`不能穿戴未擁有的裝飾：${id}`)
    const accessory = catalogs.accessories.find(item => item.id === id)
    if (accessory) { if (slots.has(accessory.slot)) fail(`穿戴欄位重複：${accessory.slot}`); slots.add(accessory.slot) }
  }
  const instances = new Set<string>()
  for (const placed of save.placedFurniture) {
    const furniture = catalogs.furniture.find(item => item.id === placed.furnitureId)
    if (!placed.instanceId || instances.has(placed.instanceId)) fail('家具 instanceId 空白或重複')
    instances.add(placed.instanceId)
    if (!furniture || !save.ownedFurnitureIds.includes(placed.furnitureId) || furniture.zone !== placed.zone) fail(`家具擺放參照無效：${placed.instanceId}`)
    if (!Number.isFinite(placed.x) || !Number.isFinite(placed.y)) fail('家具位置不是有限數值')
  }
  if (save.currentCat && (!catalogs.behaviors.some(item => item.id === save.currentCat?.actionId) || !Number.isFinite(save.currentCat.x) || !['left', 'right'].includes(save.currentCat.facing) || !['relaxed', 'curious', 'sleepy', 'playful', 'not_interested'].includes(save.currentCat.mood))) fail('角色狀態參照或欄位無效')
  for (const [id, value] of Object.entries(save.eventLastOccurredAt)) if (!catalogs.events.some(item => item.id === id) || !iso(value) || Date.parse(value) > Date.parse(save.savedAt)) fail(`事件冷卻紀錄無效：${id}`)
  for (const [id, value] of Object.entries(save.eventDailyCount)) if (!catalogs.events.some(item => item.id === id) || !localDate(value.localDate) || !Number.isSafeInteger(value.count) || value.count < 0) fail(`事件每日次數無效：${id}`)
  if (save.lastDailyRewardDate !== undefined && !localDate(save.lastDailyRewardDate)) fail('每日獎勵日期無效')
  return issues
}

