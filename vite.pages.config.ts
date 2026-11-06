import { createHash } from 'node:crypto'
import { readFileSync, realpathSync } from 'node:fs'
import { isAbsolute, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { parseAssetManifest } from './src/game/assets/manifest.ts'

const root = fileURLToPath(new URL('.', import.meta.url))
const assetRoot = '/assets/game/'
const requiredBindings = [
  ...['idle', 'walk', 'rest', 'sleep_curl', 'stretch', 'idle_blink'].map(id => `animation.${id}`),
  'image.room.cozy-room.background',
  ...['window', 'shelf', 'rug', 'cat-bed', 'sofa', 'plant'].map(id => `image.item.cozy-room.${id}`),
]

export default defineConfig({
  root,
  base: '/gulu-cat-game/',
  publicDir: false,
  plugins: [react(), {
    name: 'published-home-assets',
    apply: 'build',
    generateBundle() {
      const directory = realpathSync(resolve(root, 'public/assets/game'))
      const manifest = readFileSync(resolve(directory, 'manifest.json'))
      const { assets, issues } = parseAssetManifest(JSON.parse(manifest.toString('utf8')), assetRoot)
      if (issues.length || Object.keys(assets).length !== requiredBindings.length || requiredBindings.some(key => !assets[key])) {
        this.error('Pages requires the validated set of six animations and seven home images.')
      }

      const emitted = new Set<string>()
      for (const { frames } of Object.values(assets)) {
        for (const { src, sha256 } of frames) {
          const image = realpathSync(resolve(directory, src.slice(assetRoot.length)))
          const imagePath = relative(directory, image)
          if (isAbsolute(imagePath) || imagePath.startsWith('..')) this.error('Published image escaped the game asset directory.')
          const source = readFileSync(image)
          if (createHash('sha256').update(source).digest('hex') !== sha256) this.error(`Published image checksum mismatch: ${src}`)
          if (!emitted.has(src)) {
            this.emitFile({ type: 'asset', fileName: src.slice(1), source })
            emitted.add(src)
          }
        }
      }
      this.emitFile({ type: 'asset', fileName: 'assets/game/manifest.json', source: manifest })
    },
  }],
  build: {
    outDir: 'dist-pages',
    rollupOptions: { input: resolve(root, 'index.html') },
  },
})
