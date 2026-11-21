import { MOVES, SOLVED, applyMove, applyMoves, faceletAt, moveTurn, randomScramble, seededRandom, type Vec3 } from '../../cube';
import { cubiesOf } from '../cubies';

/** Rotation d'angle quelconque autour d'un axe, comme le fait three.js, arrondie à l'entier. */
function rotateByAngle(v: Vec3, axis: number, angle: number): Vec3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const [x, y, z] = v;
  const r: [number, number, number] =
    axis === 0 ? [x, c * y - s * z, s * y + c * z] : axis === 1 ? [c * x + s * z, y, -s * x + c * z] : [c * x - s * y, s * x + c * y, z];
  return r.map((n) => Math.round(n) + 0) as unknown as Vec3;
}

describe('scène', () => {
  test('26 pièces, 54 facettes', () => {
    const cubies = cubiesOf(SOLVED);
    expect(cubies).toHaveLength(26);
    expect(cubies.flatMap((c) => c.stickers)).toHaveLength(54);
  });

  // Le critère de la phase 3 : à la fin de l'animation, ce qu'on voit est l'état du modèle après le mouvement.
  test.each(MOVES)('la fin de l’animation de %s montre l’état du modèle', (move) => {
    const before = applyMoves(SOLVED, randomScramble(20, seededRandom(move.charCodeAt(0) + move.length)));
    const after = applyMove(before, move);
    const { axis, layer, angle } = moveTurn(move);
    for (const cubie of cubiesOf(before)) {
      const turning = cubie.position[axis] === layer;
      for (const sticker of cubie.stickers) {
        const position = turning ? rotateByAngle(cubie.position, axis, angle) : cubie.position;
        const normal = turning ? rotateByAngle(sticker.normal, axis, angle) : sticker.normal;
        expect(after[faceletAt(position, normal)]).toBe(sticker.color);
      }
    }
  });
});
