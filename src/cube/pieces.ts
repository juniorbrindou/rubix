import type { Face } from './faces';

/**
 * Coins, dans l'ordre de Kociemba. Pour chacun : ses trois facettes, en commençant par la facette U ou D
 * puis dans le sens horaire vu de l'extérieur du coin, et les faces dont il porte les couleurs, dans le même ordre.
 */
export const CORNERS = ['URF', 'UFL', 'ULB', 'UBR', 'DFR', 'DLF', 'DBL', 'DRB'] as const;
export type Corner = (typeof CORNERS)[number];

export const CORNER_FACELETS: readonly (readonly [number, number, number])[] = [
  [8, 9, 20], // URF : U8 R0 F2
  [6, 18, 38], // UFL : U6 F0 L2
  [0, 36, 47], // ULB : U0 L0 B2
  [2, 45, 11], // UBR : U2 B0 R2
  [29, 26, 15], // DFR : D2 F8 R6
  [27, 44, 24], // DLF : D0 L8 F6
  [33, 53, 42], // DBL : D6 B8 L6
  [35, 17, 51], // DRB : D8 R8 B6
];

export const CORNER_COLORS: readonly (readonly [Face, Face, Face])[] = CORNERS.map(
  (c) => c.split('') as unknown as [Face, Face, Face],
);

/** Arêtes, dans l'ordre de Kociemba. Facettes et couleurs dans le même ordre. */
export const EDGES = ['UR', 'UF', 'UL', 'UB', 'DR', 'DF', 'DL', 'DB', 'FR', 'FL', 'BL', 'BR'] as const;
export type Edge = (typeof EDGES)[number];

export const EDGE_FACELETS: readonly (readonly [number, number])[] = [
  [5, 10], // UR : U5 R1
  [7, 19], // UF : U7 F1
  [3, 37], // UL : U3 L1
  [1, 46], // UB : U1 B1
  [32, 16], // DR : D5 R7
  [28, 25], // DF : D1 F7
  [30, 43], // DL : D3 L7
  [34, 52], // DB : D7 B7
  [23, 12], // FR : F5 R3
  [21, 41], // FL : F3 L5
  [50, 39], // BL : B5 L3
  [48, 14], // BR : B3 R5
];

export const EDGE_COLORS: readonly (readonly [Face, Face])[] = EDGES.map(
  (e) => e.split('') as unknown as [Face, Face],
);
