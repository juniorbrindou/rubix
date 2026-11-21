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
- **Livrer** : après un changement vert, commit puis push sur `master`. Les builds mobiles passent par EAS
  (le serveur n'a pas de SDK Android) ; l'essai sur téléphone passe par Expo Go (`npx expo start --tunnel`).

Les commandes (tests, lint, lancement) sont celles des scripts de `package.json`.

## Où lire

- **Modèle** (indexation des facettes, notation des mouvements, règles de validité) :
  [`docs/MODELE-CUBE.md`](docs/MODELE-CUBE.md).
- **Solveur** (étapes de la méthode, algorithmes, prédicats d'étape) : [`docs/METHODE-DEBUTANT.md`](docs/METHODE-DEBUTANT.md).
- **Architecture** (pile, dossiers, sens des dépendances) : [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
- **Écrans et parcours** : [`docs/PRODUIT.md`](docs/PRODUIT.md).
- **Pourquoi** un choix a été fait : [`docs/adr/`](docs/adr/). Une décision qui en contredit une s'écrit en nouvel ADR.
