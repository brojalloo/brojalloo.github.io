import { motion } from 'framer-motion'
import { stagger, useRise } from './motion'
import { CONTENT, TIMELINE } from '../content'
import { useApp } from '../store'

type Entry = (typeof TIMELINE)[number]

/**
 * The entry still running is the one whose period is left open with an arrow.
 * Reading it out of the period keeps the "current" state in the data, so the
 * day a new line is added nothing here needs editing.
 */
function isCurrent(entry: Entry) {
  return entry.period.includes('→')
}

/**
 * The marker reads the entry back at a glance: a hollow dot for a period of
 * study, filled amber while it is still running, a plain tick for work.
 */
function marker(entry: Entry) {
  if (isCurrent(entry)) return 'h-2 w-2 rounded-full bg-amber'
  if (entry.kind === 'work') return 'h-px w-3 bg-mute'
  return 'h-2 w-2 rounded-full border border-ash'
}

export function Parcours() {
  const lang = useApp((s) => s.lang)
  const c = CONTENT[lang].parcours
  const item = useRise()

  const studies = TIMELINE.filter((entry) => entry.kind === 'study')
  const work = TIMELINE.filter((entry) => entry.kind === 'work')

  const block = (title: string, entries: Entry[], spacing: string) => (
    <motion.section variants={stagger} className={spacing}>
      <motion.h3 variants={item} className="legend">
        {title}
      </motion.h3>
      <div className="hairline mt-3" />

      <motion.ol variants={stagger} className="mt-8 border-l border-rule pl-6 sm:pl-8">
        {entries.map((entry) => (
          <motion.li key={entry.key} variants={item} className="relative pb-9 last:pb-0">
            <span
              aria-hidden="true"
              className={`absolute top-2 -left-6 -translate-x-1/2 sm:-left-8 ${marker(entry)}`}
            />
            <p className="font-mono text-[0.66rem] tabular-nums text-mute">{entry.key === 'binn' ? c.binn.period : entry.period}</p>
            <h4
              className={`mt-2 max-w-[36ch] text-base sm:text-lg ${
                isCurrent(entry) ? 'text-bone' : 'text-bone/70'
              }`}
            >
              {c.entries[entry.key]}
            </h4>
            <p className="mt-1 max-w-[48ch] text-[0.9rem] text-ash">{entry.place}</p>
            {entry.key === 'binn' && (
              <>
                <p className="mt-2 max-w-[48ch] text-[0.8rem] text-amber">{c.binn.duration}</p>
                <p className="mt-3 max-w-[62ch] text-[0.9rem] leading-relaxed text-ash">{c.binn.missions}</p>
              </>
            )}
          </motion.li>
        ))}
      </motion.ol>
    </motion.section>
  )

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      <motion.header variants={item}>
        <p className="legend">{c.kicker}</p>
        <h2 className="mt-4 max-w-[24ch] text-3xl text-bone sm:text-4xl">{c.heading}</h2>
      </motion.header>

      {block(c.studiesTitle, studies, 'mt-12')}
      {block(c.workTitle, work, 'mt-14')}
    </motion.div>
  )
}
