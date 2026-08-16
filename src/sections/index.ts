import type { ComponentType } from 'react'
import type { NodeId } from '../types'

import { Whoami } from './Whoami'
import { Pipeline } from './Pipeline'
import { Arsenal } from './Arsenal'
import { Certifications } from './Certifications'
import { Parcours } from './Parcours'
import { Projets } from './Projets'
import { Contact } from './Contact'

/** One component per node. The panel and the no-WebGL fallback both read this. */
export const SECTIONS: Record<NodeId, ComponentType> = {
  whoami: Whoami,
  pipeline: Pipeline,
  arsenal: Arsenal,
  certifications: Certifications,
  parcours: Parcours,
  projets: Projets,
  contact: Contact,
}
