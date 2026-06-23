/**
 * Correctif temporaire Lynx WebEncodePlugin (manifest vide en dev web).
 * À retirer quand @lynx-js/template-webpack-plugin sera corrigé en amont.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const target = path.resolve(
  __dirname,
  '../node_modules/@lynx-js/template-webpack-plugin/lib/WebEncodePlugin.js',
)

if (!fs.existsSync(target)) {
  console.info('[patch-lynx-web] WebEncodePlugin introuvable, skip')
  process.exit(0)
}

let src = fs.readFileSync(target, 'utf8')
const needle = 'manifestEntries = Object.entries(encodeData.manifest ?? {})'
if (src.includes(needle)) {
  console.info('[patch-lynx-web] déjà appliqué')
  process.exit(0)
}

const broken = 'const [name, content] = last(Object.entries(encodeData.manifest));'
const fixed = `const manifestEntries = Object.entries(encodeData.manifest ?? {});
                if (manifestEntries.length === 0) {
                    return encodeOptions;
                }
                const [name, content] = manifestEntries[manifestEntries.length - 1];`

if (!src.includes(broken)) {
  console.info('[patch-lynx-web] format inattendu, skip')
  process.exit(0)
}

src = src.replace(broken, fixed)
fs.writeFileSync(target, src)
console.info('[patch-lynx-web] patch appliqué')
