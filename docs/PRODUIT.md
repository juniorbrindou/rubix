# Produit

## Objectif

Un joueur bloqué sur son Rubik's Cube décrit l'état de son cube à l'application, qui lui dit exactement quoi
faire, mouvement par mouvement, animé en 3D, jusqu'au cube résolu.

## Parcours

1. **Prise en main** : l'écran montre comment tenir le cube (jaune en haut, vert face à soi).
2. **Étapes finies** : l'utilisateur coche ce qu'il a déjà fait — croix blanche, premier étage, deuxième étage,
   croix jaune, face jaune, coins jaunes. Cocher une étape coche les précédentes ; les facettes concernées se
   colorent d'elles-mêmes, en animation.
3. **Cases restantes** : il fait tourner le cube du doigt, touche une facette grise et choisit sa couleur dans la
   palette. Un compteur indique les facettes restant à saisir.
4. **Vérification** : quand tout est saisi, l'application valide l'état. En cas d'erreur, elle désigne la
   facette fautive et dit pourquoi (« il y a 10 cases rouges »).
5. **Solution** : barre en haut avec la suite des mouvements (`R U R' …`), le pas en cours mis en évidence,
   le nom de l'étape au-dessus. Boutons **Précédent**, **Lecture**, **Suivant** ; chaque mouvement est animé.

## Écrans

- `src/app/index.tsx` : saisie (étapes 1 à 4 du parcours).
- `src/app/solution.tsx` : lecture de la solution (étape 5).

## Repères visuels

La maquette d'origine : un cube 3D aux couleurs franches, contours noirs épais, barre de mouvements en haut,
trois boutons en bas, texte d'état sous le cube (« Appuie sur Lecture ou Suivant »). Le texte tutoie l'utilisateur.
