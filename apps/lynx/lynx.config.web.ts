import { defineConfig } from '@lynx-js/rspeedy'

import { pluginReactLynx } from '@lynx-js/react-rsbuild-plugin'
import { pluginTypeCheck } from '@rsbuild/plugin-type-check'

/** Config dev navigateur uniquement — ne pas utiliser pour Explorer / stores */
export default defineConfig({
  plugins: [pluginReactLynx(), pluginTypeCheck()],
  environments: {
    web: {},
  },
  server: {
    port: 3000,
  },
})
