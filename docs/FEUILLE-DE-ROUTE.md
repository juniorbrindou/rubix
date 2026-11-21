# Feuille de route

Prendre la première phase non cochée. Une phase est finie quand son critère est vrai, vérifié, et poussé sur
`master` ; la cocher alors dans ce fichier, dans le même commit.

- [x] **0. Squelette Expo** — SDK 58, expo-router (`src/app`), `three`, `@react-three/fiber`, `expo-gl`,
  `zustand`, `jest-expo`.
  *Fini quand* : `npm test` passe (un test factice), et `npx expo start --tunnel ngrok` sert l'écran d'accueil.
- [ ] **1. Modèle du cube** (`src/cube`) — chaîne d'état, application d'un mouvement et d'une séquence, inverse,
  validation avec facette fautive.
  *Fini quand* : tous les tests d'invariants de `docs/MODELE-CUBE.md` passent.
- [ ] **2. Solveur** (`src/solver`) — les sept étapes, leurs prédicats, la `Solution` étiquetée par étape.
  *Fini quand* : les critères « Fini quand » de `docs/METHODE-DEBUTANT.md` sont tenus.
- [ ] **3. Scène 3D** (`src/scene`) — cube affiché depuis une chaîne d'état, rotation du cube au doigt, toucher
  d'une facette qui renvoie son indice, animation d'un mouvement.
  *Fini quand* : sur téléphone, `R U R' U'` s'anime et l'état affiché à la fin égale celui du modèle.
- [ ] **4. Saisie** (`src/input`, `src/app/index.tsx`) — préréglages animés, palette, compteur, validation visuelle.
  *Fini quand* : un état réel recopié depuis un vrai cube mélangé est accepté, et une erreur volontaire est désignée.
- [ ] **5. Lecture de la solution** (`src/app/solution.tsx`) — barre de mouvements, nom d'étape, Précédent / Lecture / Suivant.
  *Fini quand* : un vrai cube mélangé, suivi pas à pas, finit résolu.
- [ ] **6. Publication** — APK Android signée avec une vraie clé (aujourd'hui : clé de débogage).
  *Fini quand* : l'APK s'installe et le parcours complet fonctionne sans Expo Go.
