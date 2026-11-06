import type { ContentCandidate } from '../types/catalog.ts'

export function animationTokens(row: ContentCandidate): string[] {
  return [...new Set((row.sourceAnimation.match(/[a-z][a-z_]*/g) ?? []).filter(token => token !== 'audio'))]
}
export function supportingArt(row: ContentCandidate) {
  return row.sourceAnimation.split(/[+/]/).flatMap((token, index) => {
    const part = token.trim()
    if (part !== 'audio' && /^[a-z_]+$/.test(part)) return []
    return [{ id: `art.${row.id}.${index}`, kind: part === 'audio' ? 'audio' as const : 'effect' as const, notes: part }]
  })
}
