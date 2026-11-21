# Feuille de route

Prendre la première phase non cochée. Une phase est finie quand son critère est vrai, vérifié, et poussé sur
`master` ; la cocher alors dans ce fichier, dans le même commit.

- [x] **0. Squelette Expo** — SDK 58, expo-router (`src/app`), `three`, `@react-three/fiber`, `expo-gl`,
  `zustand`, `jest-expo`.
  *Fini quand* : `npm test` passe (un test factice), et `npx expo start --tunnel ngrok` sert l'écran d'accueil.
- [x] **1. Modèle du cube** (`src/cube`) — chaîne d'état, application d'un mouvement et d'une séquence, inverse,
  validation avec facette fautive.
  *Fini quand* : tous les tests d'invariants de `docs/MODELE-CUBE.md` passent.
- [x] **2. Solveur** (`src/solver`) — les sept étapes, leurs prédicats, la `Solution` étiquetée par étape.
  *Fini quand* : les critères « Fini quand » de `docs/METHODE-DEBUTANT.md` sont tenus. Le temps sur téléphone
  n'a pas encore été mesuré (27 ms au pire sur le serveur) : il passe dans le critère de la phase 3.
- [x] **3. Scène 3D** (cube affiché sur téléphone avec la 0.5.3, le 2026-11-21 ; avant, l'APK plantait au démarrage) (`src/scene`) — cube affiché depuis une chaîne d'état, rotation du cube au doigt, toucher
  d'une facette qui renvoie son indice, animation d'un mouvement.
  *Fini quand* : sur téléphone, `R U R' U'` s'anime et l'état affiché à la fin égale celui du modèle ; le temps
  d'un `solve` sur un mélange y est affiché et reste sous 200 ms.
- [x] **4. Saisie** (vrai cube saisi et accepté sur téléphone, 0.5.3, le 2026-11-21) (`src/input`, `src/app/index.tsx`) — préréglages animés, palette, compteur, validation visuelle.
  *Fini quand* : un état réel recopié depuis un vrai cube mélangé est accepté, et une erreur volontaire est désignée.
- [x] **5. Lecture de la solution** (vrai cube résolu en suivant l'app, 0.5.3, le 2026-11-21) (`src/app/solution.tsx`) — barre de mouvements, nom d'étape, Précédent / Lecture / Suivant.
  *Fini quand* : un vrai cube mélangé, suivi pas à pas, finit résolu.
- [ ] **7. Apprendre** (`src/app/apprendre.tsx`) — cube numérique qu'on résout soi-même : un doigt tourne une
  face, deux doigts le cube ; départ d'un mélange ou de son vrai cube ; « Aide » montre le prochain mouvement
  (flèche + consigne), un second appui le joue ; Annuler. Code livré, reste à le relier aux autres écrans.
  *Fini quand* : sur téléphone, un cube mélangé se résout jusqu'au bout avec les gestes et l'Aide.
- [ ] **6. Publication** — APK Android signée avec une vraie clé (aujourd'hui : clé de débogage). La distribution
  est en place : `scripts/publier-apk.sh` → `https://brindoujunior.com/rubix-v<version>.apk`.
  *Fini quand* : l'APK s'installe et le parcours complet fonctionne sans Expo Go.
