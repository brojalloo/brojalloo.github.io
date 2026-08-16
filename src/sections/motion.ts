import { useReducedMotion } from 'framer-motion'
import type { Variants } from 'framer-motion'

/**
 * One entrance for every section, so the six of them read as one instrument
 * rather than six pages: blocks rise 12px over 320ms, 40ms apart, once.
 * Nothing here loops.
 */

/** Shared easing, also used directly by the pipeline accordion. */
export const EASE = [0.16, 1, 0.3, 1] as const

export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}

const rise: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: EASE } },
}

const fade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.32 } },
}

/** The per-block variant, with the travel dropped when motion is unwelcome. */
export function useRise(): Variants {
  return useReducedMotion() ? fade : rise
}
