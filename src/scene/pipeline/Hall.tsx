import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferGeometry, Float32BufferAttribute } from 'three'
import type { LineBasicMaterial } from 'three'
import { STAGES } from '../../content'
import { PIPELINE_ORIGIN, STAGE_SPACING, stagePosition } from '../layout'
import { useApp } from '../../store'
import { damp, easeOutCubic, PIPE } from './Conveyor'

/**
 * The room the chain runs through.
 *
 * The scene needs a floor and a rhythm — without them the camera glides past
 * markers floating in nothing and the traversal reads as a slideshow. But the
 * hall has no ceiling and no walls: the void above stays open, both because
 * the site's whole identity is a bench in the dark, and because the orbital
 * overview is genuinely sixty units up there.
 *
 * Everything here is wireframe, built once at module scope into three merged
 * geometries. Three draw calls for the entire set.
 */

const SPAN = (STAGES.length - 1) * STAGE_SPACING
const HALF = SPAN / 2 + STAGE_SPACING * 1.6
const FLOOR_Y = PIPELINE_ORIGIN[1] - 2.6
const CELL = 1.7
/** How far the floor reaches on either side of the chain. */
const FLOOR_DEPTH = 13

function buildFloor(depth: number): BufferGeometry {
  const v: number[] = []
  for (let x = -HALF; x <= HALF + 0.001; x += CELL) {
    v.push(x, FLOOR_Y, -depth, x, FLOOR_Y, depth)
  }
  for (let z = -depth; z <= depth + 0.001; z += CELL) {
    v.push(-HALF, FLOOR_Y, z, HALF, FLOOR_Y, z)
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(v, 3))
  return g
}

/** One open gantry: two uprights and a lintel. No floor beam — the grid is it. */
function pushGantry(v: number[], x: number): void {
  const top = FLOOR_Y + 5.4
  const w = 2.1
  v.push(x, FLOOR_Y, -w, x, top, -w)
  v.push(x, FLOOR_Y, w, x, top, w)
  v.push(x, top, -w, x, top, w)
}

function buildGantries(): BufferGeometry {
  const v: number[] = []
  for (let x = -HALF; x <= HALF + 0.001; x += STAGE_SPACING / 2) pushGantry(v, x)
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(v, 3))
  return g
}

/** Axis-aligned box outline, as twelve segments. */
function pushBox(
  v: number[],
  cx: number,
  cy: number,
  cz: number,
  hx: number,
  hy: number,
  hz: number,
): void {
  const x0 = cx - hx
  const x1 = cx + hx
  const y0 = cy - hy
  const y1 = cy + hy
  const z0 = cz - hz
  const z1 = cz + hz
  const c: [number, number, number][] = [
    [x0, y0, z0],
    [x1, y0, z0],
    [x1, y0, z1],
    [x0, y0, z1],
    [x0, y1, z0],
    [x1, y1, z0],
    [x1, y1, z1],
    [x0, y1, z1],
  ]
  const edges = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ]
  for (const [a, b] of edges) {
    v.push(c[a][0], c[a][1], c[a][2], c[b][0], c[b][1], c[b][2])
  }
}

/**
 * One silhouette per stage, so each post is a place rather than a point.
 * TRIVY gets nothing: its structure is already built in StageMarker, and it
 * must stay the only massive object in the scene.
 */
function buildVolumes(): BufferGeometry {
  const v: number[] = []
  STAGES.forEach((spec, i) => {
    const [x, , z] = stagePosition(i)
    const base = FLOOR_Y
    switch (spec.key) {
      case 'checkout':
      case 'install':
        pushBox(v, x, base + 0.5, z - 2.4, 0.75, 0.5, 0.6)
        break
      case 'test':
        // Stacked plates: one run per assertion group.
        for (let k = 0; k < 3; k++) {
          pushBox(v, x, base + 0.22 + k * 0.34, z - 2.4, 0.8, 0.05, 0.62)
        }
        break
      case 'sonar':
      case 'gate':
        pushBox(v, x, base + 1.5, z - 2.5, 0.16, 1.5, 0.16)
        pushBox(v, x, base + 3.1, z - 2.5, 0.42, 0.12, 0.42)
        break
      case 'build':
        pushBox(v, x, base + 0.62, z - 2.5, 1.15, 0.62, 0.7)
        break
      case 'trivy':
        break
      case 'deploy':
        pushBox(v, x, base + 0.12, z - 2.4, 1.3, 0.12, 0.85)
        break
      case 'health':
        pushBox(v, x, base + 2.2, z - 2.5, 0.3, 0.3, 0.3)
        pushBox(v, x, base + 1.1, z - 2.5, 0.08, 1.1, 0.08)
        break
    }
  })
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(v, 3))
  return g
}

const FLOOR_GEOMETRY = buildFloor(FLOOR_DEPTH)
const FLOOR_GEOMETRY_LITE = buildFloor(FLOOR_DEPTH / 2)
const GANTRY_GEOMETRY = buildGantries()
const VOLUME_GEOMETRY = buildVolumes()

export function Hall() {
  const active = useApp((s) => s.active)
  const tier = useApp((s) => s.tier)

  const floorRef = useRef<LineBasicMaterial | null>(null)
  const gantryRef = useRef<LineBasicMaterial | null>(null)
  const volumeRef = useRef<LineBasicMaterial | null>(null)
  const enteredAt = useRef(-1)

  // The hall resolves before the chain does, so the rail lands in a room
  // rather than the room appearing around an existing rail.
  useFrame((state, dt) => {
    const now = state.clock.getElapsedTime()
    if (active === 'pipeline') {
      if (enteredAt.current < 0) enteredAt.current = now
    } else {
      enteredAt.current = -1
    }
    const t = enteredAt.current < 0 ? 0 : easeOutCubic((now - enteredAt.current) / 0.7)

    const floor = floorRef.current
    if (floor) floor.opacity = damp(floor.opacity, t * 0.4, 8, dt)
    const gantry = gantryRef.current
    if (gantry) gantry.opacity = damp(gantry.opacity, t * 0.55, 8, dt)
    const volume = volumeRef.current
    if (volume) volume.opacity = damp(volume.opacity, t * 0.65, 8, dt)
  })

  return (
    <group>
      <lineSegments
        geometry={tier === 'full' ? FLOOR_GEOMETRY : FLOOR_GEOMETRY_LITE}
        frustumCulled={false}
      >
        <lineBasicMaterial
          ref={floorRef}
          color={PIPE.rule}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </lineSegments>
      <lineSegments geometry={GANTRY_GEOMETRY} frustumCulled={false}>
        <lineBasicMaterial
          ref={gantryRef}
          color={PIPE.rule}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </lineSegments>
      <lineSegments geometry={VOLUME_GEOMETRY} frustumCulled={false}>
        <lineBasicMaterial
          ref={volumeRef}
          color={PIPE.mute}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </lineSegments>
    </group>
  )
}
