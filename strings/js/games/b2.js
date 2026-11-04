// B2 Search and Replace: one string, eight calls. Type what each gives.
import { pick } from '../../../arcade/engine/ui.js';
import { runRounds } from '../../../arcade/engine/kit.js';
import { answersRound, boxRow } from './_t4.js';
import { SEARCHES } from '../data/b.js';

export default {
  mount(stage, api) {
    const S = pick(SEARCHES);
    runRounds(stage, api, [answersRound({
      title: `What does each call give on "${S.lit}"?`,
      intro: `Here \`text\` holds "${S.lit}". Type what each call gives. For true or false, capitals do not matter, and quotes are optional.`,
      items: () => S.rows.map((r, i) => ({ head: i === 0 ? () => boxRow(S.lit).el : undefined, lines: [r.expr], answer: r.answer, kind: r.kind, why: r.why })),
    })]);
  },
};
