# Méthode débutant

Le solveur résout étage par étage, blanc en bas, dans l'orientation de référence (`docs/MODELE-CUBE.md`).
Il part de l'état saisi, saute les étapes déjà finies et produit une `Solution` : chaque pas porte un mouvement
et le nom de l'étape qu'il sert.

## Les sept étapes

Chaque étape a un **prédicat** (ce qui doit être vrai à sa fin) et le préréglage du même nom fixe exactement les
facettes de ce prédicat. Les étapes sont cumulatives : l'étape n exige aussi les prédicats 1 à n−1.

| # | Étape (texte affiché) | Prédicat | Algorithmes |
|---|------------------------|----------|-------------|
| 1 | Croix blanche | arêtes DF, DR, DB, DL à leur place, blanc en D | intuitif |
| 2 | Premier étage | + coins DFR, DLF, DBL, DRB à leur place, blanc en D | `R U R' U'` répété |
| 3 | Deuxième étage | + arêtes FR, FL, BL, BR à leur place | droite : `U R U' R' U' F' U F` ; gauche : `U' L' U L U F U' F'` |
| 4 | Croix jaune | + 4 facettes jaunes d'arête sur U | `F R U R' U' F'` |
| 5 | Face jaune | + les 9 facettes de U jaunes | Sune : `R U R' U R U2 R'` |
| 6 | Coins jaunes | + 4 coins de U à leur place | `R' F R' B2 R F' R' B2 R2` |
| 7 | Cube résolu | état résolu | `R U' R U R U R U' R' U' R2` et son inverse `R2 U R U R' U' R' U' R' U R'` |

## Comment chaque étape cherche ses mouvements

- **Étape 1** : une arête blanche à la fois, recherche bornée (IDA*, profondeur ≤ 8) sur les 18 mouvements, sous
  contrainte de garder en place les arêtes déjà posées.
- **Étapes 2 et 3** : procédé fixe par pièce. Amener la pièce en U au-dessus de sa case (ou l'en sortir avec
  l'algorithme si elle est coincée en dessous, mal placée), puis appliquer l'algorithme. Pour un coin, `R U R' U'`
  au-dessus de la case DFR, répété jusqu'à ce qu'il soit posé (1, 3 ou 5 fois).
- **Étapes 4 à 7** : recherche en largeur sur les **macro-coups** `{U, U', U2, algorithme de l'étape}`, jusqu'au
  prédicat. L'espace est minuscule ; la recherche choisit les ajustements, ce qui évite de coder la table des cas
  à la main.

Le texte d'aide affiché à chaque pas (« place le coin jaune en avant à gauche ») se déduit des ajustements
trouvés, pas d'une table écrite à part.

## Fini quand

- Les tests appliquent le solveur à 1 000 mélanges aléatoires de 25 mouvements : tous finissent résolus, et
  après chaque étape son prédicat est vrai.
- Chaque algorithme du tableau a un test qui vérifie qu'il préserve les étapes précédentes (sauf l'ajustement U).
- Une solution complète se calcule en moins de 200 ms sur un téléphone d'entrée de gamme, mesuré.
