import { Vector3 } from 'three'
import { STAGES } from '../content'
import { AIM_SHIFT, GATE_INDEX, PIPELINE_ORIGIN, SHEET_LIFT, stagePosition } from './layout'

/**
 * The journey: one number, 0 to 1, is the whole state of the pipeline scene.
 *
 * Scroll writes it, the render loop reads it. Nothing in between allocates,
 * and nothing in between goes through React — a 120Hz scroll that re-rendered
 * the reading panel would make the page unusable.
 *
 * The axis is cut into eleven contiguous slots: an entry, the nine stages, an
 * exit. Each slot owns an anchor — a camera position — and a hold band at its
 * centre where the camera is parked. Between two hold bands the camera travels
 * a quadratic Bezier whose control point is pulled back, which is what makes
 * the distance breathe. The Trivy slot is 2.6 times as wide as an ordinary
 * stage; that width *is* the plateau.
 */

// ---------------------------------------------------------------------------
// The bus. Written by `useJourneyScroll`, read by the scene in useFrame.
// Same one-way pattern as PIPELINE_BUS in scene/pipeline/Conveyor.tsx.
// ---------------------------------------------------------------------------

export const JOURNEY = {
  /** Where the scroll says we should be. */
  target: 0,
  /** Where the camera actually is; damped toward `target` by CameraRig. */
  progress: 0,
}

// ---------------------------------------------------------------------------
// Slot layout
// ---------------------------------------------------------------------------

/** Scroll weight of the approach, before stage 01. */
const ENTRY_WEIGHT = 1.6
/** Scroll weight of the pull-back, after stage 09. */
const EXIT_WEIGHT = 1.4
/** The gate is worth this many ordinary stages. This is the plateau. */
const GATE_WEIGHT = 2.6
/** Share of a slot spent parked rather than travelling. */
const HOLD_FRAC = 0.46

/** Anchor indices: -1 is the entry, 0..8 the stages, 9 the exit. */
const FIRST_SLOT = -1
const LAST_SLOT = STAGES.length

function weightOf(slot: number): number {
  if (slot === FIRST_SLOT) return ENTRY_WEIGHT
  if (slot === LAST_SLOT) return EXIT_WEIGHT
  return slot === GATE_INDEX ? GATE_WEIGHT : 1
}

/** Centre of each slot on the progress axis, and half-width of its hold band. */
const CENTRES: number[] = []
const HOLDS: number[] = []

{
  let total = 0
  for (let s = FIRST_SLOT; s <= LAST_SLOT; s++) total += weightOf(s)

  let cursor = 0
  for (let s = FIRST_SLOT; s <= LAST_SLOT; s++) {
    const w = weightOf(s) / total
    CENTRES.push(cursor + w / 2)
    HOLDS.push((w * HOLD_FRAC) / 2)
    cursor += w
  }
}

/** Slot index -> position in the CENTRES / HOLDS arrays. */
function slotAt(slot: number): number {
  return slot - FIRST_SLOT
}

/** Progress at which the camera is parked in front of stage `i`. */
export function progressForStage(i: number): number {
  const clamped = i < 0 ? 0 : i > STAGES.length - 1 ? STAGES.length - 1 : i
  return CENTRES[slotAt(clamped)]
}

/** Nearest stage to a progress value. Never returns the entry or exit slot. */
export function stageAtProgress(p: number): number {
  let best = 0
  let bestDistance = Infinity
  for (let i = 0; i < STAGES.length; i++) {
    const d = Math.abs(p - CENTRES[slotAt(i)])
    if (d < bestDistance) {
      bestDistance = d
      best = i
    }
  }
  return best
}

// ---------------------------------------------------------------------------
// The gate plateau, exported so SecurityGate can trigger on arrival.
// The arm bounds sit outside the trigger bounds: that gap is the hysteresis
// that stops a shaky scroll from re-firing the destruction on every frame.
// ---------------------------------------------------------------------------

const GATE_CENTRE = CENTRES[slotAt(GATE_INDEX)]
const GATE_HOLD = HOLDS[slotAt(GATE_INDEX)]

export const GATE_ENTER = GATE_CENTRE - GATE_HOLD
export const GATE_LEAVE = GATE_CENTRE + GATE_HOLD
export const GATE_ARM_LOW = GATE_ENTER - GATE_HOLD * 0.9
export const GATE_ARM_HIGH = GATE_LEAVE + GATE_HOLD * 0.9

// ---------------------------------------------------------------------------
// Anchors. Built once; `journeyView` only ever reads them.
// ---------------------------------------------------------------------------

/** Distance in front of a stage, parked. Close enough to read the volume. */
const STAGE_DISTANCE = 5.2
/** Distance at the midpoint of a span. The gap is the breathing. */
const SPAN_DISTANCE = 12
/**
 * Sideways swing at a midpoint, as a fraction of that span's own length, so
 * the path serpentines instead of sliding. Must stay below 0.5 — see
 * `controlOf`.
 */
const LATERAL_FRAC = 0.42
/** Eye height above the rail. */
const EYE_LIFT = 0.75
/** How far above the chain the approach starts. */
const ENTRY_LIFT = 15
const ENTRY_DISTANCE = 26
/** How far back the camera settles once the chain is behind it. */
const EXIT_DISTANCE = 15
const EXIT_LIFT = 2.5

function anchorOf(slot: number, out: Vector3): Vector3 {
  if (slot === FIRST_SLOT) {
    const first = stagePosition(0)
    return out.set(first[0] - 2, PIPELINE_ORIGIN[1] + ENTRY_LIFT, first[2] + ENTRY_DISTANCE)
  }
  if (slot === LAST_SLOT) {
    const last = stagePosition(STAGES.length - 1)
    return out.set(last[0] + 4, PIPELINE_ORIGIN[1] + EXIT_LIFT, last[2] + EXIT_DISTANCE)
  }
  const p = stagePosition(slot)
  return out.set(p[0], p[1] + EYE_LIFT, p[2] + STAGE_DISTANCE)
}

/** Distance from the rail at an anchor — what `journeyDistance` interpolates. */
function anchorDistance(slot: number): number {
  if (slot === FIRST_SLOT) return ENTRY_DISTANCE
  if (slot === LAST_SLOT) return EXIT_DISTANCE
  return STAGE_DISTANCE
}

// Module-scope scratch: `journeyView` is called every frame and must not
// allocate. Safe because nothing here is re-entrant or async.
// `controlOf` gets its own pair: it is called between `journeyView`'s two
// `anchorOf` calls and the Bezier that reads them back, so sharing A and B
// would silently clobber the anchors it is supposed to sit between.
const SCRATCH_A = new Vector3()
const SCRATCH_B = new Vector3()
const SCRATCH_C = new Vector3()
const CONTROL_A = new Vector3()
const CONTROL_B = new Vector3()

/**
 * Bezier control point between two consecutive anchors: back, and to a side.
 *
 * The sideways swing is a fraction of the span rather than a fixed distance.
 * That is not cosmetic: with a control point offset of more than half the span,
 * the Bezier's x derivative goes negative near one end and the camera visibly
 * slides *back* down the chain. Keeping the fraction under 0.5 makes going
 * backwards impossible by construction — which is what the monotonicity test
 * in `journey.test.ts` checks.
 */
function controlOf(slot: number, out: Vector3): Vector3 {
  const a = anchorOf(slot, CONTROL_A)
  const b = anchorOf(slot + 1, CONTROL_B)
  const side = slot % 2 === 0 ? 1 : -1
  const swing = Math.abs(b.x - a.x) * LATERAL_FRAC * side
  return out.set(
    (a.x + b.x) / 2 + swing,
    (a.y + b.y) / 2 + 0.9,
    (a.z + b.z) / 2 + (SPAN_DISTANCE - STAGE_DISTANCE),
  )
}

/** Ken Perlin's smootherstep, matching the one in scene/pipeline/Conveyor.tsx. */
function smootherstep(x: number): number {
  const t = x < 0 ? 0 : x > 1 ? 1 : x
  return t * t * t * (t * (t * 6 - 15) + 10)
}

/**
 * Where `p` sits: either parked in slot `locatedSlot`, or `locatedT` of the way
 * from it to the next one. `locatedT < 0` means parked.
 *
 * The result is written to module state rather than returned as an object,
 * because this runs on every frame and returning `{ slot, t }` would allocate
 * sixty times a second.
 */
let locatedSlot = 0
let locatedT = -1

function locateInto(p: number): void {
  const clamped = p < 0 ? 0 : p > 1 ? 1 : p
  for (let s = FIRST_SLOT; s <= LAST_SLOT; s++) {
    const i = slotAt(s)
    if (clamped <= CENTRES[i] + HOLDS[i]) {
      // Inside this slot's hold band, or before the whole axis started.
      if (clamped >= CENTRES[i] - HOLDS[i] || s === FIRST_SLOT) {
        locatedSlot = s
        locatedT = -1
        return
      }
      // Travelling into it from the previous slot.
      const from = CENTRES[i - 1] + HOLDS[i - 1]
      const to = CENTRES[i] - HOLDS[i]
      locatedSlot = s - 1
      locatedT = smootherstep((clamped - from) / (to - from))
      return
    }
  }
  locatedSlot = LAST_SLOT
  locatedT = -1
}

export function journeyView(p: number, out: Vector3): Vector3 {
  locateInto(p)
  if (locatedT < 0) return anchorOf(locatedSlot, out)

  const t = locatedT
  const u = 1 - t
  anchorOf(locatedSlot, SCRATCH_A)
  anchorOf(locatedSlot + 1, SCRATCH_B)
  controlOf(locatedSlot, SCRATCH_C)

  // Quadratic Bezier: passes exactly through both anchors, which is the whole
  // reason this is not a CatmullRom through every point.
  return out.set(
    u * u * SCRATCH_A.x + 2 * u * t * SCRATCH_C.x + t * t * SCRATCH_B.x,
    u * u * SCRATCH_A.y + 2 * u * t * SCRATCH_C.y + t * t * SCRATCH_B.y,
    u * u * SCRATCH_A.z + 2 * u * t * SCRATCH_C.z + t * t * SCRATCH_B.z,
  )
}

export function journeyDistance(p: number): number {
  locateInto(p)
  if (locatedT < 0) return anchorDistance(locatedSlot)
  const t = locatedT
  const u = 1 - t
  const a = anchorDistance(locatedSlot)
  const b = anchorDistance(locatedSlot + 1)
  return u * u * a + 2 * u * t * SPAN_DISTANCE + t * t * b
}

/**
 * The point the camera looks at: a point on the chain, pushed sideways so the
 * subject clears the reading panel. Wide viewports get a right-hand column and
 * aim right; narrow ones get a bottom sheet and aim down.
 */
export function journeyAim(p: number, wide: boolean, out: Vector3): Vector3 {
  journeyView(p, out)
  const d = journeyDistance(p)
  // The rail sits `d` in front of the camera on z, at the chain's own height.
  out.z -= d
  out.y = PIPELINE_ORIGIN[1]
  if (wide) {
    out.x += d * AIM_SHIFT
    out.y -= 0.2
  } else {
    out.y -= d * SHEET_LIFT
  }
  return out
}
