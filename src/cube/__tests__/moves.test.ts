import {
  FACES,
  MOVES,
  MOVE_PERMUTATION,
  SOLVED,
  applyMove,
  applyMoves,
  invertMoves,
  parseMoves,
  randomScramble,
  seededRandom,
  type Move,
} from '..';

const repeat = (moves: Move[], n: number) => Array.from({ length: n }, () => moves).flat();

describe('mouvements : états de référence', () => {
  // Calculés à la main depuis le patron de docs/MODELE-CUBE.md, indépendamment de la géométrie.
  test('R depuis le cube résolu', () => {
    expect(applyMove(SOLVED, 'R')).toBe('UUFUUFUUFRRRRRRRRRFFDFFDFFDDDBDDBDDBLLLLLLLLLUBBUBBUBB');
  });
  test('U depuis le cube résolu', () => {
    expect(applyMove(SOLVED, 'U')).toBe('UUUUUUUUUBBBRRRRRRRRRFFFFFFDDDDDDDDDFFFLLLLLLLLLBBBBBB');
  });
  test('F depuis le cube résolu', () => {
    expect(applyMove(SOLVED, 'F')).toBe('UUUUUULLLURRURRURRFFFFFFFFFRRRDDDDDDLLDLLDLLDBBBBBBBBB');
  });
});

describe('mouvements : invariants', () => {
  test('chaque permutation est une bijection qui garde les centres', () => {
    for (const m of MOVES) {
      expect([...MOVE_PERMUTATION[m]].sort((a, b) => a - b)).toEqual([...Array(54).keys()]);
      for (let f = 0; f < 6; f++) expect(MOVE_PERMUTATION[m][f * 9 + 4]).toBe(f * 9 + 4);
    }
  });

  test.each(FACES)('%s quatre fois rend l’état de départ', (face) => {
    const start = applyMoves(SOLVED, parseMoves("R U2 F' D L B'"));
    expect(applyMoves(start, repeat([face as Move], 4))).toBe(start);
  });

  test('X2 = X X et X\' = X X X', () => {
    for (const face of FACES) {
      expect(applyMove(SOLVED, `${face}2`)).toBe(applyMoves(SOLVED, [face, face]));
      expect(applyMove(SOLVED, `${face}'`)).toBe(applyMoves(SOLVED, [face, face, face]));
    }
  });

  test("(R U R' U') six fois rend l'état de départ, mais pas moins", () => {
    const sexy = parseMoves("R U R' U'");
    expect(applyMoves(SOLVED, repeat(sexy, 6))).toBe(SOLVED);
    for (let n = 1; n < 6; n++) expect(applyMoves(SOLVED, repeat(sexy, n))).not.toBe(SOLVED);
  });

  test("Sune (R U R' U R U2 R') six fois rend l'état de départ", () => {
    expect(applyMoves(SOLVED, repeat(parseMoves("R U R' U R U2 R'"), 6))).toBe(SOLVED);
  });

  test('une séquence suivie de son inverse rend l’état de départ', () => {
    const random = seededRandom(1);
    for (let k = 0; k < 200; k++) {
      const moves = randomScramble(25, random);
      expect(applyMoves(applyMoves(SOLVED, moves), invertMoves(moves))).toBe(SOLVED);
    }
  });
});

describe('notation', () => {
  test('lit et inverse une séquence', () => {
    expect(parseMoves("  R U2  F' ")).toEqual(['R', 'U2', "F'"]);
    expect(invertMoves(parseMoves("R U2 F'"))).toEqual(['F', 'U2', "R'"]);
  });
  test('refuse un symbole inconnu', () => {
    expect(() => parseMoves('R M')).toThrow('« M »');
    expect(() => parseMoves('x')).toThrow();
  });
});
