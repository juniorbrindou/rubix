import { SOLVED, applyMoves, randomScramble, seededRandom, toPieces, validate, type CubeState } from '..';

function swap(state: CubeState, ...pairs: [number, number][]): CubeState {
  const s = [...state];
  for (const [a, b] of pairs) [s[a], s[b]] = [s[b], s[a]];
  return s.join('');
}

function set(state: CubeState, index: number, c: string): CubeState {
  return state.slice(0, index) + c + state.slice(index + 1);
}

const scrambled = applyMoves(SOLVED, randomScramble(30, seededRandom(42)));

describe('états valides', () => {
  test('le cube résolu', () => {
    expect(validate(SOLVED)).toEqual({ ok: true });
    expect(toPieces(SOLVED)).toEqual({
      cornerPermutation: [0, 1, 2, 3, 4, 5, 6, 7],
      cornerOrientation: [0, 0, 0, 0, 0, 0, 0, 0],
      edgePermutation: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      edgeOrientation: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    });
  });

  test('tout état obtenu par mouvements', () => {
    const random = seededRandom(7);
    for (let k = 0; k < 500; k++) {
      expect(validate(applyMoves(SOLVED, randomScramble(25, random)))).toEqual({ ok: true });
    }
  });
});

describe('états invalides : la bonne règle et la bonne facette', () => {
  test('longueur', () => {
    expect(validate(SOLVED.slice(1))).toMatchObject({ ok: false, error: 'length', facelet: null });
  });

  test('facette inconnue', () => {
    expect(validate(set(SOLVED, 30, '?'))).toMatchObject({ ok: false, error: 'unknown', facelet: 30 });
  });

  test('caractère inattendu', () => {
    expect(validate(set(SOLVED, 12, 'x'))).toMatchObject({ ok: false, error: 'character', facelet: 12 });
  });

  test('centre déplacé', () => {
    expect(validate(swap(SOLVED, [4, 13]))).toMatchObject({ ok: false, error: 'center', facelet: 4 });
  });

  test('dix cases d’une couleur', () => {
    const v = validate(set(SOLVED, 0, 'R'));
    expect(v).toMatchObject({ ok: false, error: 'count', facelet: 0 });
    expect(!v.ok && v.message).toBe('Il y a 10 cases orange, il en faut 9.');
  });

  test("deux facettes d'un même coin échangées (coin miroir)", () => {
    // Coin URF : facettes 8 (U), 9 (R), 20 (F) ; on échange R et F.
    expect(validate(swap(scrambled, [9, 20]))).toMatchObject({ ok: false, error: 'corner' });
    expect(validate(swap(SOLVED, [9, 20]))).toMatchObject({ ok: false, error: 'corner', facelet: 8 });
  });

  test('un coin tourné sur lui-même', () => {
    const s = [...SOLVED];
    [s[8], s[9], s[20]] = [s[9], s[20], s[8]];
    expect(validate(s.join(''))).toMatchObject({ ok: false, error: 'cornerTwist', facelet: null });
  });

  test('une arête retournée', () => {
    expect(validate(swap(SOLVED, [5, 10]))).toMatchObject({ ok: false, error: 'edgeFlip', facelet: null });
  });

  test('deux arêtes échangées (parité)', () => {
    // UR (5, 10) ↔ UF (7, 19)
    expect(validate(swap(SOLVED, [5, 7], [10, 19]))).toMatchObject({ ok: false, error: 'parity', facelet: null });
  });

  test('toPieces refuse un état invalide', () => {
    expect(() => toPieces(swap(SOLVED, [5, 10]))).toThrow('mal remonté');
  });
});
