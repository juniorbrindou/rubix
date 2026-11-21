import { faceOfFacelet, type CubeState } from '../cube';

export const STAGES = [
  'cross',
  'firstLayer',
  'secondLayer',
  'yellowCross',
  'yellowFace',
  'yellowCorners',
  'solved',
] as const;
export type StageId = (typeof STAGES)[number];

export const STAGE_LABEL: Record<StageId, string> = {
  cross: 'Croix blanche',
  firstLayer: 'Premier étage',
  secondLayer: 'Deuxième étage',
  yellowCross: 'Croix jaune',
  yellowFace: 'Face jaune',
  yellowCorners: 'Coins jaunes',
  solved: 'Cube résolu',
};

/**
 * Facettes qu'une étape met en place (en plus de celles des étapes précédentes). Une facette est en place
 * quand elle porte la couleur de sa face. C'est aussi ce que remplit le préréglage de l'étape.
 */
export const STAGE_FACELETS: Record<StageId, readonly number[]> = {
  cross: [28, 25, 32, 16, 34, 52, 30, 43], // arêtes DF, DR, DB, DL
  firstLayer: [29, 26, 15, 27, 44, 24, 33, 53, 42, 35, 17, 51], // coins DFR, DLF, DBL, DRB
  secondLayer: [23, 12, 21, 41, 50, 39, 48, 14], // arêtes FR, FL, BL, BR
  yellowCross: [1, 3, 5, 7], // facettes jaunes des arêtes de U
  yellowFace: [0, 2, 6, 8], // facettes jaunes des coins de U
  yellowCorners: [9, 20, 18, 38, 36, 47, 45, 11], // flancs des coins de U
  solved: [10, 19, 37, 46], // flancs des arêtes de U
};

export function inPlace(state: CubeState, facelets: readonly number[]): boolean {
  return facelets.every((f) => state[f] === faceOfFacelet(f));
}

/** Vrai si l'étape et toutes les précédentes sont finies. */
export function stageDone(state: CubeState, stage: StageId): boolean {
  const n = STAGES.indexOf(stage);
  return STAGES.slice(0, n + 1).every((s) => inPlace(state, STAGE_FACELETS[s]));
}

/** Dernière étape finie, ou `null` si même la croix blanche ne l'est pas. */
export function lastStageDone(state: CubeState): StageId | null {
  let last: StageId | null = null;
  for (const s of STAGES) {
    if (!stageDone(state, s)) break;
    last = s;
  }
  return last;
}
