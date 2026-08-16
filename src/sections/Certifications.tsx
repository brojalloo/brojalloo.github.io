import { motion } from 'framer-motion'
import { stagger, useRise } from './motion'
import { CERTIFICATIONS, CONTENT, formatCertDate } from '../content'
import { useApp } from '../store'

/*
  Cards are plain boxes: one hairline, square corners, no shadow. The only
  distinction a card can carry is the amber edge on the ones worth reading
  first — no badge, no ribbon. Sides are set individually so the featured
  edge never depends on utility ordering to beat the shorthand.
*/
const CARD = 'flex h-full flex-col bg-hull p-5 sm:p-6'
const PLAIN = 'border border-rule'
const FEATURED =
  'border-y border-r border-y-rule border-r-rule border-l-[3px] border-l-amber'

export function Certifications() {
  const lang = useApp((s) => s.lang)
  const c = CONTENT[lang].certifications
  const item = useRise()

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      <motion.header variants={item}>
        <p className="legend">{c.kicker}</p>
        <h2 className="mt-4 max-w-[24ch] text-3xl text-bone sm:text-4xl">{c.heading}</h2>
        <p className="mt-6 max-w-[62ch] text-[0.95rem] leading-[1.75] text-ash">{c.note}</p>
      </motion.header>

      <motion.p variants={item} className="mt-12 flex items-baseline gap-3">
        <span className="readout text-base tabular-nums text-bone">
          {String(CERTIFICATIONS.length).padStart(2, '0')}
        </span>
        <span className="legend">{c.count}</span>
      </motion.p>
      <div className="hairline mt-3" />

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-5">
        {CERTIFICATIONS.map((cert) => {
          const date = formatCertDate(cert.date, lang)

          return (
            <motion.li
              key={cert.key}
              variants={item}
              className={`${CARD} ${cert.featured ? FEATURED : PLAIN}`}
            >
              <h3
                className={`max-w-[24ch] text-bone ${
                  cert.featured ? 'text-[1.05rem] sm:text-lg' : 'text-[0.95rem]'
                }`}
              >
                {cert.name}
              </h3>

              <p className="legend mt-3">{cert.issuer}</p>

              <p className="mt-auto pt-6 font-mono text-[0.66rem] tracking-[0.08em] tabular-nums">
                {date ? (
                  <span className="text-mute">{date}</span>
                ) : (
                  <span className="text-trace">{c.completed}</span>
                )}
              </p>
            </motion.li>
          )
        })}
      </ul>
    </motion.div>
  )
}
