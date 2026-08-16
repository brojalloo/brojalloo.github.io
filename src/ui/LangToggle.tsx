import { useEffect } from 'react'
import { CONTENT } from '../content'
import { useApp } from '../store'

/**
 * FR / EN. One button, no dropdown — with two languages a menu is ceremony.
 *
 * The label already reads as the language you would switch *to*, so the button
 * says what pressing it gets you rather than what you are currently reading.
 */
export function LangToggle() {
  const lang = useApp((s) => s.lang)
  const toggleLang = useApp((s) => s.toggleLang)

  // The store keeps `document.documentElement.lang` in step on every toggle,
  // but nothing has applied the *initial* value yet — the language may have
  // come from localStorage or from the browser, not from the markup.
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const copy = CONTENT[lang].hud

  return (
    <button
      type="button"
      onClick={toggleLang}
      aria-label={copy.langLabel}
      className="pointer-events-auto border border-rule px-3 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ash transition-colors duration-200 hover:border-amber hover:text-amber focus-visible:border-amber focus-visible:text-amber"
    >
      {copy.lang}
    </button>
  )
}
