import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import {
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  DynamicDrawUsage,
  MeshBasicMaterial,
  MeshStandardMaterial,
  OctahedronGeometry,
  PointsMaterial,
  RingGeometry,
  SphereGeometry,
  Vector3,
} from 'three'
import type { Group, Mesh, Points, PointLight } from 'three'
import monoFontUrl from '@fontsource/martian-mono/files/martian-mono-latin-400-normal.woff?url'
import { GATE_INDEX, stagePosition } from '../layout'
import { clearOfGatePlateau, JOURNEY, onGatePlateau } from '../journey'
import { useApp } from '../../store'
import {
  clamp01,
  C_ALERT,
  C_AMBER,
  easeOutBack,
  easeOutCubic,
  easeOutQuint,
  ENTRY_S,
  PACKET_LIFT,
  PIPE,
  PIPELINE_BUS,
  prefersReducedMotion,
  revealAt,
  sampleConveyor,
  smootherstep,
} from './Conveyor'

/**
 * The moment the whole scene exists for.
 *
 * `trivy image --severity CRITICAL --exit-code 1` is not a description in this
 * scene, it is a mechanism: a red artifact rides the conveyor into the gate,
 * the gate snaps shut, and the artifact is destroyed. What follows matters as
 * much as the burst — the conveyor past Trivy stays empty. Nothing got through.
 */

// --- cycle timing, in seconds from the start of a run ----------------------

const PERIOD = 7.2
/** The CRITICAL packet reaches the gate. */
const TRAVEL_END = 2.1
/** Particles and shockwave live this long. Sharp, not squishy. */
const BURST_DUR = 0.44
/** Blades hold shut through the silence, then ease back to the armed slot. */
const REOPEN_START = 2.95
/** Traffic is allowed to resume. The gap before this is the point. */
const SILENCE_END = 3.4

/** Spans the red packet crosses: lead-in, then one per stage up to Trivy. */
const SEGMENTS = GATE_INDEX - ENTRY_S
const SEG = TRAVEL_END / SEGMENTS
/** Share of a span spent moving; the rest is the stage doing its work. */
const TRAVEL_FRAC = 0.75

/** Half-height of the opening the conveyor runs through. */
const APERTURE_ARMED = 0.3
const APERTURE_SHUT = 0.028
/** Sized so a fully retracted blade still sits inside the gate frame. */
const BLADE_HALF = 0.28

const PARTICLE_COUNT = 56

const GATE_POS = stagePosition(GATE_INDEX)

// --- shared geometry -------------------------------------------------------

const BLADE_GEOM = new BoxGeometry(0.1, BLADE_HALF * 2, 0.44)
const EDGE_GEOM = new BoxGeometry(0.126, 0.022, 0.48)
const SHOCK_GEOM = new RingGeometry(0.9, 1, 72)
const CRIT_GEOM = new OctahedronGeometry(0.125, 0)
const HALO_GEOM = new SphereGeometry(0.22, 14, 10)

/** The same stepped rhythm the healthy packets use, run open-loop off the cycle. */
function criticalS(ct: number): number {
  const k = Math.min(Math.floor(ct / SEG), SEGMENTS - 1)
  const local = ct - k * SEG
  const f = clamp01(local / (SEG * TRAVEL_FRAC))
  return k - 1 + smootherstep(f)
}

/** Instant rise, exponential fall — a flash, not a glow. */
function flareAt(d: number): number {
  if (d < 0) return 0
  return clamp01(d / 0.03) * Math.exp(-Math.max(0, d - 0.03) * 8.5)
}

export function SecurityGate() {
  const tier = useApp((s) => s.tier)
  const active = useApp((s) => s.active)

  // Reduced motion and the lite tier get the mechanism without the theatre.
  const reduced = useMemo(() => prefersReducedMotion(), [])
  const animated = tier === 'full' && !reduced

  const rootRef = useRef<Group | null>(null)
  const gateRef = useRef<Group | null>(null)
  const topRef = useRef<Group | null>(null)
  const bottomRef = useRef<Group | null>(null)
  const lightRef = useRef<PointLight | null>(null)
  const shockRef = useRef<Mesh | null>(null)
  const critRef = useRef<Group | null>(null)
  const pointsRef = useRef<Points | null>(null)

  const cycleStart = useRef(-1)
  const burstCycle = useRef(-1)
  const cycleIndex = useRef(0)
  const enteredAt = useRef(-1)
  // True while the visitor has not yet triggered the destruction for this
  // approach. Cleared on firing, set again only once they have travelled well
  // clear of the plateau — a shaky scroll must not restage the whole thing.
  const armed = useRef(true)

  const scratch = useMemo(() => ({ pos: new Vector3(), color: new Color() }), [])

  const mats = useMemo(() => {
    const blade = new MeshStandardMaterial({
      color: '#0c1219',
      emissive: C_AMBER.clone(),
      emissiveIntensity: 0.16,
      roughness: 0.42,
      metalness: 0.45,
    })
    const edge = new MeshStandardMaterial({
      color: '#0c1219',
      emissive: C_AMBER.clone(),
      emissiveIntensity: 1.1,
      roughness: 0.3,
      metalness: 0.2,
    })
    const shock = new MeshBasicMaterial({
      color: C_ALERT.clone(),
      transparent: true,
      opacity: 0,
      blending: AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    })
    const crit = new MeshStandardMaterial({
      color: C_ALERT.clone(),
      emissive: C_ALERT.clone(),
      emissiveIntensity: 2.4,
      roughness: 0.25,
      metalness: 0,
    })
    const halo = new MeshBasicMaterial({
      color: C_ALERT.clone(),
      transparent: true,
      opacity: 0.14,
      blending: AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    })
    const dust = new PointsMaterial({
      color: C_ALERT.clone(),
      size: 0.075,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0,
      blending: AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    })
    return { blade, edge, shock, crit, halo, dust }
  }, [])

  // Particle state: two flat buffers, allocated once, mutated in place.
  const dust = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const velocities = new Float32Array(PARTICLE_COUNT * 3)
    const geometry = new BufferGeometry()
    const attr = new BufferAttribute(positions, 3)
    attr.setUsage(DynamicDrawUsage)
    geometry.setAttribute('position', attr)
    geometry.boundingSphere = null
    return { positions, velocities, geometry, attr }
  }, [])

  useEffect(() => {
    const m = mats
    const d = dust
    return () => {
      m.blade.dispose()
      m.edge.dispose()
      m.shock.dispose()
      m.crit.dispose()
      m.halo.dispose()
      m.dust.dispose()
      d.geometry.dispose()
    }
  }, [mats, dust])

  // Leaving the scene must also release the hold on healthy traffic.
  useEffect(() => {
    return () => {
      PIPELINE_BUS.blockUntil = 0
      PIPELINE_BUS.nextCriticalAt = Number.POSITIVE_INFINITY
      PIPELINE_BUS.gateShut = false
    }
  }, [])

  function scatter(origin: Vector3) {
    const { positions, velocities } = dust
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const o = i * 3
      positions[o] = origin.x + (Math.random() - 0.5) * 0.06
      positions[o + 1] = origin.y + (Math.random() - 0.5) * 0.06
      positions[o + 2] = origin.z + (Math.random() - 0.5) * 0.06

      const a = Math.random() * Math.PI * 2
      const r = 0.35 + Math.random() * 0.65
      let vx = Math.cos(a) * r
      const vy = Math.sin(a) * r
      const vz = (Math.random() - 0.5) * 0.5
      // The gate held: debris scatters back and sideways, never downstream.
      if (vx > 0) vx *= 0.1
      const speed = 2.4 + Math.random() * 3.6
      velocities[o] = vx * speed
      velocities[o + 1] = vy * speed
      velocities[o + 2] = vz * speed
    }
    dust.attr.needsUpdate = true
  }

  useFrame((state, dt) => {
    const now = state.clock.getElapsedTime()
    const step = Math.min(dt, 0.05)

    const root = rootRef.current
    const gate = gateRef.current
    if (!root || !gate) return

    // --- mount transition, in step with the markers -------------------------
    if (active === 'pipeline') {
      if (enteredAt.current < 0) enteredAt.current = now
    } else {
      enteredAt.current = -1
      cycleStart.current = -1
      burstCycle.current = -1
      armed.current = true
    }
    const reveal = enteredAt.current < 0 ? 0 : revealAt(now - enteredAt.current, GATE_INDEX)
    gate.scale.setScalar(reveal <= 0 ? 0.0001 : easeOutBack(reveal))
    root.visible = reveal > 0
    if (reveal <= 0) {
      PIPELINE_BUS.nextCriticalAt = Number.POSITIVE_INFINITY
      PIPELINE_BUS.blockUntil = 0
      return
    }

    // --- static gate: lite tier and reduced motion --------------------------
    if (!animated) {
      // Shut, and it stays shut. Healthy packets stop here; the conveyor past
      // Trivy is permanently empty, which is the same statement without motion.
      PIPELINE_BUS.gateShut = true
      PIPELINE_BUS.blockUntil = 0
      PIPELINE_BUS.nextCriticalAt = Number.POSITIVE_INFINITY
      const top = topRef.current
      const bottom = bottomRef.current
      if (top) top.position.y = PACKET_LIFT + APERTURE_SHUT + BLADE_HALF
      if (bottom) bottom.position.y = PACKET_LIFT - (APERTURE_SHUT + BLADE_HALF)
      mats.edge.emissiveIntensity = 1.35
      if (lightRef.current) lightRef.current.intensity = 1.2
      if (critRef.current) critRef.current.visible = false
      if (shockRef.current) shockRef.current.visible = false
      if (pointsRef.current) pointsRef.current.visible = false
      return
    }

    PIPELINE_BUS.gateShut = false

    // --- cycle bookkeeping --------------------------------------------------
    // The destruction is not a loop the visitor happens to catch mid-way. It is
    // caused by their arrival: the red packet leaves as they reach the plateau,
    // and the silence that follows lands where they are sitting still, reading
    // the paragraph about `--exit-code 1`.
    const p = JOURNEY.progress
    const onPlateau = onGatePlateau(p)

    if (clearOfGatePlateau(p)) {
      armed.current = true
    }

    if (onPlateau && armed.current) {
      armed.current = false
      cycleStart.current = now
      cycleIndex.current += 1
    }

    if (cycleStart.current < 0) {
      // Not triggered yet: the chain runs clean, the gate sits armed and open.
      PIPELINE_BUS.blockUntil = 0
      PIPELINE_BUS.nextCriticalAt = Number.POSITIVE_INFINITY
      const idleTop = topRef.current
      const idleBottom = bottomRef.current
      if (idleTop) idleTop.position.y = PACKET_LIFT + APERTURE_ARMED + BLADE_HALF
      if (idleBottom) idleBottom.position.y = PACKET_LIFT - (APERTURE_ARMED + BLADE_HALF)
      mats.edge.emissiveIntensity = 1.1
      mats.blade.emissiveIntensity = 0.16
      if (lightRef.current) lightRef.current.intensity = 0.9
      if (critRef.current) critRef.current.visible = false
      if (shockRef.current) shockRef.current.visible = false
      if (pointsRef.current) pointsRef.current.visible = false
      return
    }

    const ct = now - cycleStart.current

    // One run, then the gate goes quiet until the next arrival.
    if (ct > PERIOD) {
      cycleStart.current = -1
      return
    }

    PIPELINE_BUS.blockUntil = cycleStart.current + SILENCE_END
    PIPELINE_BUS.nextCriticalAt = armed.current
      ? Number.POSITIVE_INFINITY
      : cycleStart.current + PERIOD

    const d = ct - TRAVEL_END

    // --- 1. the CRITICAL packet rides in ------------------------------------
    const crit = critRef.current
    if (crit) {
      const inbound = ct < TRAVEL_END
      crit.visible = inbound
      if (inbound) {
        sampleConveyor(criticalS(ct), scratch.pos)
        crit.position.set(scratch.pos.x, scratch.pos.y + PACKET_LIFT, scratch.pos.z)
        crit.rotation.y += step * 2.1
        crit.rotation.z += step * 1.3
        // Pulsing, and it tightens as it nears the gate.
        const urgency = 1 + (ct / TRAVEL_END) * 9
        // Resolves in on the lead-in, like the healthy traffic does.
        const edge = ct < SEG ? 0.1 + smootherstep(ct / (SEG * TRAVEL_FRAC)) * 0.9 : 1
        crit.scale.setScalar((1 + Math.sin(now * urgency) * 0.11) * edge)
        mats.halo.opacity = 0.12 + Math.abs(Math.sin(now * urgency)) * 0.14
      }
    }

    // --- 2. the gate snaps shut and flares ----------------------------------
    let aperture = APERTURE_ARMED
    if (d >= 0 && ct < REOPEN_START) {
      aperture = APERTURE_ARMED + (APERTURE_SHUT - APERTURE_ARMED) * easeOutQuint(d / 0.085)
    } else if (ct >= REOPEN_START && ct < SILENCE_END) {
      const k = easeOutCubic((ct - REOPEN_START) / (SILENCE_END - REOPEN_START))
      aperture = APERTURE_SHUT + (APERTURE_ARMED - APERTURE_SHUT) * k
    }
    const top = topRef.current
    const bottom = bottomRef.current
    if (top) top.position.y = PACKET_LIFT + aperture + BLADE_HALF
    if (bottom) bottom.position.y = PACKET_LIFT - (aperture + BLADE_HALF)

    // `flareAt` already carries the shape — 30ms rise, exponential fall — so it
    // is applied straight, with no smoothing to blunt the snap.
    const flare = flareAt(d)
    mats.edge.emissiveIntensity = 1.1 + flare * 9
    mats.blade.emissiveIntensity = 0.16 + flare * 1.6
    if (lightRef.current) lightRef.current.intensity = 0.9 + flare * 34

    // --- the shockwave ------------------------------------------------------
    const life = d / BURST_DUR
    const shock = shockRef.current
    if (shock) {
      const live = life >= 0 && life <= 1
      shock.visible = live
      if (live) {
        shock.scale.setScalar(0.22 + easeOutCubic(life) * 3.1)
        mats.shock.opacity = Math.pow(1 - life, 1.7) * 0.85
        scratch.color.copy(C_ALERT).lerp(C_AMBER, life)
        mats.shock.color.copy(scratch.color)
      }
    }

    // --- the burst ----------------------------------------------------------
    const pts = pointsRef.current
    if (pts) {
      if (d >= 0 && burstCycle.current !== cycleIndex.current) {
        burstCycle.current = cycleIndex.current
        sampleConveyor(GATE_INDEX, scratch.pos)
        scratch.pos.y += PACKET_LIFT
        scatter(scratch.pos)
      }
      const live = life >= 0 && life <= 1
      pts.visible = live
      if (live) {
        const { positions, velocities } = dust
        const decay = Math.exp(-step * 5.5)
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const o = i * 3
          velocities[o] *= decay
          velocities[o + 1] *= decay
          velocities[o + 2] *= decay
          positions[o] += velocities[o] * step
          positions[o + 1] += velocities[o + 1] * step
          positions[o + 2] += velocities[o + 2] * step
        }
        dust.attr.needsUpdate = true
        mats.dust.opacity = Math.pow(1 - life, 1.5)
        mats.dust.size = 0.075 * (1 - life * 0.55)
      }
    }

    // --- 3. silence, then 4. traffic resumes, handled by PIPELINE_BUS -------
  })

  return (
    <group ref={rootRef} visible={false}>
      <group ref={gateRef} position={GATE_POS} scale={0.0001}>
        {/* The shutter, centred on the line the artifacts actually ride, not on
            the rail. At rest it is a slot they pass through; when a CRITICAL
            finding lands it closes onto one. */}
        <group ref={topRef} position={[0, PACKET_LIFT + APERTURE_ARMED + BLADE_HALF, 0]}>
          <mesh geometry={BLADE_GEOM} material={mats.blade} />
          <mesh geometry={EDGE_GEOM} material={mats.edge} position={[0, -BLADE_HALF - 0.011, 0]} />
        </group>
        <group ref={bottomRef} position={[0, PACKET_LIFT - (APERTURE_ARMED + BLADE_HALF), 0]}>
          <mesh geometry={BLADE_GEOM} material={mats.blade} />
          <mesh geometry={EDGE_GEOM} material={mats.edge} position={[0, BLADE_HALF + 0.011, 0]} />
        </group>

        <mesh
          ref={shockRef}
          geometry={SHOCK_GEOM}
          material={mats.shock}
          position={[0, PACKET_LIFT, 0]}
          visible={false}
        />

        <pointLight
          ref={lightRef}
          color={PIPE.amber}
          intensity={0.9}
          distance={7.5}
          decay={2}
          position={[0, PACKET_LIFT, 0.35]}
        />

        {/* The mechanism, named. Always on, in mute — it is a caption, not a
            headline. */}
        <Billboard position={[0, -1.55, 0.05]}>
          <Text
            font={monoFontUrl}
            fontSize={0.084}
            letterSpacing={0.1}
            color={PIPE.mute}
            anchorX="center"
            anchorY="middle"
          >
            trivy image
          </Text>
          <Text
            font={monoFontUrl}
            fontSize={0.084}
            letterSpacing={0.1}
            color={PIPE.mute}
            anchorX="center"
            anchorY="middle"
            position={[0, -0.17, 0]}
          >
            --severity CRITICAL --exit-code 1
          </Text>
        </Billboard>
      </group>

      {/* World-space, because it travels the conveyor rather than sitting on
          the gate. Larger and hotter than the healthy traffic. */}
      <group ref={critRef} visible={false}>
        <mesh geometry={CRIT_GEOM} material={mats.crit} />
        <mesh geometry={HALO_GEOM} material={mats.halo} />
      </group>

      <points
        ref={pointsRef}
        geometry={dust.geometry}
        material={mats.dust}
        visible={false}
        frustumCulled={false}
      />
    </group>
  )
}
