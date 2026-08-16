import { type ComponentRef, useEffect, useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { Billboard, Edges, Text } from '@react-three/drei'
import { Color, DoubleSide, MathUtils } from 'three'
import type { Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, RingGeometry } from 'three'
import monoFontUrl from '@fontsource/martian-mono/files/martian-mono-latin-400-normal.woff?url'

import { useApp } from '../store'
import { CONTENT } from '../content'
import type { NodeSpec } from '../types'

/**
 * One orbiting node. At rest it is a dark solid with a `mute` edge outline —
 * a part on a bench, not a light source. Focus (hover or open) walks it up to
 * amber: edges, emissive, halo and label all ride the same damped 0→1 value,
 * so the node reacts as one object rather than four animated properties.
 */

// Edges rest at `ash`, not `mute`: against a #06080b background a mute outline
// on a dark solid is very nearly invisible, and a node you cannot see is a node
// you cannot click.
const REST = new Color('#8d99a8')
const MUTE = new Color('#55606e')
const AMBER = new Color('#ff7a1a')
const HULL = '#0c1219'
const BONE = '#e9e5db'
const VOID = '#06080b'

const FOCUS_LAMBDA = 7
const LABEL_LAMBDA = 6

/** troika's Text mesh, with the one field we animate per frame. */
type TextMesh = Mesh & { fillOpacity: number }

function geometryFor(spec: NodeSpec) {
  const r = spec.radius
  switch (spec.shape) {
    case 'icosahedron':
      return <icosahedronGeometry args={[r, 0]} />
    case 'octahedron':
      return <octahedronGeometry args={[r, 0]} />
    case 'box':
      return <boxGeometry args={[r * 1.5, r * 1.5, r * 1.5]} />
    case 'tetrahedron':
      return <tetrahedronGeometry args={[r * 1.25, 0]} />
    case 'dodecahedron':
      return <dodecahedronGeometry args={[r, 0]} />
    case 'torus':
      return <torusGeometry args={[r * 0.82, r * 0.3, 8, 28]} />
    case 'cylinder':
      return <cylinderGeometry args={[r, r, r * 0.34, 12]} />
  }
}

export function NodeMesh({ spec }: { spec: NodeSpec }) {
  const active = useApp((s) => s.active)
  const hovered = useApp((s) => s.hovered)
  const lang = useApp((s) => s.lang)
  const goTo = useApp((s) => s.goTo)
  const setHovered = useApp((s) => s.setHovered)

  const orbit = useRef<Group>(null)
  const body = useRef<Mesh>(null)
  const bodyMat = useRef<MeshStandardMaterial>(null)
  const edges = useRef<ComponentRef<typeof Edges>>(null)
  const halo = useRef<Mesh<RingGeometry, MeshBasicMaterial>>(null)
  const label = useRef<TextMesh>(null)

  const focus = useRef(0)
  const labelFade = useRef(0)

  // A per-node phase so six nodes never share a beat.
  const phase = useMemo(() => spec.position[0] * 0.7 + spec.position[2] * 0.3, [spec])

  const legend = CONTENT[lang].nodes[spec.id].legend

  useEffect(() => {
    return () => {
      document.body.style.cursor = ''
    }
  }, [])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1)
    const t = state.clock.elapsedTime

    const hot = hovered === spec.id || active === spec.id ? 1 : 0
    focus.current = MathUtils.damp(focus.current, hot, FOCUS_LAMBDA, dt)
    const f = focus.current

    if (orbit.current) {
      // A drift, not an orbit: the node breathes around its authored position
      // instead of travelling, so the composition stays readable.
      orbit.current.rotation.y = Math.sin(t * spec.orbitSpeed * 2) * 0.16
      orbit.current.position.y = Math.sin(t * 0.35 + phase) * 0.09
    }

    if (body.current) {
      body.current.rotation.x = t * 0.11 + phase
      body.current.rotation.y = t * 0.17
    }

    if (bodyMat.current) {
      bodyMat.current.emissive.copy(MUTE).lerp(AMBER, f)
      // Capped below 1: a fully lit face loses its shading and the solid reads
      // as a flat orange blob instead of a faceted object.
      bodyMat.current.emissiveIntensity = 0.16 + f * 0.42
    }

    const edgeMat = edges.current?.material
    if (edgeMat) {
      edgeMat.color.copy(REST).lerp(AMBER, f)
      edgeMat.opacity = 0.78 + f * 0.22
    }

    if (halo.current) {
      halo.current.scale.setScalar(MathUtils.lerp(spec.radius * 1.3, spec.radius * 1.9, f))
      halo.current.material.opacity = f * 0.42
    }

    // Labels are readable at the overview, brightest under the pointer, and
    // gone entirely once another node owns the screen.
    const labelTarget = active === null ? 0.45 + f * 0.55 : active === spec.id ? 1 : 0
    labelFade.current = MathUtils.damp(labelFade.current, labelTarget, LABEL_LAMBDA, dt)
    if (label.current) {
      label.current.fillOpacity = labelFade.current
      label.current.visible = labelFade.current > 0.02
    }
  })

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHovered(spec.id)
    document.body.style.cursor = 'pointer'
  }
  const onOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHovered(null)
    document.body.style.cursor = ''
  }
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    goTo(spec.id)
  }

  return (
    <group ref={orbit}>
      <group position={spec.position}>
        <mesh ref={body}>
          {geometryFor(spec)}
          <meshStandardMaterial
            ref={bodyMat}
            color={HULL}
            emissive={MUTE}
            emissiveIntensity={0.06}
            roughness={0.55}
            metalness={0.2}
            flatShading
          />
          <Edges ref={edges} lineWidth={1} threshold={20} color="#55606e" transparent opacity={0.6} />
        </mesh>

        <Billboard>
          <mesh ref={halo}>
            <ringGeometry args={[1, 1.035, 64]} />
            <meshBasicMaterial
              color="#ff7a1a"
              transparent
              opacity={0}
              side={DoubleSide}
              depthWrite={false}
            />
          </mesh>
        </Billboard>

        <Billboard position={[0, -(spec.radius + 0.55), 0]}>
          <Text
            ref={label}
            font={monoFontUrl}
            fontSize={0.26}
            color={BONE}
            letterSpacing={0.14}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.006}
            outlineColor={VOID}
          >
            {legend}
          </Text>
        </Billboard>

        {/* Generous invisible hit target — the small nodes must still be easy
            to reach, and the pointer should never fall through an edge gap. */}
        <mesh visible={false} onPointerOver={onOver} onPointerOut={onOut} onClick={onClick}>
          <sphereGeometry args={[spec.radius * 1.95, 12, 12]} />
        </mesh>
      </group>
    </group>
  )
}
