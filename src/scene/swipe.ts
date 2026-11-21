import { FACELET_GEOMETRY, FACES, moveTurn, type Move, type Vec3 } from '../cube';

/**
 * Glisser un doigt sur une case tourne la couche qui emporte cette case dans le sens du glissement.
 * `direction` est l'axe du modèle (±x, ±y ou ±z, dans le plan de la face) qui suit le mieux le doigt à l'écran.
 * La rotation qui pousse un point de normale n vers d a pour axe n × d (règle de la main droite).
 * Renvoie `null` pour une couche du milieu : le modèle ne connaît que les mouvements de faces.
 */
export function moveFromSwipe(facelet: number, direction: Vec3): Move | null {
  const { position, normal } = FACELET_GEOMETRY[facelet];
  const axisVector = cross(normal, direction);
  const axis = axisVector.findIndex((v) => v !== 0);
  if (axis < 0) return null; // direction hors du plan de la face
  const layer = position[axis];
  if (layer === 0) return null;
  const sign = Math.sign(axisVector[axis]);
  for (const face of FACES) {
    for (const suffix of ['', "'"] as const) {
      const move = `${face}${suffix}` as Move;
      const turn = moveTurn(move);
      if (turn.axis === axis && turn.layer === layer && Math.sign(turn.angle) === sign) return move;
    }
  }
  return null;
}

export function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]].map((v) => v + 0) as unknown as Vec3;
}

/** Les deux axes du modèle dans le plan d'une face (ceux où la normale vaut 0). */
export function inPlaneAxes(normal: Vec3): [Vec3, Vec3] {
  const axes: Vec3[] = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
  return axes.filter((a) => a.every((v, i) => v === 0 || normal[i] === 0)) as [Vec3, Vec3];
}
