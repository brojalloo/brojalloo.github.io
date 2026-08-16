import type { NodeSpec } from '../types'

/**
 * Layout of the six orbiting nodes.
 *
 * Not a flat ring: the nodes sit on a tilted, uneven shell so the scene reads
 * as depth rather than as a carousel. `pipeline` is deliberately the largest
 * and the closest to the camera's resting position — it is the main project,
 * and the composition should say so before any text does.
 */
export const NODES: NodeSpec[] = [
  { id: 'pipeline', position: [5.5, 1.9, 2.2], radius: 0.85, orbitSpeed: 0.055, shape: 'icosahedron' },
  { id: 'projets', position: [1.0, 5.8, -1.4], radius: 0.58, orbitSpeed: 0.05, shape: 'box' },
  { id: 'whoami', position: [-4.9, 3.4, 1.6], radius: 0.58, orbitSpeed: 0.048, shape: 'dodecahedron' },
  { id: 'parcours', position: [-5.5, -2.1, -2.0], radius: 0.5, orbitSpeed: 0.042, shape: 'tetrahedron' },
  { id: 'contact', position: [-0.6, -5.9, 1.0], radius: 0.46, orbitSpeed: 0.058, shape: 'torus' },
  { id: 'arsenal', position: [4.5, -3.8, -1.8], radius: 0.6, orbitSpeed: 0.062, shape: 'octahedron' },
]

export const NODE_BY_ID = Object.fromEntries(NODES.map((n) => [n.id, n])) as Record<
  NodeSpec['id'],
  NodeSpec
>

/**
 * Docking a node is two offsets, not one.
 *
 * `dockDistance` is scaled by the node's radius so every node fills roughly the
 * same slice of the viewport whatever its size — a fixed distance put the
 * camera inside the larger shapes.
 *
 * `dockAim` is what actually moves the node off-centre. Offsetting the camera
 * sideways does nothing on its own: the node stays wherever the camera looks.
 * To push it into the empty left third, clear of the content panel that covers
 * the right ~46% of a wide viewport, the camera has to aim to its right.
 */
export function dockDistance(radius: number): number {
  return Math.max(6, radius * 14.7)
}

export function dockPosition(radius: number): [number, number, number] {
  const d = dockDistance(radius)
  return [0, d * 0.09, d * 0.95]
}

/**
 * Aim offset that moves the subject out from behind the content surface.
 *
 * Wide viewports: the panel is a right-hand column, so aim right and the node
 * lands in the empty left third. Narrow viewports: the panel is a bottom sheet
 * covering everything below 40% of the height, so aim *down* and the node
 * rises into the strip that is still visible.
 */
export function dockAim(radius: number, wide: boolean): [number, number, number] {
  const d = dockDistance(radius)
  return wide ? [d * 0.31, 0, 0] : [0, -d * 0.3, 0]
}

/**
 * Camera resting position for the orbital overview.
 *
 * Far enough back that every node sits between 17 and 23 units away. Keeping
 * that spread tight matters more than it sounds: node size and label size are
 * both in world units, so a node twice as close reads as twice as important.
 */
export const HOME_POSITION: [number, number, number] = [0, 0.6, 19]
