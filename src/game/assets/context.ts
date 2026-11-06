import { createContext } from 'react'
import type { LoadedAssets } from './types.ts'

export interface GameArtState extends LoadedAssets { readonly status: 'loading' | 'ready' | 'fallback' }
export const GameArtContext = createContext<GameArtState>({ assets: {}, issues: [], status: 'fallback' })
