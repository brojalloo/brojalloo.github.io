/**
 * Shared contracts. Every module in the app agrees on these shapes; nothing
 * here imports from anywhere else, so it is safe to depend on from the scene,
 * the HUD, and the content files alike.
 */

/** The seven orbiting nodes. `null` means we are at the overview. */
export type NodeId =
  | 'whoami'
  | 'arsenal'
  | 'certifications'
  | 'projets'
  | 'pipeline'
  | 'parcours'
  | 'contact'

/** Navigation order — this is the order the index and the fallback both use. */
export const NODE_IDS: NodeId[] = [
  'whoami',
  'arsenal',
  'certifications',
  'projets',
  'pipeline',
  'parcours',
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
  /** Solid used for the node body — each node reads differently. */
  shape:
    | 'icosahedron'
    | 'octahedron'
    | 'box'
    | 'tetrahedron'
    | 'dodecahedron'
    | 'torus'
    | 'cylinder'
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
  /** `null` when no public repository exists — the link is then omitted. */
  repo: string | null
  /** Technologies actually used. Empty when they are not publicly verifiable. */
  stack: string[]
  /** Bullet points of what the project actually does. */
  highlights: string[]
  year: string
  /** The main project, drawn as a full-width featured entry. */
  featured?: boolean
}

export interface Certification {
  key: string
  name: string
  issuer: string
  /** Month and year, or `null` when only completion is confirmed. */
  date: string | null
  /** Drawn with a heavier treatment — the ones worth reading first. */
  featured?: boolean
}

export interface TimelineEntry {
  key: string
  period: string
  place: string
  /** Certifications render with an amber marker, studies with a hollow one. */
  kind: 'study' | 'cert' | 'work'
}
