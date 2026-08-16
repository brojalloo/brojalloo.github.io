import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Edges } from '@react-three/drei'
import type { Mesh } from 'three'

/**
 * The centre of the scene: the person the whole graph hangs off.
 *
 * Two objects only — a slowly tumbling wireframe shell, and a small solid mass
 * inside it that breathes. The shell is geometry you can read through; the
 * mass is the only thing in the orbital scene allowed to be genuinely bright.
 */

const AMBER = '#ff7a1a'
const EMBER = '#2a1207'

export function Core() {
  const shell = useRef<Mesh>(null)
  const mass = useRef<Mesh>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (shell.current) {
      // Two axes at unrelated rates, so the silhouette never repeats a pose.
      shell.current.rotation.y = t * 0.085
      shell.current.rotation.x = Math.sin(t * 0.043) * 0.42
    }
    if (mass.current) {
      mass.current.scale.setScalar(1 + Math.sin(t * 1.25) * 0.04)
      mass.current.rotation.y = -t * 0.14
    }
  })

  return (
    <group>
      <mesh ref={shell}>
        <icosahedronGeometry args={[1.6, 1]} />
        <meshBasicMaterial color={AMBER} wireframe transparent opacity={0.2} depthWrite={false} />
      </mesh>

      {/* Twenty faces, not eighty, and an emissive kept well under 1: past that
          the facets blow out into a flat orange disc and the mass stops reading
          as an object. The bloom pass supplies the glow instead. */}
      <mesh ref={mass}>
        <icosahedronGeometry args={[0.55, 0]} />
        <meshStandardMaterial
          color={EMBER}
          emissive={AMBER}
          emissiveIntensity={0.72}
          roughness={0.35}
          metalness={0.15}
          flatShading
        />
        <Edges lineWidth={1.4} threshold={12} color={AMBER} transparent opacity={0.9} />
      </mesh>
    </group>
  )
}
