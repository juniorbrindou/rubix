# 0001 — Application mobile avec Expo (React Native)

Date : 2026-11-21 · Statut : accepté

## Contexte

L'utilisateur veut une application mobile. Il faut de la 3D fluide sur téléphone. Le serveur de développement
a un SDK Android (builds APK locaux) mais pas Xcode.

## Décision

Expo + React Native en TypeScript, 3D par three.js via `@react-three/fiber/native`.

## Raisons

- Une seule base de code pour Android et iOS.
- three.js est la bibliothèque 3D la plus documentée ; `@react-three/fiber` l'utilise telle quelle sur mobile.
- L'APK Android se construit sur le serveur ; iOS passera par les builds EAS dans le nuage.
- Le cœur (modèle, solveur) reste du TypeScript pur, réutilisable si un jour une version web s'ajoute.

## Écartés

- **Flutter** : 3D moins mûre, autre langage que le reste des projets.
- **Application web (PWA)** : plus simple, mais l'utilisateur veut une vraie application installée.
