import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { AnimatePresence } from 'framer-motion'

import { useApp } from './store'
import { detectTier, dprRange } from './lib/perf'
import { HOME_POSITION } from './scene/nodes'
import { OrbitalScene } from './scene/OrbitalScene'
import { CameraRig } from './scene/CameraRig'
import { HallFog } from './scene/HallFog'
import { SECTIONS } from './sections'
import { Boot } from './ui/Boot'
import { Hud } from './ui/Hud'
import { Panel } from './ui/Panel'
import { Fallback } from './Fallback'

// The pipeline is the heaviest scene and most visitors open the overview
// first, so it is fetched only once someone actually goes there.
const PipelineScene = lazy(() =>
  import('./scene/pipeline/PipelineScene').then((m) => ({ default: m.PipelineScene })),
)

// Same reasoning for the postprocessing pass: it is a large dependency that the
// lite tier never renders, and the lite tier is most phones.
const Effects = lazy(() => import('./scene/Effects').then((m) => ({ default: m.Effects })))

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

export default function App() {
  const active = useApp((s) => s.active)
  const lang = useApp((s) => s.lang)
  const booting = useApp((s) => s.booting)
  const tier = useApp((s) => s.tier)
  const setTier = useApp((s) => s.setTier)

  const [webgl] = useState(hasWebGL)
  // Set once at boot rather than per frame: re-deciding the budget mid-session
  // would make the scene visibly change quality while someone is looking at it.
  useEffect(() => {
    setTier(detectTier())
  }, [setTier])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const dpr = useMemo(() => dprRange(tier), [tier])
  const Section = active ? SECTIONS[active] : null

  if (!webgl) {
    return <Fallback />
  }

  return (
    <>
      <Canvas
        dpr={dpr}
        gl={{ antialias: tier === 'full', powerPreference: 'high-performance' }}
        camera={{ position: HOME_POSITION, fov: 46, near: 0.1, far: 400 }}
        // The scene animates continuously (orbits, packets), so the default
        // always-on loop is correct here; demand mode would freeze the traffic.
      >
        <color attach="background" args={['#06080b']} />
        <fog attach="fog" args={['#06080b', 22, 78]} />

        <CameraRig />
        {/* Outside the lazy pipeline subtree on purpose: it has to be alive on
            the way out to ease the fog back, and importing it from `pipeline/`
            would pull that whole folder into the initial bundle. */}
        <HallFog />
        <OrbitalScene />

        {active === 'pipeline' && (
          <Suspense fallback={null}>
            <PipelineScene />
          </Suspense>
        )}

        {tier === 'full' && (
          <Suspense fallback={null}>
            <Effects />
          </Suspense>
        )}
      </Canvas>

      <Hud />

      <AnimatePresence mode="wait">{Section ? <Panel key={active}><Section /></Panel> : null}</AnimatePresence>

      <AnimatePresence>{booting && <Boot key="boot" />}</AnimatePresence>
    </>
  )
}
