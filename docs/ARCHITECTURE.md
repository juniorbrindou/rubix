# Architecture

## Pile

- **Expo** (React Native) en TypeScript strict, navigation **expo-router** — pourquoi : `docs/adr/0001-app-mobile-expo.md`.
- **3D** : `three` rendu par `@react-three/fiber/native` sur `expo-gl`.
- **État d'écran** : `zustand`.
- **Tests** : Jest (`jest-expo`) ; le cœur pur se teste sans émulateur.
- **Builds** : EAS (dans le nuage). Essai sur téléphone : Expo Go.

Les versions sont celles de `package.json`.

## Dossiers

```
app/            écrans (expo-router) : saisie, solution
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

`src/cube` ne dépend de rien. `src/solver` ne dépend que de `src/cube`. Seuls `src/scene`, `src/ui` et `app`
importent React ou three.js. Une flèche dans l'autre sens est une erreur de conception, pas un raccourci.

## Animation d'un mouvement

La scène tient 26 pièces (sans le centre caché). Animer `R` : regrouper les 9 pièces de la couche R dans un
pivot, tourner le pivot de 90° (≈ 300 ms, accélération douce), puis replacer les pièces à leur position arrondie
et repartir de l'état du modèle. L'état du modèle reste la vérité ; la scène ne fait que le rejouer.
