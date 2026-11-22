import { moveFace, type Face, type Move } from '../cube';

const FACE_NAME: Record<Face, string> = {
  U: 'la face du haut',
  D: 'la face du bas',
  F: 'la face avant',
  B: 'la face arrière',
  R: 'la face droite',
  L: 'la face gauche',
};

/** Consigne d'un mouvement pour quelqu'un qui ne connaît pas la notation. */
export function describeMove(move: Move): string {
  const face = FACE_NAME[moveFace(move)];
  if (move.endsWith('2')) return `Tournez ${face} d’un demi-tour.`;
  const sense = move.endsWith("'") ? 'dans le sens inverse des aiguilles d’une montre' : 'dans le sens des aiguilles d’une montre';
  return `Tournez ${face} d’un quart de tour, ${sense}, en la regardant de face.`;
}
