import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig } from 'vite'

import topLevelAwait from 'vite-plugin-top-level-await'
import wasm from 'vite-plugin-wasm'
import tsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    wasm(),
    topLevelAwait(),
    tsConfigPaths(),
    tanstackStart({
      target: 'bun',
    }),
  ],
})
