import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import { BoxGeometry, Color, MeshStandardMaterial, SphereGeometry, TorusGeometry } from 'three'
import type { Group } from 'three'
import monoFontUrl from '@fontsource/martian-mono/files/martian-mono-latin-400-normal.woff?url'
import type { PipelineStage } from '../../types'
import { useApp } from '../../store'
import { stagePosition } from '../layout'
import { JOURNEY, progressForStage } from '../journey'
import {
  C_AMBER,
  C_BONE,
  C_HULL,
  C_MUTE,
  damp,
  easeOutBack,
  PIPE,
  prefersReducedMotion,
  revealAt,
  type TroikaText,
} from './Conveyor'

/**
 * One stage of the chain. A marker, not a blob: an open ring the artifact
 * passes through, a number, a label. The Trivy stage is the exception — it is
 * built as a structure, because it is the one stage with the power to stop
 * everything.
 */

interface Props {
  index: number
  spec: PipelineStage
}

// Geometry is shared by all nine markers — built once, never per frame.
const RING_GEOM = new TorusGeometry(0.5, 0.013, 6, 48, Math.PI * 1.62)
const GATE_RING_GEOM = new TorusGeometry(0.74, 0.019, 6, 56, Math.PI * 2)
const STEM_GEOM = new BoxGeometry(0.008, 0.2, 0.008)
const POST_GEOM = new BoxGeometry(0.055, 1.98, 0.14)
const BEAM_GEOM = new BoxGeometry(1.42, 0.062, 0.14)
const FOOT_GEOM = new BoxGeometry(0.2, 0.05, 0.2)
const HIT_SPHERE = new SphereGeometry(0.92, 12, 10)
const HIT_BOX = new BoxGeometry(1.75, 2.4, 1.1)

/** Progress distance over which a marker fades from lit to dark. */
const FOCUS_REACH = 0.075

export function StageMarker({ index, spec }: Props) {
  const active = useApp((s) => s.active)

  const position = useMemo(() => stagePosition(index), [index])
  const number = useMemo(() => String(index + 1).padStart(2, '0'), [index])

  const groupRef = useRef<Group | null>(null)
  const numberRef = useRef<TroikaText | null>(null)
  const labelRef = useRef<TroikaText | null>(null)
  const hovered = useRef(false)
  const enteredAt = useRef(-1)

  // Animated scalars, lerped every frame rather than snapped on state change.
  const anim = useRef({ focus: 0, hover: 0, dim: 0 })

  // Every mutable Color and Material is allocated once, here.
  const mats = useMemo(() => {
    const body = new MeshStandardMaterial({
      color: C_HULL.clone(),
      emissive: C_MUTE.clone(),
      emissiveIntensity: 0.16,
      roughness: 0.55,
      metalness: 0.12,
      transparent: true,
      opacity: 1,
    })
    const edge = new MeshStandardMaterial({
      color: C_HULL.clone(),
      emissive: C_MUTE.clone(),
      emissiveIntensity: 0.3,
      roughness: 0.35,
      metalness: 0.2,
      transparent: true,
      opacity: 1,
    })
    return { body, edge }
  }, [])

  const scratch = useMemo(
    () => ({ emissive: new Color(), base: new Color(), num: new Color(), label: new Color() }),
    [],
  )

  useEffect(() => {
    const { body, edge } = mats
    return () => {
      body.dispose()
      edge.dispose()
    }
  }, [mats])

  useEffect(() => {
    return () => {
      // Never leave the cursor stuck in the pointer state on unmount.
      if (hovered.current && typeof document !== 'undefined') {
        document.body.style.cursor = 'auto'
      }
    }
  }, [])

  const setCursor = useCallback((on: boolean) => {
    if (typeof document === 'undefined') return
    document.body.style.cursor = on ? 'pointer' : 'auto'
  }, [])

  const onOver = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation()
      hovered.current = true
      setCursor(true)
    },
    [setCursor],
  )

  const onOut = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation()
      hovered.current = false
      setCursor(false)
    },
    [setCursor],
  )

  const onClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation()
      // Everything moves the camera through the scroll position, this included.
      // Nothing in the scene sets the camera directly.
      const block = document.querySelector<HTMLElement>(`[data-stage-index="${index}"]`)
      block?.scrollIntoView({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'center',
      })
    },
    [index],
  )

  useFrame((state, dt) => {
    const now = state.clock.getElapsedTime()
    const group = groupRef.current
    if (!group) return

    // --- mount transition: stage 01 resolves first, the rest follow ---
    if (active === 'pipeline') {
      if (enteredAt.current < 0) enteredAt.current = now
    } else {
      enteredAt.current = -1
    }
    const reveal = enteredAt.current < 0 ? 0 : revealAt(now - enteredAt.current, index)
    const scale = reveal <= 0 ? 0.0001 : easeOutBack(reveal)
    group.scale.setScalar(scale)
    group.visible = reveal > 0

    if (reveal <= 0) return

    // --- state → animated scalars ---
    const a = anim.current
    // Focus is a distance, not a match: the camera is continuously somewhere
    // between two stages, and the light on the markers has to be too.
    const reach = Math.abs(JOURNEY.progress - progressForStage(index))
    const focusTarget = Math.max(0, 1 - reach / FOCUS_REACH)
    const hoverTarget = hovered.current ? 1 : 0
    const dimTarget = 1 - focusTarget
    a.focus = damp(a.focus, focusTarget, 9, dt)
    a.hover = damp(a.hover, hoverTarget, 12, dt)
    a.dim = damp(a.dim, dimTarget, 7, dt)

    // The gate is amber even at rest — it is the structure, not a marker.
    const heat = spec.gate ? Math.max(a.focus, 0.4) : a.focus
    const attention = Math.max(a.hover, a.focus)
    const fade = 1 - a.dim * 0.72

    // --- structure ---
    scratch.emissive.copy(C_MUTE).lerp(C_BONE, a.hover * 0.8).lerp(C_AMBER, heat)
    scratch.base.copy(C_HULL).lerp(C_AMBER, heat * 0.3)

    mats.body.emissive.copy(scratch.emissive)
    mats.body.color.copy(scratch.base)
    mats.body.emissiveIntensity = (0.16 + a.hover * 0.45 + heat * 0.95) * fade
    mats.body.opacity = 0.35 + 0.65 * fade

    mats.edge.emissive.copy(scratch.emissive)
    mats.edge.color.copy(scratch.base)
    mats.edge.emissiveIntensity = (0.3 + a.hover * 0.6 + heat * 1.6) * fade
    mats.edge.opacity = 0.35 + 0.65 * fade

    // --- type ---
    const num = numberRef.current
    if (num) {
      scratch.num.copy(C_MUTE).lerp(C_AMBER, heat).multiplyScalar(fade)
      num.color = scratch.num
    }
    const label = labelRef.current
    if (label) {
      scratch.label.copy(C_MUTE).lerp(C_BONE, attention).lerp(C_AMBER, a.focus * 0.55)
      scratch.label.multiplyScalar(fade)
      label.color = scratch.label
    }
  })

  const gate = spec.gate === true
  const numberY = gate ? 1.24 : 0.78
  const labelY = gate ? -1.2 : -0.9

  return (
    <group ref={groupRef} position={position} scale={0.0001}>
      {gate ? (
        <>
          {/* The gate is a frame the whole chain has to pass through. */}
          <mesh geometry={GATE_RING_GEOM} material={mats.edge} />
          <mesh geometry={POST_GEOM} material={mats.body} position={[-0.66, 0, 0]} />
          <mesh geometry={POST_GEOM} material={mats.body} position={[0.66, 0, 0]} />
          <mesh geometry={BEAM_GEOM} material={mats.edge} position={[0, 0.96, 0]} />
          <mesh geometry={BEAM_GEOM} material={mats.edge} position={[0, -0.96, 0]} />
          <mesh geometry={FOOT_GEOM} material={mats.body} position={[-0.66, -1.01, 0]} />
          <mesh geometry={FOOT_GEOM} material={mats.body} position={[0.66, -1.01, 0]} />
        </>
      ) : (
        <>
          {/* An open ring: the artifact goes through it, it does not stop it. */}
          <mesh geometry={RING_GEOM} material={mats.edge} rotation={[0, 0, Math.PI * 0.19]} />
          <mesh geometry={STEM_GEOM} material={mats.body} position={[0, -0.6, 0]} />
        </>
      )}

      <Billboard>
        <Text
          ref={numberRef}
          font={monoFontUrl}
          fontSize={0.13}
          letterSpacing={0.14}
          color={PIPE.mute}
          anchorX="center"
          anchorY="middle"
          position={[0, numberY, 0]}
        >
          {number}
        </Text>
        <Text
          ref={labelRef}
          font={monoFontUrl}
          fontSize={0.115}
          letterSpacing={0.16}
          color={PIPE.mute}
          anchorX="center"
          anchorY="middle"
          position={[0, labelY, 0]}
        >
          {spec.label}
        </Text>
      </Billboard>

      {/* Generous invisible hit target — the visible geometry is hairline thin. */}
      <mesh
        geometry={gate ? HIT_BOX : HIT_SPHERE}
        onClick={onClick}
        onPointerOver={onOver}
        onPointerOut={onOut}
      >
        <meshBasicMaterial visible={false} />
      </mesh>
    </group>
  )
}
