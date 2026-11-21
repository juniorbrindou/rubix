import { FACELET_GEOMETRY, SOLVED, applyMove, faceletAt, moveTurn, type Vec3 } from '../../cube';
import { cross, inPlaneAxes, moveFromSwipe } from '../swipe';

const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const neg = (a: Vec3): Vec3 => a.map((v) => -v + 0) as unknown as Vec3;

describe('glisser pour tourner une face', () => {
  test('glisser vers le haut sur la colonne droite de F fait R', () => {
    expect(moveFromSwipe(23, [0, 1, 0])).toBe('R'); // F5
    expect(moveFromSwipe(23, [0, -1, 0])).toBe("R'");
  });

  test('glisser vers la droite sur la rangée du haut de F fait U\'', () => {
    // U tourne la rangée du haut de F vers la gauche ; la pousser vers la droite, c'est U'.
    expect(moveFromSwipe(19, [1, 0, 0])).toBe("U'"); // F1
    expect(moveFromSwipe(19, [-1, 0, 0])).toBe('U');
  });

  test('une couche du milieu ne donne aucun mouvement', () => {
    expect(moveFromSwipe(22, [0, 1, 0])).toBeNull(); // centre de F
  });

  // Pour toute case et tout sens de glissement, la couche choisie emporte bien la case dans ce sens.
  test('la case part toujours dans le sens du doigt', () => {
    let checked = 0;
    FACELET_GEOMETRY.forEach(({ position, normal }, f) => {
      for (const axis of inPlaneAxes(normal)) {
        for (const d of [axis, neg(axis)]) {
          const move = moveFromSwipe(f, d);
          const r = cross(normal, d);
          const k = r.findIndex((v) => v !== 0);
          if (position[k] === 0) {
            expect(move).toBeNull();
            continue;
          }
          expect(move).not.toBeNull();
          const turn = moveTurn(move!);
          const signedAxis = [0, 0, 0].map((_, i) => (i === turn.axis ? Math.sign(turn.angle) : 0)) as unknown as Vec3;
          // Vitesse du point sous une rotation positive autour de l'axe signé : axe × position.
          expect(dot(cross(signedAxis, position), d)).toBeGreaterThan(0);
          checked++;
        }
      }
    });
    expect(checked).toBeGreaterThan(100);
  });

  test('cohérent avec le modèle : après R, la couleur de F5 est montée en U5', () => {
    const after = applyMove(SOLVED, moveFromSwipe(23, [0, 1, 0])!);
    expect(after[faceletAt([1, 1, 0], [0, 1, 0])]).toBe('F');
  });
});
