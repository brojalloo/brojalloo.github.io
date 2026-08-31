import { create } from 'zustand'
import type { Lang, NodeId, Tier } from './types'

interface AppState {
  /** Which node the camera is docked at. `null` = orbital overview. */
  active: NodeId | null
  /** Node under the pointer, drives hover highlight in both scene and HUD. */
  hovered: NodeId | null
  /** Stage the journey is currently at. `-1` only when outside the pipeline. */
  stage: number
  lang: Lang
  tier: Tier
  /** True until the scene has rendered its first frame and fonts are ready. */
  booting: boolean

  goTo: (id: NodeId | null) => void
  setHovered: (id: NodeId | null) => void
  setStage: (i: number) => void
  toggleLang: () => void
  setTier: (t: Tier) => void
  finishBoot: () => void
}

const STORAGE_KEY = 'portfolio.lang'

function initialLang(): Lang {
  if (typeof window === 'undefined') return 'fr'
  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (saved === 'fr' || saved === 'en') return saved
  return navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en'
}

export const useApp = create<AppState>((set) => ({
  active: null,
  hovered: null,
  stage: -1,
  lang: initialLang(),
  tier: 'full',
  booting: true,

  // Entering the pipeline starts the journey at the first stage rather than at
  // "no stage": the journey always sits somewhere on the chain. Leaving any
  // node releases it, so the next entry starts from the top again.
  goTo: (id) => set({ active: id, stage: id === 'pipeline' ? 0 : -1, hovered: null }),
  setHovered: (id) => set({ hovered: id }),
  setStage: (i) => set({ stage: i }),
  toggleLang: () =>
    set((s) => {
      const next: Lang = s.lang === 'fr' ? 'en' : 'fr'
      window.localStorage.setItem(STORAGE_KEY, next)
      document.documentElement.lang = next
      return { lang: next }
    }),
  setTier: (t) => set({ tier: t }),
  finishBoot: () => set({ booting: false }),
}))
