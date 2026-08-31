# Plan d'implémentation — Le voyage du pipeline

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre la scène 3D du pipeline traversable — le scroll du panneau de lecture pilote une trajectoire de caméra qui entre dans une halle technique, s'arrête à chacun des neuf stages, et marque un palier devant le portique Trivy.

**Architecture:** Un module pur, `src/scene/journey.ts`, convertit une progression `0..1` en position et point visé. Un objet mutable au niveau du module (`JOURNEY`) transporte cette progression du DOM vers la boucle de rendu sans jamais passer par React. Le scroll écrit `JOURNEY.target` ; `CameraRig`, `StageMarker`, `Hall` et `SecurityGate` le lisent en `useFrame`.

**Tech Stack:** React 19, TypeScript strict, `@react-three/fiber` 9, `three` 0.185, `zustand` 5, `framer-motion` 13, Vite 8, oxlint, vitest (ajouté par la tâche 1).

**Spec:** `docs/superpowers/specs/2026-08-31-pipeline-journey-design.md`

## Global Constraints

- **Langue du code.** Tous les commentaires, noms de variables et messages de commit sont en **anglais**, comme l'intégralité du dépôt existant. Seuls les documents de `docs/` sont en français.
- **Zéro allocation par frame.** Aucune fonction appelée depuis un `useFrame` ne crée de `Vector3`, `Color`, tableau ou objet littéral. Les scratch objects s'allouent dans un `useMemo` ou au niveau du module. C'est la convention déjà tenue par `Conveyor.tsx`, `StageMarker.tsx` et `SecurityGate.tsx`.
- **Géométrie construite une fois.** Toute `BufferGeometry` partagée se construit au niveau du module, comme `TICK_GEOMETRY` dans `Conveyor.tsx:...`. Jamais dans un composant.
- **Palette.** Uniquement les constantes de `PIPE` exportées par `src/scene/pipeline/Conveyor.tsx`. Aucune couleur littérale nouvelle. `PIPE.alert` (`#ff3b4e`) reste réservé au portique Trivy.
- **TypeScript strict** avec `verbatimModuleSyntax` : tout import de type s'écrit `import type { … }`. `noUnusedLocals` et `noUnusedParameters` sont actifs — aucun import ni paramètre mort ne compile.
- **Portée.** Le nœud `pipeline` seul. Les six autres nœuds, `OrbitalScene`, `Core`, `Links`, `NodeMesh`, `Starfield` et `Fallback` ne sont pas touchés.
- **Deux écarts assumés par rapport à la spec**, décidés avant l'écriture de ce plan :
  1. `src/ui/Panel.tsx` n'expose **pas** la ref de son conteneur défilant : `Pipeline.tsx` le retrouve seul avec `closest('.panel-scroll')`. Le panneau reste tout de même modifié par la tâche 2, mais pour une autre raison — son raccourci Échap dépend de l'ancienne sémantique de `stage`.
  2. Pas de `CatmullRomCurve3` pour la trajectoire. Trajectoire par morceaux : paliers à l'arrêt + Béziers quadratiques entre les ancrages, qui passent par construction exactement sur chaque point de stage.

---

## Structure des fichiers

| Fichier | Responsabilité | Tâche |
| --- | --- | --- |
| `src/scene/journey.ts` | **Nouveau.** Progression ↔ stage, progression → position et visée. Pur, sans React, sans DOM. | 1 |
| `src/scene/journey.test.ts` | **Nouveau.** Les tests des fonctions pures ci-dessus. | 1 |
| `src/scene/layout.ts` | Exporte `AIM_SHIFT` et `SHEET_LIFT` ; perd `pipelineView`, `pipelineAim`, `stageView`, `stageAim`. | 1, 4 |
| `src/store.ts` | `stage` change de sens : le stage où le voyage se trouve, jamais `-1` dans le pipeline. | 2 |
| `src/sections/Pipeline.tsx` | Les neuf blocs sont ouverts en permanence et portent une ancre mesurable. | 2 |
| `src/ui/useJourneyScroll.ts` | **Nouveau.** Position de scroll → `JOURNEY.target` et `setStage`. | 3 |
| `src/scene/CameraRig.tsx` | Le bloc pipeline lit `JOURNEY` ; amplitude du glisser par contexte. | 4, 5 |
| `src/scene/pipeline/StageMarker.tsx` | Focus continu depuis `JOURNEY.progress` ; le clic fait défiler le panneau. | 5 |
| `src/scene/pipeline/Hall.tsx` | **Nouveau.** Sol, portiques, volumes de stage. Trois géométries fusionnées. | 6 |
| `src/scene/pipeline/PipelineScene.tsx` | Monte `Hall`, amortit le brouillard. | 6 |
| `src/scene/pipeline/SecurityGate.tsx` | Le cycle Trivy est déclenché par l'arrivée au lieu de tourner en boucle. | 7 |
| `package.json` | `vitest` en devDependency, script `test`. | 1 |

---

## Task 1: Le module de trajectoire

**Files:**
- Create: `src/scene/journey.ts`
- Create: `src/scene/journey.test.ts`
- Modify: `src/scene/layout.ts` (exporter `AIM_SHIFT` et `SHEET_LIFT`)
- Modify: `package.json` (devDependency `vitest`, script `test`)

**Interfaces:**
- Consumes: `stagePosition(i)`, `PIPELINE_ORIGIN`, `GATE_INDEX` de `src/scene/layout.ts` ; `STAGES` de `src/content.ts`.
- Produces, importés par les tâches 3, 4, 5, 6 et 7 :
  - `JOURNEY: { target: number; progress: number }` — objet mutable, valeurs initiales `0`.
  - `progressForStage(i: number): number`
  - `stageAtProgress(p: number): number`
  - `journeyView(p: number, out: Vector3): Vector3`
  - `journeyAim(p: number, wide: boolean, out: Vector3): Vector3`
  - `journeyDistance(p: number): number`
  - `GATE_ENTER: number`, `GATE_LEAVE: number`, `GATE_ARM_LOW: number`, `GATE_ARM_HIGH: number` — les bornes d'hystérésis du palier Trivy, consommées par la tâche 7.

### Le modèle, à lire avant de coder

L'axe de progression `0..1` est découpé en **onze créneaux** contigus : un créneau d'entrée, les neuf stages, un créneau de sortie. La largeur de chaque créneau est proportionnelle à un poids ; le stage Trivy pèse 2.6 fois un stage ordinaire, ce qui *est* le palier.

Chaque créneau possède un **point d'ancrage** — une position de caméra — et une **bande d'arrêt** centrée, occupant `HOLD_FRAC` de sa largeur. Dans la bande d'arrêt la caméra ne bouge pas. Entre deux bandes elle voyage le long d'une Bézier quadratique dont le point de contrôle est reculé, ce qui produit la respiration de distance.

```
progression  0                                                        1
             |--entrée--|--01--|--02--| ... |----- 07 (TRIVY) -----| ... |--sortie--|
                  [==]    [=]    [=]              [==========]              [==]
                  arrêt  arrêt  arrêt                 arrêt                 arrêt
                       \_____/      \_____/     \____/       \____/
                       voyage       voyage      voyage       voyage
```

- [ ] **Step 1: Installer vitest et déclarer le script**

```bash
npm install -D vitest
npx vitest --version
```

Puis, dans `package.json`, ajouter la ligne `"test"` au bloc `scripts`, juste après `"typecheck"` :

```json
    "typecheck": "tsc -b --force",
    "test": "vitest run",
```

- [ ] **Step 2: Exporter les deux constantes de cadrage depuis `layout.ts`**

Dans `src/scene/layout.ts`, les constantes `AIM_SHIFT` et `SHEET_LIFT` sont aujourd'hui privées au module. Ajouter `export` devant chacune. Ne rien changer d'autre dans ce fichier à cette étape — les fonctions `pipelineView` / `pipelineAim` / `stageView` / `stageAim` restent en place et seront retirées par la tâche 4, quand plus rien ne les appellera.

```ts
export const AIM_SHIFT = 0.31
```

```ts
export const SHEET_LIFT = 0.3
```

- [ ] **Step 3: Écrire les tests, qui échouent**

Créer `src/scene/journey.test.ts` :

```ts
import { describe, expect, it } from 'vitest'
import { Vector3 } from 'three'
import { STAGES } from '../content'
import { stagePosition } from './layout'
import {
  GATE_ENTER,
  GATE_LEAVE,
  journeyAim,
  journeyDistance,
  journeyView,
  progressForStage,
  stageAtProgress,
} from './journey'

const LAST = STAGES.length - 1

describe('progressForStage', () => {
  it('lands strictly inside the 0..1 range for every stage', () => {
    for (let i = 0; i <= LAST; i++) {
      const p = progressForStage(i)
      expect(p).toBeGreaterThan(0)
      expect(p).toBeLessThan(1)
    }
  })

  it('increases strictly from the first stage to the last', () => {
    for (let i = 1; i <= LAST; i++) {
      expect(progressForStage(i)).toBeGreaterThan(progressForStage(i - 1))
    }
  })

  it('gives the gate the widest slot, because that slot is the plateau', () => {
    const gate = STAGES.findIndex((s) => s.gate)
    const gateSpan = progressForStage(gate + 1) - progressForStage(gate - 1)
    const plainSpan = progressForStage(3) - progressForStage(1)
    expect(gateSpan).toBeGreaterThan(plainSpan * 1.5)
  })
})

describe('stageAtProgress', () => {
  it('round-trips through progressForStage', () => {
    for (let i = 0; i <= LAST; i++) {
      expect(stageAtProgress(progressForStage(i))).toBe(i)
    }
  })

  it('clamps rather than running off either end', () => {
    expect(stageAtProgress(-4)).toBe(0)
    expect(stageAtProgress(0)).toBe(0)
    expect(stageAtProgress(1)).toBe(LAST)
    expect(stageAtProgress(9)).toBe(LAST)
  })
})

describe('journeyView', () => {
  it('writes into the vector it was given and returns it', () => {
    const out = new Vector3()
    expect(journeyView(0.5, out)).toBe(out)
  })

  it('is finite everywhere along the axis, including outside it', () => {
    const out = new Vector3()
    for (let p = -0.2; p <= 1.2; p += 0.01) {
      journeyView(p, out)
      expect(Number.isFinite(out.x)).toBe(true)
      expect(Number.isFinite(out.y)).toBe(true)
      expect(Number.isFinite(out.z)).toBe(true)
    }
  })

  it('parks the camera in front of each stage at that stage progress', () => {
    const out = new Vector3()
    for (let i = 0; i <= LAST; i++) {
      journeyView(progressForStage(i), out)
      const anchor = stagePosition(i)
      // Dead in front of the marker on the chain axis, pulled back on z.
      expect(out.x).toBeCloseTo(anchor[0], 5)
      expect(out.z).toBeGreaterThan(anchor[2])
    }
  })

  it('never travels backwards along the chain', () => {
    const out = new Vector3()
    let previous = -Infinity
    for (let p = 0; p <= 1; p += 0.005) {
      journeyView(p, out)
      expect(out.x).toBeGreaterThanOrEqual(previous - 1e-6)
      previous = out.x
    }
  })

  it('starts high above the chain and comes down into it', () => {
    const out = new Vector3()
    journeyView(0, out)
    const entryHeight = out.y
    journeyView(progressForStage(0), out)
    expect(entryHeight).toBeGreaterThan(out.y + 8)
  })
})

describe('journeyDistance', () => {
  it('is tightest at a stage and widest between two', () => {
    const atStage = journeyDistance(progressForStage(2))
    const between = journeyDistance((progressForStage(2) + progressForStage(3)) / 2)
    expect(between).toBeGreaterThan(atStage * 1.5)
  })
})

describe('journeyAim', () => {
  it('pushes the subject left of the panel on a wide viewport', () => {
    const wide = new Vector3()
    const narrow = new Vector3()
    journeyAim(0.5, true, wide)
    journeyAim(0.5, false, narrow)
    expect(wide.x).toBeGreaterThan(narrow.x)
    expect(narrow.y).toBeLessThan(wide.y)
  })
})

describe('the gate plateau', () => {
  it('brackets the gate stage', () => {
    const gate = progressForStage(STAGES.findIndex((s) => s.gate))
    expect(GATE_ENTER).toBeLessThan(gate)
    expect(GATE_LEAVE).toBeGreaterThan(gate)
  })
})
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils échouent**

Run: `npm test`
Expected: FAIL — `Failed to resolve import "./journey"`.

- [ ] **Step 5: Écrire `src/scene/journey.ts`**

```ts
import { Vector3 } from 'three'
import { STAGES } from '../content'
import { AIM_SHIFT, GATE_INDEX, PIPELINE_ORIGIN, SHEET_LIFT, stagePosition } from './layout'

/**
 * The journey: one number, 0 to 1, is the whole state of the pipeline scene.
 *
 * Scroll writes it, the render loop reads it. Nothing in between allocates,
 * and nothing in between goes through React — a 120Hz scroll that re-rendered
 * the reading panel would make the page unusable.
 *
 * The axis is cut into eleven contiguous slots: an entry, the nine stages, an
 * exit. Each slot owns an anchor — a camera position — and a hold band at its
 * centre where the camera is parked. Between two hold bands the camera travels
 * a quadratic Bezier whose control point is pulled back, which is what makes
 * the distance breathe. The Trivy slot is 2.6 times as wide as an ordinary
 * stage; that width *is* the plateau.
 */

// ---------------------------------------------------------------------------
// The bus. Written by `useJourneyScroll`, read by the scene in useFrame.
// Same one-way pattern as PIPELINE_BUS in scene/pipeline/Conveyor.tsx.
// ---------------------------------------------------------------------------

export const JOURNEY = {
  /** Where the scroll says we should be. */
  target: 0,
  /** Where the camera actually is; damped toward `target` by CameraRig. */
  progress: 0,
}

// ---------------------------------------------------------------------------
// Slot layout
// ---------------------------------------------------------------------------

/** Scroll weight of the approach, before stage 01. */
const ENTRY_WEIGHT = 1.6
/** Scroll weight of the pull-back, after stage 09. */
const EXIT_WEIGHT = 1.4
/** The gate is worth this many ordinary stages. This is the plateau. */
const GATE_WEIGHT = 2.6
/** Share of a slot spent parked rather than travelling. */
const HOLD_FRAC = 0.46

/** Anchor indices: -1 is the entry, 0..8 the stages, 9 the exit. */
const FIRST_SLOT = -1
const LAST_SLOT = STAGES.length

function weightOf(slot: number): number {
  if (slot === FIRST_SLOT) return ENTRY_WEIGHT
  if (slot === LAST_SLOT) return EXIT_WEIGHT
  return slot === GATE_INDEX ? GATE_WEIGHT : 1
}

/** Centre of each slot on the progress axis, and half-width of its hold band. */
const CENTRES: number[] = []
const HOLDS: number[] = []

{
  let total = 0
  for (let s = FIRST_SLOT; s <= LAST_SLOT; s++) total += weightOf(s)

  let cursor = 0
  for (let s = FIRST_SLOT; s <= LAST_SLOT; s++) {
    const w = weightOf(s) / total
    CENTRES.push(cursor + w / 2)
    HOLDS.push((w * HOLD_FRAC) / 2)
    cursor += w
  }
}

/** Slot index -> position in the CENTRES / HOLDS arrays. */
function slotAt(slot: number): number {
  return slot - FIRST_SLOT
}

/** Progress at which the camera is parked in front of stage `i`. */
export function progressForStage(i: number): number {
  const clamped = i < 0 ? 0 : i > STAGES.length - 1 ? STAGES.length - 1 : i
  return CENTRES[slotAt(clamped)]
}

/** Nearest stage to a progress value. Never returns the entry or exit slot. */
export function stageAtProgress(p: number): number {
  let best = 0
  let bestDistance = Infinity
  for (let i = 0; i < STAGES.length; i++) {
    const d = Math.abs(p - CENTRES[slotAt(i)])
    if (d < bestDistance) {
      bestDistance = d
      best = i
    }
  }
  return best
}

// ---------------------------------------------------------------------------
// The gate plateau, exported so SecurityGate can trigger on arrival.
// The arm bounds sit outside the trigger bounds: that gap is the hysteresis
// that stops a shaky scroll from re-firing the destruction on every frame.
// ---------------------------------------------------------------------------

const GATE_CENTRE = CENTRES[slotAt(GATE_INDEX)]
const GATE_HOLD = HOLDS[slotAt(GATE_INDEX)]

export const GATE_ENTER = GATE_CENTRE - GATE_HOLD
export const GATE_LEAVE = GATE_CENTRE + GATE_HOLD
export const GATE_ARM_LOW = GATE_ENTER - GATE_HOLD * 0.9
export const GATE_ARM_HIGH = GATE_LEAVE + GATE_HOLD * 0.9

// ---------------------------------------------------------------------------
// Anchors. Built once; `journeyView` only ever reads them.
// ---------------------------------------------------------------------------

/** Distance in front of a stage, parked. Close enough to read the volume. */
const STAGE_DISTANCE = 5.2
/** Distance at the midpoint of a span. The gap is the breathing. */
const SPAN_DISTANCE = 12
/**
 * Sideways swing at a midpoint, as a fraction of that span's own length, so
 * the path serpentines instead of sliding. Must stay below 0.5 — see
 * `controlOf`.
 */
const LATERAL_FRAC = 0.42
/** Eye height above the rail. */
const EYE_LIFT = 0.75
/** How far above the chain the approach starts. */
const ENTRY_LIFT = 15
const ENTRY_DISTANCE = 26
/** How far back the camera settles once the chain is behind it. */
const EXIT_DISTANCE = 15
const EXIT_LIFT = 2.5

function anchorOf(slot: number, out: Vector3): Vector3 {
  if (slot === FIRST_SLOT) {
    const first = stagePosition(0)
    return out.set(first[0] - 2, PIPELINE_ORIGIN[1] + ENTRY_LIFT, first[2] + ENTRY_DISTANCE)
  }
  if (slot === LAST_SLOT) {
    const last = stagePosition(STAGES.length - 1)
    return out.set(last[0] + 4, PIPELINE_ORIGIN[1] + EXIT_LIFT, last[2] + EXIT_DISTANCE)
  }
  const p = stagePosition(slot)
  return out.set(p[0], p[1] + EYE_LIFT, p[2] + STAGE_DISTANCE)
}

/** Distance from the rail at an anchor — what `journeyDistance` interpolates. */
function anchorDistance(slot: number): number {
  if (slot === FIRST_SLOT) return ENTRY_DISTANCE
  if (slot === LAST_SLOT) return EXIT_DISTANCE
  return STAGE_DISTANCE
}

// Module-scope scratch: `journeyView` is called every frame and must not
// allocate. Safe because nothing here is re-entrant or async.
// `controlOf` gets its own pair: it is called between `journeyView`'s two
// `anchorOf` calls and the Bezier that reads them back, so sharing A and B
// would silently clobber the anchors it is supposed to sit between.
const SCRATCH_A = new Vector3()
const SCRATCH_B = new Vector3()
const SCRATCH_C = new Vector3()
const CONTROL_A = new Vector3()
const CONTROL_B = new Vector3()

/**
 * Bezier control point between two consecutive anchors: back, and to a side.
 *
 * The sideways swing is a fraction of the span rather than a fixed distance.
 * That is not cosmetic: with a control point offset of more than half the span,
 * the Bezier's x derivative goes negative near one end and the camera visibly
 * slides *back* down the chain. Keeping the fraction under 0.5 makes going
 * backwards impossible by construction — which is what the monotonicity test
 * in `journey.test.ts` checks.
 */
function controlOf(slot: number, out: Vector3): Vector3 {
  const a = anchorOf(slot, CONTROL_A)
  const b = anchorOf(slot + 1, CONTROL_B)
  const side = slot % 2 === 0 ? 1 : -1
  const swing = Math.abs(b.x - a.x) * LATERAL_FRAC * side
  return out.set(
    (a.x + b.x) / 2 + swing,
    (a.y + b.y) / 2 + 0.9,
    (a.z + b.z) / 2 + (SPAN_DISTANCE - STAGE_DISTANCE),
  )
}

/** Ken Perlin's smootherstep, matching the one in scene/pipeline/Conveyor.tsx. */
function smootherstep(x: number): number {
  const t = x < 0 ? 0 : x > 1 ? 1 : x
  return t * t * t * (t * (t * 6 - 15) + 10)
}

/**
 * Where `p` sits: either parked in slot `locatedSlot`, or `locatedT` of the way
 * from it to the next one. `locatedT < 0` means parked.
 *
 * The result is written to module state rather than returned as an object,
 * because this runs on every frame and returning `{ slot, t }` would allocate
 * sixty times a second.
 */
let locatedSlot = 0
let locatedT = -1

function locateInto(p: number): void {
  const clamped = p < 0 ? 0 : p > 1 ? 1 : p
  for (let s = FIRST_SLOT; s <= LAST_SLOT; s++) {
    const i = slotAt(s)
    if (clamped <= CENTRES[i] + HOLDS[i]) {
      // Inside this slot's hold band, or before the whole axis started.
      if (clamped >= CENTRES[i] - HOLDS[i] || s === FIRST_SLOT) {
        locatedSlot = s
        locatedT = -1
        return
      }
      // Travelling into it from the previous slot.
      const from = CENTRES[i - 1] + HOLDS[i - 1]
      const to = CENTRES[i] - HOLDS[i]
      locatedSlot = s - 1
      locatedT = smootherstep((clamped - from) / (to - from))
      return
    }
  }
  locatedSlot = LAST_SLOT
  locatedT = -1
}

export function journeyView(p: number, out: Vector3): Vector3 {
  locateInto(p)
  if (locatedT < 0) return anchorOf(locatedSlot, out)

  const t = locatedT
  const u = 1 - t
  anchorOf(locatedSlot, SCRATCH_A)
  anchorOf(locatedSlot + 1, SCRATCH_B)
  controlOf(locatedSlot, SCRATCH_C)

  // Quadratic Bezier: passes exactly through both anchors, which is the whole
  // reason this is not a CatmullRom through every point.
  return out.set(
    u * u * SCRATCH_A.x + 2 * u * t * SCRATCH_C.x + t * t * SCRATCH_B.x,
    u * u * SCRATCH_A.y + 2 * u * t * SCRATCH_C.y + t * t * SCRATCH_B.y,
    u * u * SCRATCH_A.z + 2 * u * t * SCRATCH_C.z + t * t * SCRATCH_B.z,
  )
}

export function journeyDistance(p: number): number {
  locateInto(p)
  if (locatedT < 0) return anchorDistance(locatedSlot)
  const t = locatedT
  const u = 1 - t
  const a = anchorDistance(locatedSlot)
  const b = anchorDistance(locatedSlot + 1)
  return u * u * a + 2 * u * t * SPAN_DISTANCE + t * t * b
}

/**
 * The point the camera looks at: a point on the chain, pushed sideways so the
 * subject clears the reading panel. Wide viewports get a right-hand column and
 * aim right; narrow ones get a bottom sheet and aim down.
 */
export function journeyAim(p: number, wide: boolean, out: Vector3): Vector3 {
  journeyView(p, out)
  const d = journeyDistance(p)
  // The rail sits `d` in front of the camera on z, at the chain's own height.
  out.z -= d
  out.y = PIPELINE_ORIGIN[1]
  if (wide) {
    out.x += d * AIM_SHIFT
    out.y -= 0.2
  } else {
    out.y -= d * SHEET_LIFT
  }
  return out
}
```

- [ ] **Step 6: Lancer les tests jusqu'au vert**

Run: `npm test`
Expected: PASS, tous les blocs `describe`.

Si `never travels backwards along the chain` échoue, c'est `LATERAL_FRAC` qui a dépassé `0.5` : au-delà, la dérivée en `x` de la Bézier devient négative près d'une extrémité et la caméra redescend visiblement la chaîne. Réduire `LATERAL_FRAC` jusqu'au vert, jamais assouplir le test — il énonce une vraie propriété du voyage.

- [ ] **Step 7: Vérifier types et lint**

Run: `npm run typecheck && npm run lint`
Expected: aucune erreur.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json src/scene/journey.ts src/scene/journey.test.ts src/scene/layout.ts
git commit -m "Add the journey module: one number describes the whole pipeline view"
```

---

## Task 2: Le panneau devient la timeline

**Files:**
- Modify: `src/store.ts` (sémantique de `stage`)
- Modify: `src/sections/Pipeline.tsx:130-200` (l'accordéon devient neuf blocs ouverts)
- Modify: `src/ui/Panel.tsx:47-60` (le raccourci Échap ne relâche plus le stage)

**Interfaces:**
- Consumes: `progressForStage` de la tâche 1 (uniquement pour le commentaire d'intention ; aucun appel encore).
- Produces: chaque bloc de stage porte `id={`stage-anchor-${spec.key}`}` et `data-stage-index={i}`. La tâche 3 mesure ces éléments par `[data-stage-index]`.

Cette tâche ne touche pas la 3D. À la fin, le panneau se lit de bout en bout au scroll, et la caméra ne bouge toujours pas — c'est normal, c'est la tâche 4 qui la branche.

- [ ] **Step 1: Redéfinir `stage` dans le store**

Dans `src/store.ts`, remplacer le commentaire et le corps de `goTo` :

```ts
  /** Stage the journey is currently at. `-1` only when outside the pipeline. */
  stage: number
```

```ts
  // Entering the pipeline starts the journey at the first stage rather than at
  // "no stage": the journey always sits somewhere on the chain. Leaving any
  // node releases it, so the next entry starts from the top again.
  goTo: (id) => set({ active: id, stage: id === 'pipeline' ? 0 : -1, hovered: null }),
```

- [ ] **Step 2: Échap sort du nœud en une pression**

Dans `src/ui/Panel.tsx`, le gestionnaire `onKey` teste aujourd'hui `s.stage >= 0` pour relâcher d'abord le stage. Comme `stage` ne représente plus un dépliage, cette branche relâcherait un état que rien n'affiche. Remplacer le corps du `if` :

```ts
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const s = useApp.getState()
      if (s.active === null) return
      e.preventDefault()
      // One press, one step out. `stage` is no longer a disclosure state, so
      // there is nothing to release before leaving.
      s.goTo(null)
    }
```

Supprimer aussi l'import de `setStage` s'il devient inutilisé — `noUnusedLocals` refuse de compiler sinon.

- [ ] **Step 3: Ouvrir les neuf blocs en permanence**

Dans `src/sections/Pipeline.tsx`, remplacer intégralement le bloc `<motion.ul>` des stages (celui qui contient `AnimatePresence` et le `<button aria-expanded>`) par :

```tsx
      {/* ---- The nine stages. All open: their stacked height is the timeline
              the camera travels along, so nothing may collapse. ---- */}
      <motion.ol variants={item} className="mt-14 border-t border-rule">
        {STAGES.map((spec, i) => {
          const detail = c.stageDetail[spec.key]
          const current = stage === i

          return (
            <li
              key={spec.key}
              id={`stage-anchor-${spec.key}`}
              data-stage-index={i}
              className="border-b border-rule py-6"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <span
                  aria-hidden="true"
                  className={`h-5 w-[2px] shrink-0 ${spec.gate ? 'bg-alert' : 'bg-transparent'}`}
                />
                <span className="font-mono text-[0.68rem] tabular-nums text-mute">{pad(i + 1)}</span>
                <span
                  className={`font-mono text-[0.68rem] tracking-[0.14em] transition-colors duration-300 ${
                    current ? 'text-amber' : 'text-bone'
                  }`}
                >
                  {spec.label}
                </span>
                <span
                  aria-hidden="true"
                  className={`ml-auto h-px shrink-0 transition-all duration-300 ${
                    current ? 'w-10 bg-amber' : 'w-4 bg-rule'
                  }`}
                />
              </div>

              {detail ? (
                <div className="pt-4 pl-8 sm:pl-[3.25rem]">
                  <p className="font-mono text-[0.7rem] tracking-[0.08em] text-trace">
                    {detail.title}
                  </p>
                  <p className="mt-3 max-w-[62ch] text-[0.9rem] leading-[1.75] text-ash">
                    {detail.body}
                  </p>
                  {spec.gate ? (
                    <p className="mt-5 max-w-[58ch] border-l-2 border-alert pl-4 text-[0.85rem] leading-[1.7] text-alert">
                      {c.gateNote}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </li>
          )
        })}
      </motion.ol>
```

- [ ] **Step 4: Nettoyer ce que la suppression de l'accordéon rend mort**

Dans le même fichier, `setStage`, `reduced`, `AnimatePresence`, `EASE` et `useReducedMotion` ne sont peut-être plus utilisés. Retirer de la ligne `import` **uniquement** ceux que le compilateur signale. Ne rien retirer « au cas où » : `stage` reste lu, pour le surlignage.

- [ ] **Step 5: Vérifier**

Run: `npm run typecheck && npm run lint && npm test`
Expected: aucune erreur, tests de la tâche 1 toujours verts.

Puis `npm run dev`, ouvrir le nœud DevOps : les neuf stages sont dépliés, on les fait défiler d'un trait, le stage 01 est en ambre. Un seul appui sur Échap referme le panneau.

- [ ] **Step 6: Commit**

```bash
git add src/store.ts src/sections/Pipeline.tsx src/ui/Panel.tsx
git commit -m "Open the nine pipeline stages permanently: their height is the timeline"
```

---

## Task 3: Le scroll écrit la progression

**Files:**
- Create: `src/ui/useJourneyScroll.ts`
- Modify: `src/sections/Pipeline.tsx` (appeler le hook)

**Interfaces:**
- Consumes: `JOURNEY`, `progressForStage`, `stageAtProgress` de `src/scene/journey.ts` ; les éléments `[data-stage-index]` posés par la tâche 2.
- Produces: `useJourneyScroll(): void` — hook sans argument ni retour, monté une fois par `Pipeline`.

- [ ] **Step 1: Écrire le hook**

Créer `src/ui/useJourneyScroll.ts` :

```ts
import { useEffect } from 'react'
import { JOURNEY, progressForStage, stageAtProgress } from '../scene/journey'
import { useApp } from '../store'

/**
 * Turns the reading panel's scroll position into a journey progress.
 *
 * The mapping is not "how far down the scrollbar is": the panel also holds the
 * architecture diagram, the API table and the proofs, and none of those are
 * places on the chain. It is measured off the nine stage blocks themselves —
 * whichever one is crossing the reading line owns the camera.
 *
 * Two rules keep this cheap enough to run on every scroll event:
 *   - the write goes into JOURNEY, a plain mutable object, never into React;
 *   - the store is touched only when the *integer* stage changes, at most nine
 *     times for a full descent.
 */

/** Height fraction of the viewport at which a block counts as "being read". */
const READING_LINE = 0.45

export function useJourneyScroll(): void {
  useEffect(() => {
    const blocks = Array.from(
      document.querySelectorAll<HTMLElement>('[data-stage-index]'),
    ).sort(
      (a, b) => Number(a.dataset.stageIndex) - Number(b.dataset.stageIndex),
    )
    if (blocks.length === 0) return

    // The class is a scrollbar style in index.css and, from here, also the
    // handle on the scrolling element. Renaming it breaks the journey.
    const scroller = blocks[0].closest<HTMLElement>('.panel-scroll')
    if (!scroller) return

    let queued = false
    let lastStage = -1

    const measure = () => {
      queued = false
      const line = window.innerHeight * READING_LINE

      // Centre of each block relative to the reading line. The block whose
      // centre is above the line and the next one below it bracket us.
      let index = 0
      while (index < blocks.length - 1) {
        const next = blocks[index + 1].getBoundingClientRect()
        if (next.top + next.height / 2 > line) break
        index++
      }

      const current = blocks[index].getBoundingClientRect()
      const currentCentre = current.top + current.height / 2
      let progress: number

      if (index === blocks.length - 1 || currentCentre > line) {
        // Before the first block's centre, or past the last one: hold the end.
        progress = progressForStage(index)
        if (index === 0 && currentCentre > line) {
          // Approaching stage 01 from above — this is the dive.
          const start = window.innerHeight
          const travelled = (start - currentCentre) / Math.max(1, start - line)
          progress = progressForStage(0) * Math.min(1, Math.max(0, travelled))
        }
      } else {
        const next = blocks[index + 1].getBoundingClientRect()
        const nextCentre = next.top + next.height / 2
        const span = nextCentre - currentCentre
        const f = span <= 0 ? 0 : Math.min(1, Math.max(0, (line - currentCentre) / span))
        const a = progressForStage(index)
        const b = progressForStage(index + 1)
        progress = a + (b - a) * f
      }

      JOURNEY.target = progress

      const stage = stageAtProgress(progress)
      if (stage !== lastStage) {
        lastStage = stage
        useApp.getState().setStage(stage)
      }
    }

    // Scroll events can outpace the frame rate; coalesce them onto one frame.
    const onScroll = () => {
      if (queued) return
      queued = true
      requestAnimationFrame(measure)
    }

    measure()
    scroller.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      scroller.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      JOURNEY.target = 0
      JOURNEY.progress = 0
    }
  }, [])
}
```

- [ ] **Step 2: Le monter dans la section**

Dans `src/sections/Pipeline.tsx`, ajouter l'import et l'appel, juste après les lectures du store :

```ts
import { useJourneyScroll } from '../ui/useJourneyScroll'
```

```ts
  // The panel's own scroll is the journey. Mounted here rather than in Panel,
  // so the panel keeps knowing nothing about what it displays.
  useJourneyScroll()
```

- [ ] **Step 3: Vérifier à l'œil que la progression suit**

Run: `npm run dev`

`JOURNEY` n'est pas exposé globalement, et ne doit pas l'être : la vérification passe par son seul effet observable. `setStage` est appelé depuis `stageAtProgress`, lui-même calculé depuis `JOURNEY.target` — donc si le surlignage suit, toute la chaîne fonctionne.

Ouvrir le nœud DevOps et faire défiler le panneau de bout en bout.

Expected: le libellé du stage en cours de lecture passe en ambre, dans l'ordre 01 → 09, et redescend dans l'ordre inverse en remontant. Aucun saut, aucune oscillation entre deux stages voisins à l'arrêt.

- [ ] **Step 4: Vérifier types, lint et tests**

Run: `npm run typecheck && npm run lint && npm test`
Expected: aucune erreur.

- [ ] **Step 5: Commit**

```bash
git add src/ui/useJourneyScroll.ts src/sections/Pipeline.tsx
git commit -m "Drive journey progress from the reading panel's scroll position"
```

---

## Task 4: La caméra voyage

**Files:**
- Modify: `src/scene/CameraRig.tsx:38-70` (la cible du pipeline vient de `JOURNEY`)
- Modify: `src/scene/layout.ts` (retirer les quatre fonctions devenues mortes)

**Interfaces:**
- Consumes: `JOURNEY`, `journeyView`, `journeyAim` de `src/scene/journey.ts`.
- Produces: rien de nouveau. `CameraRig` reste un composant sans rendu.

C'est la tâche où le voyage devient visible.

- [ ] **Step 1: Sortir la cible du pipeline du `useMemo`**

Dans `src/scene/CameraRig.tsx`, le `useMemo` calcule aujourd'hui une cible figée pour les trois cas. La cible du pipeline change désormais à chaque frame et ne peut plus y vivre. Le `useMemo` ne garde que les deux cas statiques :

```ts
  // Only the static destinations are memoised. The pipeline target is a
  // function of JOURNEY.progress and is therefore recomputed each frame,
  // below, into scratch vectors that never reallocate.
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
```

L'import de `stage` depuis le store et les imports `pipelineAim`, `pipelineView`, `stageAim`, `stageView` deviennent morts : les retirer.

- [ ] **Step 2: Amortir la progression et échantillonner dans `useFrame`**

Ajouter deux scratch vectors à côté de `scratch` :

```ts
  const journeyScratch = useMemo(() => ({ view: new Vector3(), aim: new Vector3() }), [])
```

Puis, dans `useFrame`, juste avant `scratch.desired.copy(target.position)` :

```ts
    // The journey is damped here, not in the scroll handler: the scroll writes
    // a target whenever the user moves, the camera closes the gap at its own
    // pace, and a flick of the wheel becomes a glide rather than a jump.
    const onJourney = active === 'pipeline'
    if (onJourney) {
      JOURNEY.progress = MathUtils.damp(JOURNEY.progress, JOURNEY.target, JOURNEY_LAMBDA, dt)
      journeyView(JOURNEY.progress, journeyScratch.view)
      journeyAim(JOURNEY.progress, wide, journeyScratch.aim)
      target.position.copy(journeyScratch.view)
      target.look.copy(journeyScratch.aim)
    }
```

Et la constante, à côté de `LAMBDA` :

```ts
/** Faster than the node transitions: the journey must feel connected to the
    wheel, not like a camera catching up from another room. */
const JOURNEY_LAMBDA = 4.2
```

- [ ] **Step 3: Supprimer les fonctions mortes de `layout.ts`**

`pipelineView`, `pipelineAim`, `stageView` et `stageAim` n'ont plus d'appelant. Les retirer de `src/scene/layout.ts`, ainsi que la constante `VIEW_DISTANCE` et `STAGE_DISTANCE` qui ne servaient qu'à elles. **Garder** `PIPELINE_ORIGIN`, `STAGE_SPACING`, `stagePosition`, `GATE_INDEX`, `AIM_SHIFT` et `SHEET_LIFT` — tout le reste du dossier `pipeline/` en dépend, ainsi que `journey.ts`.

Mettre à jour le commentaire d'en-tête du fichier, qui décrit encore un vol unique vers une position fixe :

```ts
/**
 * The pipeline scene does not replace the orbital scene — it lives below it in
 * the same world, and the camera flies down to it. This module owns where the
 * chain *is*; `scene/journey.ts` owns how the camera moves through it.
 */
```

- [ ] **Step 4: Vérifier**

Run: `npm run typecheck && npm run lint && npm test`
Expected: aucune erreur.

Run: `npm run dev`. Ouvrir le nœud DevOps et faire défiler le panneau. Attendu : la caméra descend d'abord depuis un plan large, puis avance de stage en stage, se rapproche à chaque marqueur et recule entre deux, et reste longuement immobile devant le portique Trivy. En remontant, elle revient.

- [ ] **Step 5: Commit**

```bash
git add src/scene/CameraRig.tsx src/scene/layout.ts
git commit -m "Fly the camera along the journey instead of parking it at two fixed views"
```

---

## Task 5: Les marqueurs suivent le voyage, et on peut regarder autour

**Files:**
- Modify: `src/scene/pipeline/StageMarker.tsx:130-145` (focus continu), `:128-136` (le clic défile)
- Modify: `src/scene/CameraRig.tsx:22-25` (amplitude du glisser par contexte)

**Interfaces:**
- Consumes: `JOURNEY`, `progressForStage` de `src/scene/journey.ts`.
- Produces: rien de nouveau.

- [ ] **Step 1: Le focus d'un marqueur devient continu**

Dans `src/scene/pipeline/StageMarker.tsx`, `focusTarget` et `dimTarget` se déduisent aujourd'hui de l'entier `stage`, ce qui fait clignoter l'attention d'un marqueur à l'autre au franchissement. Ils se déduisent désormais de la distance continue à la progression. Remplacer les trois lignes de cibles :

```ts
    // Focus is a distance, not a match: the camera is continuously somewhere
    // between two stages, and the light on the markers has to be too.
    const reach = Math.abs(JOURNEY.progress - progressForStage(index))
    const focusTarget = Math.max(0, 1 - reach / FOCUS_REACH)
    const hoverTarget = hovered.current ? 1 : 0
    const dimTarget = 1 - focusTarget
```

Et la constante, sous les géométries partagées :

```ts
/** Progress distance over which a marker fades from lit to dark. */
const FOCUS_REACH = 0.075
```

Ajouter l'import :

```ts
import { JOURNEY, progressForStage } from '../journey'
```

`stage` n'est plus lu par ce composant : retirer `const stage = useApp((s) => s.stage)`. C'est ce qui supprime le re-render des neuf marqueurs à chaque franchissement.

- [ ] **Step 2: Cliquer un marqueur fait défiler le panneau**

Le `onClick` appelle aujourd'hui `setStage`, qui ne déplace plus rien. Il doit faire défiler le panneau jusqu'au bloc correspondant — le scroll fera bouger la caméra, comme pour tout le reste. Remplacer le corps :

```ts
  const onClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation()
      // Everything moves the camera through the scroll position, this included.
      // Nothing in the scene sets the camera directly.
      const block = document.querySelector<HTMLElement>(`[data-stage-index="${index}"]`)
      block?.scrollIntoView({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'center',
      })
    },
    [index],
  )
```

`prefersReducedMotion` est déjà exporté par `./Conveyor` : l'ajouter à l'import existant. `setStage` devient inutilisé : le retirer.

- [ ] **Step 3: Le glisser existe partout, avec deux amplitudes**

Dans `src/scene/CameraRig.tsx`, remplacer la constante unique :

```ts
/** Free-look amplitude at the orbital overview, in radians. */
const DRAG_CLAMP_HOME = 0.35
/** Tighter inside the journey: the camera is already moving, and the framing
    of each stage is authored. Enough to glance aside, never to break a shot. */
const DRAG_CLAMP_JOURNEY = 0.18
```

Dans `onMove`, la borne dépend du contexte, lu au moment de l'événement :

```ts
    const onMove = (e: PointerEvent) => {
      if (!d.dragging) return
      const limit =
        useApp.getState().active === null ? DRAG_CLAMP_HOME : DRAG_CLAMP_JOURNEY
      d.azimuth = MathUtils.clamp(d.azimuth - (e.clientX - d.x) * DRAG_SENSITIVITY, -limit, limit)
      d.elevation = MathUtils.clamp(d.elevation + (e.clientY - d.y) * DRAG_SENSITIVITY, -limit, limit)
      d.x = e.clientX
      d.y = e.clientY
    }
```

Dans `useFrame`, le rappel au centre ne doit plus s'appliquer dès qu'on quitte l'accueil, mais dès qu'on lâche :

```ts
    if (!d.dragging) {
      d.azimuth = MathUtils.damp(d.azimuth, 0, DRAG_RETURN, dt)
      d.elevation = MathUtils.damp(d.elevation, 0, DRAG_RETURN, dt)
    }
```

Et l'offset sphérique s'applique désormais aussi dans le voyage, **mais pas la parallaxe de pointeur** — ajoutée à une caméra déjà en mouvement, elle donne le mal de mer :

```ts
    if (atHome || onJourney) {
      scratch.spherical.setFromVector3(scratch.desired)
      scratch.spherical.theta += d.azimuth
      scratch.spherical.phi = MathUtils.clamp(
        scratch.spherical.phi + d.elevation,
        0.25,
        Math.PI - 0.25,
      )
      scratch.desired.setFromSpherical(scratch.spherical)
    }
    if (atHome) {
      scratch.desired.x += state.pointer.x * PARALLAX
      scratch.desired.y += state.pointer.y * PARALLAX
    }
```

**Attention** — `setFromVector3` décompose la position par rapport à l'origine du monde `(0,0,0)`, qui est le centre de la scène orbitale, soixante unités au-dessus du pipeline. Appliquée telle quelle dans le voyage, une rotation de `theta` ferait décrire à la caméra un arc gigantesque. Il faut donc pivoter autour du point visé, pas autour de l'origine :

```ts
    if (atHome || onJourney) {
      if (onJourney) scratch.desired.sub(target.look)
      scratch.spherical.setFromVector3(scratch.desired)
      scratch.spherical.theta += d.azimuth
      scratch.spherical.phi = MathUtils.clamp(
        scratch.spherical.phi + d.elevation,
        0.25,
        Math.PI - 0.25,
      )
      scratch.desired.setFromSpherical(scratch.spherical)
      if (onJourney) scratch.desired.add(target.look)
    }
```

- [ ] **Step 4: Vérifier**

Run: `npm run typecheck && npm run lint && npm test`
Expected: aucune erreur.

Run: `npm run dev`. Attendu : en descendant, chaque marqueur s'allume progressivement en approchant et s'éteint en s'éloignant, sans à-coup au franchissement. Cliquer un marqueur fait défiler le panneau jusqu'au bloc correspondant et la caméra suit. Glisser à la souris dans le pipeline fait pivoter légèrement la vue autour du sujet, qui revient au centre au relâchement — sans jamais partir en vrille.

- [ ] **Step 5: Commit**

```bash
git add src/scene/pipeline/StageMarker.tsx src/scene/CameraRig.tsx
git commit -m "Light the markers by distance and allow a bounded look-around in the journey"
```

---

## Task 6: La halle

**Files:**
- Create: `src/scene/pipeline/Hall.tsx`
- Modify: `src/scene/pipeline/PipelineScene.tsx` (monter `Hall`, amortir le brouillard)

**Interfaces:**
- Consumes: `stagePosition`, `STAGE_SPACING`, `PIPELINE_ORIGIN` de `src/scene/layout.ts` ; `PIPE`, `damp`, `easeOutCubic` de `./Conveyor` ; `STAGES` de `../../content`.
- Produces: `Hall` (composant), `HallFog` (composant).

- [ ] **Step 1: Écrire `Hall.tsx`**

```tsx
import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { BufferGeometry, Float32BufferAttribute, Fog } from 'three'
import type { LineBasicMaterial } from 'three'
import { STAGES } from '../../content'
import { PIPELINE_ORIGIN, STAGE_SPACING, stagePosition } from '../layout'
import { useApp } from '../../store'
import { damp, easeOutCubic, PIPE } from './Conveyor'

/**
 * The room the chain runs through.
 *
 * The scene needs a floor and a rhythm — without them the camera glides past
 * markers floating in nothing and the traversal reads as a slideshow. But the
 * hall has no ceiling and no walls: the void above stays open, both because
 * the site's whole identity is a bench in the dark, and because the orbital
 * overview is genuinely sixty units up there.
 *
 * Everything here is wireframe, built once at module scope into three merged
 * geometries. Three draw calls for the entire set.
 */

const SPAN = (STAGES.length - 1) * STAGE_SPACING
const HALF = SPAN / 2 + STAGE_SPACING * 1.6
const FLOOR_Y = PIPELINE_ORIGIN[1] - 2.6
const CELL = 1.7
/** How far the floor reaches on either side of the chain. */
const FLOOR_DEPTH = 13

function buildFloor(): BufferGeometry {
  const v: number[] = []
  for (let x = -HALF; x <= HALF + 0.001; x += CELL) {
    v.push(x, FLOOR_Y, -FLOOR_DEPTH, x, FLOOR_Y, FLOOR_DEPTH)
  }
  for (let z = -FLOOR_DEPTH; z <= FLOOR_DEPTH + 0.001; z += CELL) {
    v.push(-HALF, FLOOR_Y, z, HALF, FLOOR_Y, z)
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(v, 3))
  return g
}

/** One open gantry: two uprights and a lintel. No floor beam — the grid is it. */
function pushGantry(v: number[], x: number): void {
  const top = FLOOR_Y + 5.4
  const w = 2.1
  v.push(x, FLOOR_Y, -w, x, top, -w)
  v.push(x, FLOOR_Y, w, x, top, w)
  v.push(x, top, -w, x, top, w)
}

function buildGantries(): BufferGeometry {
  const v: number[] = []
  for (let x = -HALF; x <= HALF + 0.001; x += STAGE_SPACING / 2) pushGantry(v, x)
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(v, 3))
  return g
}

/** Axis-aligned box outline, as twelve segments. */
function pushBox(
  v: number[],
  cx: number, cy: number, cz: number,
  hx: number, hy: number, hz: number,
): void {
  const x0 = cx - hx, x1 = cx + hx
  const y0 = cy - hy, y1 = cy + hy
  const z0 = cz - hz, z1 = cz + hz
  const corners: [number, number, number][] = [
    [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1],
    [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1],
  ]
  const edges = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7],
  ]
  for (const [a, b] of edges) {
    v.push(...corners[a], ...corners[b])
  }
}

/**
 * One silhouette per stage, so each post is a place rather than a point.
 * TRIVY gets nothing: its structure is already built in StageMarker, and it
 * must stay the only massive object in the scene.
 */
function buildVolumes(): BufferGeometry {
  const v: number[] = []
  STAGES.forEach((spec, i) => {
    const [x, , z] = stagePosition(i)
    const base = FLOOR_Y
    switch (spec.key) {
      case 'checkout':
      case 'install':
        pushBox(v, x, base + 0.5, z - 2.4, 0.75, 0.5, 0.6)
        break
      case 'test':
        // Stacked plates: one run per assertion group.
        for (let k = 0; k < 3; k++) {
          pushBox(v, x, base + 0.22 + k * 0.34, z - 2.4, 0.8, 0.05, 0.62)
        }
        break
      case 'sonar':
      case 'gate':
        pushBox(v, x, base + 1.5, z - 2.5, 0.16, 1.5, 0.16)
        pushBox(v, x, base + 3.1, z - 2.5, 0.42, 0.12, 0.42)
        break
      case 'build':
        pushBox(v, x, base + 0.62, z - 2.5, 1.15, 0.62, 0.7)
        break
      case 'trivy':
        break
      case 'deploy':
        pushBox(v, x, base + 0.12, z - 2.4, 1.3, 0.12, 0.85)
        break
      case 'health':
        pushBox(v, x, base + 2.2, z - 2.5, 0.3, 0.3, 0.3)
        pushBox(v, x, base + 1.1, z - 2.5, 0.08, 1.1, 0.08)
        break
    }
  })
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(v, 3))
  return g
}

const FLOOR_GEOMETRY = buildFloor()
const GANTRY_GEOMETRY = buildGantries()
const VOLUME_GEOMETRY = buildVolumes()

export function Hall() {
  const active = useApp((s) => s.active)

  const floorRef = useRef<LineBasicMaterial | null>(null)
  const gantryRef = useRef<LineBasicMaterial | null>(null)
  const volumeRef = useRef<LineBasicMaterial | null>(null)
  const enteredAt = useRef(-1)

  // The hall resolves before the chain does, so the rail lands in a room
  // rather than the room appearing around an existing rail.
  useFrame((state, dt) => {
    const now = state.clock.getElapsedTime()
    if (active === 'pipeline') {
      if (enteredAt.current < 0) enteredAt.current = now
    } else {
      enteredAt.current = -1
    }
    const t = enteredAt.current < 0 ? 0 : easeOutCubic((now - enteredAt.current) / 0.7)

    const floor = floorRef.current
    if (floor) floor.opacity = damp(floor.opacity, t * 0.4, 8, dt)
    const gantry = gantryRef.current
    if (gantry) gantry.opacity = damp(gantry.opacity, t * 0.55, 8, dt)
    const volume = volumeRef.current
    if (volume) volume.opacity = damp(volume.opacity, t * 0.65, 8, dt)
  })

  return (
    <group>
      <lineSegments geometry={FLOOR_GEOMETRY} frustumCulled={false}>
        <lineBasicMaterial
          ref={floorRef}
          color={PIPE.rule}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </lineSegments>
      <lineSegments geometry={GANTRY_GEOMETRY} frustumCulled={false}>
        <lineBasicMaterial
          ref={gantryRef}
          color={PIPE.rule}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </lineSegments>
      <lineSegments geometry={VOLUME_GEOMETRY} frustumCulled={false}>
        <lineBasicMaterial
          ref={volumeRef}
          color={PIPE.mute}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </lineSegments>
    </group>
  )
}

/**
 * The global fog is tuned for the orbital overview, where 22 to 78 units is
 * the right depth. Left alone it would render the far gantries as a crisp flat
 * grid. Inside the hall it closes right in, and it eases rather than cuts
 * because the fly-down is continuous.
 */
const HALL_NEAR = 9
const HALL_FAR = 46
const HOME_NEAR = 22
const HOME_FAR = 78

export function HallFog() {
  const scene = useThree((s) => s.scene)
  const active = useApp((s) => s.active)
  const fog = useMemo(() => (scene.fog instanceof Fog ? scene.fog : null), [scene])

  useFrame((_, dt) => {
    if (!fog) return
    const inside = active === 'pipeline'
    fog.near = damp(fog.near, inside ? HALL_NEAR : HOME_NEAR, 2.2, dt)
    fog.far = damp(fog.far, inside ? HALL_FAR : HOME_FAR, 2.2, dt)
  })

  return null
}
```

- [ ] **Step 2: Monter `Hall` dans la scène du pipeline**

Dans `src/scene/pipeline/PipelineScene.tsx`, ajouter l'import et l'élément. `Hall` vient **avant** `Conveyor` dans l'arbre, pour que le décor se pose sous la chaîne :

```tsx
import { Hall } from './Hall'
```

```tsx
      <Hall />

      <Conveyor />
```

- [ ] **Step 3: Monter `HallFog` dans `App`, pas dans la scène**

`HallFog` doit vivre **hors** du bloc conditionnel. `PipelineScene` est chargé paresseusement et démonté à la sortie du nœud : monté dedans, `HallFog` disparaîtrait avant d'avoir ramené le brouillard à ses valeurs d'accueil, qui resteraient bloquées sur celles de la halle et laisseraient la vue orbitale dans la purée de pois.

Dans `src/App.tsx`, à côté de `CameraRig` :

```tsx
import { HallFog } from './scene/pipeline/Hall'
```

```tsx
        <CameraRig />
        <HallFog />
        <OrbitalScene />
```

L'import est statique et non paresseux : `HallFog` fait trente lignes et ne porte aucune géométrie, il ne pèse pas sur le chargement initial. Le `lazy` de `PipelineScene` continue de couvrir tout le reste du dossier.

- [ ] **Step 4: Vérifier**

Run: `npm run typecheck && npm run lint && npm test`
Expected: aucune erreur.

Run: `npm run dev`. Attendu : en entrant dans le nœud DevOps, un sol de grille et une file de portiques se révèlent avant la chaîne ; en avançant, les portiques défilent et les lointains se perdent dans la brume ; chaque poste porte une silhouette, sauf Trivy. En ressortant vers la vue orbitale, le brouillard se rouvre et les étoiles redeviennent nettes.

- [ ] **Step 5: Commit**

```bash
git add src/scene/pipeline/Hall.tsx src/scene/pipeline/PipelineScene.tsx src/App.tsx
git commit -m "Build the hall: floor, gantries, one silhouette per stage"
```

---

## Task 7: La destruction se déclenche à l'arrivée

**Files:**
- Modify: `src/scene/pipeline/SecurityGate.tsx:277-295` (le bloc « cycle bookkeeping »)

**Interfaces:**
- Consumes: `JOURNEY`, `GATE_ENTER`, `GATE_LEAVE`, `GATE_ARM_LOW`, `GATE_ARM_HIGH` de `../journey`.
- Produces: rien de nouveau.

- [ ] **Step 1: Ajouter l'état d'armement**

Dans `src/scene/pipeline/SecurityGate.tsx`, à côté des refs existantes (`cycleStart`, `burstCycle`, `cycleIndex`, `enteredAt`) :

```ts
  // True while the visitor has not yet triggered the destruction for this
  // approach. Cleared on firing, set again only once they have travelled well
  // clear of the plateau — a shaky scroll must not restage the whole thing.
  const armed = useRef(true)
```

Et l'import :

```ts
import { GATE_ARM_HIGH, GATE_ARM_LOW, GATE_ENTER, GATE_LEAVE, JOURNEY } from '../journey'
```

- [ ] **Step 2: Remplacer la boucle libre par un déclenchement**

Le bloc `// --- cycle bookkeeping ---` amorce aujourd'hui le cycle dès le montage et le fait tourner indéfiniment avec `while (now - cycleStart.current >= PERIOD)`. Le remplacer entièrement par :

```ts
    // --- cycle bookkeeping ---------------------------------------------------
    // The destruction is not a loop the visitor happens to catch mid-way. It is
    // caused by their arrival: the red packet leaves as they reach the plateau,
    // and the silence that follows lands where they are sitting still, reading
    // the paragraph about `--exit-code 1`.
    const p = JOURNEY.progress
    const onPlateau = p >= GATE_ENTER && p <= GATE_LEAVE

    if (!onPlateau && (p < GATE_ARM_LOW || p > GATE_ARM_HIGH)) {
      armed.current = true
    }

    if (onPlateau && armed.current) {
      armed.current = false
      cycleStart.current = now
      cycleIndex.current += 1
    }

    if (cycleStart.current < 0) {
      // Not triggered yet: the chain runs clean, the gate sits armed and open.
      PIPELINE_BUS.blockUntil = 0
      PIPELINE_BUS.nextCriticalAt = Number.POSITIVE_INFINITY
      const top = topRef.current
      const bottom = bottomRef.current
      if (top) top.position.y = PACKET_LIFT + APERTURE_ARMED + BLADE_HALF
      if (bottom) bottom.position.y = PACKET_LIFT - (APERTURE_ARMED + BLADE_HALF)
      mats.edge.emissiveIntensity = 1.1
      mats.blade.emissiveIntensity = 0.16
      if (lightRef.current) lightRef.current.intensity = 0.9
      if (critRef.current) critRef.current.visible = false
      if (shockRef.current) shockRef.current.visible = false
      if (pointsRef.current) pointsRef.current.visible = false
      return
    }

    const ct = now - cycleStart.current

    // One run, then the gate goes quiet until the next arrival.
    if (ct > PERIOD) {
      cycleStart.current = -1
      return
    }

    PIPELINE_BUS.blockUntil = cycleStart.current + SILENCE_END
    PIPELINE_BUS.nextCriticalAt = armed.current
      ? Number.POSITIVE_INFINITY
      : cycleStart.current + PERIOD
```

- [ ] **Step 3: Vérifier que le réarmement survit à la sortie du nœud**

Le bloc de démontage remet déjà `cycleStart.current = -1` quand `active !== 'pipeline'`. Y ajouter le réarmement, sans quoi revenir dans le nœud ne rejouerait rien :

```ts
    } else {
      enteredAt.current = -1
      cycleStart.current = -1
      burstCycle.current = -1
      armed.current = true
    }
```

- [ ] **Step 4: Vérifier**

Run: `npm run typecheck && npm run lint && npm test`
Expected: aucune erreur.

Run: `npm run dev`. Attendu, dans l'ordre : on descend jusqu'à Trivy ; à l'entrée du palier un artefact rouge s'élance sur le convoyeur ; il atteint le portique, les lames claquent, il éclate ; le convoyeur au-delà de Trivy reste vide pendant plus d'une seconde. On continue à descendre, rien ne rejoue. On remonte au-dessus du stage 05 puis on redescend : la séquence rejoue une fois, et une seule.

- [ ] **Step 5: Commit**

```bash
git add src/scene/pipeline/SecurityGate.tsx
git commit -m "Fire the Trivy destruction on arrival instead of looping it"
```

---

## Task 8: Dégradations et vérification finale

**Files:**
- Modify: `src/scene/CameraRig.tsx` (amortissement selon le tier)
- Modify: `src/scene/pipeline/Hall.tsx` (sol réduit en `lite`)

**Interfaces:**
- Consumes: `tier` du store ; `prefersReducedMotion` de `./Conveyor`.
- Produces: rien de nouveau.

- [ ] **Step 1: En `lite` et en mouvement réduit, la caméra coupe au lieu de glisser**

Dans `src/scene/CameraRig.tsx`, ajouter à côté de `JOURNEY_LAMBDA` :

```ts
/** Reduced motion gets the same trajectory as a series of cuts: the visitor
    still travels the whole chain, they just are not carried along it. */
const JOURNEY_LAMBDA_CUT = 26
```

Lire le tier et le réglage système, puis choisir :

```ts
  const tier = useApp((s) => s.tier)
  const reduced = useMemo(() => prefersReducedMotion(), [])
  const journeyLambda = tier === 'lite' || reduced ? JOURNEY_LAMBDA_CUT : JOURNEY_LAMBDA
```

et remplacer `JOURNEY_LAMBDA` par `journeyLambda` dans l'appel `MathUtils.damp` de `useFrame`. Importer `prefersReducedMotion` depuis `./pipeline/Conveyor`.

- [ ] **Step 2: Réduire le sol en `lite`**

Dans `src/scene/pipeline/Hall.tsx`, le sol est de loin la géométrie la plus lourde. En `lite`, n'en dessiner que la moitié en profondeur. Ajouter une seconde géométrie au niveau du module et choisir au rendu :

```ts
function buildFloor(depth: number): BufferGeometry {
```

en remplaçant les deux usages de `FLOOR_DEPTH` dans le corps par `depth`, puis :

```ts
const FLOOR_GEOMETRY = buildFloor(FLOOR_DEPTH)
const FLOOR_GEOMETRY_LITE = buildFloor(FLOOR_DEPTH / 2)
```

et dans le composant :

```tsx
  const tier = useApp((s) => s.tier)
```

```tsx
      <lineSegments
        geometry={tier === 'full' ? FLOOR_GEOMETRY : FLOOR_GEOMETRY_LITE}
        frustumCulled={false}
      >
```

- [ ] **Step 3: Vérifier types, lint et tests**

Run: `npm run typecheck && npm run lint && npm test`
Expected: aucune erreur, tous les tests verts.

- [ ] **Step 4: Vérifier le build de production**

Run: `npm run build`
Expected: succès, sans avertissement de taille de chunk au-delà de la limite de 1200 kB déjà configurée dans `vite.config.ts`.

- [ ] **Step 5: Passer la liste de vérification manuelle**

Run: `npm run dev`, puis, dans le navigateur :

- [ ] Descente complète du panneau DevOps : la caméra plonge, traverse les neuf stages, marque le palier Trivy, se pose en plan large après le stage 09, et le contenu de référence (architecture, API, secrets, observabilité, statut, preuves) se lit ensuite sans que la caméra reparte.
- [ ] Remontée complète : la trajectoire se rejoue à l'envers, sans à-coup.
- [ ] Un appui sur Échap ferme le panneau et la caméra remonte vers la vue orbitale ; le brouillard se rouvre.
- [ ] Cliquer un marqueur 3D fait défiler le panneau jusqu'au bloc correspondant.
- [ ] Glisser à la souris dans le pipeline : la vue pivote légèrement autour du sujet et revient au centre au relâchement.
- [ ] Au clavier seul, sans souris : `Tab` jusqu'au nœud DevOps, `Entrée`, puis `PageDown` répété parcourt tout le voyage.
- [ ] `?tier=lite` : le voyage est une suite de plans fixes, le portique reste fermé, la scène ne saccade pas.
- [ ] Fenêtre réduite à 390 px de large : le panneau devient une feuille, le voyage se pilote au doigt, et le sujet 3D reste visible dans la bande du haut.
- [ ] Réglage système « réduire les animations » activé : mêmes plans fixes qu'en `lite`.
- [ ] Les six autres nœuds — `whoami`, `arsenal`, `certifications`, `projets`, `parcours`, `contact` — s'ouvrent et se ferment exactement comme avant.

- [ ] **Step 6: Commit**

```bash
git add src/scene/CameraRig.tsx src/scene/pipeline/Hall.tsx
git commit -m "Degrade the journey to cuts on lite and reduced motion"
```

---

## Ce que ce plan ne fait pas

Consigné pour qu'aucune de ces absences ne passe pour un oubli :

- **Le HUD n'affiche pas la progression.** Pas de `STAGE 04/09`, pas de barre. `src/ui/Hud.tsx` n'est pas touché. La ligne en ambre dans le panneau porte déjà l'information.
- **Aucun son.** Le site n'en a pas et n'en aura pas dans ce chantier.
- **Les six autres nœuds gardent leur caméra actuelle.** Le voyage est propre au pipeline.
- **Pas de lien profond vers un stage.** L'URL ne change pas au fil du voyage ; recharger la page revient à la vue orbitale, comme aujourd'hui.
