import type { HandlerDefinition } from '../types/catalog.ts'
import { CONTENT_CATALOG } from './content.ts'

export const PREDICATE_DEFINITIONS: readonly HandlerDefinition[] = CONTENT_CATALOG.filter(row => row.category !== 'general').map(row => ({
  id: `predicate.${row.id}.eligibility`, status: 'unimplemented', notes: row.sourceCondition,
}))
export const EFFECT_DEFINITIONS: readonly HandlerDefinition[] = [
  { id: 'effect.play-presentation', status: 'unimplemented', notes: '播放候選內容的動畫／音效／場景效果；尚未執行' },
  { id: 'effect.record-first-discovery', status: 'unimplemented', notes: '首次發現與日記的原子化紀錄；尚未執行' },
  { id: 'effect.grant-first-reward', status: 'unimplemented', notes: '首次獎勵防重；名稱與數量待確認，尚未執行' },
]
