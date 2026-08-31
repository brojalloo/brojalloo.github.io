import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { stagger, useRise } from './motion'
import { ARCHITECTURE, CONTENT, PROOFS, STAGES } from '../content'
import { useApp } from '../store'
import { useJourneyScroll } from '../ui/useJourneyScroll'

type Item = Variants

/** The repository the whole section describes. */
const REPO = 'https://github.com/brojalloo/devops-lap'

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

/** Decorative connector between two steps of the architecture diagram. */
function Connector() {
  return (
    <span aria-hidden="true" className="flex w-6 justify-center py-1">
      <svg width="9" height="20" viewBox="0 0 9 20" fill="none" className="text-rule">
        <path d="M4.5 0v14" stroke="currentColor" strokeWidth="1" />
        <path d="M1.5 12 4.5 16.5 7.5 12" stroke="currentColor" strokeWidth="1" />
      </svg>
    </span>
  )
}

/** Verified-result tick. Never an emoji — a drawn mark, like a checked box. */
function Tick() {
  return (
    <svg
      aria-hidden="true"
      width="11"
      height="11"
      viewBox="0 0 11 11"
      fill="none"
      className="mt-[0.32rem] shrink-0 text-trace"
    >
      <path d="M1 5.6 4.1 8.8 10 1.8" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

export function Pipeline() {
  const lang = useApp((s) => s.lang)
  // Read to highlight the stage the journey is currently at. Nothing in this
  // section sets it — the scroll position does, through useJourneyScroll.
  const stage = useApp((s) => s.stage)
  const item = useRise()

  // The panel's own scroll is the journey. Mounted here rather than in Panel,
  // so the panel keeps knowing nothing about what it displays.
  useJourneyScroll()
  const c = CONTENT[lang].pipeline

  // role="img" hides the drawing from assistive tech, so the flow is spelled
  // out once, in order, in this label.
  const flowLabel = `${c.architecture.title}. ${c.architecture.note} ${ARCHITECTURE.map(
    (step) => step.label,
  ).join(', ')}.`

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      <motion.header variants={item}>
        <p className="legend">{c.kicker}</p>
        <h2 className="mt-4 max-w-[24ch] text-3xl text-bone sm:text-4xl">{c.heading}</h2>
        <p className="mt-6 max-w-[62ch] text-[0.95rem] leading-[1.75] text-ash">{c.intro}</p>
      </motion.header>

      {/* ---- The chain, drawn end to end, before the stages detail it ---- */}
      <Block item={item} title={c.architecture.title}>
        <p className="mt-3 max-w-[58ch] text-[0.9rem] leading-[1.7] text-ash">
          {c.architecture.note}
        </p>

        <div role="img" aria-label={flowLabel} className="mt-6">
          {ARCHITECTURE.map((step, i) => {
            const opensGroup = i === 0 || ARCHITECTURE[i - 1].group !== step.group
            // The Trivy step is the only gate in the chain, so it is the only
            // one carrying accent. Red stays reserved for the 3D scene.
            const gate = step.group === 'security'

            return (
              <div key={step.key}>
                {i > 0 ? <Connector /> : null}
                <div className="flex items-start gap-3">
                  <span aria-hidden="true" className="flex w-6 shrink-0 justify-center pt-[0.35rem]">
                    <span
                      className={`block h-[7px] w-[7px] border ${
                        gate ? 'border-amber bg-amber' : 'border-mute'
                      }`}
                    />
                  </span>
                  <span className="min-w-0">
                    {opensGroup ? (
                      <span className={`legend block ${gate ? 'text-amber' : ''}`}>
                        {c.architecture.groups[step.group]}
                      </span>
                    ) : null}
                    <span
                      className={`block font-mono text-[0.72rem] leading-[1.5] tracking-[0.06em] ${
                        gate ? 'text-amber' : 'text-bone'
                      } ${opensGroup ? 'mt-1.5' : ''}`}
                    >
                      {step.label}
                    </span>
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </Block>

      {/* ---- The nine stages. All open: their stacked height is the timeline
              the camera travels along, so nothing may collapse. ---- */}
      <motion.ol variants={item} className="mt-14 border-t border-rule">
        {STAGES.map((spec, i) => {
          const detail = c.stageDetail[spec.key]
          const current = stage === i

          return (
            <li
              key={spec.key}
              id={`stage-anchor-${spec.key}`}
              data-stage-index={i}
              className="border-b border-rule py-6"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <span
                  aria-hidden="true"
                  className={`h-5 w-[2px] shrink-0 ${spec.gate ? 'bg-alert' : 'bg-transparent'}`}
                />
                <span className="font-mono text-[0.68rem] tabular-nums text-mute">{pad(i + 1)}</span>
                <span
                  className={`font-mono text-[0.68rem] tracking-[0.14em] transition-colors duration-300 ${
                    current ? 'text-amber' : 'text-bone'
                  }`}
                >
                  {spec.label}
                </span>
                <span
                  aria-hidden="true"
                  className={`ml-auto h-px shrink-0 transition-all duration-300 ${
                    current ? 'w-10 bg-amber' : 'w-4 bg-rule'
                  }`}
                />
              </div>

              {detail ? (
                <div className="pt-4 pl-8 sm:pl-[3.25rem]">
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
              ) : null}
            </li>
          )
        })}
      </motion.ol>

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

      {/* ---- What was actually observed ---- */}
      <Block item={item} title={c.proofs.title}>
        <p className="mt-3 max-w-[58ch] text-[0.9rem] leading-[1.7] text-ash">{c.proofs.note}</p>
        <ul className="mt-6 grid border-t border-rule sm:grid-cols-2 sm:gap-x-10">
          {PROOFS.map((key) => {
            const line = c.proofs.items[key]
            if (!line) return null
            return (
              <li key={key} className="flex gap-3 border-b border-rule py-3">
                <Tick />
                <span className="text-[0.9rem] leading-[1.6] text-bone">{line}</span>
              </li>
            )
          })}
        </ul>

        <a
          href={REPO}
          target="_blank"
          rel="noopener noreferrer"
          className="group mt-8 inline-flex items-baseline gap-2 font-mono text-[0.66rem] tracking-[0.18em] text-amber uppercase"
        >
          <span className="relative">
            {c.repo}
            <span
              aria-hidden="true"
              className="absolute -bottom-1 left-0 h-px w-0 bg-amber transition-[width] duration-300 ease-out group-hover:w-full group-focus-visible:w-full"
            />
          </span>
          <span aria-hidden="true">↗</span>
        </a>
      </Block>
    </motion.div>
  )
}
