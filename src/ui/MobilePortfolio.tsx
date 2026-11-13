import { lazy, Suspense, useEffect, useRef, useState, type MouseEvent } from 'react'
import { CONTENT, IDENTITY, SKILL_GROUPS } from '../content'
import { Whoami } from '../sections/Whoami'
import { Projets } from '../sections/Projets'
import { Parcours } from '../sections/Parcours'
import { Certifications } from '../sections/Certifications'
import { Contact } from '../sections/Contact'
import { useApp } from '../store'
import type { NodeId } from '../types'
import { LangToggle } from './LangToggle'
import './mobile.css'

const Pipeline = lazy(() => import('../sections/Pipeline').then((m) => ({ default: m.Pipeline })))
const sections = { whoami: Whoami, projets: Projets, parcours: Parcours, certifications: Certifications, contact: Contact }

const order: NodeId[] = ['projets', 'whoami', 'arsenal', 'parcours', 'certifications', 'pipeline', 'contact']
const labels = {
  fr: { home: 'Accueil', whoami: 'À propos', arsenal: 'Compétences', projets: 'Projets', parcours: 'Parcours', certifications: 'Certifications', pipeline: 'Laboratoire DevOps', contact: 'Contact' },
  en: { home: 'Home', whoami: 'About', arsenal: 'Skills', projets: 'Projects', parcours: 'Experience', certifications: 'Certifications', pipeline: 'DevOps lab', contact: 'Contact' },
}

export function MobilePortfolio() {
  const lang = useApp((s) => s.lang)
  const c = CONTENT[lang]
  const names = labels[lang]
  const dialog = useRef<HTMLDialogElement>(null)
  const menuButton = useRef<HTMLButtonElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [pipelineOpen, setPipelineOpen] = useState(false)
  const cv = lang === 'fr' ? 'Télécharger mon CV' : 'Download my CV'

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const target = document.getElementById(window.location.hash.slice(1))
      target?.scrollIntoView()
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  function closeMenu() {
    dialog.current?.close()
    setMenuOpen(false)
  }

  function navigate(event: MouseEvent<HTMLAnchorElement>, id: string) {
    event.preventDefault()
    closeMenu()
    const target = document.getElementById(id)
    target?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
    target?.focus({ preventScroll: true })
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${id}`)
  }

  return (
    <div className={`mobile-portfolio${menuOpen ? ' menu-open' : ''}`}>
      <header className="mobile-header">
        <a href="#home" onClick={(event) => navigate(event, 'home')} className="mobile-name">{IDENTITY.name}</a>
        <button ref={menuButton} type="button" className="mobile-menu-button" aria-expanded={menuOpen} aria-controls="mobile-menu" aria-haspopup="dialog" onClick={() => { dialog.current?.showModal(); setMenuOpen(true) }}>
          Menu <span aria-hidden="true">☰</span>
        </button>
      </header>

      <dialog ref={dialog} id="mobile-menu" className="mobile-menu" aria-labelledby="mobile-menu-title" onClose={() => setMenuOpen(false)} onClick={(event) => { if (event.target === dialog.current) closeMenu() }}>
        <div className="mobile-menu-content">
          <div className="mobile-menu-heading">
            <h2 id="mobile-menu-title">Menu</h2>
            <button type="button" className="mobile-menu-button" onClick={() => { closeMenu(); menuButton.current?.focus() }} autoFocus>{lang === 'fr' ? 'Fermer' : 'Close'} <span aria-hidden="true">×</span></button>
          </div>
          <nav aria-label={lang === 'fr' ? 'Navigation principale' : 'Main navigation'}>
            {(['home', 'whoami', 'arsenal', 'projets', 'parcours', 'certifications', 'pipeline', 'contact'] as const).map((id) => (
              <a key={id} href={`#${id}`} onClick={(event) => navigate(event, id)}>{names[id]}</a>
            ))}
          </nav>
          <a className="mobile-cta" href={IDENTITY.cv} download onClick={closeMenu}>{cv} <span aria-hidden="true">↓</span></a>
          <div className="mobile-language"><span>{lang === 'fr' ? 'Langue' : 'Language'}</span><LangToggle /></div>
        </div>
      </dialog>

      <main>
        <section id="home" tabIndex={-1} className="mobile-hero" aria-labelledby="mobile-title">
          <p className="mobile-location">{IDENTITY.city}, {IDENTITY.country[lang]}</p>
          <h1 id="mobile-title">Ibrahima<br />Diallo</h1>
          <p className="mobile-role">DevOps junior / DevSecOps</p>
          <p className="mobile-intro">{lang === 'fr' ? 'Je configure des serveurs Linux, déploie vos applications avec Docker et automatise leur livraison et leur supervision.' : 'I configure Linux servers, deploy your applications with Docker, and automate delivery and monitoring.'}</p>
          <div className="mobile-actions">
            <a href="#projets" className="mobile-cta primary" onClick={(event) => navigate(event, 'projets')}>{lang === 'fr' ? 'Voir mes projets' : 'View my projects'}</a>
            <a href={IDENTITY.cv} download className="mobile-cta">{cv} <span aria-hidden="true">↓</span></a>
          </div>
          <a href="#projets" className="mobile-explore" onClick={(event) => navigate(event, 'projets')}>{lang === 'fr' ? 'Découvrir mon travail' : 'Explore my work'} <span aria-hidden="true">↓</span></a>
        </section>

        {order.map((id) => {
          const Section = id !== 'arsenal' && id !== 'pipeline' ? sections[id] : null
          return (
            <section key={id} id={id} tabIndex={-1} className="mobile-section" aria-label={names[id]}>
              <p className="mobile-section-label">{names[id]}</p>
              {id === 'arsenal' ? (
                <>
                  <h2>{c.arsenal.heading}</h2>
                  <p className="mobile-section-intro">{c.arsenal.note}</p>
                  {SKILL_GROUPS.map((group) => (
                    <details key={group.key} className="mobile-details">
                      <summary>{c.arsenal.groups[group.key]}</summary>
                      <ul className="mobile-skills-list">{group.items.map((entry) => <li key={entry.name}><span>{entry.name}</span>{entry.note && <small>{entry.note}</small>}</li>)}</ul>
                    </details>
                  ))}
                </>
              ) : id === 'pipeline' ? (
                <details className="mobile-details" onToggle={(event) => setPipelineOpen(event.currentTarget.open)}>
                  <summary>{lang === 'fr' ? 'Explorer mon pipeline CI/CD' : 'Explore my CI/CD pipeline'}</summary>
                  {pipelineOpen && <Suspense fallback={<p role="status">{lang === 'fr' ? 'Chargement…' : 'Loading…'}</p>}><Pipeline /></Suspense>}
                </details>
              ) : Section ? <Section /> : null}
            </section>
          )
        })}
        <footer className="mobile-footer"><a href="#home" onClick={(event) => navigate(event, 'home')}>{lang === 'fr' ? 'Retour en haut' : 'Back to top'} ↑</a></footer>
      </main>
    </div>
  )
}
