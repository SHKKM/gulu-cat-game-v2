/** Structural defaults ONLY. Zero weights keep every draft unschedulable. */
export const CATALOG_DRAFT_CONFIG = {
  durationMs: { min: 1000, max: 1000 }, baseWeight: 0, eventWeight: 0, cooldownMs: 0,
  geometry: { width: 1, height: 1 }, // normalized placeholder, not real room units
  currencyId: 'currency.main',
  expectedCounts: { general: 22, special: 18, furniture: 20, seasonal: 16, interaction: 16 },
} as const
