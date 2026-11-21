import { MOVES, moveFace, type Move } from './moves';

/** Générateur pseudo-aléatoire déterministe (mulberry32) : un même `seed` redonne le même mélange. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Mélange de `length` mouvements, sans deux mouvements consécutifs sur la même face. */
export function randomScramble(length: number, random: () => number = Math.random): Move[] {
  const moves: Move[] = [];
  while (moves.length < length) {
    const m = MOVES[Math.floor(random() * MOVES.length)];
    if (moves.length && moveFace(moves[moves.length - 1]) === moveFace(m)) continue;
    moves.push(m);
  }
  return moves;
}
