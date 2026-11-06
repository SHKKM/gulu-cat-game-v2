import type { EffectHandler, PredicateHandler } from '../types/save.ts'

// Explicit empty allowlists. Draft strings never execute code or silently succeed.
export const effectHandlers: Readonly<Partial<Record<string, EffectHandler>>> = Object.freeze({})
export const predicateHandlers: Readonly<Partial<Record<string, PredicateHandler>>> = Object.freeze({})
