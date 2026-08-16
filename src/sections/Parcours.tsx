import { motion } from 'framer-motion'
import { stagger, useRise } from './motion'
import { CONTENT, TIMELINE } from '../content'
import { useApp } from '../store'

/**
 * The marker reads the entry back at a glance: a filled amber dot for a
 * certification, a hollow one for a period of study, a plain tick for work.
 */
function marker(kind: 'study' | 'cert' | 'work') {
  if (kind === 'cert') return 'h-2 w-2 rounded-full bg-amber'
  if (kind === 'study') return 'h-2 w-2 rounded-full border border-ash'
  return 'h-px w-3 bg-mute'
}

export function Parcours() {
  const lang = useApp((s) => s.lang)
  const c = CONTENT[lang].parcours
  const item = useRise()

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      <motion.header variants={item}>
        <p className="legend">{c.kicker}</p>
        <h2 className="mt-4 max-w-[24ch] text-3xl text-bone sm:text-4xl">{c.heading}</h2>
      </motion.header>

      <ol className="mt-12 border-l border-rule pl-6 sm:pl-8">
        {TIMELINE.map((entry) => (
          <motion.li key={entry.key} variants={item} className="relative pb-9 last:pb-0">
            <span
              aria-hidden="true"
              className={`absolute top-2 -left-6 -translate-x-1/2 sm:-left-8 ${marker(entry.kind)}`}
            />
            <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="font-mono text-[0.66rem] tabular-nums text-mute">
                {entry.period}
              </span>
              <span className="legend">{c.kinds[entry.kind]}</span>
            </p>
            <h3 className="mt-2 max-w-[36ch] text-base text-bone sm:text-lg">
              {c.entries[entry.key]}
            </h3>
            <p className="mt-1 max-w-[48ch] text-[0.9rem] text-ash">{entry.place}</p>
          </motion.li>
        ))}
      </ol>
    </motion.div>
  )
}
