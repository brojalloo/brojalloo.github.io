import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { CONTENT } from '../content'
import { useApp } from '../store'
import { NODE_IDS } from '../types'
import type { NodeId } from '../types'

/**
 * The reading surface.
 *
 * A plate bolted to the right-hand edge of the frame: square corners, one
 * hairline on the leading edge, no shadow, no float. It knows nothing about
 * what it displays — the sections are handed to it as children, so adding or
 * reordering content never touches this file.
 */

const EASE = [0.16, 1, 0.3, 1] as const

export function Panel({ children }: { children: ReactNode }) {
  const active = useApp((s) => s.active)
  const lang = useApp((s) => s.lang)
  const goTo = useApp((s) => s.goTo)
  const reduce = useReducedMotion() ?? false

  const panelRef = useRef<HTMLElement | null>(null)
  const restoreRef = useRef<HTMLElement | null>(null)
  const wasOpenRef = useRef(false)

  // The panel keeps rendering the node it was showing while it slides out, so
  // the title and legend do not blank halfway through the exit.
  const lastRef = useRef<NodeId>(NODE_IDS[0])
  if (active !== null) lastRef.current = active
  const node = active ?? lastRef.current

  const copy = CONTENT[lang]
  const title = copy.nodes[node].title
  const index = NODE_IDS.indexOf(node)

  // Escape is registered once for the lifetime of the app rather than per open,
  // and reads the store at the moment it fires.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const s = useApp.getState()
      if (s.active === null) return
      e.preventDefault()
      // One press, one step out. `stage` is no longer a disclosure state, so
      // there is nothing to release before leaving.
      s.goTo(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Focus moves to the panel on open and goes home on close. No trap: the scene
  // behind stays live and reachable, which is the whole point of aria-modal false.
  useEffect(() => {
    const isOpen = active !== null

    if (isOpen && !wasOpenRef.current) {
      const previous = document.activeElement
      restoreRef.current = previous instanceof HTMLElement ? previous : null
      panelRef.current?.focus({ preventScroll: true })
    } else if (!isOpen && wasOpenRef.current) {
      const previous = restoreRef.current
      restoreRef.current = null
      if (previous && previous.isConnected) previous.focus({ preventScroll: true })
    }

    wasOpenRef.current = isOpen
  }, [active])

  return (
    <AnimatePresence>
      {active !== null && (
        <motion.aside
          key="panel"
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-label={title}
          tabIndex={-1}
          initial={reduce ? { opacity: 0 } : { x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { x: '100%', opacity: 0 }}
          transition={{
            duration: reduce ? 0 : 0.38,
            ease: EASE,
            opacity: { duration: reduce ? 0 : 0.18, ease: 'linear' },
          }}
          className="fixed top-[40dvh] right-0 bottom-0 z-30 flex w-full flex-col border-t border-rule bg-hull/96 outline-none md:top-0 md:w-[min(46rem,46vw)] md:border-t-0 md:border-l"
        >
          {/* The generous top padding on desktop is not decoration: it clears
              the HUD's top-right readout stack, which sits above the panel. */}
          <header className="flex items-center justify-between gap-4 border-b border-rule px-5 pt-5 pb-4 sm:px-8 md:pt-32">
            <p className="legend tabular-nums">
              {String(index + 1).padStart(2, '0')} — {copy.nodes[node].legend}
            </p>

            <button
              type="button"
              onClick={() => goTo(null)}
              aria-label={copy.hud.close}
              className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center border border-rule text-ash transition-colors duration-200 hover:border-amber hover:text-amber focus-visible:border-amber focus-visible:text-amber"
            >
              <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" className="h-3.5 w-3.5">
                <path
                  d="M3 3 L13 13 M13 3 L3 13"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="square"
                />
              </svg>
            </button>
          </header>

          {/* `data-journey-scroller` is the handle useJourneyScroll grabs. It is
              deliberately not the `panel-scroll` class: that one is a scrollbar
              style, and NodeIndex wears it too. */}
          <div
            data-journey-scroller=""
            className="panel-scroll flex-1 overflow-y-auto overscroll-contain px-5 pt-8 pb-20 sm:px-8"
          >
            {/* Both the outgoing and incoming node occupy the same grid cell, so
                switching nodes reads as a crossfade in place rather than a jump. */}
            <div className="grid">
              <AnimatePresence initial={false}>
                <motion.div
                  key={node}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduce ? 0 : 0.22, ease: EASE }}
                  className="col-start-1 row-start-1"
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
