import { FACELET_GEOMETRY, type CubeState, type Vec3 } from '../cube';

export interface Sticker {
  facelet: number;
  normal: Vec3;
  /** Lettre de la face dont la facette porte la couleur, ou `?`. */
  color: string;
}

export interface Cubie {
  position: Vec3;
  stickers: Sticker[];
}

const key = (p: Vec3) => p.join(',');

/** Les 26 pièces visibles et leurs facettes, colorées selon l'état. */
export function cubiesOf(state: CubeState): Cubie[] {
  const byPosition = new Map<string, Cubie>();
  for (let x = -1; x <= 1; x++)
    for (let y = -1; y <= 1; y++)
      for (let z = -1; z <= 1; z++) {
        if (x === 0 && y === 0 && z === 0) continue;
        byPosition.set(key([x, y, z]), { position: [x, y, z], stickers: [] });
      }
  FACELET_GEOMETRY.forEach(({ position, normal }, facelet) => {
    byPosition.get(key(position))!.stickers.push({ facelet, normal, color: state[facelet] });
  });
  return [...byPosition.values()];
}

/** Couleurs affichées, proches d'un cube réel. */
export const STICKER_COLOR: Record<string, string> = {
  U: '#FFD500',
  R: '#FF6A00',
  F: '#00A651',
  D: '#FFFFFF',
  L: '#D62828',
  B: '#0051BA',
  '?': '#9A9A9A',
};

export const BODY_COLOR = '#111111';
