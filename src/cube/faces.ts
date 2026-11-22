/** Les six faces, dans l'ordre de la chaîne d'état (format Kociemba). */
export const FACES = ['U', 'R', 'F', 'D', 'L', 'B'] as const;
export type Face = (typeof FACES)[number];

/** Facette pas encore saisie. */
export const UNKNOWN = '?';

/**
 * État du cube : 54 caractères, 9 par face dans l'ordre U R F D L B.
 * Chaque caractère est le nom de la face dont la facette porte la couleur (voir docs/MODELE-CUBE.md).
 */
export type CubeState = string;

export const FACELET_COUNT = 54;

export const SOLVED: CubeState = FACES.map((f) => f.repeat(9)).join('');

/** Couleur de chaque face dans l'orientation de référence (jaune en haut, vert devant). */
export const FACE_COLOR_NAME: Record<Face, string> = {
  U: 'jaune',
  R: 'orange',
  F: 'vert',
  D: 'blanc',
  L: 'rouge',
  B: 'bleu',
};

/** Même chose au pluriel, pour « 9 cases jaunes » (orange est invariable). */
export const FACE_COLOR_PLURAL: Record<Face, string> = {
  U: 'jaunes',
  R: 'orange',
  F: 'vertes',
  D: 'blanches',
  L: 'rouges',
  B: 'bleues',
};

export function isFace(c: string): c is Face {
  return (FACES as readonly string[]).includes(c);
}

/** Face à laquelle appartient la facette d'indice `index`. */
export function faceOfFacelet(index: number): Face {
  return FACES[Math.floor(index / 9)];
}

/** Indice de la facette centrale d'une face. */
export function centerIndex(face: Face): number {
  return FACES.indexOf(face) * 9 + 4;
}

export function isSolved(state: CubeState): boolean {
  return state === SOLVED;
}
