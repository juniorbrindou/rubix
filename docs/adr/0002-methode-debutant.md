# 0002 — Solveur par méthode débutant

Date : 2026-11-21 · Statut : accepté

## Contexte

Deux familles de solveurs : la méthode débutant (étage par étage, ~145 mouvements mesurés) et la méthode optimale
de Kociemba (~20 mouvements, aucune logique lisible pour un humain).

## Décision

Méthode débutant, en sept étapes (`docs/METHODE-DEBUTANT.md`).

## Raisons

- La saisie repose sur les étapes finies (« premier étage fait ») : ce sont les étapes de la méthode débutant.
  Le solveur reprend là où l'utilisateur en est, au lieu de défaire ce qu'il a construit.
- Chaque mouvement s'annonce avec son étape : l'utilisateur comprend ce qu'il fait et finit par apprendre.

## Conséquence

La chaîne d'état reste au format Kociemba : brancher plus tard un solveur optimal en option ne demandera pas de
changer le modèle.
