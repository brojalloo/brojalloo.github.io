import { useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Fog, MathUtils } from 'three'
import { useApp } from '../store'

/**
 * Depth of field for the two places the camera can be.
 *
 * The scene's fog is tuned for the orbital overview, where 22 to 78 units is
 * the right depth. Left alone inside the pipeline it would render the far
 * gantries as a crisp flat grid instead of letting them dissolve; closed in,
 * the hall gains its distance.
 *
 * This lives at the scene root rather than inside `pipeline/`, and deliberately
 * imports nothing from that folder. It has to stay mounted on the way *out* of
 * the node to ease the fog back — and `PipelineScene` is lazily loaded and
 * unmounts the moment you leave, which would both strand the fog at hall depth
 * and drag the whole pipeline subtree into the initial bundle.
 */

const HALL_NEAR = 9
const HALL_FAR = 46
const HOME_NEAR = 22
const HOME_FAR = 78
/** Slow enough to read as depth opening up, not as a lens change. */
const LAMBDA = 2.2

export function HallFog() {
  const scene = useThree((s) => s.scene)
  const active = useApp((s) => s.active)
  const fog = useMemo(() => (scene.fog instanceof Fog ? scene.fog : null), [scene])

  useFrame((_, delta) => {
    if (!fog) return
    const dt = Math.min(delta, 0.1)
    const inside = active === 'pipeline'
    fog.near = MathUtils.damp(fog.near, inside ? HALL_NEAR : HOME_NEAR, LAMBDA, dt)
    fog.far = MathUtils.damp(fog.far, inside ? HALL_FAR : HOME_FAR, LAMBDA, dt)
  })

  return null
}
