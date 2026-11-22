import { FACE_COLOR_NAME, FACE_COLOR_PLURAL, FACELET_COUNT, FACES, UNKNOWN, centerIndex, isFace, type CubeState, type Face } from './faces';
import { CORNER_COLORS, CORNER_FACELETS, EDGE_COLORS, EDGE_FACELETS } from './pieces';

export type ValidationError =
  | 'length'
  | 'character'
  | 'unknown'
  | 'center'
  | 'count'
  | 'corner'
  | 'duplicateCorner'
  | 'edge'
  | 'duplicateEdge'
  | 'cornerTwist'
  | 'edgeFlip'
  | 'parity';

export type Validation =
  | { ok: true }
  | {
      ok: false;
      error: ValidationError;
      /** Première facette fautive, ou `null` quand la faute tient au cube entier (torsion, retournement, parité). */
      facelet: number | null;
      /** Explication affichable, au vouvoiement. */
      message: string;
    };

/** Pièces d'un état valide, au format de Kociemba : permutation et orientation des coins et des arêtes. */
export interface Pieces {
  cornerPermutation: number[];
  cornerOrientation: number[];
  edgePermutation: number[];
  edgeOrientation: number[];
}

const REASSEMBLED = 'Ce cube a été démonté puis mal remonté : aucune suite de mouvements ne peut le résoudre.';

function fail(error: ValidationError, facelet: number | null, message: string): Validation {
  return { ok: false, error, facelet, message };
}

function parity(permutation: readonly number[]): number {
  let inversions = 0;
  for (let i = 0; i < permutation.length; i++)
    for (let j = i + 1; j < permutation.length; j++) if (permutation[i] > permutation[j]) inversions++;
  return inversions % 2;
}

/**
 * Vérifie qu'un vrai cube peut être dans cet état. Les règles s'appliquent dans l'ordre de docs/MODELE-CUBE.md ;
 * la première qui échoue donne l'erreur.
 */
export function validate(state: CubeState): Validation {
  return analyze(state).validation;
}

/** Décompose un état valide en pièces ; lève une erreur si l'état n'est pas valide. */
export function toPieces(state: CubeState): Pieces {
  const { validation, pieces } = analyze(state);
  if (!validation.ok) throw new Error(validation.message);
  return pieces!;
}

function analyze(state: CubeState): { validation: Validation; pieces?: Pieces } {
  const result = (validation: Validation) => ({ validation });

  if (state.length !== FACELET_COUNT)
    return result(fail('length', null, `L'état doit compter 54 facettes, il en a ${state.length}.`));
  for (let i = 0; i < FACELET_COUNT; i++) {
    if (state[i] === UNKNOWN) return result(fail('unknown', i, 'Il reste des cases à colorier.'));
    if (!isFace(state[i])) return result(fail('character', i, `Caractère inattendu « ${state[i]} ».`));
  }

  for (const face of FACES) {
    const i = centerIndex(face);
    if (state[i] !== face)
      return result(fail('center', i, `Le centre de cette face doit être ${FACE_COLOR_NAME[face]} : les centres ne bougent jamais.`));
  }

  const counts = new Map<Face, number>(FACES.map((f) => [f, 0]));
  for (const c of state) counts.set(c as Face, counts.get(c as Face)! + 1);
  for (const face of FACES) {
    const n = counts.get(face)!;
    if (n > 9) {
      const i = [...state].findIndex((c, k) => c === face && k !== centerIndex(face));
      return result(fail('count', i, `Il y a ${n} cases ${FACE_COLOR_PLURAL[face]}, il en faut 9.`));
    }
  }

  const cornerPermutation: number[] = [];
  const cornerOrientation: number[] = [];
  const seenCorners = new Set<number>();
  for (let i = 0; i < CORNER_FACELETS.length; i++) {
    const facelets = CORNER_FACELETS[i];
    const ori = facelets.findIndex((f) => state[f] === 'U' || state[f] === 'D');
    const piece =
      ori < 0
        ? -1
        : CORNER_COLORS.findIndex(
            (colors) =>
              colors[0] === state[facelets[ori]] &&
              colors[1] === state[facelets[(ori + 1) % 3]] &&
              colors[2] === state[facelets[(ori + 2) % 3]],
          );
    if (piece < 0) return result(fail('corner', facelets[0], 'Ce coin porte des couleurs qui ne vont pas ensemble.'));
    if (seenCorners.has(piece)) return result(fail('duplicateCorner', facelets[0], 'Ce coin existe déjà ailleurs sur le cube.'));
    seenCorners.add(piece);
    cornerPermutation.push(piece);
    cornerOrientation.push(ori);
  }

  const edgePermutation: number[] = [];
  const edgeOrientation: number[] = [];
  const seenEdges = new Set<number>();
  for (let i = 0; i < EDGE_FACELETS.length; i++) {
    const [a, b] = EDGE_FACELETS[i];
    let flip = 0;
    let piece = EDGE_COLORS.findIndex(([x, y]) => x === state[a] && y === state[b]);
    if (piece < 0) {
      piece = EDGE_COLORS.findIndex(([x, y]) => x === state[b] && y === state[a]);
      flip = 1;
    }
    if (piece < 0) return result(fail('edge', a, 'Cette arête porte des couleurs qui ne vont pas ensemble.'));
    if (seenEdges.has(piece)) return result(fail('duplicateEdge', a, 'Cette arête existe déjà ailleurs sur le cube.'));
    seenEdges.add(piece);
    edgePermutation.push(piece);
    edgeOrientation.push(flip);
  }

  if (cornerOrientation.reduce((s, o) => s + o, 0) % 3 !== 0) return result(fail('cornerTwist', null, REASSEMBLED));
  if (edgeOrientation.reduce((s, o) => s + o, 0) % 2 !== 0) return result(fail('edgeFlip', null, REASSEMBLED));
  if (parity(cornerPermutation) !== parity(edgePermutation)) return result(fail('parity', null, REASSEMBLED));

  return {
    validation: { ok: true },
    pieces: { cornerPermutation, cornerOrientation, edgePermutation, edgeOrientation },
  };
}
