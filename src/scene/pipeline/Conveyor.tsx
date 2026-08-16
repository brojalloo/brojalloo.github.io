import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import {
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  Float32BufferAttribute,
  Vector3,
} from 'three'
import type { LineBasicMaterial, Mesh } from 'three'
import type { Line2, LineSegments2 } from 'three-stdlib'
import { STAGES } from '../../content'
import { GATE_INDEX, STAGE_SPACING, stagePosition } from '../layout'
import { useApp } from '../../store'

/**
 * The physical chain the artifacts ride on.
 *
 * This file is also the leaf module of the pipeline scene: every other file in
 * `scene/pipeline` already has to import the conveyor curve to know where a
 * point on the chain is, so the small amount of shared vocabulary — palette,
 * easing, and the one-way bus the security gate uses to clear the lane —
 * lives here rather than in a sixth file. Nothing here imports a sibling.
 */

// ---------------------------------------------------------------------------
// Palette. Mirrors the tokens in index.css; three.js cannot read CSS variables,
// so the two lists are kept literally identical on purpose.
// ---------------------------------------------------------------------------

export const PIPE = {
  void: '#06080b',
  hull: '#0c1219',
  rule: '#1e2936',
  amber: '#ff7a1a',
  trace: '#4dd8c0',
  /** CRITICAL. Appears at the gate and nowhere else on the site. */
  alert: '#ff3b4e',
  bone: '#e9e5db',
  ash: '#8d99a8',
  mute: '#55606e',
} as const

export const C_RULE = new Color(PIPE.rule)
export const C_AMBER = new Color(PIPE.amber)
export const C_TRACE = new Color(PIPE.trace)
export const C_ALERT = new Color(PIPE.alert)
export const C_BONE = new Color(PIPE.bone)
export const C_MUTE = new Color(PIPE.mute)
export const C_HULL = new Color(PIPE.hull)

// ---------------------------------------------------------------------------
// Maths helpers. All of these are pure and allocation-free.
// ---------------------------------------------------------------------------

export function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x
}

/** Ken Perlin's smootherstep — zero first *and* second derivative at the ends. */
export function smootherstep(x: number): number {
  const t = clamp01(x)
  return t * t * t * (t * (t * 6 - 15) + 10)
}

export function easeOutCubic(x: number): number {
  const t = clamp01(x)
  const inv = 1 - t
  return 1 - inv * inv * inv
}

export function easeOutQuint(x: number): number {
  const t = clamp01(x)
  const inv = 1 - t
  return 1 - inv * inv * inv * inv * inv
}

/** Slight overshoot, for the mount transition. */
export function easeOutBack(x: number): number {
  const t = clamp01(x)
  const c1 = 1.70158
  const c3 = c1 + 1
  const u = t - 1
  return 1 + c3 * u * u * u + c1 * u * u
}

/** Framerate-independent exponential approach. */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt))
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// ---------------------------------------------------------------------------
// The curve. Nine stage positions plus a lead-in and a lead-out, so packets
// have somewhere to come from and somewhere to go.
// ---------------------------------------------------------------------------

const first = stagePosition(0)
const last = stagePosition(STAGES.length - 1)

/** Extra rail beyond the first and last marker, in world units. */
const LEAD = STAGE_SPACING * 1.05

const CONVEYOR_POINTS: Vector3[] = [
  new Vector3(first[0] - LEAD, first[1], first[2]),
  ...STAGES.map((_, i) => {
    const p = stagePosition(i)
    return new Vector3(p[0], p[1], p[2])
  }),
  new Vector3(last[0] + LEAD, last[1], last[2]),
]

export const CONVEYOR_CURVE = new CatmullRomCurve3(CONVEYOR_POINTS, false, 'centripetal', 0.5)

/**
 * Stage-space is the coordinate the rest of the scene reasons in: `-1` is the
 * lead-in, `0..8` are the nine markers, `9` is the lead-out. A CatmullRom curve
 * passes exactly through its control points at `i / (n - 1)`, so the mapping is
 * a straight line.
 */
export const ENTRY_S = -1
export const EXIT_S = STAGES.length
const SPAN_S = CONVEYOR_POINTS.length - 1

export function conveyorT(s: number): number {
  return clamp01((s - ENTRY_S) / SPAN_S)
}

/** Writes the world position at stage-space coordinate `s` into `out`. */
export function sampleConveyor(s: number, out: Vector3): Vector3 {
  return CONVEYOR_CURVE.getPoint(conveyorT(s), out)
}

/** How high above the rail an artifact rides. */
export const PACKET_LIFT = 0.085

// ---------------------------------------------------------------------------
// The bus. `SecurityGate` owns the CRITICAL cycle and is the only writer;
// `Packets` only reads it, to know when to hold traffic back so the lane past
// the gate is genuinely empty when the red packet is destroyed.
// ---------------------------------------------------------------------------

export const PIPELINE_BUS = {
  /** Elapsed-clock time before which no healthy packet may spawn. */
  blockUntil: 0,
  /** Elapsed-clock time of the next CRITICAL run. `Infinity` = never. */
  nextCriticalAt: Number.POSITIVE_INFINITY,
  /**
   * The lite / reduced-motion rendering: the gate is drawn permanently shut, so
   * healthy packets stop at Trivy instead of passing it. Same statement as the
   * destruction sequence, told without motion.
   */
  gateShut: false,
}

/**
 * A packet spawned this long before a CRITICAL run would still be past the gate
 * when the gate fires. Holding it back is what buys the empty conveyor.
 */
export const CLEAR_LEAD = 1.2

// ---------------------------------------------------------------------------
// Mount transition. Stage 01 resolves first, the rest follow.
// ---------------------------------------------------------------------------

export const REVEAL_STAGGER = 0.055
export const REVEAL_DURATION = 0.5

export function revealAt(elapsedSinceEnter: number, index: number): number {
  return clamp01((elapsedSinceEnter - index * REVEAL_STAGGER) / REVEAL_DURATION)
}

/** Troika's text mesh, narrowed to the two fields we mutate per frame. */
export interface TroikaText extends Mesh {
  color: Color
  fillOpacity: number
}

// ---------------------------------------------------------------------------
// Geometry, built once at module scope.
// ---------------------------------------------------------------------------

/** Samples per stage-space unit when drawing the rail. */
const RAIL_SUBDIV = 26

function buildRail(): { points: Vector3[]; colors: Color[] } {
  const points: Vector3[] = []
  const colors: Color[] = []
  const total = SPAN_S * RAIL_SUBDIV
  for (let i = 0; i <= total; i++) {
    const s = ENTRY_S + (i / total) * SPAN_S
    points.push(sampleConveyor(s, new Vector3()))
    // The chain runs cold except around the gate, where the instrument is
    // doing work. A soft gaussian, capped well below full amber.
    const d = s - GATE_INDEX
    const heat = Math.exp(-(d * d) / 1.5) * 0.42
    colors.push(new Color().copy(C_RULE).lerp(C_AMBER, heat))
  }
  return { points, colors }
}

const RAIL = buildRail()

/** Ticks per stage-space unit — the chain reads as a measured scale. */
const TICKS_PER_UNIT = 6

function buildTicks(): BufferGeometry {
  const verts: number[] = []
  const p = new Vector3()
  const total = SPAN_S * TICKS_PER_UNIT
  for (let i = 0; i <= total; i++) {
    const s = ENTRY_S + (i / total) * SPAN_S
    sampleConveyor(s, p)
    // Majors land on the markers, minors subdivide the span between them.
    const major = i % TICKS_PER_UNIT === 0
    const h = major ? 0.15 : 0.05
    verts.push(p.x, p.y - 0.012, p.z, p.x, p.y - 0.012 - h, p.z)
  }
  const geom = new BufferGeometry()
  geom.setAttribute('position', new Float32BufferAttribute(verts, 3))
  return geom
}

const TICK_GEOMETRY = buildTicks()

// ---------------------------------------------------------------------------

export function Conveyor() {
  const active = useApp((s) => s.active)

  const railRef = useRef<Line2 | LineSegments2 | null>(null)
  const tickRef = useRef<LineBasicMaterial | null>(null)
  const enteredAt = useRef(-1)

  const railPoints = useMemo(() => RAIL.points, [])
  const railColors = useMemo(() => RAIL.colors, [])

  useFrame((state, dt) => {
    const now = state.clock.getElapsedTime()
    if (active === 'pipeline') {
      if (enteredAt.current < 0) enteredAt.current = now
    } else {
      enteredAt.current = -1
    }

    // The rail resolves as one piece, just ahead of the markers.
    const target = enteredAt.current < 0 ? 0 : easeOutCubic((now - enteredAt.current) / 0.55)

    const rail = railRef.current
    if (rail) {
      const m = rail.material
      m.opacity = damp(m.opacity, target * 0.95, 9, dt)
    }
    const ticks = tickRef.current
    if (ticks) {
      ticks.opacity = damp(ticks.opacity, target * 0.55, 9, dt)
    }
  })

  return (
    <group>
      <Line
        ref={railRef}
        points={railPoints}
        vertexColors={railColors}
        lineWidth={1.6}
        transparent
        opacity={0}
        depthWrite={false}
        toneMapped={false}
      />
      <lineSegments geometry={TICK_GEOMETRY} frustumCulled={false}>
        <lineBasicMaterial
          ref={tickRef}
          color={PIPE.rule}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </lineSegments>
    </group>
  )
}
