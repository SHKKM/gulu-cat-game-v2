import type { CatalogBundle, Category, EventDefinition, Version } from '../types/catalog.ts'
import type { EffectHandler, PredicateHandler } from '../types/save.ts'
import { CATALOG_DRAFT_CONFIG } from './config.ts'

export interface CatalogIssue { path: string; code: string; message: string }
export interface HandlerRegistry {
  effects: Readonly<Partial<Record<string, EffectHandler>>>
  predicates: Readonly<Partial<Record<string, PredicateHandler>>>
}
export const NO_HANDLERS: HandlerRegistry = { effects: Object.freeze({}), predicates: Object.freeze({}) }
export const VERSIONS: readonly Version[] = ['v0.1', 'v0.2', 'v0.3', 'v0.4', 'v0.5+']
const categories: Readonly<Record<string, Category>> = { G: 'general', S: 'special', F: 'furniture', E: 'seasonal', I: 'interaction' }
const finite = (n: number) => typeof n === 'number' && Number.isFinite(n)
const nonnegative = (n: number) => finite(n) && n >= 0
const positive = (n: number) => finite(n) && n > 0
const ownFunction = (map: object, id: string) => Object.hasOwn(map, id) && typeof (map as Record<string, unknown>)[id] === 'function'
const datePart = (month: number, day: number) => Number.isInteger(month) && month >= 1 && month <= 12 && Number.isInteger(day) && day >= 1 && day <= new Date(Date.UTC(2000, month, 0)).getUTCDate()
const localAsset = (src: string) => typeof src === 'string' && /^\/assets\/[^?#]+\.(png|webp|svg|mp3|ogg|wav)$/i.test(src) && !src.includes('..')

/** Structural/reference validation only; never runs event effects or predicates. */
export function validateCatalogs(bundle: CatalogBundle, handlers: HandlerRegistry = NO_HANDLERS): CatalogIssue[] {
  const issues: CatalogIssue[] = []
  const fail = (path: string, code: string, message: string) => { issues.push({ path, code, message }) }
  const groups = Object.entries(bundle) as [keyof CatalogBundle, readonly { id: string }[]][]
  for (const [name, rows] of groups) {
    const seen = new Set<string>()
    for (const row of rows) {
      if (!row.id || seen.has(row.id)) fail(`${name}.${row.id}`, 'duplicate-id', 'ID 必須存在且在各資料目錄內唯一')
      seen.add(row.id)
      const statuses = name === 'art' ? ['missing', 'placeholder', 'ready'] : name === 'effects' || name === 'predicates' ? ['unimplemented', 'implemented'] : ['candidate', 'approved', 'implemented', 'disabled']
      if ('status' in row && !statuses.includes(String(row.status))) fail(`${name}.${row.id}`, 'status', '不支援的狀態')
      if ('minVersion' in row && !VERSIONS.includes(row.minVersion as Version)) fail(`${name}.${row.id}`, 'version', '不支援的版本')
    }
  }
  const index = <T extends { id: string }>(rows: readonly T[]) => new Map(rows.map(row => [row.id, row]))
  const content = index(bundle.content), animations = index(bundle.animations), behaviors = index(bundle.behaviors)
  const events = index(bundle.events), furniture = index(bundle.furniture), diaries = index(bundle.diaries)
  const art = index(bundle.art), rewards = index(bundle.rewards), currencies = index(bundle.currencies)
  const predicates = index(bundle.predicates), effects = index(bundle.effects), windows = index(bundle.calendarWindows)
  const accessories = index(bundle.accessories)
  const reference = (exists: boolean, path: string, target: string) => { if (!exists) fail(path, 'missing-reference', `找不到參照：${target}`) }
  const expectedIds: string[] = []
  for (const [prefix, category] of Object.entries(categories)) {
    const expected = CATALOG_DRAFT_CONFIG.expectedCounts[category]
    const actual = bundle.content.filter(row => row.category === category).length
    if (actual !== expected) fail(`content.${category}`, 'count', `預期 ${expected} 筆，實際 ${actual} 筆`)
    for (let n = 1; n <= expected; n++) expectedIds.push(`${prefix}${String(n).padStart(2, '0')}`)
  }
  if (bundle.content.length !== 92) fail('content', 'count', '候選主檔必須共 92 筆')
  for (const id of expectedIds) reference(content.has(id), 'content', id)
  for (const row of bundle.content) {
    if (!expectedIds.includes(row.id) || categories[row.id[0]] !== row.category) fail(`content.${row.id}`, 'action-id', '分類或穩定 ID 不符候選主檔範圍')
    reference(behaviors.has(row.id), `content.${row.id}`, row.id)
    if (row.category !== 'general') reference(events.has(row.id), `content.${row.id}`, row.id)
  }
  if (bundle.behaviors.length !== 92) fail('behaviors', 'count', '必須有 92 筆候選行為')
  if (bundle.events.length !== 70) fail('events', 'count', '非 G 類候選事件必須有 70 筆')
  for (const animation of bundle.animations) {
    const path = `animations.${animation.id}`
    if (!positive(animation.fps) || !animation.frames.length || !animation.frames.every(src => localAsset(src) && /\.(png|webp|svg)$/i.test(src))) fail(path, 'animation', '影格不可空白，FPS 必須為有限正數，路徑必須是本機圖片資產')
    if (![animation.canvas.width, animation.canvas.height].every(n => Number.isInteger(n) && positive(n))) fail(path, 'canvas', '畫布需為正整數尺寸')
    if (![animation.anchor.x, animation.anchor.y].every(n => finite(n) && n >= 0 && n <= 1)) fail(path, 'anchor', '錨點需在 0..1 內')
    if (!['left', 'right'].includes(animation.facing) || typeof animation.mirrorAllowed !== 'boolean' || typeof animation.loop !== 'boolean' || !['forward', 'ping-pong'].includes(animation.playback)) fail(path, 'animation', '方向或播放設定無效')
    const markerKeys = new Set<string>()
    for (const marker of animation.markers ?? []) {
      const key = `${marker.frame}:${marker.key}`
      if (!Number.isInteger(marker.frame) || marker.frame < 0 || marker.frame >= animation.frames.length || !marker.key || markerKeys.has(key)) fail(path, 'marker', '影格標記越界、空白或重複')
      markerKeys.add(key)
    }
    for (const target of [animation.fallbackAnimationId, animation.aliasOf]) if (target) reference(animations.has(target), path, target)
    if (animation.status === 'implemented' && animation.assetStatus !== 'ready') fail(path, 'not-ready', '已實作動畫不可仍為占位／缺圖')
    const visit = (id: string, stack: Set<string>) => {
      if (stack.has(id)) { fail(path, 'animation-cycle', 'fallback／alias 參照不可循環'); return }
      const item = animations.get(id)
      if (!item) return
      const next = new Set(stack).add(id)
      for (const target of [item.fallbackAnimationId, item.aliasOf]) if (target) visit(target, next)
    }
    visit(animation.id, new Set())
  }
  for (const behavior of bundle.behaviors) {
    const path = `behaviors.${behavior.id}`, row = content.get(behavior.id)
    reference(!!row, path, behavior.id)
    if (row && (row.category !== behavior.category || row.label !== behavior.label || row.minVersion !== behavior.minVersion)) fail(path, 'source-mismatch', '行為與主檔分類、名稱或版本不符')
    if (!positive(behavior.durationMs.min) || !finite(behavior.durationMs.max) || behavior.durationMs.max < behavior.durationMs.min || !nonnegative(behavior.baseWeight) || (behavior.cooldownMs !== undefined && !nonnegative(behavior.cooldownMs))) fail(path, 'behavior-range', '持續時間／權重／冷卻無效')
    if (!behavior.animationIds.length || !behavior.animationIds.includes(behavior.animationId)) fail(path, 'animation', '主要動畫必須包含於素材清單')
    for (const id of behavior.animationIds) reference(animations.has(id), path, id)
    for (const id of behavior.supportingArtIds) reference(art.has(id), path, id)
    for (const id of behavior.allowedFrom ?? []) reference(behaviors.has(id), path, id)
    for (const anchor of behavior.furnitureAnchorRefs) reference(!!furniture.get(anchor.furnitureId)?.anchors.some(item => item.id === anchor.anchorId && item.actionIds.includes(behavior.id)), path, `${anchor.furnitureId}/${anchor.anchorId}`)
    if (behavior.status === 'implemented' && (behavior.tuningStatus !== 'confirmed' || behavior.animationIds.some(id => animations.get(id)?.status !== 'implemented' || animations.get(id)?.assetStatus !== 'ready'))) fail(path, 'not-ready', '行為的素材或調校尚未就緒')
  }
  const anchorIds = new Set<string>()
  const furnitureTypes = new Set<string>()
  for (const item of bundle.furniture) {
    const path = `furniture.${item.id}`
    if (!item.type || furnitureTypes.has(item.type)) fail(path, 'furniture-type', '家具類型需唯一且非空')
    furnitureTypes.add(item.type)
    if (!positive(item.footprint.width) || !positive(item.footprint.height) || !['floor', 'wall'].includes(item.zone) || !['behind_cat', 'in_front_of_cat'].includes(item.layer)) fail(path, 'furniture-geometry', '家具區域／尺寸／圖層無效')
    if (!item.anchors.length) fail(path, 'anchor', '家具需有預留互動點')
    for (const anchor of item.anchors) {
      if (!anchor.id || anchorIds.has(anchor.id) || ![anchor.x, anchor.y].every(n => finite(n) && n >= 0 && n <= 1)) fail(path, 'anchor', '家具錨點 ID 重複或正規化座標無效')
      anchorIds.add(anchor.id)
      if (anchor.facing && !['left', 'right'].includes(anchor.facing)) fail(path, 'anchor', '錨點朝向無效')
      for (const id of anchor.actionIds) reference(behaviors.has(id), path, id)
    }
    if (item.status === 'implemented' && item.geometryStatus !== 'confirmed') fail(path, 'not-ready', '家具幾何參數仍待確認')
  }
  for (const event of bundle.events) {
    const path = `events.${event.id}`, row = content.get(event.id)
    if (!row || row.category === 'general' || row.category !== event.category || row.label !== event.label || row.minVersion !== event.minVersion) fail(path, 'event-category', '事件與非 G 類候選資料不符')
    reference(behaviors.has(event.behaviorId), path, event.behaviorId)
    if (!nonnegative(event.weight) || !nonnegative(event.cooldownMs) || (event.maxOccurrencesPerLocalDay !== undefined && (!Number.isInteger(event.maxOccurrencesPerLocalDay) || !positive(event.maxOccurrencesPerLocalDay)))) fail(path, 'event-range', '事件權重／冷卻／每日上限無效')
    for (const trigger of [...event.triggerAll ?? [], ...event.triggerAny ?? []]) {
      if (!['behavior_started', 'behavior_completed', 'player_action', 'furniture_used', 'furniture_placed', 'time_window', 'season', 'calendar'].includes(trigger.kind)) fail(path, 'trigger', '未知觸發類型')
      if (trigger.kind === 'behavior_started' || trigger.kind === 'behavior_completed') reference(behaviors.has(trigger.actionId), path, trigger.actionId)
      else if (trigger.kind === 'furniture_used' || trigger.kind === 'furniture_placed') reference(trigger.furnitureType === '*' || furnitureTypes.has(trigger.furnitureType), path, trigger.furnitureType)
      else if (trigger.kind === 'player_action' && !['pet', 'feed', 'call', 'play', 'equip', 'invite'].includes(trigger.action)) fail(path, 'trigger', '未知玩家操作')
      else if (trigger.kind === 'season' && !['spring', 'summer', 'autumn', 'winter'].includes(trigger.season)) fail(path, 'trigger', '未知季節')
      else if (trigger.kind === 'time_window' && (!trigger.localHours.every(Number.isInteger) || trigger.localHours[0] < 0 || trigger.localHours[0] > 23 || trigger.localHours[1] < 0 || trigger.localHours[1] > 24)) fail(path, 'trigger', '當地時間窗口無效')
      else if (trigger.kind === 'calendar' && (!datePart(trigger.month, trigger.dayFrom) || !datePart(trigger.month, trigger.dayTo) || trigger.dayFrom > trigger.dayTo)) fail(path, 'trigger', '日期窗口無效')
    }
    for (const id of event.conditions ?? []) reference(predicates.has(id), path, id)
    for (const id of event.effectIds) reference(effects.has(id), path, id)
    if (!event.effectIds.length) fail(path, 'effect', '事件需要明確的效果計畫')
    if (event.diaryId) reference(diaries.get(event.diaryId)?.eventId === event.id, path, event.diaryId)
    if (event.firstDiscoveryRewardId) reference(rewards.has(event.firstDiscoveryRewardId), path, event.firstDiscoveryRewardId)
    if (event.calendarWindowId) reference(windows.has(event.calendarWindowId), path, event.calendarWindowId)
    for (const id of event.accessoryIds ?? []) reference(accessories.has(id), path, id)
    if (typeof event.offlineEligible !== 'boolean' || !['unconfirmed', 'confirmed'].includes(event.triggerStatus) || !['unconfirmed', 'confirmed'].includes(event.tuningStatus)) fail(path, 'event-status', '事件待確認欄位或離線資格無效')
    if (event.status === 'implemented' && !isEventReady(event, bundle, 'v0.5+', handlers)) fail(path, 'not-ready', '事件仍缺素材、條件、調校或白名單處理函式')
  }
  for (const item of bundle.accessories) {
    reference(art.has(item.artId), `accessories.${item.id}`, item.artId)
    if (item.anchorId) reference(anchorIds.has(item.anchorId), `accessories.${item.id}`, item.anchorId)
    if (!['head', 'neck', 'body'].includes(item.slot) || !['overlay', 'full_sprite'].includes(item.mode) || !['shop', 'event'].includes(item.obtainable)) fail(`accessories.${item.id}`, 'accessory', '裝飾欄位無效')
  }
  for (const diary of bundle.diaries) {
    reference(events.get(diary.eventId)?.diaryId === diary.id, `diaries.${diary.id}`, diary.eventId)
    if (diary.imageId) reference(art.has(diary.imageId), `diaries.${diary.id}`, diary.imageId)
    if (!diary.title || !diary.text || !['first_discovery', 'milestone'].includes(diary.collectionMode)) fail(`diaries.${diary.id}`, 'diary', '日記欄位無效')
  }
  for (const item of bundle.art) if (item.status === 'ready' && (!item.source || !localAsset(item.source))) fail(`art.${item.id}`, 'asset', '已就緒素材需要有效本機路徑')
  for (const reward of bundle.rewards) {
    reference(currencies.has(reward.currencyId), `rewards.${reward.id}`, reward.currencyId)
    if (reward.amount !== null && !nonnegative(reward.amount)) fail(`rewards.${reward.id}`, 'reward', '獎勵金額無效')
    if (reward.status === 'implemented' && reward.amount === null) fail(`rewards.${reward.id}`, 'not-ready', '獎勵額度尚未確認')
  }
  for (const window of bundle.calendarWindows) if (!datePart(window.start.month, window.start.day) || !datePart(window.end.month, window.end.day)) fail(`calendarWindows.${window.id}`, 'calendar', '跨年窗口的起訖日期無效')
  for (const [definitions, registry, name] of [[bundle.effects, handlers.effects, 'effects'], [bundle.predicates, handlers.predicates, 'predicates']] as const) {
    for (const item of definitions) if (item.status === 'implemented' && !ownFunction(registry, item.id)) fail(`${name}.${item.id}`, 'missing-handler', '已實作處理器必須有白名單函式')
    for (const id of Object.keys(registry)) if (!definitions.some(item => item.id === id && item.status === 'implemented') || !ownFunction(registry, id)) fail(`${name}.${id}`, 'unknown-handler', '函式沒有對應已實作宣告')
  }
  return issues
}

/** Readiness guard only, NOT an event scheduler. Current drafts always return false. */
export function isEventReady(event: EventDefinition, bundle: CatalogBundle, version: Version, handlers: HandlerRegistry = NO_HANDLERS): boolean {
  if (!VERSIONS.includes(version) || !VERSIONS.includes(event.minVersion) || VERSIONS.indexOf(event.minVersion) > VERSIONS.indexOf(version)) return false
  if (!bundle.content.some(item => item.id === event.id && item.status === 'implemented')) return false
  if (event.status !== 'implemented' || event.tuningStatus !== 'confirmed' || event.triggerStatus !== 'confirmed' || !positive(event.weight) || ![...event.triggerAll ?? [], ...event.triggerAny ?? []].length) return false
  const behavior = bundle.behaviors.find(item => item.id === event.behaviorId)
  if (!behavior || behavior.status !== 'implemented' || behavior.tuningStatus !== 'confirmed') return false
  if (behavior.animationIds.some(id => !bundle.animations.some(item => item.id === id && item.status === 'implemented' && item.assetStatus === 'ready'))) return false
  if (behavior.supportingArtIds.some(id => !bundle.art.some(item => item.id === id && item.status === 'ready'))) return false
  if (behavior.furnitureAnchorRefs.some(ref => !bundle.furniture.some(item => item.id === ref.furnitureId && item.status === 'implemented' && item.geometryStatus === 'confirmed' && item.anchors.some(anchor => anchor.id === ref.anchorId)))) return false
  if ((event.conditions ?? []).some(id => !bundle.predicates.some(item => item.id === id && item.status === 'implemented') || !ownFunction(handlers.predicates, id))) return false
  if (!event.effectIds.length || event.effectIds.some(id => !bundle.effects.some(item => item.id === id && item.status === 'implemented') || !ownFunction(handlers.effects, id))) return false
  if (event.diaryId && !bundle.diaries.some(item => item.id === event.diaryId && item.status === 'implemented' && item.textStatus === 'approved')) return false
  if (event.firstDiscoveryRewardId && !bundle.rewards.some(item => item.id === event.firstDiscoveryRewardId && item.status === 'implemented' && item.amount !== null && nonnegative(item.amount))) return false
  if ((event.accessoryIds ?? []).some(id => !bundle.accessories.some(item => item.id === id && item.status === 'implemented' && bundle.art.some(art => art.id === item.artId && art.status === 'ready')))) return false
  if (event.calendarWindowId && !bundle.calendarWindows.some(item => item.id === event.calendarWindowId && item.status === 'implemented')) return false
  return true
}


