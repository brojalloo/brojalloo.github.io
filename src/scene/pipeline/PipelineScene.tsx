import { STAGES } from '../../content'
import { Conveyor, PIPE } from './Conveyor'
import { Hall } from './Hall'
import { Packets } from './Packets'
import { SecurityGate } from './SecurityGate'
import { StageMarker } from './StageMarker'

/**
 * The signature scene: Ibrahima's Jenkins pipeline as a bench you can walk
 * along. Nine stages, artifacts moving through them, and one gate that
 * destroys what must not reach production.
 *
 * Everything below is placed in world space through `stagePosition` — there is
 * deliberately no wrapping transform, because the camera module aims at those
 * same world coordinates. Adding an offset group here would silently point the
 * camera at empty space.
 *
 * This component renders no Canvas, no camera and no postprocessing; it is a
 * subtree, not a scene root.
 */
export function PipelineScene() {
  return (
    <>
      {/* Local lighting. Directional lights only carry a direction, so these
          stay correct wherever the chain sits in the world. */}
      <hemisphereLight args={['#22303f', PIPE.void, 0.42]} />
      <directionalLight color={PIPE.amber} intensity={0.95} position={[-3.5, 8, 4.5]} />
      {/* A cold rim from behind, so the markers keep an edge against the void. */}
      <directionalLight color={PIPE.trace} intensity={0.22} position={[2.5, -1.5, -6]} />

      <Hall />

      <Conveyor />

      {STAGES.map((spec, i) => (
        <StageMarker key={spec.key} index={i} spec={spec} />
      ))}

      <Packets />
      <SecurityGate />
    </>
  )
}
