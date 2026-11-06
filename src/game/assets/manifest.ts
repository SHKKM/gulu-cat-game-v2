import { ANIMATION_CATALOG } from '../catalogs/animations.ts'
import type { AssetIssue, ParsedAssets, RuntimeAsset } from './types.ts'

const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
const id = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/.test(value) && !value.includes('..')
const date = (value: unknown): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value))
const positive = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0
const hash = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
const canonical = (value: string) => ANIMATION_CATALOG.find(item => item.id === value)?.aliasOf ?? value

/** Resolve only package-relative paths inside the explicitly installed /assets root. */
export function assetUrl(path: unknown, base: string): string {
  if (typeof path !== 'string' || !path || path.startsWith('/') || !/^[\p{L}\p{N}_./-]+\.(png|webp)$/u.test(path) || path.split('/').some(part => !part || part === '.' || part === '..')) throw Error('不安全的套件圖片路徑')
  if (!/^\/(?:[A-Za-z0-9_-]+\/)?assets\/(?:[A-Za-z0-9_.-]+\/)*$/.test(base) || base.includes('..') || base.split('/').includes('.')) throw Error('素材根目錄必須在同站的 assets 內')
  return base + path
}

/** Read-only bridge. Never inspects workbench storage, never approves any file. */
export function parseAssetManifest(input: unknown, base = '/assets/game/'): ParsedAssets {
  const assets: Record<string, RuntimeAsset> = {}, issues: AssetIssue[] = []
  const fail = (key: string, code: AssetIssue['code'], message: string) => { issues.push({ key, code, message }) }
  if (!record(input) || input.schemaVersion !== 1 || !['gulu-animation-assets', 'gulu-game-assets'].includes(String(input.format))) {
    return { assets, issues: [{ key: 'manifest', code: 'incompatible', message: '不支援的素材清單版本或格式' }] }
  }
  if (!Array.isArray(input.assets) || input.assets.length > 2000 || !Array.isArray(input.animationBindings) || input.animationBindings.length > 4000 || (Array.isArray(input.imageBindings) && input.imageBindings.length > 4000)) return { assets, issues: [{ key: 'manifest', code: 'invalid', message: '素材清單缺少 assets 或 bindings' }] }
  const ids = new Set<string>(), duplicates = new Set<string>()
  for (const item of input.assets) if (record(item) && typeof item.assetId === 'string') { if (ids.has(item.assetId)) duplicates.add(item.assetId); ids.add(item.assetId) }
  const accepted = new Map<string, RuntimeAsset>()
  for (const raw of input.assets) {
    const key = record(raw) && typeof raw.assetId === 'string' ? raw.assetId : 'unknown'
    if (!record(raw) || !id(raw.assetId) || !id(raw.version) || duplicates.has(key)) { fail(key, 'invalid', '素材 ID／版本無效或重複'); continue }
    if (raw.status !== 'published' || !record(raw.approval) || typeof raw.approval.by !== 'string' || !raw.approval.by.trim() || !date(raw.approval.at) || !date(raw.publishedAt)) { fail(key, 'unapproved', '正式素材必須人工核准並發布'); continue }
    try {
      if (!record(raw.canvas) || ![raw.canvas.width, raw.canvas.height].every(value => Number.isInteger(value) && positive(value) && value <= 8192) || !record(raw.anchor) || ![raw.anchor.x, raw.anchor.y].every(value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1)) throw Error('畫布／錨點無效')
      if (!positive(raw.fps) || raw.fps > 60 || typeof raw.loop !== 'boolean' || !['forward', 'ping-pong'].includes(String(raw.playback)) || !['left', 'right'].includes(String(raw.facing)) || typeof raw.mirrorAllowed !== 'boolean') throw Error('播放參數無效')
      if (!Array.isArray(raw.frames) || !raw.frames.length || raw.frames.length > 256) throw Error('影格數無效')
      const paths = new Set<string>()
      const frames = raw.frames.map((frame, index) => {
        if (!record(frame) || frame.order !== index + 1 || !hash(frame.sha256)) throw Error('影格順序或 SHA-256 無效')
        const src = assetUrl(frame.imagePath, base)
        if (paths.has(src)) throw Error('重複影格路徑')
        paths.add(src)
        return { src, sha256: frame.sha256 }
      })
      const markers = raw.markers ?? []
      if (!Array.isArray(markers) || markers.some(marker => !record(marker) || !Number.isInteger(marker.frame) || Number(marker.frame) < 0 || Number(marker.frame) >= frames.length || typeof marker.key !== 'string' || !marker.key)) throw Error('影格標記無效')
      const kind = input.format === 'gulu-animation-assets' ? 'animation' : raw.kind
      if (kind !== 'animation' && kind !== 'image') throw Error('未知素材種類')
      if (kind === 'image' && frames.length !== 1) throw Error('場景圖片必須恰有一格')
      accepted.set(key, { assetId: raw.assetId, version: raw.version, kind, status: 'published', approval: { by: raw.approval.by, at: raw.approval.at }, publishedAt: raw.publishedAt,
        canvas: { width: Number(raw.canvas.width), height: Number(raw.canvas.height) }, anchor: { x: Number(raw.anchor.x), y: Number(raw.anchor.y) }, frames, fps: raw.fps, loop: raw.loop, playback: raw.playback as RuntimeAsset['playback'], facing: raw.facing as RuntimeAsset['facing'], mirrorAllowed: raw.mirrorAllowed, markers: markers.map(marker => ({ frame: Number(marker.frame), key: String(marker.key) })) })
    } catch (error) { fail(key, 'invalid', String(error)) }
  }
  const bindings = input.format === 'gulu-animation-assets'
    ? input.animationBindings.map(binding => record(binding) ? { key: typeof binding.animationId === 'string' ? `animation.${canonical(binding.animationId)}` : '', assetId: binding.assetId, version: accepted.get(String(binding.assetId))?.version, animationId: binding.animationId } : null)
    : [...input.animationBindings, ...(Array.isArray(input.imageBindings) ? input.imageBindings : [])]
  const bound = new Map<string, string>()
  const poisoned = new Set<string>()
  for (const raw of bindings) {
    if (!record(raw) || !id(raw.key) || !id(raw.assetId)) { fail('binding', 'invalid', '素材綁定無效'); continue }
    const key = raw.key, asset = accepted.get(raw.assetId)
    if (!asset) { fail(key, 'missing', '綁定素材不存在或尚未通過核准檢查'); continue }
    if (raw.version !== asset.version) { fail(key, 'incompatible', '綁定版本與發布版本不一致'); continue }
    if (key.startsWith('animation.')) {
      const animationId = key.slice(10)
      if (!ANIMATION_CATALOG.some(item => item.id === animationId) || asset.kind !== 'animation') { fail(key, 'invalid', '動畫不符合 S1 ID'); continue }
      const original = input.assets.find(item => record(item) && item.assetId === raw.assetId)
      if (record(original) && typeof original.animationId === 'string' && canonical(original.animationId) !== canonical(animationId)) { fail(key, 'invalid', '動畫與素材 ID 對應不符'); continue }
    } else if (!key.startsWith('image.') || asset.kind !== 'image') { fail(key, 'invalid', '場景圖片綁定無效'); continue }
    const previous = bound.get(key)
    if (previous && previous !== `${asset.assetId}@${asset.version}`) { poisoned.add(key); delete assets[key]; fail(key, 'invalid', '同一綁定不可選取多個版本'); continue }
    if (poisoned.has(key)) continue
    bound.set(key, `${asset.assetId}@${asset.version}`)
    assets[key] = asset
  }
  return { assets, issues }
}

