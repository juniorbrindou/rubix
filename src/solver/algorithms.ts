import { parseMoves, type Face, type Move } from '../cube';

/** Algorithmes de la méthode, écrits pour la face F devant (docs/METHODE-DEBUTANT.md). */
export const ALGORITHMS = {
  /** Coin du premier étage : répété jusqu'à ce que le coin soit posé en DFR. */
  sexy: parseMoves("R U R' U'"),
  /** Arête du deuxième étage, de UF vers FR. */
  rightInsert: parseMoves("U R U' R' U' F' U F"),
  /** Arête du deuxième étage, de UF vers FL. */
  leftInsert: parseMoves("U' L' U L U F U' F'"),
  yellowCross: parseMoves("F R U R' U' F'"),
  sune: parseMoves("R U R' U R U2 R'"),
  /** Permute trois coins de U (« phares » derrière), sans toucher au reste. */
  cornerCycle: parseMoves("R' F R' B2 R F' R' B2 R2"),
  /** Permutent trois arêtes de U, dans un sens puis dans l'autre. */
  edgeCycleA: parseMoves("R U' R U R U R U' R' U' R2"),
  edgeCycleB: parseMoves("R2 U R U R' U' R' U' R' U R'"),
} satisfies Record<string, Move[]>;

export type AlgorithmName = keyof typeof ALGORITHMS;

export const ALGORITHM_LABEL: Record<AlgorithmName, string> = {
  sexy: 'Coin du premier étage',
  rightInsert: 'Arête vers la droite',
  leftInsert: 'Arête vers la gauche',
  yellowCross: 'Croix jaune',
  sune: 'Sune',
  cornerCycle: 'Échange de coins jaunes',
  edgeCycleA: 'Échange d’arêtes jaunes',
  edgeCycleB: 'Échange d’arêtes jaunes',
};

/** Faces latérales dans l'ordre où elles passent devant quand on tourne le cube vers la gauche. */
export const SIDE_FACES: readonly Face[] = ['F', 'R', 'B', 'L'];

export function rightOf(front: Face): Face {
  return SIDE_FACES[(SIDE_FACES.indexOf(front) + 1) % 4];
}

/**
 * Réécrit une séquence prévue pour F devant comme si `front` était devant, sans tourner le cube :
 * le solveur n'émet que des mouvements de faces, dans l'orientation de référence.
 */
export function inFrame(moves: readonly Move[], front: Face): Move[] {
  const i = SIDE_FACES.indexOf(front);
  const map = (f: Face): Face => {
    const k = SIDE_FACES.indexOf(f);
    return k < 0 ? f : SIDE_FACES[(k + i) % 4];
  };
  return moves.map((m) => `${map(m[0] as Face)}${m.slice(1)}` as Move);
}

/** Tours de U : 0, 1, 2 ou 3 quarts horaires. */
export function turnsU(quarters: number): Move[] {
  return [[], ['U'], ['U2'], ["U'"]][((quarters % 4) + 4) % 4] as Move[];
}
