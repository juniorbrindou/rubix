import { FACELET_COUNT, FACES, type Face } from './faces';

/** Vecteur entier. Repère : x vers R, y vers U, z vers F ; chaque coordonnée vaut -1, 0 ou 1. */
export type Vec3 = readonly [number, number, number];

export interface FaceletGeometry {
  /** Position de la pièce qui porte la facette. */
  position: Vec3;
  /** Normale sortante de la facette (direction de sa face). */
  normal: Vec3;
}

const FACE_NORMAL: Record<Face, Vec3> = {
  U: [0, 1, 0],
  R: [1, 0, 0],
  F: [0, 0, 1],
  D: [0, -1, 0],
  L: [-1, 0, 0],
  B: [0, 0, -1],
};

/**
 * Position de la facette (ligne r, colonne c) d'une face, lue en regardant la face de face,
 * selon le patron déplié de docs/MODELE-CUBE.md.
 */
function positionOf(face: Face, r: number, c: number): Vec3 {
  switch (face) {
    case 'U':
      return [c - 1, 1, r - 1];
    case 'D':
      return [c - 1, -1, 1 - r];
    case 'F':
      return [c - 1, 1 - r, 1];
    case 'B':
      return [1 - c, 1 - r, -1];
    case 'R':
      return [1, 1 - r, 1 - c];
    case 'L':
      return [-1, 1 - r, c - 1];
  }
}

/** Géométrie des 54 facettes, indexée comme la chaîne d'état. */
export const FACELET_GEOMETRY: readonly FaceletGeometry[] = Array.from({ length: FACELET_COUNT }, (_, i) => {
  const face = FACES[Math.floor(i / 9)];
  const k = i % 9;
  return { position: positionOf(face, Math.floor(k / 3), k % 3), normal: FACE_NORMAL[face] };
});

function key(position: Vec3, normal: Vec3): string {
  return `${position.join(',')}|${normal.join(',')}`;
}

const INDEX_BY_KEY = new Map(FACELET_GEOMETRY.map((g, i) => [key(g.position, g.normal), i]));

/** Indice de la facette portée par la pièce `position` sur la face de normale `normal`. */
export function faceletAt(position: Vec3, normal: Vec3): number {
  const i = INDEX_BY_KEY.get(key(position, normal));
  if (i === undefined) throw new Error(`Aucune facette en ${key(position, normal)}`);
  return i;
}

export type Axis = 0 | 1 | 2;

/** Quart de tour dans le sens trigonométrique (antihoraire) autour de l'axe positif, répété `quarters` fois. */
export function rotate(v: Vec3, axis: Axis, quarters: number): Vec3 {
  let [x, y, z] = v;
  for (let q = 0; q < ((quarters % 4) + 4) % 4; q++) {
    if (axis === 0) [y, z] = [-z, y];
    else if (axis === 1) [x, z] = [z, -x];
    else [x, y] = [-y, x];
  }
  return [x + 0, y + 0, z + 0]; // + 0 normalise -0 en 0 pour les clés
}
