/**
 * Shared contracts. Every module in the app agrees on these shapes; nothing
 * here imports from anywhere else, so it is safe to depend on from the scene,
 * the HUD, and the content files alike.
 */

/** The six orbiting nodes. `null` means we are at the overview. */
export type NodeId = 'whoami' | 'pipeline' | 'arsenal' | 'parcours' | 'projets' | 'contact'

export const NODE_IDS: NodeId[] = [
  'whoami',
  'pipeline',
  'arsenal',
  'parcours',
  'projets',
  'contact',
]

export type Lang = 'fr' | 'en'

/** Rendering budget, resolved once at boot from device capability. */
export type Tier = 'full' | 'lite'

/** Fixed geometry of a node in the orbital scene. */
export interface NodeSpec {
  id: NodeId
  /** Resting position in world space. */
  position: [number, number, number]
  /** Base radius of the node body. */
  radius: number
  /** Rotational speed around the core, radians/second. */
  orbitSpeed: number
  /** Platonic solid used for the node body — each node reads differently. */
  shape: 'icosahedron' | 'octahedron' | 'box' | 'tetrahedron' | 'dodecahedron' | 'torus'
}

/** One stage of the Jenkins pipeline, for the signature scene. */
export interface PipelineStage {
  /** Stage key, used to look up localised copy. */
  key: string
  /** Label shown on the 3D marker — kept short, always ASCII. */
  label: string
  /** The Trivy stage is the one that destroys a CRITICAL packet. */
  gate?: boolean
}

export interface SkillGroup {
  key: string
  items: { name: string; note?: string }[]
}

export interface Project {
  key: string
  name: string
  repo: string
  /** Language breakdown as reported by GitHub, largest first. */
  stack: string[]
  /** Bullet points of what the project actually does. */
  highlights: string[]
  year: string
}

export interface TimelineEntry {
  key: string
  period: string
  place: string
  /** Certifications render with an amber marker, studies with a hollow one. */
  kind: 'study' | 'cert' | 'work'
}
