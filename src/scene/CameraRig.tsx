import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { MathUtils, Spherical, Vector3 } from 'three'

import { useApp } from '../store'
import { dockAim, dockPosition, HOME_POSITION, NODE_BY_ID } from './nodes'
import { JOURNEY, journeyAim, journeyView } from './journey'

/**
 * The camera is fully authored — no OrbitControls. Every view in the site is a
 * position and a look-at point, and the rig damps toward whichever pair the
 * store currently asks for. Because both the position and the target are
 * damped with the same lambda, a 60-unit drop to the pipeline and a 3-unit
 * hop to a neighbouring node use the identical curve: no easing table, no
 * special case, nothing that stalls halfway.
 */

/** ~1s to settle, no overshoot. */
const LAMBDA = 2.2
/** Faster than the node transitions: the journey must feel connected to the
    wheel, not like a camera catching up from another room. */
const JOURNEY_LAMBDA = 4.2
const PARALLAX = 0.8
const DRAG_CLAMP = 0.35
const DRAG_SENSITIVITY = 0.0035
const DRAG_RETURN = 1.8

export function CameraRig() {
  const active = useApp((s) => s.active)
  const gl = useThree((s) => s.gl)
  // Matches the breakpoint at which the panel stops being a right-hand column
  // and becomes a bottom sheet, which is what the lateral aim compensates for.
  const wide = useThree((s) => s.size.width) >= 768

  // Only the static destinations are memoised. The pipeline target is a
  // function of JOURNEY.progress and is therefore recomputed each frame, below,
  // into these same vectors — which never reallocate.
  const target = useMemo(() => {
    const position = new Vector3()
    const look = new Vector3()

    if (active === null) {
      position.fromArray(HOME_POSITION)
      look.set(0, 0, 0)
    } else if (active !== 'pipeline') {
      const node = NODE_BY_ID[active]
      position.fromArray(node.position).add(new Vector3(...dockPosition(node.radius)))
      look.fromArray(node.position).add(new Vector3(...dockAim(node.radius, wide)))
    }

    return { position, look }
  }, [active, wide])

  const scratch = useMemo(() => ({ desired: new Vector3(), spherical: new Spherical() }), [])
  const journeyScratch = useMemo(() => ({ view: new Vector3(), aim: new Vector3() }), [])
  const lookNow = useRef(new Vector3(0, 0, 0))

  // Drag is an offset from the authored overview, not a free orbit: it springs
  // back to centre so the composition can never be left broken.
  const drag = useRef({ dragging: false, x: 0, y: 0, azimuth: 0, elevation: 0 })

  useEffect(() => {
    const canvas = gl.domElement
    const d = drag.current

    const onDown = (e: PointerEvent) => {
      d.dragging = true
      d.x = e.clientX
      d.y = e.clientY
    }
    const onMove = (e: PointerEvent) => {
      if (!d.dragging) return
      d.azimuth = MathUtils.clamp(
        d.azimuth - (e.clientX - d.x) * DRAG_SENSITIVITY,
        -DRAG_CLAMP,
        DRAG_CLAMP,
      )
      d.elevation = MathUtils.clamp(
        d.elevation + (e.clientY - d.y) * DRAG_SENSITIVITY,
        -DRAG_CLAMP,
        DRAG_CLAMP,
      )
      d.x = e.clientX
      d.y = e.clientY
    }
    const onUp = () => {
      d.dragging = false
    }

    canvas.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      canvas.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [gl])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1)
    const d = drag.current
    const atHome = active === null

    if (!atHome || !d.dragging) {
      d.azimuth = MathUtils.damp(d.azimuth, 0, DRAG_RETURN, dt)
      d.elevation = MathUtils.damp(d.elevation, 0, DRAG_RETURN, dt)
    }

    // The journey is damped here, not in the scroll handler: the scroll writes
    // a target whenever the visitor moves, the camera closes the gap at its own
    // pace, and a flick of the wheel becomes a glide rather than a jump.
    const onJourney = active === 'pipeline'
    if (onJourney) {
      JOURNEY.progress = MathUtils.damp(JOURNEY.progress, JOURNEY.target, JOURNEY_LAMBDA, dt)
      journeyView(JOURNEY.progress, journeyScratch.view)
      journeyAim(JOURNEY.progress, wide, journeyScratch.aim)
      target.position.copy(journeyScratch.view)
      target.look.copy(journeyScratch.aim)
    }

    scratch.desired.copy(target.position)

    if (atHome) {
      scratch.spherical.setFromVector3(scratch.desired)
      scratch.spherical.theta += d.azimuth
      scratch.spherical.phi = MathUtils.clamp(
        scratch.spherical.phi + d.elevation,
        0.25,
        Math.PI - 0.25,
      )
      scratch.desired.setFromSpherical(scratch.spherical)
      scratch.desired.x += state.pointer.x * PARALLAX
      scratch.desired.y += state.pointer.y * PARALLAX
    }

    const cam = state.camera
    cam.position.x = MathUtils.damp(cam.position.x, scratch.desired.x, LAMBDA, dt)
    cam.position.y = MathUtils.damp(cam.position.y, scratch.desired.y, LAMBDA, dt)
    cam.position.z = MathUtils.damp(cam.position.z, scratch.desired.z, LAMBDA, dt)

    const look = lookNow.current
    look.x = MathUtils.damp(look.x, target.look.x, LAMBDA, dt)
    look.y = MathUtils.damp(look.y, target.look.y, LAMBDA, dt)
    look.z = MathUtils.damp(look.z, target.look.z, LAMBDA, dt)
    cam.lookAt(look)
  })

  return null
}
