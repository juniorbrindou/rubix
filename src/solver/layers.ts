import {
  CORNERS,
  CORNER_FACELETS,
  EDGES,
  EDGE_FACELETS,
  applyMoves,
  type CubeState,
  type Face,
  type Move,
} from '../cube';
import { ALGORITHMS, SIDE_FACES, inFrame, rightOf, turnsU, type AlgorithmName } from './algorithms';
import { inPlace, stageDone, type StageId } from './stages';

/** Un morceau de solution : ses mouvements et ce qu'ils font. */
export interface Segment {
  moves: Move[];
  label: AlgorithmName | 'adjust';
}

function sameColors(state: CubeState, facelets: readonly number[], colors: readonly Face[]): boolean {
  const seen = facelets.map((f) => state[f]).sort().join('');
  return seen === [...colors].sort().join('');
}

function locate(state: CubeState, pieces: readonly (readonly number[])[], colors: readonly Face[]): number {
  const i = pieces.findIndex((facelets) => sameColors(state, facelets, colors));
  if (i < 0) throw new Error(`Pièce ${colors.join('')} introuvable`);
  return i;
}

/** Parmi des candidats, le plus court qui atteint `goal`. */
function shortest(state: CubeState, candidates: Segment[][], goal: (s: CubeState) => boolean): Segment[] {
  const moves = (c: Segment[]) => c.reduce((n, seg) => n + seg.moves.length, 0);
  const ok = candidates.filter((c) => goal(applyMoves(state, c.flatMap((seg) => seg.moves))));
  if (!ok.length) throw new Error('Aucun candidat ne pose la pièce');
  return ok.reduce((a, b) => (moves(b) < moves(a) ? b : a));
}

const adjust = (q: number): Segment => ({ moves: turnsU(q), label: 'adjust' });
const alg = (name: AlgorithmName, front: Face): Segment => ({ moves: inFrame(ALGORITHMS[name], front), label: name });

function run(state: CubeState, segments: Segment[]): CubeState {
  return applyMoves(state, segments.flatMap((s) => s.moves));
}

/**
 * Premier étage : chaque coin blanc, case par case. Un coin coincé en bas au mauvais endroit en sort par
 * l'algorithme de sa case ; puis on l'amène au-dessus de sa case et on répète l'algorithme jusqu'à ce qu'il tienne.
 */
export function solveFirstLayer(start: CubeState): Segment[] {
  let state = start;
  const out: Segment[] = [];
  for (const front of SIDE_FACES) {
    const target = CORNERS.indexOf(`D${front}${rightOf(front)}` as (typeof CORNERS)[number]);
    const slot = CORNER_FACELETS[target];
    if (inPlace(state, slot)) continue;

    const at = locate(state, CORNER_FACELETS, ['D', front, rightOf(front)]);
    if (CORNERS[at][0] === 'D') {
      const extract = [alg('sexy', CORNERS[at][1] as Face)];
      state = run(state, extract);
      out.push(...extract);
    }

    const candidates = [0, 1, 2, 3].flatMap((q) =>
      [1, 3, 5].map((reps) => [adjust(q), ...Array.from({ length: reps }, () => alg('sexy', front))]),
    );
    const done = (s: CubeState) => inPlace(s, slot) && stageDone(s, 'cross');
    const best = shortest(state, candidates, done);
    state = run(state, best);
    out.push(...best);
  }
  return out;
}

/** Case du deuxième étage entre `front` et la face à sa droite. */
function middleSlot(front: Face): number {
  const name = [front, rightOf(front)].sort().join('');
  return EDGES.findIndex((e) => e.split('').sort().join('') === name);
}

/**
 * Deuxième étage : chaque arête, case par case. Une arête coincée au milieu au mauvais endroit (ou retournée)
 * en sort par l'algorithme de sa case ; puis on l'insère par la droite ou par la gauche, selon ce qui est le plus court.
 */
export function solveSecondLayer(start: CubeState): Segment[] {
  let state = start;
  const out: Segment[] = [];
  for (const front of SIDE_FACES) {
    const target = middleSlot(front);
    const slot = EDGE_FACELETS[target];
    if (inPlace(state, slot)) continue;

    const at = locate(state, EDGE_FACELETS, [front, rightOf(front)]);
    const stuckIn = SIDE_FACES.find((f) => middleSlot(f) === at);
    if (stuckIn) {
      const extract = [alg('rightInsert', stuckIn)];
      state = run(state, extract);
      out.push(...extract);
    }

    const candidates = [0, 1, 2, 3].flatMap((q) => [
      [adjust(q), alg('rightInsert', front)],
      [adjust(q), alg('leftInsert', rightOf(front))],
    ]);
    const done = (s: CubeState) => inPlace(s, slot) && stageDone(s, 'firstLayer');
    const best = shortest(state, candidates, done);
    state = run(state, best);
    out.push(...best);
  }
  return out;
}

/**
 * Étapes de la dernière couche : recherche en largeur sur les macro-coups {U, U', U2, algorithmes de l'étape},
 * jusqu'à ce que l'étape soit finie.
 */
export function solveByMacros(start: CubeState, stage: StageId, algorithms: readonly AlgorithmName[]): Segment[] {
  if (stageDone(start, stage)) return [];
  const macros: Segment[] = [adjust(1), adjust(2), adjust(3), ...algorithms.map((a) => alg(a, 'F'))];
  const seen = new Set([start]);
  let frontier: { state: CubeState; path: Segment[] }[] = [{ state: start, path: [] }];
  for (let depth = 0; depth < 10 && frontier.length; depth++) {
    const next: typeof frontier = [];
    for (const { state, path } of frontier)
      for (const macro of macros) {
        const last = path[path.length - 1];
        if (macro.label === 'adjust' && last?.label === 'adjust') continue;
        const s = run(state, [macro]);
        if (seen.has(s)) continue;
        seen.add(s);
        if (stageDone(s, stage)) return [...path, macro];
        next.push({ state: s, path: [...path, macro] });
      }
    frontier = next;
  }
  throw new Error(`Étape ${stage} introuvable`);
}
