import { moveFace, type Move, type MoveSuffix } from '../cube';
import type { StageId } from './stages';

/** Un pas de la solution : un mouvement, l'étape qu'il sert, et ce qu'il fait (nom d'algorithme ou « Ajustement »). */
export interface SolutionStep {
  move: Move;
  stage: StageId;
  label: string;
}

const QUARTERS: Record<MoveSuffix, number> = { '': 1, '2': 2, "'": 3 };
const SUFFIX_OF = ['', '', '2', "'"] as const;

/**
 * Fusionne les mouvements consécutifs d'une même face (`U U` → `U2`, `U U'` → rien).
 * Le pas fusionné garde l'étiquette du premier.
 */
export function simplify(steps: readonly SolutionStep[]): SolutionStep[] {
  const out: SolutionStep[] = [];
  for (const step of steps) {
    const top = out[out.length - 1];
    if (top && moveFace(top.move) === moveFace(step.move)) {
      const q = (QUARTERS[top.move.slice(1) as MoveSuffix] + QUARTERS[step.move.slice(1) as MoveSuffix]) % 4;
      if (q === 0) out.pop();
      else out[out.length - 1] = { ...top, move: `${moveFace(top.move)}${SUFFIX_OF[q]}` as Move };
    } else {
      out.push(step);
    }
  }
  return out;
}

export function tag(moves: readonly Move[], stage: StageId, label: string): SolutionStep[] {
  return moves.map((move) => ({ move, stage, label }));
}
