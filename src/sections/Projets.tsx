import { motion } from 'framer-motion'
import { stagger, useRise } from './motion'
import { CONTENT, PROJECTS } from '../content'
import type { Lang, Project } from '../types'
import { useApp } from '../store'

/*
  `Project.key` is a plain string, while the copy table has one entry per
  project. This narrows one to the other without a cast, so a new project
  added to PROJECTS without matching copy simply renders no prose rather
  than crashing.
*/
type ProjetsCopy = (typeof CONTENT)[Lang]['projets']
type ProjectKey = Extract<keyof ProjetsCopy, 'devopsLab' | 'tekkiPro'>

function isProjectKey(key: string): key is ProjectKey {
  return key === 'devopsLab' || key === 'tekkiPro'
}

function copyFor(copy: ProjetsCopy, project: Project) {
  return isProjectKey(project.key) ? copy[project.key] : null
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

        return (
          <motion.article key={project.key} variants={item} className={i === 0 ? 'mt-12' : 'mt-16'}>
            {i > 0 ? <div className="hairline mb-16" /> : null}

            <h3 className="text-2xl text-bone sm:text-3xl">{project.name}</h3>

            <p className="mt-3 flex flex-wrap items-center gap-y-1 font-mono text-[0.64rem] tracking-[0.08em] text-mute">
              {[project.year, ...project.stack].map((meta, k) => (
                <span key={meta} className="flex items-center gap-3">
                  {k > 0 ? <span aria-hidden="true" className="h-3 w-px bg-rule" /> : null}
                  <span className={k === 0 ? 'tabular-nums text-ash' : undefined}>{meta}</span>
                </span>
              ))}
            </p>

            <p className="mt-6 max-w-[62ch] text-[0.95rem] leading-[1.75] text-ash">
              {copy.summary}
            </p>

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

            <a
              href={project.repo}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-6 inline-flex items-baseline gap-2 font-mono text-[0.66rem] tracking-[0.18em] text-amber uppercase"
            >
              <span className="relative">
                {c.open}
                <span
                  aria-hidden="true"
                  className="absolute -bottom-1 left-0 h-px w-0 bg-amber transition-[width] duration-300 ease-out group-hover:w-full group-focus-visible:w-full"
                />
              </span>
              <span aria-hidden="true">↗</span>
            </a>
          </motion.article>
        )
      })}
    </motion.div>
  )
}
