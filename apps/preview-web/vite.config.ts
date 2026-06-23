import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

function rpxToPxPlugin(): Plugin {
  return {
    name: 'rpx-to-px',
    transform(code, id) {
      if (!id.endsWith('.css')) return null
      return {
        code: code.replace(/(\d+(?:\.\d+)?)rpx/g, (_, n) => `${parseFloat(n) * 0.5}px`),
        map: null,
      }
    },
  }
}

export default defineConfig({
  plugins: [
    rpxToPxPlugin(),
    react({
      jsxImportSource: '@realmeety/lynx-dom-shim',
    }),
  ],
  resolve: {
    alias: {
      '@lynx-js/react': path.resolve(__dirname, '../../packages/lynx-dom-shim/src/index.ts'),
      '@realmeety/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
  server: {
    port: 8080,
    strictPort: true,
  },
})
