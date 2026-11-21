import { SOLVED, applyMoves, parseMoves, randomScramble, seededRandom, type Face } from '../../cube';
import { stageDone } from '../../solver';
import { PRESET_STAGES, changeLevel, colorCounts, emptyInput, inputStatus, lockingStage, paint, presetFacelets } from '../input';

describe('saisie', () => {
  test('un cube vierge ne connaît que ses centres', () => {
    const s = emptyInput();
    expect(colorCounts(s)['?']).toBe(48);
    expect(inputStatus(s)).toEqual({ kind: 'incomplete', remaining: 48 });
  });

  test('cocher une étape remplit ses cases et celles des précédentes ; décocher les vide', () => {
    const up = changeLevel(emptyInput(), 0, 2); // croix blanche + premier étage
    expect(up.filled).toHaveLength(8 + 12);
    expect(stageDone(up.state, 'firstLayer')).toBe(true);
    const down = changeLevel(up.state, 2, 1);
    expect(stageDone(down.state, 'cross')).toBe(true);
    expect(colorCounts(down.state)['?']).toBe(48 - 8);
  });

  test('tous les préréglages cochés : il ne reste que les quatre flancs des arêtes jaunes', () => {
    const { state } = changeLevel(emptyInput(), 0, PRESET_STAGES.length);
    expect(inputStatus(state)).toEqual({ kind: 'incomplete', remaining: 4 });
  });

  test('une case fixée ne se colorie pas ; une case libre se colorie puis se gomme', () => {
    const { state } = changeLevel(emptyInput(), 0, 1);
    expect(lockingStage(28, 1)).toBe('cross');
    expect(lockingStage(4, 0)).toBe('center');
    expect(paint(state, 28, 'U', 1)).toBe(state);
    const painted = paint(state, 0, 'R', 1);
    expect(painted[0]).toBe('R');
    expect(paint(painted, 0, 'R', 1)[0]).toBe('?');
  });

  test('un cube réel recopié case par case est accepté', () => {
    const real = applyMoves(SOLVED, randomScramble(25, seededRandom(5)));
    let s = emptyInput();
    for (let i = 0; i < 54; i++) if (s[i] === '?') s = paint(s, i, real[i] as Face, 0);
    expect(s).toBe(real);
    expect(inputStatus(s)).toEqual({ kind: 'valid' });
  });

  test('les préréglages correspondent à un vrai cube où ces étapes sont finies', () => {
    // Sune sur cube résolu : deux étages et croix jaune faits.
    const real = applyMoves(SOLVED, parseMoves("R U R' U R U2 R'"));
    let { state } = changeLevel(emptyInput(), 0, 4);
    for (const f of presetFacelets(4)) expect(state[f]).toBe(real[f]);
    for (let i = 0; i < 54; i++) if (state[i] === '?') state = paint(state, i, real[i] as Face, 4);
    expect(inputStatus(state)).toEqual({ kind: 'valid' });
  });

  test('une couleur en trop se signale avant la fin, sur une case qu’on peut corriger', () => {
    let s = emptyInput();
    for (const f of [0, 1, 2, 3, 5, 6, 7, 8, 9]) s = paint(s, f, 'U', 0);
    expect(inputStatus(s)).toMatchObject({ kind: 'tooMany', face: 'U', count: 10, facelet: 0 });
  });

  test('une erreur de recopie est désignée', () => {
    const real = applyMoves(SOLVED, randomScramble(25, seededRandom(6)));
    // On échange deux cases d'un même coin : impossible sur un vrai cube.
    const s = [...real];
    [s[9], s[20]] = [s[20], s[9]];
    const status = inputStatus(s.join(''));
    expect(status.kind).toBe('invalid');
    expect(status.kind === 'invalid' && status.validation.facelet).toBe(8);
  });
});
