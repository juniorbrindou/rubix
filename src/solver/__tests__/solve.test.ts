import { SOLVED, applyMove, applyMoves, parseMoves, randomScramble, seededRandom } from '../../cube';
import { ALGORITHMS } from '../algorithms';
import { solve } from '../solve';
import { STAGES, stageDone } from '../stages';

describe('solveur', () => {
  test('1 000 mélanges : tous résolus, et chaque étape finie quand la suivante commence', () => {
    const random = seededRandom(2026);
    let total = 0;
    let worst = 0;
    for (let k = 0; k < 1000; k++) {
      const start = applyMoves(SOLVED, randomScramble(25, random));
      const steps = solve(start);
      let state = start;
      steps.forEach((step, i) => {
        state = applyMove(state, step.move);
        const next = steps[i + 1];
        if (!next || next.stage !== step.stage) expect(stageDone(state, step.stage)).toBe(true);
      });
      expect(state).toBe(SOLVED);
      // Les étapes se suivent dans l'ordre de la méthode.
      const order = steps.map((s) => STAGES.indexOf(s.stage));
      expect(order).toEqual([...order].sort((a, b) => a - b));
      total += steps.length;
      worst = Math.max(worst, steps.length);
    }
    console.log(`mouvements par solution : moyenne ${(total / 1000).toFixed(1)}, pire ${worst}`);
  });

  test('le cube résolu ne demande rien', () => {
    expect(solve(SOLVED)).toEqual([]);
  });

  test('les étapes déjà finies sont sautées', () => {
    // Sune sur un cube résolu : les deux premiers étages et la croix jaune restent faits.
    const steps = solve(applyMoves(SOLVED, ALGORITHMS.sune));
    expect(steps.length).toBeGreaterThan(0);
    expect(steps.every((s) => STAGES.indexOf(s.stage) >= STAGES.indexOf('yellowFace'))).toBe(true);
  });

  test('refuse un état impossible', () => {
    const s = [...SOLVED];
    [s[5], s[10]] = [s[10], s[5]];
    expect(() => solve(s.join(''))).toThrow('mal remonté');
  });

  test('temps de calcul', () => {
    const random = seededRandom(99);
    const starts = Array.from({ length: 200 }, () => applyMoves(SOLVED, randomScramble(25, random)));
    const times = starts.map((s) => {
      const t = performance.now();
      solve(s);
      return performance.now() - t;
    });
    times.sort((a, b) => a - b);
    const p = (q: number) => times[Math.floor(q * (times.length - 1))].toFixed(1);
    console.log(`temps par solution (Node) : médiane ${p(0.5)} ms, 95e centile ${p(0.95)} ms, pire ${p(1)} ms`);
  });

  test('exemple lisible', () => {
    const steps = solve(applyMoves(SOLVED, parseMoves("R U R' U'")));
    expect(applyMoves(applyMoves(SOLVED, parseMoves("R U R' U'")), steps.map((s) => s.move))).toBe(SOLVED);
  });
});
