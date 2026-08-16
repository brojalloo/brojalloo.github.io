import { type ComponentRef, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import { Color, MathUtils, Object3D, Vector3 } from 'three'
import type { InstancedMesh } from 'three'

import { useApp } from '../store'
import { NODES } from './nodes'
import type { NodeSpec } from '../types'

/**
 * The connective tissue: one hairline from the core to each node, with packets
 * running outward along it. The lines are almost invisible at rest — what you
 * actually read is the traffic, which is what makes the graph look powered on
 * rather than drawn.
 */

const ORIGIN = new Vector3(0, 0, 0)
const RULE = new Color('#1e2936')
const TRACE = new Color('#4dd8c0')

/** Packet budget: 4 per link at `full` (24 total), 1 at `lite` (6 total). */
const PER_LINK = { full: 4, lite: 1 } as const

function Link({ spec }: { spec: NodeSpec }) {
  const active = useApp((s) => s.active)
  const hovered = useApp((s) => s.hovered)

  const line = useRef<ComponentRef<typeof Line>>(null)
  const focus = useRef(0)

  const points = useMemo(() => [ORIGIN, new Vector3(...spec.position)], [spec])

  useFrame((_state, delta) => {
    const dt = Math.min(delta, 0.1)
    const hot = hovered === spec.id || active === spec.id ? 1 : 0
    focus.current = MathUtils.damp(focus.current, hot, 6, dt)

    const mat = line.current?.material
    if (mat) {
      mat.color.copy(RULE).lerp(TRACE, focus.current)
      mat.opacity = 0.45 + focus.current * 0.55
    }
  })

  return (
    <Line ref={line} points={points} lineWidth={1} color="#1e2936" transparent opacity={0.45} />
  )
}

interface Lane {
  target: Vector3
  offset: number
  speed: number
}

function Packets() {
  const tier = useApp((s) => s.tier)
  const per = PER_LINK[tier]

  const mesh = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new Object3D(), [])

  const lanes = useMemo<Lane[]>(
    () =>
      NODES.flatMap((node, li) =>
        Array.from({ length: per }, (_, k) => ({
          target: new Vector3(...node.position),
          // Stagger both the phase and the rate so the traffic never pulses in
          // unison — a system with six synchronised links reads as a decoration.
          offset: (k / per + li * 0.137) % 1,
          speed: 0.15 + ((li * 5 + k * 3) % 7) * 0.028,
        })),
      ),
    [per],
  )

  useFrame((state) => {
    const m = mesh.current
    if (!m) return
    const t = state.clock.elapsedTime

    for (let i = 0; i < lanes.length; i++) {
      const lane = lanes[i]
      const u = (t * lane.speed + lane.offset) % 1
      dummy.position.copy(lane.target).multiplyScalar(u)
      // Grow out of the core, shrink into the node: an arrival, not a loop cut.
      dummy.scale.setScalar(0.35 + Math.sin(u * Math.PI) * 0.9)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      key={lanes.length}
      ref={mesh}
      args={[undefined!, undefined!, lanes.length]}
      frustumCulled={false}
    >
      <sphereGeometry args={[0.05, 8, 8]} />
      <meshBasicMaterial color="#4dd8c0" toneMapped={false} />
    </instancedMesh>
  )
}

export function Links() {
  return (
    <group>
      {NODES.map((node) => (
        <Link key={node.id} spec={node} />
      ))}
      <Packets />
    </group>
  )
}
