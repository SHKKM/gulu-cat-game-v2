import { createContext } from 'react'
import type { GameStore } from './store.ts'

export const GameContext = createContext<GameStore | null>(null)
