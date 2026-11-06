import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { GameArtContext } from './context.ts'
import type { GameArtState } from './context.ts'
import { disposeAssets, loadApprovedAssets } from './loader.ts'
import type { LoadedAssets } from './types.ts'

const gameManifestUrl = `${import.meta.env.BASE_URL}assets/game/manifest.json`
// Pages can need more time to download and verify the complete home on first visit.
const assetLoadTimeoutMs = import.meta.env.BASE_URL === '/' ? 8_000 : 45_000

export function GameArtProvider({ children, manifestUrl = gameManifestUrl }: { children: ReactNode; manifestUrl?: string }) {
  const [state, setState] = useState<GameArtState>({ assets: {}, issues: [], status: 'loading' })
  useEffect(() => {
    let active = true
    let loaded: LoadedAssets | undefined
    const controller = new AbortController()
    const fallback = (code: 'missing' | 'load-failed') => { if (active) setState({ assets: {}, issues: [{ key: 'manifest', code, message: '正式素材未就緒，使用暫時素材' }], status: 'fallback' }) }
    const timer = window.setTimeout(() => { controller.abort(); fallback('load-failed') }, assetLoadTimeoutMs)
    const load = async () => {
      try {
        const response = await fetch(manifestUrl, { signal: controller.signal, cache: 'no-cache', credentials: 'same-origin' })
        if (!response.ok) { fallback('missing'); return }
        const raw = await response.text()
        if (raw.length > 2_000_000) throw Error('manifest too large')
        const base = manifestUrl.slice(0, manifestUrl.lastIndexOf('/') + 1)
        loaded = await loadApprovedAssets(JSON.parse(raw), base, undefined, controller.signal)
        if (!active || controller.signal.aborted) { disposeAssets(loaded); loaded = undefined; return }
        setState({ ...loaded, status: Object.keys(loaded.assets).length ? 'ready' : 'fallback' })
      } catch { fallback('load-failed') }
      finally { window.clearTimeout(timer) }
    }
    void load()
    return () => { active = false; controller.abort(); window.clearTimeout(timer); if (loaded) disposeAssets(loaded) }
  }, [manifestUrl])
  return <GameArtContext.Provider value={state}>{children}</GameArtContext.Provider>
}
