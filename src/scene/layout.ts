import { STAGES } from '../content'

/**
 * The pipeline scene does not replace the orbital scene — it lives below it in
 * the same world, and the camera flies down to it. That keeps the transition
 * continuous instead of cutting between two disconnected views.
 *
 * This module owns where the chain *is*. `scene/journey.ts` owns how the
 * camera moves through it.
 */

/** Origin of the pipeline chain in world space. */
export const PIPELINE_ORIGIN: [number, number, number] = [0, -60, 0]

/** Spacing between two consecutive stage markers along the chain (X axis). */
export const STAGE_SPACING = 3.4

/** World position of stage `i`, centred on PIPELINE_ORIGIN. */
export function stagePosition(i: number): [number, number, number] {
  const span = (STAGES.length - 1) * STAGE_SPACING
  return [
    PIPELINE_ORIGIN[0] - span / 2 + i * STAGE_SPACING,
    // A gentle sag toward the middle of the chain, so the row of stages reads
    // as a suspended cable rather than a ruler.
    PIPELINE_ORIGIN[1] + Math.sin((i / (STAGES.length - 1)) * Math.PI) * -0.55,
    PIPELINE_ORIGIN[2],
  ]
}

/** Index of the stage that blocks CRITICAL findings. */
export const GATE_INDEX = STAGES.findIndex((s) => s.gate)

/**
 * How far right the camera aims, as a fraction of the viewing distance, to push
 * the subject clear of the content panel on wide viewports. Derived from the
 * panel covering ~46% of the width at a 46° vertical field of view.
 */
export const AIM_SHIFT = 0.31

/**
 * Same idea vertically, for narrow viewports where the panel is a bottom sheet
 * covering everything below 40% of the height: aim down, and the subject rises
 * into the strip that is still visible.
 */
export const SHEET_LIFT = 0.3
