import { motion } from 'framer-motion'
import { stagger, useRise } from './motion'
import { CONTENT, SKILL_GROUPS } from '../content'
import { useApp } from '../store'

export function Arsenal() {
  const lang = useApp((s) => s.lang)
  const c = CONTENT[lang].arsenal
  const item = useRise()

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      <motion.header variants={item}>
        <p className="legend">{c.kicker}</p>
        <h2 className="mt-4 max-w-[24ch] text-3xl text-bone sm:text-4xl">{c.heading}</h2>
      </motion.header>

      <div className="mt-12 grid gap-10 sm:grid-cols-2 sm:gap-x-12">
        {SKILL_GROUPS.map((group) => (
          <motion.section key={group.key} variants={item}>
            <h3 className="legend">{c.groups[group.key]}</h3>
            <div className="hairline mt-3" />
            <ul>
              {group.items.map((entry) => (
                <li
                  key={entry.name}
                  className="flex items-baseline justify-between gap-4 border-b border-rule py-2.5"
                >
                  <span className="text-[0.95rem] text-bone">{entry.name}</span>
                  {entry.note ? (
                    <span className="shrink-0 font-mono text-[0.62rem] tracking-[0.08em] text-mute">
                      {entry.note}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </motion.section>
        ))}
      </div>
    </motion.div>
  )
}
