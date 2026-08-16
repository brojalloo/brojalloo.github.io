import { motion } from 'framer-motion'
import { stagger, useRise } from './motion'
import { CONTENT, IDENTITY, PROJECTS } from '../content'
import type { Lang, Project } from '../types'
import { useApp } from '../store'

/*
  `Project.key` is a plain string, while the copy table has one entry per
  project. This narrows one to the other without a cast, so a new project
  added to PROJECTS without matching copy simply renders no prose rather
  than crashing.
*/
type ProjetsCopy = (typeof CONTENT)[Lang]['projets']
type ProjectKey = Extract<keyof ProjetsCopy, 'devopsLab' | 'tekkiPro' | 'senRecrutement'>

const PROJECT_KEYS: ProjectKey[] = ['devopsLab', 'tekkiPro', 'senRecrutement']

function isProjectKey(key: string): key is ProjectKey {
  return (PROJECT_KEYS as string[]).includes(key)
}

function copyFor(copy: ProjetsCopy, project: Project) {
  return isProjectKey(project.key) ? copy[project.key] : null
}

const linkClass =
  'group inline-flex items-baseline gap-2 font-mono text-[0.66rem] tracking-[0.18em] uppercase'

/** Text link whose underline draws on hover. Shared by the repo and the CTA. */
function DrawnLink({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`${linkClass} text-amber`}>
      <span className="relative">
        {children}
        <span
          aria-hidden="true"
          className="absolute -bottom-1 left-0 h-px w-0 bg-amber transition-[width] duration-300 ease-out group-hover:w-full group-focus-visible:w-full"
        />
      </span>
      <span aria-hidden="true">↗</span>
    </a>
  )
}

export function Projets() {
  const lang = useApp((s) => s.lang)
  const c = CONTENT[lang].projets
  const item = useRise()

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      <motion.header variants={item}>
        <p className="legend">{c.kicker}</p>
        <h2 className="mt-4 max-w-[24ch] text-3xl text-bone sm:text-4xl">{c.heading}</h2>
      </motion.header>

      {PROJECTS.map((project, i) => {
        const copy = copyFor(c, project)
        if (!copy) return null

        // The stack is empty for projects whose technologies are not publicly
        // verifiable, so the metadata line falls back to the year alone.
        const meta = [project.year, ...project.stack]

        return (
          <motion.article key={project.key} variants={item} className={i === 0 ? 'mt-12' : 'mt-16'}>
            {i > 0 ? <div className="hairline mb-16" /> : null}

            {project.featured ? (
              <p className="legend mb-3 text-amber">{c.featuredLabel}</p>
            ) : null}

            <h3
              className={
                project.featured ? 'text-3xl text-bone sm:text-4xl' : 'text-2xl text-bone sm:text-3xl'
              }
            >
              {project.name}
            </h3>

            <p className="mt-3 flex flex-wrap items-center gap-y-1 font-mono text-[0.64rem] tracking-[0.08em] text-mute">
              {meta.map((value, k) => (
                <span key={value} className="flex items-center gap-3">
                  {k > 0 ? <span aria-hidden="true" className="h-3 w-px bg-rule" /> : null}
                  <span className={k === 0 ? 'tabular-nums text-ash' : undefined}>{value}</span>
                </span>
              ))}
            </p>

            <p className="mt-6 max-w-[62ch] text-[0.95rem] leading-[1.75] text-ash">
              {copy.summary}
            </p>

            {project.highlights.length > 0 ? (
              <ul className="mt-8 border-t border-rule">
                {project.highlights.map((key) => {
                  const line = copy.highlights[key]
                  if (!line) return null
                  return (
                    <li
                      key={key}
                      className="border-b border-rule py-3 text-[0.9rem] leading-[1.6] text-bone"
                    >
                      {line}
                    </li>
                  )
                })}
              </ul>
            ) : null}

            <div className="mt-6">
              {project.repo ? (
                <DrawnLink href={project.repo}>{c.open}</DrawnLink>
              ) : (
                // No repository exists, so no link is rendered — not a disabled
                // one, not a placeholder. The absence is stated instead.
                <p className="legend">{c.noRepo}</p>
              )}
            </div>
          </motion.article>
        )
      })}

      <motion.div variants={item} className="mt-16">
        <div className="hairline mb-8" />
        <DrawnLink href={IDENTITY.github}>{c.all}</DrawnLink>
      </motion.div>
    </motion.div>
  )
}
