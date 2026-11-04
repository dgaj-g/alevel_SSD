// D3 Find the Fault: tap the faulty line, name the fault, say what the call returns.
import { h, fb, codeBlock, codeInline, shuffle, choiceSet, sfx, rich } from '../../../arcade/engine/ui.js';
import { runRounds, checkButton } from '../../../arcade/engine/kit.js';
import { BUGGY, RESULTS } from '../data/d.js';

const round = (b, k, n) => ({
  title: `Find the fault. Method ${k} of ${n}.`, intro: 'One line in this validator is wrong. Tap that line, name the fault, and say what the call returns.', intro2: 'Answer all three, then press Check.',
  async run(box, ctx) {
    let tapped = null; const faults = shuffle(b.options);
    const code = codeBlock(b.code, { onLine: (i) => { tapped = i; code.lines.forEach((l, j) => l.classList.toggle('sel', j === i)); } });
    const set = choiceSet(faults.map((f) => f.replace(/`/g, '')), {}); const res = choiceSet(RESULTS, { mono: true });
    box.append(code.el, h('p', { class: 'bigq' }, 'What is the fault?'), set.el, h('p', { class: 'bigq' }, 'What does ', codeInline(b.call), ' do?'), res.el);
    let pts = 0; const note = h('span', { class: 'note' }, '');
    await checkButton(ctx, () => {
      if (tapped == null) { note.textContent = 'Tap the faulty line first.'; return false; }
      if (set.value() == null || res.value() == null) { note.textContent = 'Answer all three first.'; return false; }
      const a = tapped === b.at; const c = faults[set.value()] === b.fault; const d = RESULTS[res.value()] === b.result;
      pts = (a ? 1 : 0) + (c ? 1 : 0) + (d ? 1 : 0);
      code.lines.forEach((l, j) => { l.classList.remove('sel'); if (j === b.at) l.classList.add('hi'); });
      set.lock(faults.indexOf(b.fault)); res.lock(RESULTS.indexOf(b.result));
      (pts === 3 ? sfx.good : sfx.bad)();
      box.append(fb(pts === 3 ? 'good' : 'bad', `${pts} of 3 right.`, h('span', null, rich(b.why))));
    }, 'Check', note);
    await ctx.next();
    return { score: pts, max: 3 };
  },
});
export default { mount(stage, api) { const list = shuffle(BUGGY); runRounds(stage, api, list.map((b, i) => round(b, i + 1, list.length))); } };
