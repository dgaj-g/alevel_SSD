// D2 Validator Builder: Parsons of one past-paper validator; every trap shows its real result.
import { pick } from '../../../arcade/engine/ui.js';
import { runRounds } from '../../../arcade/engine/kit.js';
import { parsonsRound } from './_parsons.js';
import { rowsFromCode } from '../data/_q.js';
import { BUILDS } from '../data/d.js';

export default {
  mount(stage, api) {
    const B = pick(BUILDS);
    runRounds(stage, api, [parsonsRound({
      title: `Build ${B.method}`,
      intro: `The rule is ${B.rule}. Length first, then each position, return false the moment one breaks, and return true at the end.`,
      rows: rowsFromCode(B.code), traps: B.traps,
      run: { ev: B.calls.map(([c, r]) => ['out', `${c} returns ${r.toLowerCase()}.`]) },
      runNote: 'What the finished method returns:',
      closing: ['Length first, each position next, the number with TryParse and its range, and return true only at the very end.'],
    })]);
  },
};
