// C4 Will It Build? — the whole topic as a compiler: headers, calls, return values, ref, overloading.
// Pick the verdict AND the reason. Every program was built with dotnet; the Error List shows C#'s own words.
import { h, codeBlock, shuffle, sample } from '../ui.js';
import { runRounds, programLines, quizRound, realResult } from '../kit.js';
import { BUILD } from '../data/c.js';

export default {
  mount(stage, api) {
    api.wide();
    const builds = BUILD.filter((c) => c.options[0][1] === 'b');
    const fails = BUILD.filter((c) => c.options[0][1] === 'n');
    const picked = shuffle([...sample(builds, 4), ...sample(fails, 8)]).map((c) => ({
      q: 'Will it build? If it builds, what does it print?',
      options: c.options.map((o) => o[0]),
      kinds: c.options.map((o) => o[1]),
      a: 0, why: c.why, cs: c.cs, expect: c.expect,
    }));
    const sets = [0, 1, 2].map((s) => picked.slice(s * 4, s * 4 + 4));
    runRounds(stage, api, sets.map((items, s) => quizRound({
      title: `Set ${s + 1} of 3`,
      intro: 'You are the compiler. Read the program, then pick what happens — and why.',
      intro2: 'Right verdict and right reason: 2 points. Right verdict, wrong reason: 1.',
      items,
      show: (it) => codeBlock(programLines(it.cs)).el,
      scoreOf: (it, p) => (p === it.a ? [2, 2] : it.kinds[p] === it.kinds[it.a] ? [1, 2] : [0, 2]),
      why: (it, p, pts) => (pts === 1 ? `Right verdict, wrong reason. ${it.why}` : it.why),
      after: (it) => h('div', { class: 'mt' }, realResult(it.expect)),
    })));
  },
};
