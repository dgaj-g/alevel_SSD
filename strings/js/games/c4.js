// C4 Read a Number Safely: build the TryParse routine; the traps carry their real results.
import { runRounds } from '../../../arcade/engine/kit.js';
import { parsonsRound } from './_parsons.js';
import { CHECK_ROWS, CHECK_TRAPS } from '../data/c.js';

export default {
  mount(stage, api) {
    runRounds(stage, api, [parsonsRound({
      title: 'Build the number check',
      intro: 'This code reads some text. It prints `Error: enter a whole number` when the text is not a number, `Valid` when the number is 10 to 55, and `Invalid` otherwise.',
      rows: CHECK_ROWS, traps: CHECK_TRAPS.map((t) => (t.shown ? { ...t, expect: { msgs: t.shown } } : t)),
      run: { ev: [['in', 'abc'], ['out', 'Error: enter a whole number'], ['in', '40'], ['out', 'Valid'], ['in', '60'], ['out', 'Invalid']] },
      runNote: 'Three runs of the finished code, one after the other:',
      closing: ['TryParse never crashes: it says whether the text was a number, and only then is the number safe to test.'],
    })]);
  },
};
