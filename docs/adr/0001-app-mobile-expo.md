# 0001 — Application mobile avec Expo (React Native)

Date : 2026-11-21 · Statut : accepté

## Contexte

L'utilisateur veut une application mobile. Il faut de la 3D fluide sur téléphone, et le serveur de développement
n'a ni SDK Android ni Xcode.

## Décision

Expo + React Native en TypeScript, 3D par three.js via `@react-three/fiber/native`.

## Raisons

- Une seule base de code pour Android et iOS.
- three.js est la bibliothèque 3D la plus documentée ; `@react-three/fiber` l'utilise telle quelle sur mobile.
- Les builds EAS tournent dans le nuage : rien à installer sur le serveur. Expo Go permet d'essayer sur un vrai
  téléphone en scannant un QR code.
- Le cœur (modèle, solveur) reste du TypeScript pur, réutilisable si un jour une version web s'ajoute.

## Écartés

- **Flutter** : 3D moins mûre, autre langage que le reste des projets.
- **Application web (PWA)** : plus simple, mais l'utilisateur veut une vraie application installée.
