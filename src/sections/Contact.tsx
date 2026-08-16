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

/** Speech bubble with a handset inside — drawn here, not a brand asset. */
function WhatsAppGlyph() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d="M2 14l1.1-3.1A5.6 5.6 0 0 1 4.7 3.2a5.9 5.9 0 0 1 6.6 0 5.6 5.6 0 0 1 .3 9.1 5.9 5.9 0 0 1-6.4.5L2 14z" />
      <path d="M6.1 6c.2 1 .6 1.8 1.3 2.5.7.7 1.5 1.1 2.5 1.3l.6-.9 1.1.6-.3 1c-1.3.3-2.7-.2-3.9-1.4C6.2 7.9 5.7 6.5 6 5.2l1-.3.6 1.1z" />
    </svg>
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

        <Row label={c.labels.whatsapp}>
          <a
            href={IDENTITY.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className={`${linkClass} font-mono text-[0.85rem] tabular-nums`}
          >
            {IDENTITY.phone}
          </a>
        </Row>

        <Row label={c.labels.location}>
          <span>
            {IDENTITY.city}
            <span className="text-mute"> · </span>
            <span className="tabular-nums">{IDENTITY.postcode}</span>
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

      {/* Primary control first — the fastest way to reach him — then the CV. */}
      <motion.div variants={item} className="mt-12 flex flex-col flex-wrap gap-3 min-[480px]:flex-row min-[480px]:items-center min-[480px]:gap-4">
        <a
          href={IDENTITY.whatsappPrefilled}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-3 border border-trace px-5 py-3 font-mono text-[0.7rem] font-semibold tracking-[0.18em] text-trace uppercase transition-colors hover:bg-trace hover:text-void focus-visible:bg-trace focus-visible:text-void"
        >
          <WhatsAppGlyph />
          {c.whatsappCta}
        </a>

        <a
          href={IDENTITY.cv}
          download
          className="inline-flex items-center justify-center gap-3 border border-amber px-5 py-3 font-mono text-[0.7rem] font-semibold tracking-[0.18em] text-amber uppercase transition-colors hover:bg-amber hover:text-void focus-visible:bg-amber focus-visible:text-void"
        >
          {c.cv}
          <span aria-hidden="true">↓</span>
        </a>
      </motion.div>
    </motion.div>
  )
}
