import {
  CORNER_COLORS,
  CORNER_FACELETS,
  EDGE_COLORS,
  EDGE_FACELETS,
  FACELET_GEOMETRY,
  SOLVED,
  faceletAt,
  type Vec3,
} from '..';

const same = (a: Vec3, b: Vec3) => a.every((v, i) => v === b[i]);
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

describe('géométrie des facettes', () => {
  test('chaque facette a une place unique et se retrouve par sa place', () => {
    FACELET_GEOMETRY.forEach(({ position, normal }, i) => expect(faceletAt(position, normal)).toBe(i));
  });

  test('la ligne du bas de U touche F, celle du haut de D touche F (patron de Kociemba)', () => {
    expect(FACELET_GEOMETRY[7].position).toEqual([0, 1, 1]); // U7
    expect(FACELET_GEOMETRY[28].position).toEqual([0, -1, 1]); // D1
  });

  test('les trois facettes de chaque coin sont sur la même pièce, dans le sens horaire', () => {
    CORNER_FACELETS.forEach((facelets, c) => {
      const [g0, g1, g2] = facelets.map((f) => FACELET_GEOMETRY[f]);
      expect(same(g0.position, g1.position) && same(g0.position, g2.position)).toBe(true);
      expect(dot(cross(g0.normal, g1.normal), g2.normal)).toBe(-1);
      facelets.forEach((f, k) => expect(SOLVED[f]).toBe(CORNER_COLORS[c][k]));
    });
  });

  test('les deux facettes de chaque arête sont sur la même pièce', () => {
    EDGE_FACELETS.forEach((facelets, e) => {
      const [g0, g1] = facelets.map((f) => FACELET_GEOMETRY[f]);
      expect(same(g0.position, g1.position)).toBe(true);
      facelets.forEach((f, k) => expect(SOLVED[f]).toBe(EDGE_COLORS[e][k]));
    });
  });
});
