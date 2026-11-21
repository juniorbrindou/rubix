import { SOLVED, applyMoves, parseMoves } from '../../cube';
import { ALGORITHMS, inFrame } from '../algorithms';
import { STAGE_FACELETS, stageDone } from '../stages';
import { inPlace } from '../stages';

// Chaque algorithme, appliqué au cube résolu, doit garder ce que son étape suppose déjà fait, et changer quelque chose.
describe('ce que chaque algorithme préserve', () => {
  test.each(['F', 'R', 'B', 'L'] as const)('coin du premier étage (repère %s) : garde la croix et les trois autres coins', (front) => {
    const s = applyMoves(SOLVED, inFrame(ALGORITHMS.sexy, front));
    expect(stageDone(s, 'cross')).toBe(true);
    expect(stageDone(s, 'firstLayer')).toBe(false);
    // Exactement un coin du bas dérangé : celui de la case visée.
    const corners = [
      [29, 26, 15],
      [27, 44, 24],
      [33, 53, 42],
      [35, 17, 51],
    ];
    expect(corners.filter((c) => !inPlace(s, c))).toHaveLength(1);
  });

  test.each(['rightInsert', 'leftInsert'] as const)('%s garde le premier étage', (name) => {
    for (const front of ['F', 'R', 'B', 'L'] as const) {
      const s = applyMoves(SOLVED, inFrame(ALGORITHMS[name], front));
      expect(stageDone(s, 'firstLayer')).toBe(true);
      expect(stageDone(s, 'secondLayer')).toBe(false);
    }
  });

  test.each(['yellowCross', 'sune'] as const)('%s garde les deux premiers étages', (name) => {
    const s = applyMoves(SOLVED, ALGORITHMS[name]);
    expect(stageDone(s, 'secondLayer')).toBe(true);
    expect(s).not.toBe(SOLVED);
  });

  test('yellowCross garde la croix jaune quand elle est faite (elle retourne seulement les arêtes)', () => {
    const s = applyMoves(SOLVED, ALGORITHMS.yellowCross);
    expect(stageDone(s, 'yellowCross')).toBe(false);
  });

  test('sune garde la croix jaune', () => {
    expect(stageDone(applyMoves(SOLVED, ALGORITHMS.sune), 'yellowCross')).toBe(true);
  });

  test('cornerCycle garde la face jaune et déplace des coins', () => {
    const s = applyMoves(SOLVED, ALGORITHMS.cornerCycle);
    expect(stageDone(s, 'yellowFace')).toBe(true);
    expect(stageDone(s, 'yellowCorners')).toBe(false);
  });

  test.each(['edgeCycleA', 'edgeCycleB'] as const)('%s garde les coins jaunes et déplace des arêtes', (name) => {
    const s = applyMoves(SOLVED, ALGORITHMS[name]);
    expect(stageDone(s, 'yellowCorners')).toBe(true);
    expect(inPlace(s, STAGE_FACELETS.solved)).toBe(false);
  });

  test('les deux échanges d’arêtes sont inverses l’un de l’autre', () => {
    expect(applyMoves(applyMoves(SOLVED, ALGORITHMS.edgeCycleA), ALGORITHMS.edgeCycleB)).toBe(SOLVED);
  });

  test('inFrame tourne les faces latérales sans toucher U et D', () => {
    expect(inFrame(parseMoves("R U F' D2 L B"), 'R')).toEqual(parseMoves("B U R' D2 F L"));
  });
});
