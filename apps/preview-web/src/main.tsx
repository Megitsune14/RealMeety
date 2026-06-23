import '../../lynx/src/App.css'

// Mock Lynx runtime pour le preview DOM (dev uniquement)
;(globalThis as { lynx?: { setSharedData: (k: string, v: string) => void; getSharedData: (k: string) => string | undefined } }).lynx = {
  setSharedData(key, value) {
    sessionStorage.setItem(`lynx:${key}`, value)
  },
  getSharedData(key) {
    const v = sessionStorage.getItem(`lynx:${key}`)
    return v ?? undefined
  },
}

import { root } from '@lynx-js/react'
import { App } from '../../lynx/src/App.js'

root.render(<App />)
