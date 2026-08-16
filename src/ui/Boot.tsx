import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { CONTENT, IDENTITY } from '../content'
import { useApp } from '../store'

/**
 * The power-on sequence.
 *
 * It is a splash screen only in the sense that a bench instrument has one: a
 * thin amber trace drawing across, two status lines reporting in, a numeric
 * readout climbing, then a control that says the machine is yours. It never
 * traps anyone — once the readout tops out, the visitor can press Enter, click
 * the control, or simply wait.
 */

const EASE = [0.16, 1, 0.3, 1] as const
const EXIT_EASE = [0.4, 0, 1, 1] as const

/** How long the ramp takes when nothing is blocking it. */
const RAMP_MS = 1600
/** The readout holds short of 100 until fonts land — or until this gives up. */
const FONT_DEADLINE_MS = 3200
/** Nobody should be stranded at a splash screen. */
const AUTO_DISMISS_MS = 4200

/** Progress each status line is considered satisfied at. */
const LINE_THRESHOLDS = [45, 100]

export function Boot() {
  const booting = useApp((s) => s.booting)
  const finishBoot = useApp((s) => s.finishBoot)
  const lang = useApp((s) => s.lang)
  const reduce = useReducedMotion() ?? false
  const copy = CONTENT[lang]

  // Seeded from the media query rather than from `reduce`, so a visitor who
  // asked for less motion never sees a frame of the ramp at zero.
  const [progress, setProgress] = useState(() =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 100
      : 0,
  )
  const doneRef = useRef(false)
  const enterRef = useRef<HTMLButtonElement | null>(null)

  const dismiss = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    finishBoot()
  }, [finishBoot])

  // The ramp. Eased so it decelerates into place rather than sliding linearly,
  // and capped below 100 until the webfonts are actually ready — a readout that
  // reports completion before the type has swapped is lying.
  useEffect(() => {
    if (reduce) {
      setProgress(100)
      return
    }

    let raf = 0
    let cancelled = false
    let fontsReady = false
    const start = performance.now()

    const markReady = () => {
      fontsReady = true
    }
    // `document.fonts` is missing on a few older engines; the deadline below
    // covers that case, so failing to observe it is never fatal.
    document.fonts?.ready.then(markReady, markReady)

    const tick = (now: number) => {
      if (cancelled) return
      const elapsed = now - start
      const linear = Math.min(1, elapsed / RAMP_MS)
      const eased = 1 - Math.pow(1 - linear, 3)
      const unlocked = fontsReady || elapsed > FONT_DEADLINE_MS
      const value = unlocked ? eased : Math.min(eased, 0.92)
      setProgress(Math.round(value * 100))
      if (value < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [reduce])

  const ready = progress >= 100

  // Once it is ready the control takes focus, so Enter and Space work through
  // the button itself, and a timer takes over if the visitor does nothing.
  useEffect(() => {
    if (!ready) return
    enterRef.current?.focus({ preventScroll: true })
    const id = window.setTimeout(dismiss, AUTO_DISMISS_MS)
    return () => window.clearTimeout(id)
  }, [ready, dismiss])

  // …and from anywhere else on the page too, in case focus went elsewhere.
  useEffect(() => {
    if (!ready) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return
      e.preventDefault()
      dismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ready, dismiss])

  const lines = [copy.boot.line1, copy.boot.line2]

  return (
    <AnimatePresence>
      {booting && (
        <motion.div
          key="boot"
          // No entrance: this is the first paint, there is nothing to enter from.
          initial={false}
          exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.015 }}
          transition={{ duration: reduce ? 0 : 0.26, ease: EXIT_EASE }}
          className="fixed inset-0 z-50 flex flex-col justify-between overflow-hidden bg-void px-6 py-8 sm:px-12 sm:py-12"
        >
          <div className="flex items-start justify-between gap-4">
            <p className="legend">{copy.hud.location}</p>
            <p className="readout tabular-nums">{IDENTITY.coords}</p>
          </div>

          <div className="max-w-3xl py-10">
            <motion.h1
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduce ? 0 : 0.5, ease: EASE }}
              className="text-[clamp(2.1rem,8vw,4.75rem)] text-bone"
            >
              {IDENTITY.name}
            </motion.h1>

            <motion.p
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: reduce ? 0 : 0.4, delay: reduce ? 0 : 0.12, ease: EASE }}
              className="mt-4 font-mono text-[0.68rem] uppercase tracking-[0.22em] text-amber sm:text-xs"
            >
              {copy.hero.role}
            </motion.p>

            <motion.p
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: reduce ? 0 : 0.4, delay: reduce ? 0 : 0.22, ease: EASE }}
              className="mt-6 max-w-xl font-body text-sm leading-relaxed text-ash sm:text-base"
            >
              {copy.hero.tagline}
            </motion.p>
          </div>

          <div>
            {/* The trace. It is the progress bar and the rule at once. */}
            <div className="relative h-px w-full bg-rule">
              <motion.div
                aria-hidden="true"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: progress / 100 }}
                transition={{ duration: reduce ? 0 : 0.3, ease: EASE }}
                style={{ transformOrigin: 'left center' }}
                className="absolute inset-y-0 left-0 w-full bg-amber"
              />
            </div>

            <ul className="mt-5 flex flex-col gap-2">
              {lines.map((line, i) => {
                const satisfied = progress >= LINE_THRESHOLDS[i]
                return (
                  <motion.li
                    key={line}
                    initial={reduce ? false : { opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: reduce ? 0 : 0.4,
                      delay: reduce ? 0 : 0.18 + i * 0.16,
                      ease: EASE,
                    }}
                    className="flex items-center gap-3"
                  >
                    <span
                      aria-hidden="true"
                      className={
                        satisfied
                          ? 'h-1.5 w-1.5 shrink-0 bg-amber'
                          : 'h-1.5 w-1.5 shrink-0 bg-rule'
                      }
                    />
                    <span className="font-mono text-[0.66rem] tracking-[0.06em] text-ash">
                      {line}
                    </span>
                    <span aria-hidden="true" className="hairline hidden flex-1 sm:block" />
                  </motion.li>
                )
              })}
            </ul>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
              <motion.button
                ref={enterRef}
                type="button"
                disabled={!ready}
                onClick={dismiss}
                animate={{ opacity: ready ? 1 : 0.3 }}
                transition={{ duration: reduce ? 0 : 0.3, ease: EASE }}
                className="border border-rule px-7 py-3 font-mono text-[0.68rem] uppercase tracking-[0.24em] text-bone transition-colors duration-200 enabled:hover:border-amber enabled:hover:text-amber disabled:cursor-default"
              >
                {copy.boot.enter}
              </motion.button>

              {/* Deliberately not a live region: this ticks every frame, and
                  announcing it would drown a screen reader. The Enter control
                  taking focus is the accessible signal that loading finished. */}
              <p className="readout tabular-nums text-amber">
                {String(progress).padStart(3, '0')}%
              </p>
            </div>

            <p className="legend mt-5">{copy.boot.hint}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
