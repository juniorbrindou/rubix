import { FACES, FACELET_COUNT, UNKNOWN, centerIndex, faceOfFacelet, validate, type CubeState, type Face, type Validation } from '../cube';
import { STAGES, STAGE_FACELETS, type StageId } from '../solver';

/**
 * Saisie de l'état d'un vrai cube. L'utilisateur coche les étapes déjà finies (préréglages), puis colorie les
 * cases restantes. `level` = nombre d'étapes cochées : les étapes 0 à level-1 sont finies.
 */

/** Étapes proposées en préréglage : toutes sauf « cube résolu ». */
export const PRESET_STAGES: readonly StageId[] = STAGES.slice(0, -1);

const CENTERS = new Set(FACES.map(centerIndex));

/** Cube vierge : seuls les centres sont connus, puisqu'ils ne bougent jamais. */
export function emptyInput(): CubeState {
  let s = '';
  for (let i = 0; i < FACELET_COUNT; i++) s += CENTERS.has(i) ? faceOfFacelet(i) : UNKNOWN;
  return s;
}

/** Cases fixées par les préréglages d'un niveau, dans l'ordre des étapes. */
export function presetFacelets(level: number): number[] {
  return PRESET_STAGES.slice(0, level).flatMap((s) => [...STAGE_FACELETS[s]]);
}

/** Étape qui fixe une case, si un préréglage de ce niveau la fixe. */
export function lockingStage(facelet: number, level: number): StageId | 'center' | null {
  if (CENTERS.has(facelet)) return 'center';
  return PRESET_STAGES.slice(0, level).find((s) => STAGE_FACELETS[s].includes(facelet)) ?? null;
}

function setFacelets(state: CubeState, facelets: readonly number[], value: (f: number) => string): CubeState {
  const s = [...state];
  for (const f of facelets) s[f] = value(f);
  return s.join('');
}

/**
 * Passe d'un niveau à l'autre. Monter remplit les cases des étapes ajoutées avec leur couleur finale
 * (renvoyées dans `filled`, dans l'ordre, pour l'animation) ; descendre remet à `?` les cases des étapes retirées.
 */
export function changeLevel(state: CubeState, from: number, to: number): { state: CubeState; filled: number[] } {
  if (to > from) {
    const filled = PRESET_STAGES.slice(from, to).flatMap((s) => [...STAGE_FACELETS[s]]);
    return { state: setFacelets(state, filled, faceOfFacelet), filled };
  }
  const cleared = PRESET_STAGES.slice(to, from).flatMap((s) => [...STAGE_FACELETS[s]]);
  return { state: setFacelets(state, cleared, () => UNKNOWN), filled: [] };
}

/** Colorie une case. Une case déjà de cette couleur redevient inconnue. Une case fixée ne change pas. */
export function paint(state: CubeState, facelet: number, color: Face | typeof UNKNOWN, level: number): CubeState {
  if (lockingStage(facelet, level)) return state;
  const next = state[facelet] === color ? UNKNOWN : color;
  return setFacelets(state, [facelet], () => next);
}

export function colorCounts(state: CubeState): Record<Face | typeof UNKNOWN, number> {
  const counts = { U: 0, R: 0, F: 0, D: 0, L: 0, B: 0, [UNKNOWN]: 0 } as Record<Face | typeof UNKNOWN, number>;
  for (const c of state) counts[c as Face]++;
  return counts;
}

export type InputStatus =
  | { kind: 'incomplete'; remaining: number }
  | { kind: 'tooMany'; face: Face; count: number; facelet: number }
  | { kind: 'invalid'; validation: Extract<Validation, { ok: false }> }
  | { kind: 'valid' };

/** Où en est la saisie. Un excès de couleur se signale tout de suite, le reste quand tout est colorié. */
export function inputStatus(state: CubeState): InputStatus {
  const counts = colorCounts(state);
  for (const face of FACES) {
    if (counts[face] > 9) {
      const facelet = [...state].findIndex((c, i) => c === face && !CENTERS.has(i));
      return { kind: 'tooMany', face, count: counts[face], facelet };
    }
  }
  if (counts[UNKNOWN] > 0) return { kind: 'incomplete', remaining: counts[UNKNOWN] };
  const validation = validate(state);
  return validation.ok ? { kind: 'valid' } : { kind: 'invalid', validation };
}
