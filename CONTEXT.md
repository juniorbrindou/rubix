# Glossaire

Un terme par ligne : terme français (affiché, documenté) → nom dans le code.

## Le cube

- **Face** → `Face` : un des six côtés, nommé par sa position `U R F D L B` (haut, droite, devant, bas, gauche, derrière), jamais par sa couleur.
- **Facette** → `Facelet` : une des 54 cases colorées. Repérée par un indice 0–53 (voir `docs/MODELE-CUBE.md`).
- **Centre** → `Center` : facette du milieu d'une face. Ne bouge jamais par rapport aux autres centres ; il fixe la couleur de sa face.
- **Pièce** → `Cubie` : un des petits cubes. Trois sortes :
  - **Coin** → `Corner` : 3 facettes, 8 coins (`URF`, `UFL`, `ULB`, `UBR`, `DFR`, `DLF`, `DBL`, `DRB`).
  - **Arête** → `Edge` : 2 facettes, 12 arêtes (`UR`, `UF`, `UL`, `UB`, `DR`, `DF`, `DL`, `DB`, `FR`, `FL`, `BL`, `BR`).
  - **Centre** : 1 facette.
- **Couche** / **étage** → `Layer` : tranche de 9 pièces. Premier étage = couche D (blanche), deuxième = couche du milieu, troisième = couche U (jaune).
- **État** → `CubeState` : la chaîne de 54 lettres qui décrit le cube entier.
- **État valide** → `isValid` : un état qu'un vrai cube peut atteindre (voir les règles dans `docs/MODELE-CUBE.md`).

## Les mouvements

- **Mouvement** → `Move` : quart de tour, demi-tour ou quart de tour inverse d'une face (`R`, `R'`, `R2`).
- **Rotation** → `Rotation` : tour du cube entier (`x`, `y`, `z`) ; ne change pas l'état, seulement le point de vue.
- **Algorithme** → `Algorithm` : suite de mouvements nommée, apprise par cœur (« Sune »).
- **Ajustement** → `AUF` : tour de U placé avant ou après un algorithme pour amener le bon cas devant soi.

## La méthode

- **Étape** → `Stage` : une des sept étapes de la méthode débutant (`docs/METHODE-DEBUTANT.md`).
- **Étape finie** → `StageDone` : l'état satisfait le prédicat de l'étape et de toutes les précédentes.
- **Solution** → `Solution` : liste de pas, chaque pas = un mouvement + l'étape qu'il sert.

## La saisie

- **Préréglage** → `Preset` : case « étape finie » que l'utilisateur coche ; elle remplit d'office les facettes fixées par cette étape.
- **Palette** → `Palette` : les six couleurs proposées quand l'utilisateur touche une facette.
- **Facette inconnue** → `UNKNOWN` : facette pas encore saisie ; un état qui en contient n'est pas résolu.
