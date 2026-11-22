import type { ImageSourcePropType } from 'react-native';
import type { Move } from '../cube';
import { ALGORITHMS, type StageId } from '../solver';

/**
 * Fiches d'étape : ce que fait l'étape, comment tenir le cube, la formule, et à quoi on voit qu'elle est réussie.
 * Peu de mots, au vouvoiement. Les images (`assets/fiches`) se régénèrent avec `scripts/fiches/` : un cube où
 * seules les pièces utiles à l'étape sont en couleur, la case visée en rose.
 */
export interface StageGuide {
  /** Le but, en une phrase à l'infinitif. */
  goal: string;
  image: ImageSourcePropType;
  /** Comment tenir le cube : la première ligne est l'orientation, la seconde désigne ce qui est en rose. */
  hold: [string, string];
  formulas: { label?: string; moves: Move[]; gloss?: string[] }[];
  note?: string;
  done: string[];
  warning?: { title: string; text: string };
}

const HOLD = 'Jaune en haut, vert face à vous.';

export const STAGE_GUIDES: Record<StageId, StageGuide> = {
  cross: {
    goal: 'Former une croix blanche sur la face du bas.',
    image: require('../../assets/fiches/etape-1.png'),
    hold: [HOLD, 'Chaque arête blanche se place sous son centre de couleur.'],
    formulas: [],
    note: 'Pas de formule : l’app indique chaque coup.',
    done: ['Croix blanche sur la face du bas.', 'Chaque arête assortie au centre de son côté.'],
  },
  firstLayer: {
    goal: 'Placer les quatre coins blancs pour achever la face blanche.',
    image: require('../../assets/fiches/etape-2.png'),
    hold: [HOLD, 'Le coin blanc se place au-dessus de la case rose.'],
    formulas: [
      {
        moves: ALGORITHMS.sexy,
        gloss: [
          'Monter la colonne de droite.',
          'Tourner le haut vers la gauche.',
          'Redescendre la colonne de droite.',
          'Ramener le haut vers la droite.',
        ],
      },
    ],
    note: 'À répéter jusqu’à ce que le coin soit en place. Pour une case à l’arrière, l’app adapte la formule.',
    done: ['Face du bas entièrement blanche.', 'Rangée du bas unie sur chaque côté.'],
  },
  secondLayer: {
    goal: 'Placer les quatre arêtes de la rangée du milieu.',
    image: require('../../assets/fiches/etape-3.png'),
    hold: [HOLD, 'L’arête du haut descend dans la case rose.'],
    formulas: [
      { label: 'Vers la droite', moves: ALGORITHMS.rightInsert },
      { label: 'Vers la gauche', moves: ALGORITHMS.leftInsert },
    ],
    note: 'Une arête coincée au milieu ressort d’abord avec la même formule.',
    done: ['Deux rangées du bas unies sur chaque côté.'],
  },
  yellowCross: {
    goal: 'Former une croix jaune sur la face du haut.',
    image: require('../../assets/fiches/etape-4.png'),
    hold: [HOLD, 'Seules comptent les arêtes du haut, en rose.'],
    formulas: [{ moves: ALGORITHMS.yellowCross }],
    note: 'Une à trois fois, en tournant le haut entre deux.',
    done: ['Croix jaune sur la face du haut.'],
  },
  yellowFace: {
    goal: 'Rendre la face du haut entièrement jaune.',
    image: require('../../assets/fiches/etape-5.png'),
    hold: [HOLD, 'Seuls comptent les coins du haut, en rose.'],
    formulas: [{ moves: ALGORITHMS.sune }],
    note: 'À répéter, en tournant le haut entre deux, jusqu’à une face jaune.',
    done: ['Face du haut entièrement jaune.'],
  },
  yellowCorners: {
    goal: 'Mettre chaque coin du haut à sa place.',
    image: require('../../assets/fiches/etape-6.png'),
    hold: [HOLD, 'Chaque coin rose doit s’accorder à ses deux côtés.'],
    formulas: [{ moves: ALGORITHMS.cornerCycle }],
    note: 'Échange trois coins sans toucher au reste.',
    done: ['Chaque coin du haut assorti à ses deux côtés.'],
  },
  solved: {
    goal: 'Faire tourner les trois dernières arêtes jusqu’à leur place.',
    image: require('../../assets/fiches/etape-7.png'),
    hold: [HOLD, 'Les flèches indiquent les arêtes à déplacer.'],
    formulas: [{ moves: ALGORITHMS.edgeCycleA }],
    note: 'À retenir d’un bloc. Le cube se défait en cours de route, puis se reforme.',
    done: ['Cube résolu.'],
    warning: { title: 'Une arête reste mal placée ?', text: 'Répétez la formule une seconde fois.' },
  },
};
