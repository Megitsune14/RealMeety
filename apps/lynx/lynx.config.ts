import { defineConfig } from '@lynx-js/rspeedy'

import { pluginQRCode } from '@lynx-js/qrcode-rsbuild-plugin'
import { pluginReactLynx } from '@lynx-js/react-rsbuild-plugin'
import { pluginTypeCheck } from '@rsbuild/plugin-type-check'

export default defineConfig({
  plugins: [
    pluginQRCode({
      schema(url) {
        return `${url}?fullscreen=true`
      },
    }),
    pluginReactLynx(),
    pluginTypeCheck(),
  ],
  // Lynx natif (Explorer / Sparkling). Pour le preview web : lynx.config.web.ts
  environments: {
    lynx: {},
  },
  server: {
    port: 3000,
  },
  dev: {
    writeToDisk: false,
  },
})
