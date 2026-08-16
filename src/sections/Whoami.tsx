import { motion } from 'framer-motion'
import { stagger, useRise } from './motion'
import { CONTENT } from '../content'
import { useApp } from '../store'

export function Whoami() {
  const lang = useApp((s) => s.lang)
  const c = CONTENT[lang].whoami
  const item = useRise()

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      <motion.header variants={item}>
        <p className="legend">{c.kicker}</p>
        <h2 className="mt-4 max-w-[24ch] text-3xl text-bone sm:text-4xl">{c.heading}</h2>
      </motion.header>

      {c.body.map((paragraph) => (
        <motion.p
          key={paragraph.slice(0, 32)}
          variants={item}
          className="mt-6 max-w-[62ch] text-[0.95rem] leading-[1.75] text-ash"
        >
          {paragraph}
        </motion.p>
      ))}

      <motion.dl variants={item} className="mt-12 border-t border-rule">
        {c.facts.map((fact) => (
          <div
            key={fact.label}
            className="grid grid-cols-[7rem_1fr] items-baseline gap-x-4 border-b border-rule py-3 sm:grid-cols-[10rem_1fr]"
          >
            <dt className="legend">{fact.label}</dt>
            <dd className="text-[0.95rem] text-bone">{fact.value}</dd>
          </div>
        ))}
      </motion.dl>
    </motion.div>
  )
}
