import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { CONTENT, IDENTITY } from '../content'
import { useApp } from '../store'
import { LangToggle } from './LangToggle'
import { NodeIndex } from './NodeIndex'

/**
 * The instrument frame.
 *
 * Four corners, nothing in the middle — the scene owns the centre of the
 * screen and the frame never argues with it. The container is inert to the
 * pointer; only the controls inside take events back.
 */

const EASE = [0.16, 1, 0.3, 1] as const

/** Below this the frame collapses to name + language + index. */
const COMPACT_QUERY = '(max-width: 767px)'

/** Width the panel claims on desktop — the frame steps aside for it. */
const PANEL_WIDTH = 'min(46rem, 46vw)'
/** Height the panel sheet claims on mobile. */
const SHEET_HEIGHT = '60dvh'

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  )

  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setMatches(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])

  return matches
}

/**
 * Time since the page opened, as HH:MM:SS. One interval for the whole HUD,
 * torn down on unmount; the digits are tabular so nothing shifts on each tick.
 */
function useSessionClock(): string {
  const startRef = useRef(Date.now())
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const total = Math.max(0, Math.floor((now - startRef.current) / 1000))
  const hh = String(Math.floor(total / 3600)).padStart(2, '0')
  const mm = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const ss = String(total % 60).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

export function Hud() {
  const active = useApp((s) => s.active)
  const lang = useApp((s) => s.lang)
  const reduce = useReducedMotion() ?? false

  const compact = useMediaQuery(COMPACT_QUERY)
  const clock = useSessionClock()
  const copy = CONTENT[lang]
  const open = active !== null

  // The identity block shrinks out of the way once a node is reading; it is a
  // signature at the overview and a nameplate once there is content to read.
  const nameSize = open
    ? compact
      ? '0.9rem'
      : '1.05rem'
    : compact
      ? '1.15rem'
      : '1.6rem'

  const hint = open ? copy.hud.escape : copy.hud.drag

  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      {/* ---- top left: identity ---- */}
      <div className="absolute top-0 left-0 max-w-[62vw] p-5 sm:p-8">
        <motion.p
          animate={{ fontSize: nameSize }}
          transition={{ duration: reduce ? 0 : 0.35, ease: EASE }}
          style={{ fontVariationSettings: "'wdth' 112" }}
          className="font-display leading-none font-bold tracking-[-0.022em] text-bone"
        >
          {IDENTITY.name}
        </motion.p>

        <AnimatePresence initial={false}>
          {!open && !compact && (
            <motion.p
              key="role"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={{ duration: reduce ? 0 : 0.25, ease: EASE }}
              className="legend mt-2.5"
            >
              {copy.hero.role}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* ---- top right: language + live readouts ---- */}
      <div className="absolute top-0 right-0 flex flex-col items-end p-5 sm:p-8">
        <LangToggle />

        {!compact && (
          <div className="mt-3 flex flex-col items-end gap-1 text-right">
            <p className="readout tabular-nums">{IDENTITY.coords}</p>
            <p className="readout tabular-nums">
              <span className="text-mute">{copy.hud.session}</span> {clock}
            </p>
          </div>
        )}
      </div>

      {/* ---- bottom: node index ----
          On desktop it sits in the bottom-left corner. On a phone it becomes a
          strip that rides on the leading edge of the panel sheet, so opening a
          node never buries the navigation under it. */}
      <div
        className={
          compact
            ? 'absolute right-0 left-0 px-4 pb-4 transition-[bottom] duration-300 ease-out'
            : 'absolute bottom-0 left-0 max-w-[38vw] p-5 sm:p-8'
        }
        style={compact ? { bottom: open ? SHEET_HEIGHT : 0 } : undefined}
      >
        <NodeIndex orientation={compact ? 'horizontal' : 'vertical'} />
      </div>

      {/* ---- bottom right: contextual hint ----
          Steps left by exactly the panel width when a node is open, so the two
          never sit on top of one another. */}
      {!compact && (
        <div
          className="absolute bottom-0 p-5 transition-[right] duration-300 ease-out sm:p-8"
          style={{ right: open ? PANEL_WIDTH : 0 }}
        >
          <div className="relative h-4 w-full">
            <AnimatePresence initial={false}>
              <motion.p
                key={hint}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduce ? 0 : 0.25, ease: EASE }}
                className="legend absolute right-0 bottom-0 whitespace-nowrap"
              >
                {hint}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  )
}
