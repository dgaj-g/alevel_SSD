// B3 Predict the Output — type exactly what each program prints. Every expected output was produced by dotnet.
import { h, icon, codeBlock, consolePanel, fb, sfx, sameAnswer, scrollIntoViewSoft } from '../ui.js';
import { runRounds, checkButton, explain, programLines, outLines } from '../kit.js';
import { PREDICT } from '../data/b.js';

export function predictRound(p, opts = {}) {
  return {
    title: p.title,
    intro: opts.intro || 'Read the program. Type each line it prints into the console, top to bottom.',
    intro2: opts.intro2 || 'Capitals and punctuation never cost a mark. Numbers must be exact.',
    async run(box, ctx) {
      const want = outLines(p.expect.out);
      const rows = want.map((w, i) => {
        const inp = h('input', { type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': `Line ${i + 1} of the output` });
        const row = h('div', { class: 'pl' }, h('span', { class: 'n', style: { color: '#6E7681', width: '1.6em' } }, `${i + 1}`), inp, h('span', { class: 'mk' }));
        inp.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') { e.preventDefault(); const nx = rows[i + 1]; if (nx) nx.inp.focus(); else checkBtn()?.click(); }
        });
        return { row, inp, w };
      });
      const yours = h('div', { class: 'console' },
        h('div', { class: 'bar' }, icon('pencil-ruler'), 'Your prediction'),
        h('div', { class: 'out predict' }, rows.map((r) => r.row)));
      box.append(
        p.src ? h('p', { class: 'note', style: { margin: '0 0 8px' } }, p.src) : null,
        h('div', { class: 'split wide-left' }, codeBlock(programLines(p.cs)).el, yours));
      setTimeout(() => rows[0].inp.focus({ preventScroll: true }), 80);
      const checkBtn = () => ctx.foot.querySelector('.btn.primary');
      let pts = 0;
      await checkButton(ctx, () => {
        const empty = rows.find((r) => !r.inp.value.trim());
        if (empty) { empty.inp.focus(); return false; }
        rows.forEach((r) => {
          r.inp.disabled = true;
          const ok = sameAnswer(r.inp.value, r.w);
          if (ok) pts++;
          r.row.classList.add(ok ? 'right' : 'wrong');
          r.row.querySelector('.mk').append(icon(ok ? 'check' : 'x'));
          if (!ok) r.row.append(h('span', { class: 'want' }, r.w));
        });
        (pts === rows.length ? sfx.good : sfx.bad)();
        const con = consolePanel();
        want.forEach((l) => con.print(l));
        const f = fb(pts === rows.length ? 'good' : 'bad', `${pts} of ${rows.length} lines right.`);
        box.append(f, h('div', { class: 'split mt' }, con.el, explain([p.why])));
        scrollIntoViewSoft(f);
      }, 'Check', 'Fill every line.');
      await ctx.next();
      return { score: pts, max: rows.length };
    },
  };
}

export default {
  mount(stage, api) {
    api.wide();
    runRounds(stage, api, PREDICT.map((p) => predictRound(p)));
  },
};
