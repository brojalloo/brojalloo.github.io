import { motion } from 'framer-motion'
import { stagger, useRise } from './motion'
import { CONTENT, SKILL_GROUPS } from '../content'
import { useApp } from '../store'

/**
 * Ten groups on a bench. CSS columns keep the ragged group heights balanced
 * without a masonry library; `break-inside: avoid` stops a group from being
 * cut across a column boundary.
 */
export function Arsenal() {
  const lang = useApp((s) => s.lang)
  const c = CONTENT[lang].arsenal
  const item = useRise()

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      <motion.header variants={item}>
        <p className="legend">{c.kicker}</p>
        <h2 className="mt-4 max-w-[24ch] text-3xl text-bone sm:text-4xl">{c.heading}</h2>
        <p className="mt-5 max-w-[62ch] text-[0.95rem] leading-[1.75] text-ash">{c.note}</p>
      </motion.header>

      <div className="mt-12 columns-1 gap-x-12 sm:columns-2 lg:columns-3">
        {SKILL_GROUPS.map((group) => (
          <section key={group.key} className="mb-10 break-inside-avoid">
            {/* The transform lives inside the column box, never on it. */}
            <motion.div variants={item}>
              <h3 className="legend">{c.groups[group.key]}</h3>
              <div className="hairline mt-3" />
              <ul>
                {group.items.map((entry) => (
                  <li
                    key={entry.name}
                    className="flex items-baseline justify-between gap-4 border-b border-rule py-2.5"
                  >
                    <span className="min-w-0 text-[0.95rem] text-bone">{entry.name}</span>
                    {entry.note ? (
                      <span className="shrink-0 font-mono text-[0.62rem] tracking-[0.08em] text-mute">
                        {entry.note}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </motion.div>
          </section>
        ))}
      </div>
    </motion.div>
  )
}
