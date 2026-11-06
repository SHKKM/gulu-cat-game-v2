import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const game = fileURLToPath(new URL('./index.html', import.meta.url))
const artWorkbench = fileURLToPath(new URL('./art-workbench.html', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Keep the game separate from other local projects (e.g. the management center).
  server: { host: '127.0.0.1', port: 41730, strictPort: true },
  build: { rollupOptions: { input: { game, ...(existsSync(artWorkbench) ? { artWorkbench } : {}) } } },
})


