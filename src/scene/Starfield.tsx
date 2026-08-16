import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { PointMaterial, Points } from '@react-three/drei'
import type { Group } from 'three'

import { useApp } from '../store'

/**
 * Ambient depth. Two dim shells — a dense near one in `mute`, a sparser far
 * one in `ash` — turning slowly enough that you register it as parallax rather
 * than as motion. Scene fog is deliberately off here: the field lives well
 * beyond the fog's far plane and would otherwise be erased by it.
 */

const COUNT = { full: 1500, lite: 400 } as const

/** Points on a flattened spherical shell, so the field reads as a disc of sky. */
function shell(count: number, rMin: number, rMax: number): Float32Array {
  const out = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const u = Math.random() * 2 - 1
    const theta = Math.random() * Math.PI * 2
    const r = rMin + Math.random() * (rMax - rMin)
    const s = Math.sqrt(1 - u * u)
    out[i * 3] = r * s * Math.cos(theta)
    out[i * 3 + 1] = r * u * 0.55
    out[i * 3 + 2] = r * s * Math.sin(theta)
  }
  return out
}

export function Starfield() {
  const tier = useApp((s) => s.tier)
  const total = COUNT[tier]

  const field = useMemo(() => {
    const nearCount = Math.round(total * 0.76)
    return {
      near: shell(nearCount, 38, 78),
      far: shell(total - nearCount, 70, 130),
    }
  }, [total])

  const group = useRef<Group>(null)

  useFrame((state) => {
    if (group.current) {
      const t = state.clock.elapsedTime
      group.current.rotation.y = t * 0.007
      group.current.rotation.x = Math.sin(t * 0.02) * 0.04
    }
  })

  return (
    <group ref={group}>
      <Points key={`near-${total}`} positions={field.near} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#55606e"
          size={0.13}
          sizeAttenuation
          depthWrite={false}
          opacity={0.55}
          fog={false}
        />
      </Points>

      <Points key={`far-${total}`} positions={field.far} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#8d99a8"
          size={0.2}
          sizeAttenuation
          depthWrite={false}
          opacity={0.3}
          fog={false}
        />
      </Points>
    </group>
  )
}
