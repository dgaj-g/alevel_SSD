// C1 Is It a Number?: say whether each string parses and what number comes out; place all, then Check.
import { h, codeInline, fb, shuffle, sfx } from '../../../arcade/engine/ui.js';
import { runRounds, checkButton } from '../../../arcade/engine/kit.js';
import { PARSES } from '../data/c.js';

export default {
  mount(stage, api) {
    runRounds(stage, api, [{
      title: 'Which of these does int.TryParse accept?',
      intro: 'For each string, choose Number or Not a number. When it is a number, type the number it gives.',
      intro2: 'Answer all seven, then press Check.',
      async run(box, ctx) {
        const rows = shuffle(PARSES).map((p) => {
          const input = h('input', { class: 'field mono', type: 'text', autocomplete: 'off', 'aria-label': `The number in "${p.text}"`, placeholder: 'the number', disabled: true });
          let pick = null;
          const yes = h('button', { type: 'button', onclick: () => choose(true) }, 'Number');
          const no = h('button', { type: 'button', onclick: () => choose(false) }, 'Not a number');
          function choose(v) { pick = v; yes.classList.toggle('on', v); no.classList.toggle('on', !v); input.disabled = !v; if (!v) input.value = ''; }
          const el = h('div', { class: 'card mt' }, h('p', { class: 'bigq' }, codeInline(`int.TryParse("${p.text}", out number)`)), h('div', { class: 'valrow' }, h('div', { class: 'tog' }, yes, no), input));
          return { p, el, input, yes, no, get pick() { return pick; } };
        });
        rows.forEach((r) => box.append(r.el));
        let pts = 0; const note = h('span', { class: 'note' }, '');
        await checkButton(ctx, () => {
          const left = rows.filter((r) => r.pick === null || (r.pick && !r.input.value.trim())).length;
          if (left) { note.textContent = `${left} still to answer.`; return false; }
          rows.forEach((r) => {
            const ok = r.pick === r.p.isNum && (!r.p.isNum || r.input.value.trim() === String(r.p.value));
            if (ok) pts++;
            r.yes.disabled = r.no.disabled = r.input.disabled = true;
            r.el.append(fb(ok ? 'good' : 'bad', ok ? 'Right.' : `Not that. ${r.p.isNum ? `It is a number: ${r.p.value}.` : 'It is not a number.'}`, r.p.why));
          });
          (pts === 7 ? sfx.good : sfx.bad)();
          box.append(fb(pts === 7 ? 'good' : 'bad', `${pts} of 7 strings right.`));
        }, 'Check', note);
        await ctx.next();
        return { score: pts, max: 7 };
      },
    }]);
  },
};
