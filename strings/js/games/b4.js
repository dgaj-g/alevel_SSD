// B4 Which Call Does It?: the result is wanted; pick the one call that gives it.
import { h, codeInline, shuffle } from '../../../arcade/engine/ui.js';
import { runRounds } from '../../../arcade/engine/kit.js';
import { answersRound } from './_t4.js';
import { REPAIRS } from '../data/b.js';

export default {
  mount(stage, api) {
    runRounds(stage, api, [answersRound({
      title: 'Which line gives the result we want?',
      intro: 'Each card names a string and the result we want. Pick the one line that gives it.',
      items: () => REPAIRS.map((r) => ({ head: () => h('p', { class: 'bigq' }, 'From ', codeInline(`"${r.word}"`), ' we want ', codeInline(r.want === '4' || r.want === 'true' ? r.want : `"${r.want}"`), '.'), options: r.options, a: r.a, shuffled: shuffle(r.options), mono: true, why: r.why })),
    })]);
  },
};
