# Portfolio — Ibrahima Diallo

**En ligne : [brojalloo.github.io](https://brojalloo.github.io)**

Portfolio 3D interactif. Cybersécurité et DevSecOps.

Le site n'est pas une page qui *décrit* un laboratoire DevOps : c'est le laboratoire lui-même, mis en scène. Sept nœuds en orbite autour d'un noyau, et une scène signature où les neuf étapes du pipeline Jenkins deviennent une halle que l'on traverse : le défilement du panneau de lecture pilote la caméra, qui plonge dans la chaîne, s'arrête devant chaque poste, et marque un palier devant le portique Trivy — où le scan détruit visiblement un artefact vulnérable, au moment où vous arrivez, au lieu de se contenter d'en parler.

## Démarrer

```bash
npm install
npm run dev
```

Le site tourne sur http://localhost:5173.

> Le projet est actuellement dans un dossier OneDrive. La synchronisation de `node_modules` ralentit beaucoup les installations et les builds : si c'est gênant, déplacez le dossier hors de OneDrive, ou excluez `node_modules` de la synchronisation.

## Commandes

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement avec rechargement à chaud |
| `npm run build` | Build de production dans `dist/` |
| `npm run preview` | Servir le build de production en local |
| `npm run typecheck` | Vérification TypeScript de tout `src/` |
| `npm test` | Tests unitaires de la trajectoire de caméra (vitest) |
| `npm run lint` | oxlint |

> `npx tsc --noEmit` seul ne vérifie rien ici : le `tsconfig.json` racine ne contient que des références de projet. C'est `tsc -b` qui contrôle réellement le code.

> Les tests ne couvrent qu'une chose, mais la bonne : `src/scene/journey.ts`, la conversion d'une progression de défilement en position de caméra. C'est le seul morceau de la scène qui soit de la mathématique pure et donc vérifiable — le reste se juge à l'œil. Un test y garantit notamment que la caméra ne recule jamais le long de la chaîne, ce qui se produit dès qu'on pousse trop loin le serpentement de la trajectoire.

## Structure

```
src/
├── content.ts        Tout le texte du site, en français et en anglais
├── types.ts          Contrats TypeScript partagés
├── store.ts          État de navigation (zustand)
├── App.tsx           Canvas, post-processing, assemblage
├── Fallback.tsx      Version document si WebGL est indisponible
├── lib/perf.ts       Détection de la capacité de l'appareil
├── scene/            Scène orbitale, caméra, atmosphère
│   ├── nodes.ts      Position et forme des sept nœuds
│   ├── layout.ts     Où se trouve la chaîne du pipeline
│   ├── journey.ts    Comment la caméra la traverse (pur, testé)
│   ├── Effects.tsx   Post-processing, chargé à la demande
│   └── pipeline/     Scène signature CI/CD, dont la halle
├── ui/               HUD, panneau, écran d'accueil, bascule de langue
└── sections/         Les sept sections de contenu
```

Les sept sections, dans l'ordre de la navigation : à propos, compétences, certifications, projets, DevOps Lab, parcours, contact.

### Où modifier quoi

- **Changer un texte** → `src/content.ts`. Les deux langues sont côte à côte dans le même fichier pour qu'elles ne se désynchronisent pas. Aucun texte visible n'est écrit ailleurs.
- **Ajouter un projet** → tableau `PROJECTS` dans `src/content.ts`, puis les traductions correspondantes dans les objets `fr.projets` et `en.projets`. Un projet sans dépôt public met `repo: null` et le lien disparaît de lui-même.
- **Ajouter une certification** → tableau `CERTIFICATIONS` dans `src/content.ts`. Le champ `date` accepte `null` quand seule la fin de formation est confirmée : la carte affiche alors « Terminé » au lieu d'une date inventée.
- **Remplacer le CV** → modifier `cv-source/cv.html`, régénérer `public/CV-Ibrahima-Diallo.pdf` et actualiser la version dans `IDENTITY.cv` (`src/content.ts`) pour éviter un ancien téléchargement en cache.
- **Remplacer la photo** → ajouter le portrait dans `public/img/`, puis actualiser `IDENTITY.photo`, les métadonnées dans `index.html` et la photo de `cv-source/cv.html`. Le portrait actuel est `img/ibrahima-diallo-2026-10.jpg` ; la rubrique À propos affiche un cadre 4:5 aligné en haut.
- **Changer les couleurs ou les polices** → le bloc `@theme` en haut de `src/index.css`. Les couleurs utilisées dans les matériaux three.js sont écrites en dur dans les fichiers de `src/scene/`, en valeurs hexadécimales identiques.
- **Déplacer un nœud dans l'espace** → `src/scene/nodes.ts`.

## Performance

Le site choisit un budget de rendu au démarrage (`src/lib/perf.ts`) :

- **`full`** — postprocessing, champ de particules complet, trafic de paquets complet.
- **`lite`** — mobile, machines à quatre cœurs ou moins, rendu logiciel, ou `prefers-reduced-motion` activé. Même scène, moins de particules, pas de postprocessing.

Sans WebGL, `Fallback.tsx` affiche les sept sections dans un document défilant classique. Le contenu reste intégralement accessible.

Pour forcer un mode et vérifier l'autre chemin : `?tier=full` ou `?tier=lite` dans l'URL.

**Poids du bundle** : environ 411 Ko compressés au premier chargement, répartis par vitesse de changement plutôt qu'en un bloc.

| Chunk | gzip | Chargé |
| --- | --- | --- |
| `three` | 185 Ko | toujours |
| `three-helpers` (fiber, drei, stdlib, troika) | 100 Ko | toujours |
| `index` (code du site + tous les textes) | 83 Ko | toujours |
| `motion` (framer-motion) | 43 Ko | toujours |
| `Effects` (post-processing) | 22 Ko | tier `full` uniquement |
| `PipelineScene` | 6 Ko | nœud DevOps uniquement |

Le découpage n'allège pas seulement le premier chargement : `three` ne bouge jamais, le code du site change à chaque déploiement, donc une simple correction de texte ne fait retélécharger que 83 Ko au lieu de la totalité.

Ce qui reste est irréductible sans changer de parti pris : three.js et ses aides *sont* le site. Les deux seules pistes encore ouvertes coûteraient cher pour peu — remplacer framer-motion par des transitions CSS (43 Ko), ou charger `content.ts` par langue au lieu des deux ensemble (~6 Ko). Ni l'une ni l'autre ne vaut la complexité aujourd'hui.

## Déploiement

### GitHub Pages

Le workflow `.github/workflows/deploy.yml` construit et publie à chaque poussée sur `main`. Dans les paramètres du dépôt, section **Pages**, choisir **GitHub Actions** comme source.

`vite.config.ts` utilise `base: './'`, donc le site fonctionne aussi bien à la racine d'un domaine que dans un sous-chemin `/nom-du-depot/`.

### Vercel ou Netlify

Commande de build `npm run build`, dossier de sortie `dist`. Aucune variable d'environnement.

## Accessibilité

Navigation complète au clavier via l'index des nœuds : la scène 3D n'est jamais le seul chemin vers une section. `Échap` referme le panneau ouvert. Le focus est visible partout. `prefers-reduced-motion` est respecté dans les animations de l'interface et bascule le rendu 3D en mode `lite`.
