# Rubix — consignes pour les agents

Application mobile d'aide à la résolution du Rubik's Cube 3×3. L'utilisateur reproduit en 3D l'état de son cube
(étapes déjà finies + couleur des cases restantes), l'application vérifie que l'état existe, puis le guide
mouvement par mouvement avec la méthode débutant, chaque mouvement animé en 3D.

Avancement et prochaine tâche : [`docs/FEUILLE-DE-ROUTE.md`](docs/FEUILLE-DE-ROUTE.md).

## Règles du projet

- **Orientation de référence** : jaune en haut (U), blanc en bas (D), vert devant (F), orange à droite (R),
  rouge à gauche (L), bleu derrière (B). Tout le code, les écrans et les textes la supposent.
- **Un état = une chaîne de 54 lettres** au format facettes de Kociemba (`URFDLB`). Une seule représentation
  circule entre les modules ; la 3D et la saisie en dérivent.
- **Cœur pur** : `src/cube` et `src/solver` sont du TypeScript sans React, sans three.js, testés sous Node.
- **Algorithme prouvé par test** : chaque algorithme ajouté au solveur a un test qui l'applique au modèle et
  vérifie ce qu'il préserve et ce qu'il produit. Un algorithme recopié d'un site n'est jamais pris pour juste.
- **Langues** : identifiants du code en anglais, textes affichés et documentation en français. Le glossaire
  [`CONTEXT.md`](CONTEXT.md) donne la correspondance ; un nouveau terme métier y entre avant d'entrer dans le code.
- **Petit écran** : chaque écran se vérifie sur un téléphone de 360 dp de large, sans défilement parasite.
- **Commits** : message en français, sans trailer `Co-Authored-By` ni mention d'assistant.
- **Livrer** : un changement est vert quand `npm test`, `npm run typecheck` et `npx expo-doctor` passent ; alors
  commit puis push sur `master`.
- **APK** : l'utilisateur n'a pas Expo Go ; il essaie l'APK. Le serveur la construit lui-même (SDK Android dans
  `/opt/android-sdk`, JDK 17) : `npx expo prebuild --platform android`, puis dans `android/` :
  `./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a,armeabi-v7a`. Le lien à donner est celui d'une
  release GitHub (`gh release create v<version> <apk>`), contrôlé par un téléchargement avant d'être annoncé.
  Le serveur n'est pas connecté à un compte Expo : ni EAS, ni `expo start --tunnel` sans `ngrok`.

## Expo

Expo casse ses API à chaque SDK : ta mémoire d'entraînement est périmée. Avant de toucher une API Expo, EAS ou
React Native, lis la documentation de la version majeure de `expo` dans `package.json`
(`https://docs.expo.dev/versions/v<majeure>.0.0/`), ou l'index `https://docs.expo.dev/llms.txt`.

- **Ajouter un paquet** : `npx expo install <paquet>`, qui choisit la version compatible avec le SDK. Pour un
  paquet de développement, vérifier ensuite qu'il est rangé dans `devDependencies` : `-- --save-dev` ne le fait pas.
- **Expo Go** n'embarque que ses propres modules natifs : une bibliothèque à code natif hors de cette liste exige
  un build de développement EAS. `ios/` et `android/` sont générés ; la configuration native passe par `app.json`.
- **TypeScript 6** met `types` à vide par défaut : un paquet de types globaux (comme `jest`) s'ajoute à
  `compilerOptions.types` dans `tsconfig.json`.
- **Routes** : chaque fichier de `src/app/` est un écran ; le code qui n'est pas un écran vit ailleurs dans `src/`.

## Où lire

- **Modèle** (indexation des facettes, notation des mouvements, règles de validité) :
  [`docs/MODELE-CUBE.md`](docs/MODELE-CUBE.md).
- **Solveur** (étapes de la méthode, algorithmes, prédicats d'étape) : [`docs/METHODE-DEBUTANT.md`](docs/METHODE-DEBUTANT.md).
- **Architecture** (pile, dossiers, sens des dépendances) : [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
- **Écrans et parcours** : [`docs/PRODUIT.md`](docs/PRODUIT.md).
- **Pourquoi** un choix a été fait : [`docs/adr/`](docs/adr/). Une décision qui en contredit une s'écrit en nouvel ADR.
