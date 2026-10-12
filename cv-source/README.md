# Source du CV

`cv.html` est la source du CV téléchargeable depuis le site. Le PDF publié
(`public/CV-Ibrahima-Diallo.pdf`) en est le rendu.

La photo est chargée depuis `../public/img/ibrahima-diallo-2026-10.jpg`. Conserver
le dossier `public/img/` à côté de la source pour que le portrait s'affiche.

## Modifier le CV

1. Ouvrir `cv.html` dans un éditeur de texte, modifier le contenu.
2. Ouvrir le fichier dans Chrome ou Edge (double-clic suffit).
3. `Ctrl + P` → **Destination : Enregistrer au format PDF**.
4. Dans « Plus de paramètres » : format **A4**, marges **Aucune**, et cocher
   **Graphiques d'arrière-plan** — sans cette dernière case, la colonne bleue
   et les accents verts disparaissent.
5. Enregistrer par-dessus `public/CV-Ibrahima-Diallo.pdf`, puis pousser.
6. Lors d'une nouvelle mise à jour, changer aussi le paramètre de version
   de `IDENTITY.cv` dans `src/content.ts` pour renouveler le téléchargement.

## Contrainte à respecter

Le contenu doit tenir sur **une seule page A4 (297 mm)**. La mise en page est
calée au millimètre près : ajouter un projet ou deux lignes de texte fera
déborder sur une seconde page presque vide, ce qui se voit immédiatement.

Pour regagner de la place, dans l'ordre : réduire `font-size` sur `html, body`,
puis les marges de `.main h2`, puis le `padding` de `.main`.

## Ce qui est délibérément absent

- Aucune date pour le **CCNA 2** : la formation est terminée, mais aucun
  justificatif daté n'est disponible. Le CV affiche « terminé », comme le site.
- Aucun lien de vérification de certification : aucune URL officielle
  n'existe pour ces formations.

Garder cette discipline. Un CV qui n'affirme que ce qu'il peut prouver résiste à
l'entretien ; l'inverse s'effondre à la première question précise.
