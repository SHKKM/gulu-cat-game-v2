/** All durations, weights and travel speed are provisional / 待確認. */
export const BEHAVIOR_CONFIG = {
  durationMs: { idle: [25_000, 50_000], rest: [45_000, 90_000], sleep: [90_000, 180_000] },
  weights: { idle: 30, rest: 30, sleep: 25, walk: 15 },
  walkSpeed: 7,
  minimumTravel: 18,
  footRadius: 8,
  targetAttempts: 8,
  stretchMs: 2000,
  turnMs: 1000,
  visualUpdateMs: 1000 / 24,
  maxVisualDeltaMs: 250,
  assetTimeoutMs: 8000,
} as const
