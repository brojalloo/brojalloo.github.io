import type { ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { EASE, stagger, useRise } from './motion'
import { CONTENT, STAGES } from '../content'
import { useApp } from '../store'

type Item = Variants

function pad(n: number) {
  return n.toString().padStart(2, '0')
}

/** Sub-block of the pipeline readout: a hairline, a title, then the data. */
function Block({ item, title, children }: { item: Item; title: string; children: ReactNode }) {
  return (
    <motion.section variants={item} className="mt-14">
      <div className="hairline" />
      <h3 className="mt-6 text-lg text-bone sm:text-xl">{title}</h3>
      {children}
    </motion.section>
  )
}

export function Pipeline() {
  const lang = useApp((s) => s.lang)
  const stage = useApp((s) => s.stage)
  const setStage = useApp((s) => s.setStage)
  // `reduced` is still needed on its own here: the stage accordion animates its
  // height, which the shared entrance variant does not cover.
  const reduced = useReducedMotion()
  const item = useRise()
  const c = CONTENT[lang].pipeline

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      <motion.header variants={item}>
        <p className="legend">{c.kicker}</p>
        <h2 className="mt-4 max-w-[24ch] text-3xl text-bone sm:text-4xl">{c.heading}</h2>
        <p className="mt-6 max-w-[62ch] text-[0.95rem] leading-[1.75] text-ash">{c.intro}</p>
      </motion.header>

      {/* ---- The nine stages, one open at a time ---- */}
      <motion.ul variants={item} className="mt-10 border-t border-rule">
        {STAGES.map((spec, i) => {
          const open = stage === i
          const detail = c.stageDetail[spec.key]
          const panelId = `pipeline-panel-${spec.key}`
          const tabId = `pipeline-stage-${spec.key}`

          return (
            <li key={spec.key} className="border-b border-rule">
              <button
                type="button"
                id={tabId}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setStage(open ? -1 : i)}
                className="group flex w-full items-center gap-3 py-3 text-left sm:gap-4"
              >
                <span
                  aria-hidden="true"
                  className={`h-5 w-[2px] shrink-0 ${spec.gate ? 'bg-alert' : 'bg-transparent'}`}
                />
                <span className="font-mono text-[0.68rem] tabular-nums text-mute">{pad(i + 1)}</span>
                <span
                  className={`font-mono text-[0.68rem] tracking-[0.14em] transition-colors duration-200 ${
                    open ? 'text-amber' : 'text-bone group-hover:text-amber'
                  }`}
                >
                  {spec.label}
                </span>
                <span
                  aria-hidden="true"
                  className={`ml-auto h-px w-4 shrink-0 transition-colors duration-200 ${
                    open ? 'bg-amber' : 'bg-rule group-hover:bg-mute'
                  }`}
                />
              </button>

              <AnimatePresence initial={false}>
                {open && detail ? (
                  <motion.div
                    id={panelId}
                    role="region"
                    aria-labelledby={tabId}
                    initial={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    animate={reduced ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
                    exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    transition={{ duration: reduced ? 0.15 : 0.28, ease: EASE }}
                    className="overflow-hidden"
                  >
                    <div className="pb-6 pl-8 sm:pl-[3.25rem]">
                      <p className="font-mono text-[0.7rem] tracking-[0.08em] text-trace">
                        {detail.title}
                      </p>
                      <p className="mt-3 max-w-[62ch] text-[0.9rem] leading-[1.75] text-ash">
                        {detail.body}
                      </p>
                      {spec.gate ? (
                        <p className="mt-5 max-w-[58ch] border-l-2 border-alert pl-4 text-[0.85rem] leading-[1.7] text-alert">
                          {c.gateNote}
                        </p>
                      ) : null}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </li>
          )
        })}
      </motion.ul>

      {/* ---- API surface ---- */}
      <Block item={item} title={c.api.title}>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <tbody>
              {c.api.rows.map((row) => (
                <tr key={row.method + row.route} className="border-b border-rule">
                  <td
                    className={`py-2.5 pr-3 align-top font-mono text-[0.66rem] tracking-[0.1em] ${
                      row.method === 'POST' ? 'font-semibold text-bone' : 'text-mute'
                    }`}
                  >
                    {row.method}
                  </td>
                  <th
                    scope="row"
                    className="py-2.5 pr-4 align-top font-mono text-[0.7rem] font-normal whitespace-nowrap text-trace"
                  >
                    {row.route}
                  </th>
                  <td className="py-2.5 align-top text-[0.85rem] leading-[1.6] text-ash">
                    {row.desc}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Block>

      {/* ---- The Sentry secret, as a sequence ---- */}
      <Block item={item} title={c.secrets.title}>
        <ol className="mt-5 border-t border-rule">
          {c.secrets.steps.map((step, i) => (
            <li key={step.slice(0, 32)} className="flex gap-4 border-b border-rule py-3">
              <span className="mt-[0.2rem] font-mono text-[0.66rem] tabular-nums text-amber">
                {pad(i + 1)}
              </span>
              <span className="max-w-[58ch] text-[0.9rem] leading-[1.7] text-ash">{step}</span>
            </li>
          ))}
        </ol>
      </Block>

      {/* ---- What is watched once deployed ---- */}
      <Block item={item} title={c.observability.title}>
        <dl className="mt-5 border-t border-rule">
          {c.observability.rows.map((row) => (
            <div
              key={row.k}
              className="grid grid-cols-[6rem_1fr] items-baseline gap-x-4 border-b border-rule py-3 sm:grid-cols-[9rem_1fr]"
            >
              <dt className="legend">{row.k}</dt>
              <dd className="text-[0.9rem] leading-[1.6] text-ash">{row.v}</dd>
            </div>
          ))}
        </dl>
        <blockquote className="mt-8 max-w-[58ch] border-l-2 border-amber pl-5 text-[0.95rem] leading-[1.75] text-bone">
          {c.observability.note}
        </blockquote>
      </Block>

      {/* ---- Where the project stands ---- */}
      <Block item={item} title={c.status.title}>
        <div className="mt-5 grid gap-y-8 sm:grid-cols-2 sm:gap-x-10">
          <div className="border-t border-rule pt-4">
            <p className="legend text-trace">{c.status.doneLabel}</p>
            <p className="mt-3 max-w-[42ch] text-[0.9rem] leading-[1.7] text-ash">{c.status.done}</p>
          </div>
          <div className="border-t border-rule pt-4">
            <p className="legend text-amber">{c.status.nextLabel}</p>
            <p className="mt-3 max-w-[42ch] text-[0.9rem] leading-[1.7] text-ash">{c.status.next}</p>
          </div>
        </div>
      </Block>
    </motion.div>
  )
}
