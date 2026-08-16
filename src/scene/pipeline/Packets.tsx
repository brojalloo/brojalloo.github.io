import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshStandardMaterial, OctahedronGeometry, Vector3 } from 'three'
import type { Mesh } from 'three'
import { STAGES } from '../../content'
import { GATE_INDEX } from '../layout'
import { useApp } from '../../store'
import {
  clamp01,
  CLEAR_LEAD,
  C_TRACE,
  ENTRY_S,
  EXIT_S,
  PACKET_LIFT,
  PIPELINE_BUS,
  sampleConveyor,
  smootherstep,
} from './Conveyor'

/**
 * The traffic: healthy artifacts moving left to right along the chain.
 *
 * A packet does not glide. It crosses a span, stops at the marker for as long
 * as that stage would actually take, then crosses the next one. The stepped
 * rhythm is the whole point — a constant glide reads as a screensaver, a
 * stepped one reads as a build.
 */

/** Spans to cross: the lead-in, the eight between markers, and the lead-out. */
const SEGMENT_COUNT = EXIT_S - ENTRY_S

/** The two other stages that genuinely think before they pass an artifact. */
const SONAR_INDEX = STAGES.findIndex((s) => s.key === 'sonar')
const QUALITY_INDEX = STAGES.findIndex((s) => s.key === 'gate')

interface Packet {
  active: boolean
  /** Index of the span currently being crossed; position runs `step-1 → step`. */
  step: number
  /** Progress through the current span, 0..1. */
  f: number
  /** Seconds to cross one span. */
  segDur: number
  /** Seconds still to wait at the marker just reached. */
  dwell: number
  /** Base dwell for an ordinary stage. */
  dwellDur: number
  /** Stopped at a permanently shut gate — it will not leave this marker. */
  blocked: boolean
  seed: number
}

/** How long a blocked packet sits at the shut gate before it is written off. */
const BLOCKED_HOLD = 0.55
/** The tail of that hold is spent shrinking to nothing. */
const BLOCKED_FADE = 0.28
/** How far short of the gate a blocked artifact comes to rest, in stage-space. */
const BLOCK_STANDOFF = 0.42

function makePacket(): Packet {
  return {
    active: false,
    step: 0,
    f: 0,
    segDur: 0.2,
    dwell: 0,
    dwellDur: 0.07,
    blocked: false,
    seed: 0,
  }
}

/** Analysis stages genuinely take longer than a checkout — so they hold longer. */
function dwellFor(p: Packet, stageIndex: number): number {
  if (stageIndex === GATE_INDEX) return p.dwellDur * 3.4
  if (stageIndex === SONAR_INDEX || stageIndex === QUALITY_INDEX) return p.dwellDur * 2.1
  return p.dwellDur
}

export function Packets() {
  const tier = useApp((s) => s.tier)
  const active = useApp((s) => s.active)

  const count = tier === 'full' ? 5 : 2
  const spawnGap = tier === 'full' ? 0.62 : 1.35

  const meshes = useRef<(Mesh | null)[]>([])
  const nextSpawn = useRef(0)

  const pool = useMemo<Packet[]>(
    () => Array.from({ length: count }, () => makePacket()),
    [count],
  )

  const scratch = useMemo(() => new Vector3(), [])

  // Sized against the default framing: at ~18 units back an 0.082 packet is a
  // 10px speck that reads as a rendering artifact rather than as cargo.
  const geometry = useMemo(() => new OctahedronGeometry(0.125, 0), [])
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color: C_TRACE.clone(),
        emissive: C_TRACE.clone(),
        emissiveIntensity: 1.7,
        roughness: 0.3,
        metalness: 0,
      }),
    [],
  )

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  useFrame((state, dt) => {
    const now = state.clock.getElapsedTime()
    const step = Math.min(dt, 0.05)

    if (active !== 'pipeline') {
      for (let i = 0; i < pool.length; i++) {
        pool[i].active = false
        const m = meshes.current[i]
        if (m) m.visible = false
      }
      nextSpawn.current = now
      return
    }

    // --- spawning -----------------------------------------------------------
    // Hold traffic while the gate is firing, and again just before the next
    // CRITICAL run, so nothing of ours is past the gate when it snaps shut.
    const clearOfGate =
      now >= PIPELINE_BUS.blockUntil && now <= PIPELINE_BUS.nextCriticalAt - CLEAR_LEAD

    if (!clearOfGate) {
      // Do not let the timer bank up during the hold and burst on release.
      if (nextSpawn.current < now) nextSpawn.current = now
    } else if (now >= nextSpawn.current) {
      const free = pool.find((p) => !p.active)
      if (free) {
        free.active = true
        free.step = 0
        free.f = 0
        free.dwell = 0
        free.blocked = false
        free.segDur = 0.185 * (0.86 + Math.random() * 0.3)
        free.dwellDur = 0.06 * (0.75 + Math.random() * 0.7)
        free.seed = Math.random() * Math.PI * 2
        nextSpawn.current = now + spawnGap * (0.8 + Math.random() * 0.45)
      } else {
        nextSpawn.current = now + 0.1
      }
    }

    // --- motion -------------------------------------------------------------
    for (let i = 0; i < pool.length; i++) {
      const p = pool[i]
      const mesh = meshes.current[i]
      if (!mesh) continue
      if (!p.active) {
        mesh.visible = false
        continue
      }

      if (p.dwell > 0) {
        p.dwell -= step
        if (p.blocked && p.dwell <= 0) {
          // A shut gate is the end of the line. Nothing passes Trivy.
          p.active = false
          mesh.visible = false
          continue
        }
      } else {
        p.f += step / p.segDur
        if (p.f >= 1) {
          p.f = 0
          p.step += 1
          if (p.step >= SEGMENT_COUNT) {
            // Off the end of the chain: retire it and free the slot.
            p.active = false
            mesh.visible = false
            continue
          }
          const reached = p.step - 1
          if (reached >= 0 && reached < STAGES.length) p.dwell = dwellFor(p, reached)
          if (reached === GATE_INDEX && PIPELINE_BUS.gateShut) {
            p.blocked = true
            p.dwell = BLOCKED_HOLD
          }
        }
      }

      // During a dwell `f` sits at 0, so the same expression holds the packet
      // exactly on the marker it just reached. No special case needed.
      let s = p.step - 1 + smootherstep(p.f)
      // A shut gate is a physical stop: the artifact eases up to the blades and
      // never crosses the line, whatever the rest of the state machine thinks.
      if (PIPELINE_BUS.gateShut && s > GATE_INDEX - BLOCK_STANDOFF) {
        s = GATE_INDEX - BLOCK_STANDOFF
      }
      sampleConveyor(s, scratch)
      mesh.position.set(scratch.x, scratch.y + PACKET_LIFT, scratch.z)

      mesh.rotation.y += step * 1.5
      mesh.rotation.x += step * 0.9

      const pulse = 1 + Math.sin(now * 5.5 + p.seed) * 0.07
      // Resolve on the lead-in, dissolve on the lead-out, so artifacts arrive
      // and leave the bench instead of popping in and out of existence.
      let edge = 1
      if (p.step === 0) edge = 0.1 + smootherstep(p.f) * 0.9
      else if (p.step === SEGMENT_COUNT - 1) edge = 1 - smootherstep(p.f) * 0.9
      const shrink = p.blocked ? clamp01(p.dwell / BLOCKED_FADE) : 1
      mesh.scale.setScalar(pulse * edge * shrink)
      mesh.visible = true
    }
  })

  return (
    <group>
      {pool.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshes.current[i] = el
          }}
          geometry={geometry}
          material={material}
          visible={false}
          frustumCulled={false}
        />
      ))}
    </group>
  )
}
