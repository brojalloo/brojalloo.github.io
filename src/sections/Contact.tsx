import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { stagger, useRise } from './motion'
import { CONTENT, IDENTITY } from '../content'
import { useApp } from '../store'

function CopyButton({ value, idle, done }: { value: string; idle: string; done: string }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | null>(null)

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current) }, [])

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      // Clipboard access can be denied outright; the address is still visible
      // and selectable next to the button, so there is nothing to recover.
      return
    }
    setCopied(true)
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="legend shrink-0 border border-rule px-2 py-1 transition-colors hover:border-amber hover:text-amber focus-visible:border-amber focus-visible:text-amber"
    >
      {copied ? done : idle}
    </button>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] items-baseline gap-x-4 border-b border-rule py-3.5 sm:grid-cols-[9rem_1fr]">
      <dt className="legend">{label}</dt>
      <dd className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[0.95rem] text-bone">
        {children}
      </dd>
    </div>
  )
}

const linkClass =
  'text-bone underline decoration-rule underline-offset-4 transition-colors hover:decoration-amber hover:text-amber focus-visible:text-amber'

export function Contact() {
  const lang = useApp((s) => s.lang)
  const c = CONTENT[lang].contact
  const item = useRise()

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      <motion.header variants={item}>
        <p className="legend">{c.kicker}</p>
        <h2 className="mt-4 max-w-[22ch] text-3xl text-bone sm:text-4xl">{c.heading}</h2>
      </motion.header>

      <motion.p variants={item} className="mt-6 max-w-[62ch] text-[0.95rem] leading-[1.75] text-ash">
        {c.body}
      </motion.p>

      <motion.dl variants={item} className="mt-12 border-t border-rule">
        <Row label={c.labels.email}>
          <a href={`mailto:${IDENTITY.email}`} className={`${linkClass} font-mono text-[0.85rem]`}>
            {IDENTITY.email}
          </a>
          <CopyButton value={IDENTITY.email} idle={c.copy} done={c.copied} />
        </Row>

        <Row label={c.labels.phone}>
          <a href={`tel:${IDENTITY.phoneHref}`} className={`${linkClass} font-mono text-[0.85rem] tabular-nums`}>
            {IDENTITY.phone}
          </a>
          <CopyButton value={IDENTITY.phone} idle={c.copy} done={c.copied} />
        </Row>

        <Row label={c.labels.location}>
          <span>
            {IDENTITY.city}
            <span className="text-mute"> · </span>
            {IDENTITY.country[lang]}
          </span>
        </Row>

        <Row label={c.labels.github}>
          <a href={IDENTITY.github} target="_blank" rel="noopener noreferrer" className={`${linkClass} font-mono text-[0.85rem]`}>
            {IDENTITY.githubHandle}
          </a>
        </Row>

        <Row label={c.labels.linkedin}>
          <a href={IDENTITY.linkedin} target="_blank" rel="noopener noreferrer" className={`${linkClass} font-mono text-[0.85rem]`}>
            {IDENTITY.name}
          </a>
        </Row>
      </motion.dl>

      <motion.div variants={item} className="mt-12">
        <a
          href="/CV-Ibrahima-Diallo.pdf"
          download
          className="inline-flex items-center gap-3 border border-amber px-5 py-3 font-mono text-[0.7rem] font-semibold tracking-[0.18em] text-amber uppercase transition-colors hover:bg-amber hover:text-void focus-visible:bg-amber focus-visible:text-void"
        >
          {c.cv}
          <span aria-hidden="true">↓</span>
        </a>
      </motion.div>
    </motion.div>
  )
}
