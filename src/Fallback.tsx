import { useApp } from './store'
import { CONTENT, IDENTITY } from './content'
import { NODE_IDS } from './types'
import { SECTIONS } from './sections'

/**
 * Shown when WebGL is unavailable or the canvas fails to initialise.
 *
 * This is not a stripped-down apology page: it is the same six sections, in
 * order, in a plain scrolling document. A visitor on a locked-down machine
 * still gets everything a visitor with a GPU gets, minus the scene.
 */
export function Fallback() {
  const lang = useApp((s) => s.lang)
  const c = CONTENT[lang]

  return (
    <div className="panel-scroll h-full overflow-y-auto bg-void">
      <div className="mx-auto w-full max-w-3xl px-6 py-16 sm:px-10">
        <header className="mb-14">
          <p className="legend mb-4">{c.fallback.title}</p>
          <h1 className="text-4xl text-bone sm:text-5xl">{IDENTITY.name}</h1>
          <p className="mt-3 font-mono text-sm text-amber">{c.hero.role}</p>
          <p className="mt-6 max-w-[62ch] text-ash">{c.fallback.body}</p>
        </header>

        {NODE_IDS.map((id) => {
          const Section = SECTIONS[id]
          return (
            <section key={id} className="border-t border-rule py-14" aria-label={c.nodes[id].title}>
              <Section />
            </section>
          )
        })}
      </div>
    </div>
  )
}
