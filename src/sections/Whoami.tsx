import { motion } from 'framer-motion'
import { stagger, useRise } from './motion'
import { CONTENT, IDENTITY } from '../content'
import { useApp } from '../store'

/**
 * The identity plate: portrait beside the name, then the written answer to
 * "why economics, then this". The path strip at the bottom is the argument —
 * six steps read left to right, the last one lit, because it is the
 * destination rather than another entry in a list.
 */
export function Whoami() {
  const lang = useApp((s) => s.lang)
  const c = CONTENT[lang].whoami
  const hero = CONTENT[lang].hero
  const item = useRise()

  const steps = c.path.steps
  const lastStep = steps.length - 1

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      {/* Portrait + identity. Stacks under 640px, side by side above it. */}
      <motion.div
        variants={item}
        className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8"
      >
        <img
          src={IDENTITY.photo}
          width={1828}
          height={2560}
          alt={c.photoAlt}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="aspect-[4/5] w-40 shrink-0 border border-rule object-cover object-top sm:w-[200px]"
        />

        <div className="min-w-0 sm:pt-1">
          <h2 className="font-display text-2xl text-bone sm:text-3xl">{IDENTITY.name}</h2>
          <p className="mt-2 font-mono text-[0.78rem] tracking-[0.06em] text-amber">{hero.role}</p>
          <p className="legend mt-4 leading-[1.9]">{hero.keywords}</p>
        </div>
      </motion.div>

      <motion.header variants={item} className="mt-12">
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

      {/* Economics → DevSecOps, as a progression rather than a list. */}
      <motion.section variants={item} className="mt-14">
        <h3 className="legend">{c.path.title}</h3>
        <div className="hairline mt-3" />

        <ol className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
          {steps.map((step, i) => (
            <li key={step} className="flex items-center gap-x-3">
              <span
                className={
                  i === lastStep
                    ? 'font-mono text-[0.72rem] font-semibold tracking-[0.12em] text-amber uppercase'
                    : 'font-mono text-[0.72rem] tracking-[0.12em] text-mute uppercase'
                }
              >
                {step}
              </span>
              {i < lastStep ? (
                <span aria-hidden="true" className="text-[0.7rem] text-mute">
                  →
                </span>
              ) : null}
            </li>
          ))}
        </ol>

        <p className="mt-6 max-w-[62ch] text-[0.95rem] leading-[1.75] text-ash">{c.path.note}</p>
      </motion.section>
    </motion.div>
  )
}
