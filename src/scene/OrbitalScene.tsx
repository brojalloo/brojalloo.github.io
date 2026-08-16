import { Core } from './Core'
import { Links } from './Links'
import { NodeMesh } from './NodeMesh'
import { Starfield } from './Starfield'
import { NODES } from './nodes'

/**
 * The overview: a core, six nodes, the traffic between them, and enough sky to
 * give it depth. The canvas, fog, camera rig and postprocessing belong to the
 * app shell — this file is only the contents of the world.
 */
export function OrbitalScene() {
  return (
    <group>
      {/* Barely enough fill to keep unlit faces from going pure black. */}
      <ambientLight intensity={0.28} color="#8d99a8" />
      {/* The core is the light source of the scene, so the key light sits in it. */}
      <pointLight position={[0, 0, 0]} color="#ff7a1a" intensity={26} distance={30} decay={2} />
      {/* One cool rim from behind, to separate the nodes from the void. */}
      <directionalLight position={[-9, 7, -11]} color="#4dd8c0" intensity={0.45} />

      <Starfield />
      <Core />
      <Links />

      {NODES.map((node) => (
        <NodeMesh key={node.id} spec={node} />
      ))}
    </group>
  )
}
