export {
  useState,
  useEffect,
  useCallback,
  useRef,
  useContext,
  createContext,
  Fragment,
} from 'react'

import { createRoot, type Root } from 'react-dom/client'
import type { ReactNode } from 'react'

let rootInstance: Root | null = null

export const root = {
  render(jsx: ReactNode) {
    const el = document.getElementById('app-root')
    if (!el) throw new Error('#app-root introuvable')
    if (!rootInstance) rootInstance = createRoot(el)
    rootInstance.render(jsx)
  },
}
