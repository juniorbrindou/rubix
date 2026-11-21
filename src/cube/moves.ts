import { FACELET_COUNT, FACES, type CubeState, type Face } from './faces';
import { FACELET_GEOMETRY, faceletAt, rotate, type Axis } from './geometry';

export type MoveSuffix = '' | "'" | '2';
/** Mouvement d'une face en notation Singmaster : `R`, `R'`, `R2`. */
export type Move = `${Face}${MoveSuffix}`;

const SUFFIXES: readonly MoveSuffix[] = ['', "'", '2'];

/** Les 18 mouvements, face par face. */
export const MOVES: readonly Move[] = FACES.flatMap((f) => SUFFIXES.map((s) => `${f}${s}` as Move));

/** Axe de rotation, couche tournée, et nombre de quarts de tour antihoraires (autour de l'axe positif) d'un quart horaire. */
const FACE_TURN: Record<Face, { axis: Axis; layer: 1 | -1; ccwPerClockwise: 1 | 3 }> = {
  U: { axis: 1, layer: 1, ccwPerClockwise: 3 },
  D: { axis: 1, layer: -1, ccwPerClockwise: 1 },
  R: { axis: 0, layer: 1, ccwPerClockwise: 3 },
  L: { axis: 0, layer: -1, ccwPerClockwise: 1 },
  F: { axis: 2, layer: 1, ccwPerClockwise: 3 },
  B: { axis: 2, layer: -1, ccwPerClockwise: 1 },
};

const CLOCKWISE_QUARTERS: Record<MoveSuffix, number> = { '': 1, "'": 3, '2': 2 };

export function moveFace(move: Move): Face {
  return move[0] as Face;
}

export function isMove(token: string): token is Move {
  return (MOVES as readonly string[]).includes(token);
}

/**
 * Permutation d'un mouvement : `source[i]` est l'indice de la facette dont la couleur arrive en `i`.
 * Calculée par la géométrie plutôt que recopiée d'une table, pour qu'une erreur de saisie soit impossible.
 */
function buildPermutation(move: Move): Int8Array {
  const face = moveFace(move);
  const { axis, layer, ccwPerClockwise } = FACE_TURN[face];
  const quarters = ccwPerClockwise * CLOCKWISE_QUARTERS[move.slice(1) as MoveSuffix];
  const source = Int8Array.from({ length: FACELET_COUNT }, (_, i) => i);
  FACELET_GEOMETRY.forEach(({ position, normal }, from) => {
    if (position[axis] !== layer) return;
    const to = faceletAt(rotate(position, axis, quarters), rotate(normal, axis, quarters));
    source[to] = from;
  });
  return source;
}

export const MOVE_PERMUTATION: Readonly<Record<Move, Int8Array>> = Object.fromEntries(
  MOVES.map((m) => [m, buildPermutation(m)]),
) as Record<Move, Int8Array>;

/**
 * Rotation géométrique d'un mouvement, pour l'animer : axe (0 = x, 1 = y, 2 = z), couche tournée (+1 ou -1 sur
 * cet axe), angle en radians dans le sens trigonométrique autour de l'axe positif (le sens de three.js), entre -π/2 et π.
 */
export function moveTurn(move: Move): { axis: Axis; layer: 1 | -1; angle: number } {
  const { axis, layer, ccwPerClockwise } = FACE_TURN[moveFace(move)];
  const quarters = (ccwPerClockwise * CLOCKWISE_QUARTERS[move.slice(1) as MoveSuffix]) % 4;
  return { axis, layer, angle: (quarters === 3 ? -1 : quarters) * (Math.PI / 2) };
}

export function applyMove(state: CubeState, move: Move): CubeState {
  const source = MOVE_PERMUTATION[move];
  let out = '';
  for (let i = 0; i < FACELET_COUNT; i++) out += state[source[i]];
  return out;
}

export function applyMoves(state: CubeState, moves: readonly Move[]): CubeState {
  return moves.reduce(applyMove, state);
}

/** Lit une séquence séparée par des espaces (`"R U R' U'"`). Lève une erreur sur un symbole inconnu. */
export function parseMoves(sequence: string): Move[] {
  const tokens = sequence.trim().split(/\s+/).filter(Boolean);
  return tokens.map((t) => {
    if (!isMove(t)) throw new Error(`Mouvement inconnu : « ${t} »`);
    return t;
  });
}

export function formatMoves(moves: readonly Move[]): string {
  return moves.join(' ');
}

export function invertMove(move: Move): Move {
  const face = moveFace(move);
  const suffix = move.slice(1) as MoveSuffix;
  return `${face}${suffix === '' ? "'" : suffix === "'" ? '' : '2'}`;
}

/** Séquence qui défait `moves`. */
export function invertMoves(moves: readonly Move[]): Move[] {
  return [...moves].reverse().map(invertMove);
}
