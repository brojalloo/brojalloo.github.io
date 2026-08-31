import { useEffect } from 'react'
import { JOURNEY, progressForStage, stageAtProgress } from '../scene/journey'
import { useApp } from '../store'

/**
 * Turns the reading panel's scroll position into a journey progress.
 *
 * The mapping is not "how far down the scrollbar is": the panel also holds the
 * architecture diagram, the API table and the proofs, and none of those are
 * places on the chain. It is measured off the nine stage blocks themselves —
 * whichever one is crossing the reading line owns the camera.
 *
 * Two rules keep this cheap enough to run on every scroll event:
 *   - the write goes into JOURNEY, a plain mutable object, never into React;
 *   - the store is touched only when the *integer* stage changes, at most nine
 *     times for a full descent.
 */

/** Height fraction of the viewport at which a block counts as "being read". */
const READING_LINE = 0.45

export function useJourneyScroll(): void {
  useEffect(() => {
    const blocks = Array.from(document.querySelectorAll<HTMLElement>('[data-stage-index]')).sort(
      (a, b) => Number(a.dataset.stageIndex) - Number(b.dataset.stageIndex),
    )
    if (blocks.length === 0) return

    // The class is a scrollbar style in index.css and, from here, also the
    // handle on the scrolling element. Renaming it breaks the journey.
    const scroller = blocks[0].closest<HTMLElement>('.panel-scroll')
    if (!scroller) return

    let queued = false
    let lastStage = -1

    const measure = () => {
      queued = false
      const line = window.innerHeight * READING_LINE

      // The block whose centre is above the line, and the next one below it,
      // bracket where we are.
      let index = 0
      while (index < blocks.length - 1) {
        const next = blocks[index + 1].getBoundingClientRect()
        if (next.top + next.height / 2 > line) break
        index++
      }

      const current = blocks[index].getBoundingClientRect()
      const currentCentre = current.top + current.height / 2
      let progress: number

      if (index === blocks.length - 1 || currentCentre > line) {
        progress = progressForStage(index)
        if (index === 0 && currentCentre > line) {
          // Above the first block's centre: this is the approach, and it maps
          // onto the entry slot so the camera flies down rather than starting
          // parked in front of stage 01.
          const start = window.innerHeight
          const travelled = (start - currentCentre) / Math.max(1, start - line)
          progress = progressForStage(0) * Math.min(1, Math.max(0, travelled))
        }
      } else {
        const next = blocks[index + 1].getBoundingClientRect()
        const nextCentre = next.top + next.height / 2
        const span = nextCentre - currentCentre
        const f = span <= 0 ? 0 : Math.min(1, Math.max(0, (line - currentCentre) / span))
        const a = progressForStage(index)
        const b = progressForStage(index + 1)
        progress = a + (b - a) * f
      }

      JOURNEY.target = progress

      const stage = stageAtProgress(progress)
      if (stage !== lastStage) {
        lastStage = stage
        useApp.getState().setStage(stage)
      }
    }

    // Scroll events can outpace the frame rate; coalesce them onto one frame.
    const onScroll = () => {
      if (queued) return
      queued = true
      requestAnimationFrame(measure)
    }

    measure()
    scroller.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      scroller.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      JOURNEY.target = 0
      JOURNEY.progress = 0
    }
  }, [])
}
