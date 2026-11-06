import { useContext } from 'react'
import { GameArtContext } from './context.ts'

export function useGameArt() { return useContext(GameArtContext) }
