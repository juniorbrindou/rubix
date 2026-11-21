import { EDGE_FACELETS, MOVES, MOVE_PERMUTATION, applyMoves, moveFace, type CubeState, type Face, type Move } from '../cube';

/** Où va chaque facette sous chaque mouvement : `DESTINATION[m][f]`. */
const DESTINATION: Record<Move, Int8Array> = Object.fromEntries(
  MOVES.map((m) => {
    const dest = new Int8Array(54);
    MOVE_PERMUTATION[m].forEach((from, to) => (dest[from] = to));
    return [m, dest];
  }),
) as Record<Move, Int8Array>;

/** L'autre facette de la même arête. */
const PARTNER = new Int8Array(54).fill(-1);
for (const [a, b] of EDGE_FACELETS) {
  PARTNER[a] = b;
  PARTNER[b] = a;
}
const EDGE_STICKERS = EDGE_FACELETS.flat();

/** Arêtes de la croix : leur seconde couleur, et la place de leur facette blanche (D) une fois posées. */
const CROSS_EDGES: readonly { side: Face; home: number }[] = [
  { side: 'F', home: 28 },
  { side: 'R', home: 32 },
  { side: 'B', home: 34 },
  { side: 'L', home: 30 },
];

/** Nombre minimal de mouvements pour amener la facette blanche d'une arête chez elle, depuis chaque facette d'arête. */
const DISTANCE: readonly Int8Array[] = CROSS_EDGES.map(({ home }) => {
  const dist = new Int8Array(54).fill(-1);
  dist[home] = 0;
  let frontier = [home];
  for (let d = 1; frontier.length; d++) {
    const next: number[] = [];
    for (const f of frontier)
      for (const m of MOVES) {
        // Distance inverse : depuis quelle facette arrive-t-on en f ? On parcourt le graphe à rebours.
        const from = MOVE_PERMUTATION[m][f];
        if (dist[from] < 0) {
          dist[from] = d;
          next.push(from);
        }
      }
    frontier = next;
  }
  return dist;
});

const OPPOSITE: Record<Face, Face> = { U: 'D', D: 'U', R: 'L', L: 'R', F: 'B', B: 'F' };
const FACE_ORDER = 'URFDLB';

function whiteStickerOf(state: CubeState, side: Face): number {
  const f = EDGE_STICKERS.find((x) => state[x] === 'D' && state[PARTNER[x]] === side);
  if (f === undefined) throw new Error(`Arête blanche-${side} introuvable`);
  return f;
}

/** Plus courte séquence qui pose toutes les arêtes `targets` (indices dans CROSS_EDGES), par IDA*. */
function placeEdges(state: CubeState, targets: readonly number[]): Move[] {
  const locations = targets.map((t) => whiteStickerOf(state, CROSS_EDGES[t].side));
  const heuristic = (locs: readonly number[]) => Math.max(...locs.map((l, i) => DISTANCE[targets[i]][l]));
  const path: Move[] = [];

  const search = (locs: readonly number[], depth: number, bound: number, last: Face | null): boolean => {
    const h = heuristic(locs);
    if (h === 0) return true;
    if (depth + h > bound) return false;
    for (const m of MOVES) {
      const face = moveFace(m);
      if (face === last) continue;
      // U puis D et D puis U donnent le même résultat : on n'explore qu'un ordre.
      if (last && OPPOSITE[last] === face && FACE_ORDER.indexOf(face) < FACE_ORDER.indexOf(last)) continue;
      path.push(m);
      if (search(locs.map((l) => DESTINATION[m][l]), depth + 1, bound, face)) return true;
      path.pop();
    }
    return false;
  };

  for (let bound = heuristic(locations); bound <= 20; bound++) {
    if (search(locations, 0, bound, null)) return path;
  }
  throw new Error('Croix blanche introuvable');
}

/**
 * Croix blanche, une arête à la fois : à chaque tour, l'arête qui se pose le plus vite sans déranger les
 * arêtes déjà posées. Renvoie les mouvements de chaque arête, dans l'ordre.
 */
export function solveCross(state: CubeState): Move[][] {
  const placed = CROSS_EDGES.map((e, i) => i).filter((i) => state[CROSS_EDGES[i].home] === 'D' && whiteStickerOf(state, CROSS_EDGES[i].side) === CROSS_EDGES[i].home);
  const remaining = CROSS_EDGES.map((e, i) => i).filter((i) => !placed.includes(i));
  const segments: Move[][] = [];
  let s = state;
  while (remaining.length) {
    let best: { edge: number; moves: Move[] } | null = null;
    for (const edge of remaining) {
      const moves = placeEdges(s, [...placed, edge]);
      if (!best || moves.length < best.moves.length) best = { edge, moves };
    }
    s = applyMoves(s, best!.moves);
    segments.push(best!.moves);
    placed.push(best!.edge);
    remaining.splice(remaining.indexOf(best!.edge), 1);
  }
  return segments;
}
