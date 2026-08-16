import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { CONTENT } from '../content'
import { useApp } from '../store'
import { NODE_IDS } from '../types'

/**
 * The escape hatch from the 3D.
 *
 * Somebody reading a CV at 22:00 should never have to learn an orbit control to
 * reach the contact details. This is a plain keyboard-operable list that names
 * every node and jumps straight to it; hovering an entry lights the matching
 * body in the scene, so the two views stay tied together.
 */

const EASE = [0.16, 1, 0.3, 1] as const

export interface NodeIndexProps {
  /**
   * `vertical` is the desktop column in the bottom-left corner. `horizontal`
   * is the scrollable strip the HUD falls back to on narrow viewports.
   */
  orientation?: 'vertical' | 'horizontal'
}

export function NodeIndex({ orientation = 'vertical' }: NodeIndexProps) {
  const active = useApp((s) => s.active)
  const hovered = useApp((s) => s.hovered)
  const lang = useApp((s) => s.lang)
  const goTo = useApp((s) => s.goTo)
  const setHovered = useApp((s) => s.setHovered)
  const reduce = useReducedMotion() ?? false

  const copy = CONTENT[lang]
  const row = orientation === 'horizontal'

  return (
    <nav
      aria-label={copy.hud.nodes}
      className={
        row
          ? 'pointer-events-auto flex w-full flex-col gap-2'
          : 'pointer-events-auto flex flex-col gap-3'
      }
    >
      <ul
        className={
          row
            ? 'panel-scroll -mx-1 flex items-stretch gap-1 overflow-x-auto px-1 pb-1'
            : 'flex flex-col gap-px'
        }
      >
        {NODE_IDS.map((id, i) => {
          const isActive = active === id
          const isHovered = hovered === id && !isActive

          const label = isActive
            ? 'text-bone'
            : isHovered
              ? 'text-amber'
              : 'text-mute'

          const marker = row
            ? isActive
              ? 'h-px w-4 shrink-0 bg-amber'
              : isHovered
                ? 'h-px w-4 shrink-0 bg-amber/50'
                : 'h-px w-4 shrink-0 bg-transparent'
            : isActive
              ? 'h-3 w-px shrink-0 bg-amber'
              : isHovered
                ? 'h-3 w-px shrink-0 bg-amber/50'
                : 'h-3 w-px shrink-0 bg-transparent'

          return (
            <li key={id}>
              <button
                type="button"
                aria-current={isActive ? 'true' : undefined}
                onClick={() => goTo(id)}
                onPointerEnter={() => setHovered(id)}
                onPointerLeave={() => setHovered(null)}
                onFocus={() => setHovered(id)}
                onBlur={() => setHovered(null)}
                className={
                  row
                    ? 'flex items-center gap-2 whitespace-nowrap border border-rule px-3 py-2 text-left transition-colors duration-200 hover:border-amber/60'
                    : 'flex w-full items-center gap-3 py-1.5 pr-2 text-left transition-colors duration-200'
                }
              >
                <span aria-hidden="true" className={marker} />
                <span className="font-mono text-[0.6rem] tabular-nums tracking-[0.14em] text-mute">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span
                  className={`font-mono text-[0.68rem] tracking-[0.06em] transition-colors duration-200 ${label}`}
                >
                  {copy.nodes[id].title}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <AnimatePresence initial={false}>
        {active !== null && (
          <motion.button
            key="back"
            type="button"
            onClick={() => goTo(null)}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: reduce ? 0 : 0.24, ease: EASE }}
            className="flex items-center gap-2 self-start whitespace-nowrap font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ash transition-colors duration-200 hover:text-amber focus-visible:text-amber"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" className="h-3 w-3">
              <path
                d="M10 3 L5 8 L10 13"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="square"
              />
            </svg>
            {copy.hud.backShort}
          </motion.button>
        )}
      </AnimatePresence>
    </nav>
  )
}
