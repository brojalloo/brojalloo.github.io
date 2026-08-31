import { STAGES } from '../content'

/**
 * The pipeline scene does not replace the orbital scene — it lives below it in
 * the same world, and the camera flies down to it. That keeps the transition
 * continuous instead of cutting between two disconnected views.
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

/**
 * Default view of the chain.
 *
 * Deliberately not the whole pipeline. Fitting all nine stages beside the panel
 * needs about 40 units of distance, at which the stage labels are five pixels
 * tall and the packets are specks. The panel already lists all nine stages in
 * readable type; the scene's job is to show the mechanism working. So the
 * camera sits close to the Trivy gate and frames the last five stages — which
 * happens to be both gates, the deploy and the health check.
 */
const VIEW_DISTANCE = 18

export function pipelineView(): [number, number, number] {
  const gate = stagePosition(GATE_INDEX)
  return [gate[0], PIPELINE_ORIGIN[1] + 1.3, gate[2] + VIEW_DISTANCE]
}

export function pipelineAim(wide: boolean): [number, number, number] {
  const gate = stagePosition(GATE_INDEX)
  return [
    gate[0] + (wide ? VIEW_DISTANCE * AIM_SHIFT : 0),
    PIPELINE_ORIGIN[1] - (wide ? 0.2 : VIEW_DISTANCE * SHEET_LIFT),
    gate[2],
  ]
}

/** Camera parking spot for a single focused stage. */
const STAGE_DISTANCE = 7.4

export function stageView(i: number): [number, number, number] {
  const p = stagePosition(i)
  return [p[0], p[1] + 0.7, p[2] + STAGE_DISTANCE]
}

export function stageAim(i: number, wide: boolean): [number, number, number] {
  const p = stagePosition(i)
  return [
    p[0] + (wide ? STAGE_DISTANCE * AIM_SHIFT : 0),
    p[1] - (wide ? 0 : STAGE_DISTANCE * SHEET_LIFT),
    p[2],
  ]
}
