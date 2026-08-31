import type { Tier } from '../types'

/**
 * Decide once, at boot, how much scene this device should be asked to draw.
 *
 * `lite` is not a broken experience — it is the same scene with the particle
 * field, the postprocessing pass and the packet traffic cut back. Anything
 * that carries information stays.
 */
export function detectTier(): Tier {
  if (typeof window === 'undefined') return 'lite'

  // `?tier=full` / `?tier=lite` forces the budget. Useful for checking the
  // degraded path on a fast machine, and for headless capture, where the
  // software renderer would otherwise always resolve to lite.
  const forced = new URLSearchParams(window.location.search).get('tier')
  if (forced === 'full' || forced === 'lite') return forced

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'lite'

  // Coarse pointer plus a narrow viewport is a phone; phones get the lite tier
  // regardless of how capable their GPU claims to be, to protect battery.
  const coarse = window.matchMedia('(pointer: coarse)').matches
  if (coarse && window.innerWidth < 900) return 'lite'

  const cores = navigator.hardwareConcurrency ?? 4
  if (cores <= 4) return 'lite'

  // A software renderer will happily accept a WebGL context and then run at
  // 5fps, so check what we were actually given.
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    if (!gl) return 'lite'
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    if (ext) {
      const renderer = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) ?? '')
      if (/swiftshader|llvmpipe|software|basic render/i.test(renderer)) return 'lite'
    }
  } catch {
    return 'lite'
  }

  return 'full'
}

/**
 * The OS-level motion preference, read at the moment it is asked for.
 *
 * Distinct from the tier: `detectTier` folds this in as one of several reasons
 * to draw less, while callers here want the preference itself — a visitor on a
 * fast machine who asked for less motion still gets the full scene, just
 * without being carried through it.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Device pixel ratio ceiling per tier — the single biggest fill-rate lever. */
export function dprRange(tier: Tier): [number, number] {
  return tier === 'full' ? [1, 1.75] : [1, 1.25]
}
