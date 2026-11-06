import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { assetUrl, parseAssetManifest } from '../src/game/assets/manifest.ts'

test('all published homepage bindings resolve under the Pages base', async () => {
  const source = await readFile(new URL('../public/assets/game/manifest.json', import.meta.url), 'utf8')
  const manifest = JSON.parse(source)
  for (const base of ['/assets/game/', '/gulu-cat-game-v2/assets/game/']) {
    const { assets, issues } = parseAssetManifest(manifest, base)
    assert.deepEqual(issues, [])
    assert.equal(Object.keys(assets).filter(key => key.startsWith('image.')).length, 7)
    assert.equal(Object.keys(assets).filter(key => key.startsWith('animation.')).length, 6)
    for (const { frames } of Object.values(assets)) {
      for (const { src } of frames) assert.ok(src.startsWith(base))
    }
  }
})

test('asset bases and frame paths stay within the same-site asset directory', () => {
  for (const base of ['//other.test/assets/game/', 'https://other.test/assets/game/',
    '/gulu-cat-game-v2/../assets/game/', '/gulu-cat-game-v2/assets/./', '/gulu-cat-game-v2/assets/%2e%2e/']) {
    assert.throws(() => assetUrl('frame.png', base))
  }
  for (const frame of ['/frame.png', '../frame.png', 'folder/../frame.png']) {
    assert.throws(() => assetUrl(frame, '/gulu-cat-game-v2/assets/game/'))
  }
})
