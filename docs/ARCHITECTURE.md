# Architecture

## Pile

- **Expo** (React Native) en TypeScript strict, navigation **expo-router** — pourquoi : `docs/adr/0001-app-mobile-expo.md`.
- **3D** : `three` rendu par `@react-three/fiber/native` sur `expo-gl`.
- **État d'écran** : `zustand`.
- **Tests** : Jest (`jest-expo`) ; le cœur pur se teste sans émulateur.
- **Builds** : APK Android construite sur le serveur (Gradle) ; iOS par EAS plus tard.

Les versions sont celles de `package.json`.

## Dossiers

```
src/app/        écrans (expo-router) : saisie, solution
src/cube/       modèle pur : chaîne d'état, mouvements, validation
src/solver/     méthode débutant : étapes, prédicats, recherche
src/scene/      rendu 3D : cube, sélection d'une facette, animation d'un mouvement
src/input/      logique de saisie : préréglages, palette, facette sélectionnée
src/ui/         composants partagés (boutons, palette, barre de lecture)
docs/           documentation de référence
```

## Sens des dépendances

```
cube  ←  solver  ←  input  ←  app
  ↑                   ↑
  └──── scene ────────┘
```

(`app` = `src/app`.) `src/cube` ne dépend de rien. `src/solver` ne dépend que de `src/cube`. Seuls `src/scene`,
`src/ui` et `src/app` importent React ou three.js. Une flèche dans l'autre sens est une erreur de conception, pas un raccourci.

## Scène 3D (`src/scene`)

- `CubeView` affiche un `CubeState`, rien d'autre : la vérité reste l'état du modèle.
- `fiber.native.ts` / `fiber.ts` : Metro prend `@react-three/fiber/native` (expo-gl) sur mobile et
  `@react-three/fiber` sur le web. Importer `Canvas`, `useFrame`, `useThree` depuis `./fiber`, jamais directement.
- Les gestes passent par un `PanResponder` posé sur la vue qui entoure le canevas (il capture le toucher avant
  le canevas). Deux doigts, ou un doigt hors du cube, tournent le cube. Un toucher bref lance un rayon. En
  mode `turn`, glisser un doigt posé sur une case tourne sa couche : l'axe de la face qui suit le mieux le doigt à
  l'écran donne une direction du modèle, que `moveFromSwipe` (`swipe.ts`, testé sur toutes les cases) change en
  mouvement. Un toucher dans le joint noir entre deux cases désigne la case de la face du corps touchée
  (`faceletOfHit`).
- Le point de vue est une orbite (lacet libre, tangage borné à ±1,45 rad), jamais de roulis : le haut reste en
  haut. `focus` et `hint` y amènent la face voulue ; le bouton ⟲ ramène la vue de départ.
- Le sens de rotation est testé : `src/scene/__tests__/cubies.test.ts` vérifie, pour les 18 mouvements, que la
  couche tournée de l'angle `moveTurn` tombe exactement sur l'état `applyMove`.

## Animation d'un mouvement

La scène tient 26 pièces (sans le centre caché). Animer `R` : regrouper les 9 pièces de la couche R dans un
pivot, tourner le pivot de 90° (≈ 300 ms, accélération douce), puis replacer les pièces à leur position arrondie
et repartir de l'état du modèle. L'état du modèle reste la vérité ; la scène ne fait que le rejouer.
