// A4 Count It: trace a counting loop, including a crash and the empty string.
import { shuffle } from '../../../arcade/engine/ui.js';
import { runRounds } from '../../../arcade/engine/kit.js';
import { answersRound } from './_t4.js';
import { COUNTS } from '../data/a.js';

export default {
  mount(stage, api) {
    runRounds(stage, api, COUNTS.map((c, i) => answersRound({
      title: `What does this call give? Call ${i + 1} of ${COUNTS.length}.`,
      intro: c.options ? 'Read the loop carefully, then pick what happens.' : 'Trace the loop by hand, one box at a time, then type what it returns.',
      items: () => [{ code: c.code, call: c.call, answer: c.answer, kind: c.kind, options: c.options, q: c.q, a: c.a, why: c.why, shuffled: c.options ? shuffle(c.options) : undefined, prompt: c.options ? null : 'Type what this call returns.' }],
      intro2: 'Answer, then press Check.',
    })));
  },
};
