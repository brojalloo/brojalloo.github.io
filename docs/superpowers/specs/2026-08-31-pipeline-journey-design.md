# Le voyage du pipeline — spécification de conception

Date : 2026-08-31
Périmètre : le nœud `pipeline` (projet DevOps Lab) uniquement. Les six autres
nœuds du portfolio ne changent pas.

---

## 1. Le problème

La scène 3D du pipeline existe et fonctionne, mais on ne peut pas s'y déplacer.

- `src/scene/CameraRig.tsx` n'accepte le glisser que si `active === null`. Dès
  qu'un nœud est ouvert, `azimuth` et `elevation` sont ramenés à zéro : toute
  tentative de déplacement est annulée en une demi-seconde.
- Aucun gestionnaire de molette n'existe dans le projet. La molette ne fait
  rien sur le canvas.
- `pipelineView()` cadre cinq des neuf stages. Les quatre premiers sont hors
  champ, et le seul moyen d'y accéder est de cliquer une ligne d'accordéon
  dans le panneau de texte.

Le résultat est une vitrine : la mécanique tourne derrière une vitre, à une
distance et sous un angle que le visiteur ne choisit pas.

## 2. Ce qu'on construit

Le scroll du panneau de lecture pilote une trajectoire de caméra écrite, qui
traverse une halle technique de bout en bout. Le visiteur descend dans la
molette et la caméra le fait entrer dans la chaîne, s'arrêter à chaque poste,
et marquer un palier devant le portique Trivy où la séquence de destruction se
déclenche au moment de son arrivée.

Une seule barre de scroll, un seul geste, aucun mode à comprendre.

### Décisions prises et écartées

| Décision | Retenu | Écarté, et pourquoi |
| --- | --- | --- |
| Navigation | Voyage piloté par le scroll | Vol libre : casse la composition et n'est pas jouable au clavier. Aimantation discrète : c'est déjà ce que fait l'accordéon. |
| Texte | Le panneau existant pilote le voyage | Voyage plein écran puis dossier : deux modes, et enterre le contenu technique dense. |
| Décor | Halle ouverte en fil de fer | Salle fermée : trahit la direction artistique « instrument », coûteuse sur mobile. Vide pur : ne répond pas à la demande d'immersion. |
| Portée | Le nœud `pipeline` seul | Scroll-jacking pleine page : oblige à refaire la mise en page des six autres nœuds. |

## 3. Architecture

### 3.1 Le module central

`src/scene/journey.ts` devient la seule source de vérité du voyage.

```
JOURNEY                    objet mutable { target, progress }
journeyView(p, out)        progression 0..1 -> position caméra
journeyAim(p, wide, out)   progression 0..1 -> point visé
stageAtProgress(p)         -> index de stage entier
progressForStage(i)        -> l'inverse
```

`JOURNEY` suit le motif déjà établi par `PIPELINE_BUS` dans
`src/scene/pipeline/Conveyor.tsx` : un objet mutable au niveau du module,
écrit par un seul propriétaire, lu par les autres en `useFrame`.

Propriété de conception : `journeyView` et `journeyAim` sont **pures et sans
allocation** — elles écrivent dans un `Vector3` fourni par l'appelant. C'est ce
qui permet de les appeler soixante fois par seconde sans produire de déchets.

### 3.2 Le flux de données

```
scroll du panneau
      |  listener passif sur le conteneur .panel-scroll
      v
useJourneyScroll()  -- mesure la position des neuf blocs de stage
      |                contre une ligne de lecture à 45 % de la hauteur
      v
JOURNEY.target = 0.37
      |
      +----------------------------------------------+
      v useFrame                                      v useFrame
CameraRig                                       StageMarker x9, Hall,
  damp(progress -> target)                      SecurityGate
  journeyView / journeyAim                        lisent JOURNEY.progress
      |
      v seulement quand l'entier change
useApp.setStage(3)
```

La règle qui tient tout : **la progression continue ne passe jamais par
React.** Un scroll à 120 Hz qui déclencherait un rendu du panneau à chaque
événement rendrait la page inutilisable. Seul le franchissement d'un stage —
au plus neuf fois pour une descente complète — écrit dans le store, pour que
le panneau surligne la ligne du stage courant.

### 3.3 Frontières des modules

| Module | Responsabilité | Dépend de |
| --- | --- | --- |
| `scene/journey.ts` | La trajectoire, la progression, les conversions stage <-> progression | `scene/layout.ts`, `content.ts` |
| `ui/useJourneyScroll.ts` | Traduire une position de scroll en `JOURNEY.target` | `scene/journey.ts` |
| `scene/CameraRig.tsx` | Amortir et appliquer position + visée | `scene/journey.ts`, `scene/nodes.ts` |
| `scene/pipeline/Hall.tsx` | Le sol, les portiques, les volumes de stage | `scene/layout.ts`, `scene/pipeline/Conveyor.tsx` |
| `scene/pipeline/SecurityGate.tsx` | Le cycle Trivy, désormais déclenché | `scene/journey.ts` |

`Hall.tsx` ne connaît pas le scroll : il lit `JOURNEY.progress` et ne fait
qu'atténuer. `journey.ts` ne connaît ni React ni le DOM. Aucune dépendance
circulaire : `journey.ts` importe `layout.ts`, jamais l'inverse.

## 4. La trajectoire

Une `CatmullRomCurve3` de points de contrôle, échantillonnée par `progress`.
Elle serpente au lieu de suivre le rail — glisser parallèlement au rail donne
la sensation d'un tapis roulant, pas d'une traversée.

```
vue de dessus            p=0        p=0.5                    p=1
                          |           |                        |
   caméra    +----+   +---+   +-------+   +----+   +---+  +----+
             |    +---+       |           |    +---+   +--+
   rail   ===O===O===O===O===O===[TRIVY]===O===O===O===========
             01  02  03  04  05     06      07  08  09
```

Trois règles la gouvernent.

**La distance respire.** Environ 5 unités face à un stage, environ 11 entre
deux. Ce battement est ce qui produit la sensation de traverser des lieux
plutôt que de survoler une frise chronologique.

**L'entrée est un plongeon.** `p = 0` n'est pas le stage 01 : c'est un plan
large en surplomb, à environ 26 unités au-dessus de la chaîne. Les huit
premiers pour cent de scroll font descendre la caméra dans la halle.

**Trivy est un palier.** Autour de `p ~= 0.62`, la courbe s'aplatit : environ
15 % du scroll total se passe presque immobile devant le portique.

Le décalage latéral qui dégage le sujet de dessous le panneau — `AIM_SHIFT`
sur écran large, `SHEET_LIFT` sur écran étroit, tous deux dans
`scene/layout.ts` — est conservé tel quel et s'applique au point visé de la
courbe.

Le glisser est réactivé à l'intérieur du pipeline, borné à ±0.18 rad autour de
la trajectoire avec rappel au centre : on peut jeter un œil de côté, jamais
casser le cadrage. Concrètement : la condition `atHome` de `CameraRig.tsx` ne
commande plus l'existence du glisser mais seulement son amplitude — `DRAG_CLAMP`
à 0.35 rad dans la vue orbitale, 0.18 rad dans le pipeline. La parallaxe de
pointeur, elle, reste réservée à la vue orbitale : ajoutée à une caméra déjà en
mouvement, elle donnerait le mal de mer.

## 5. La halle

Un fichier, `src/scene/pipeline/Hall.tsx`. Tout en fil de fer, palette
existante, aucune surface pleine.

| Élément | Forme | Rôle |
| --- | --- | --- |
| Sol | Grille de `LineSegments`, 2.6 unités sous le rail, maille de 1.7 | Le sol et la vitesse — c'est lui qui défile |
| Portiques | Cadres ouverts tous les `STAGE_SPACING / 2`, hauteur 5.4, largeur 4.2 | Le rythme de la traversée |
| Volumes de stage | Une silhouette par stage, dérivée de `spec.key` | Chaque poste devient un lieu |

Vocabulaire des volumes, une silhouette chacun : caisse basse pour `CHECKOUT`
et `INSTALL`, plaques empilées pour `TEST`, pylône-sonde pour `SONARQUBE` et
`QUALITY GATE`, conteneur pour `DOCKER BUILD`, dalle pour `DEPLOY`,
anneau-balise pour `HEALTH CHECK`.

`TRIVY` ne reçoit aucun volume : sa structure existe déjà dans
`StageMarker.tsx` et doit rester le seul objet massif de la scène.

**Pas de plafond.** Au-dessus de la halle, on garde le vide et les étoiles de
`Starfield`. Une salle fermée serait plus spectaculaire sur une capture
d'écran et détruirait l'identité du site ; garder le ciel ouvert rend aussi
lisible le fait que la vue orbitale est soixante unités plus haut.

**Coût.** Sol, portiques et volumes sont fusionnés en trois `BufferGeometry`
construites une fois au chargement du module, comme `TICK_GEOMETRY` le fait
déjà dans `Conveyor.tsx`. Trois appels de dessin pour tout le décor, zéro
allocation par frame.

**Brouillard.** Le réglage actuel `['#06080b', 22, 78]` dans `App.tsx` est
calibré pour la vue orbitale et laisserait la halle nette jusqu'à l'horizon.
Un composant amortit `scene.fog.near / far` vers `[9, 46]` à l'entrée dans le
pipeline et les ramène à la sortie, pour que les portiques lointains
disparaissent dans la brume au lieu de former une grille plate.

## 6. La séquence Trivy

`SecurityGate.tsx` tourne aujourd'hui en boucle libre de 7.2 secondes : en
arrivant devant le portique, on tombe au hasard dans le cycle. Le moment doit
être causé par l'arrivée du visiteur, pas subi.

Le cycle reçoit une horloge propre — une `ref` `cycleStart` — au lieu de lire
`now % PERIOD`.

```
progress ------------------------------------------------->
        0.50        0.55            0.70        0.75
  ------+-----------+---------------+-----------+---------
        |           |    PALIER     |           |
     réarmé      DÉCLENCHE       fin palier   réarmé
                 cycleStart = 0
```

À l'entrée dans le palier, `cycleStart` est remis à zéro. Le paquet rouge part
au moment de l'arrivée, roule ses 2.1 secondes jusqu'au portique, les lames
claquent, il est détruit — et le silence de 1.3 seconde pendant lequel le
convoyeur reste vide tombe précisément là où le visiteur est immobile à lire le
paragraphe sur `--exit-code 1`.

L'hystérésis — déclenchement à 0.55, réarmement seulement en repassant sous
0.50 ou au-dessus de 0.75 — empêche un scroll tremblant de relancer la
séquence en boucle. En remontant, elle rejoue : c'est le comportement voulu,
c'est la démonstration du projet.

## 7. Le panneau

Conséquence directe du choix scrollytelling : **l'accordéon des neuf stages
disparaît.** Les neuf blocs sont ouverts en permanence — c'est leur hauteur
cumulée qui constitue la timeline du voyage. Cliquer un titre ne déplie plus,
il fait défiler jusqu'au bloc.

- `store.stage` change de sens : ce n'est plus « le stage déplié », c'est « le
  stage où le voyage se trouve ». `goTo('pipeline')` l'initialise donc à `0` et
  non à `-1`, et il ne vaut plus jamais `-1` tant que le pipeline est ouvert.
  Hors pipeline, il reste `-1` : aucun autre nœud ne le lit.
- Le raccourci Échap ne relâche plus le stage en premier : il sort du nœud
  directement, en une pression.
- `Panel.tsx` expose la ref de son conteneur défilant, pour que
  `useJourneyScroll` puisse s'y abonner. C'est la seule modification que le
  panneau subit ; il continue de ne rien savoir de ce qu'il affiche.

Le contenu de référence dense — architecture, table API, secrets Sentry,
observabilité, statut, preuves — reste intégralement en place, après le
neuvième stage. Une fois le voyage terminé, la caméra se pose sur un plan
large et le visiteur continue de lire.

## 8. Dégradations

**`lite` et `prefers-reduced-motion`** — la caméra ne glisse plus, elle coupe :
même trajectoire, amortissement quasi instantané, donc un enchaînement de plans
fixes. Le sol perd la moitié de son étendue, les portiques sont dessinés mais
ne défilent pas, et `PIPELINE_BUS.gateShut`, déjà en place, laisse le portique
fermé en permanence. La démonstration est faite sans mouvement.

**Mobile** — le panneau est une feuille de 60dvh sur laquelle le pouce défile
déjà ; ce geste devient le voyage. `journeyAim` applique `SHEET_LIFT` et la 3D
occupe les 40 % du haut. Aucun mode séparé.

**Clavier** — acquis sans code supplémentaire : le panneau reçoit le focus à
l'ouverture et répond déjà à `Bas`, `PageDown`, `Home` et `End`. Les titres de
stage restent des `<button>` qui font défiler jusqu'au bloc.

**Sans WebGL** — `Fallback.tsx` est inchangé.

## 9. Vérification

Ce dépôt n'a pas de lanceur de tests : `package.json` n'expose que `tsc -b` et
`oxlint`.

1. `npm run typecheck` et `npm run lint` propres. Obligatoire.
2. Vérification manuelle dans le navigateur : descente complète du voyage,
   palier Trivy, remontée du scroll, `?tier=lite`, largeur mobile.
3. Ajout de `vitest` en devDependency pour couvrir les fonctions pures de
   `journey.ts` : bornes finies en `p = 0` et `p = 1`, progression monotone le
   long du rail, et aller-retour `progressForStage(i) -> stageAtProgress(...) === i`.
   C'est le seul morceau du travail qui soit de la mathématique vérifiable, et
   la seule dépendance ajoutée par ce chantier. Décidé : on l'ajoute.

## 10. Fichiers touchés

| Fichier | Nature |
| --- | --- |
| `src/scene/journey.ts` | nouveau — trajectoire et progression |
| `src/ui/useJourneyScroll.ts` | nouveau — scroll vers progression |
| `src/scene/pipeline/Hall.tsx` | nouveau — sol, portiques, volumes |
| `src/scene/CameraRig.tsx` | bloc pipeline réécrit, glisser réactivé |
| `src/scene/layout.ts` | conserve `stagePosition`, perd `pipelineView` / `stageView` |
| `src/scene/pipeline/SecurityGate.tsx` | cycle déclenché au lieu de libre |
| `src/scene/pipeline/PipelineScene.tsx` | monte `Hall`, pilote le brouillard |
| `src/ui/Panel.tsx` | expose la ref du conteneur défilant |
| `src/sections/Pipeline.tsx` | accordéon vers blocs ouverts et ancrés |
| `src/store.ts` | nouvelle sémantique de `stage` |
| `src/scene/journey.test.ts` | nouveau — les trois tests de la section 9 |
| `package.json` | `vitest` en devDependency, script `test` |
