import { applyMoves, validate, type CubeState } from '../cube';
import { ALGORITHM_LABEL } from './algorithms';
import { solveCross } from './cross';
import { solveByMacros, solveFirstLayer, solveSecondLayer, type Segment } from './layers';
import { STAGES, stageDone, type StageId } from './stages';
import { simplify, tag, type SolutionStep } from './steps';

const ADJUST_LABEL = 'Ajustement';
const CROSS_LABEL = 'Arête de la croix';

function solveStage(state: CubeState, stage: StageId): Segment[] {
  switch (stage) {
    case 'cross':
      return solveCross(state).map((moves) => ({ moves, label: 'adjust' }));
    case 'firstLayer':
      return solveFirstLayer(state);
    case 'secondLayer':
      return solveSecondLayer(state);
    case 'yellowCross':
      return solveByMacros(state, stage, ['yellowCross']);
    case 'yellowFace':
      return solveByMacros(state, stage, ['sune']);
    case 'yellowCorners':
      return solveByMacros(state, stage, ['cornerCycle']);
    case 'solved':
      return solveByMacros(state, stage, ['edgeCycleA', 'edgeCycleB']);
  }
}

/**
 * Solution par la méthode débutant, depuis un état valide. Les étapes déjà finies ne produisent aucun pas.
 * Lève une erreur si l'état n'est pas valide.
 */
export function solve(start: CubeState): SolutionStep[] {
  const validation = validate(start);
  if (!validation.ok) throw new Error(validation.message);

  let state = start;
  const steps: SolutionStep[] = [];
  for (const stage of STAGES) {
    if (stageDone(state, stage)) continue;
    const segments = solveStage(state, stage);
    const stageSteps = simplify(
      segments.flatMap((seg) =>
        tag(seg.moves, stage, stage === 'cross' ? CROSS_LABEL : seg.label === 'adjust' ? ADJUST_LABEL : ALGORITHM_LABEL[seg.label]),
      ),
    );
    state = applyMoves(state, stageSteps.map((s) => s.move));
    if (!stageDone(state, stage)) throw new Error(`Le solveur n'a pas fini l'étape ${stage}`);
    steps.push(...stageSteps);
  }
  return steps;
}
