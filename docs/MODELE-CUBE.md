# Modèle du cube

Source de vérité pour l'indexation, la notation et la validité. Le code de `src/cube` l'implémente ; un écart
entre ce fichier et le code est un bug du code.

## Orientation de référence

| Face | Position | Couleur |
|------|----------|---------|
| U | haut | jaune |
| D | bas | blanc |
| F | devant | vert |
| B | derrière | bleu |
| R | droite | orange |
| L | gauche | rouge |

C'est le schéma de couleurs standard (blanc opposé jaune, vert opposé bleu, rouge opposé orange), tenu jaune en
haut. L'utilisateur tient son cube ainsi ; l'écran le montre ainsi.

## Chaîne d'état (format Kociemba)

54 caractères, faces dans l'ordre **U, R, F, D, L, B**, 9 facettes par face. Chaque caractère est le **nom de la
face** dont la facette a la couleur (`U` = couleur du centre U), pas la couleur elle-même. Une facette inconnue
s'écrit `?`.

Cube résolu : `UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB`

Indices : U = 0–8, R = 9–17, F = 18–26, D = 27–35, L = 36–44, B = 45–53. Dans chaque face, les facettes se
lisent ligne par ligne, de gauche à droite, sur ce patron déplié :

```
             U0 U1 U2
             U3 U4 U5
             U6 U7 U8
   L0 L1 L2  F0 F1 F2  R0 R1 R2  B0 B1 B2
   L3 L4 L5  F3 F4 F5  R3 R4 R5  B3 B4 B5
   L6 L7 L8  F6 F7 F8  R6 R7 R8  B6 B7 B8
             D0 D1 D2
             D3 D4 D5
             D6 D7 D8
```

Donc : la ligne du haut de U touche B, celle du bas de U touche F ; la ligne du haut de D touche F ; la ligne
du haut de L, F, R, B touche U. Le centre d'une face est sa facette 4.

Ce format est celui des solveurs existants (Kociemba, `cubejs`) : un état produit ici leur est lisible tel quel.

## Notation des mouvements

Singmaster. `R` = quart de tour **horaire** de la face R, vu en regardant cette face de face. `R'` = antihoraire,
`R2` = demi-tour. Idem `U F D L B`. Rotations du cube entier : `x` (comme R), `y` (comme U), `z` (comme F).

Une séquence s'écrit séparée par des espaces : `R U R' U R U2 R'`.

## Validité d'un état

Un état est valide si et seulement si toutes ces règles tiennent ; la validation renvoie la **première facette
fautive** pour que l'écran la montre.

1. 9 facettes de chaque face, aucune `?`.
2. Les six centres sont distincts.
3. Chaque coin porte trois couleurs de faces deux à deux adjacentes, et chacun des 8 coins existe une seule fois.
4. Chaque arête porte deux couleurs de faces adjacentes, et chacune des 12 arêtes existe une seule fois.
5. Somme des torsions des coins ≡ 0 (mod 3).
6. Somme des retournements des arêtes ≡ 0 (mod 2).
7. Parité de la permutation des coins = parité de la permutation des arêtes.

Les règles 5–7 sont celles d'un cube démonté et mal remonté : le message doit le dire en ces termes.

## Tests d'invariants

Le modèle est juste quand ces tests passent :

- `R R R R`, et de même pour chaque face, rend l'état de départ.
- `(R U R' U')` répété 6 fois rend l'état de départ.
- Toute séquence suivie de son inverse rend l'état de départ.
- `R U R' U R U2 R'` (Sune) répété 6 fois rend l'état de départ.
- Tout état obtenu par mouvements depuis le cube résolu est valide ; un état où l'on échange deux facettes d'un
  même coin ne l'est pas.
