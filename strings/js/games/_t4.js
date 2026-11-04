// Pieces the Topic 4 games share: numbered boxes, answer rows and marking rules.
import { h, icon, rich, codeBlock, fb, setMark, sfx, choiceSet, codeInline } from '../../../arcade/engine/ui.js';
import { checkButton, explain } from '../../../arcade/engine/kit.js';

export const show = (ch) => (ch === ' ' ? '␣' : ch);
// A row of numbered boxes. opts.tap(i, el) makes each box a button.
export function boxRow(word, opts = {}) {
  const els = [...word].map((ch, i) => {
    const kids = [h('span', { class: 'ch' }, show(ch)), h('span', { class: 'ix' }, String(i))];
    return opts.tap ? h('button', { class: 'sbox', type: 'button', 'aria-label': `Box ${i}, ${ch === ' ' ? 'a space' : ch}`, onclick: (e) => opts.tap(i, e.currentTarget) }, kids)
      : h('div', { class: 'sbox' }, kids);
  });
  const el = word.length ? h('div', { class: 'boxes' }, els) : h('p', { class: 'note' }, 'This string is empty, so it has no boxes.');
  return { el, boxes: els };
}
const strip = (s) => { const t = s.trim(); const m = t.match(/^(['"])(.*)\1$/s); return m ? m[2] : t; };
export function accepts(item, raw) {
  const kind = item.kind || 'text';
  const answers = [item.answer, ...(item.alts || [])].map(String);
  if (kind === 'num') return answers.includes(raw.trim());
  if (kind === 'bool') return answers.some((a) => a.toLowerCase() === raw.trim().toLowerCase());
  if (kind === 'expr') { const sq = (s) => s.replace(/\s+/g, '').replace(/;$/, '').toLowerCase(); return answers.some((a) => sq(a) === sq(raw)); }
  return answers.includes(strip(raw));
}
export function answerRow(item, i) {
  const parts = [];
  if (item.prompt) parts.push(h('p', { class: 'bigq' }, rich(item.prompt)));
  if (item.head) parts.push(item.head());
  if (item.code) parts.push(codeBlock(item.code, { title: item.codeTitle || null }).el);
  if (item.lines) parts.push(codeBlock(item.lines).el);
  if (item.call) parts.push(h('p', null, codeInline(item.call)));
  let get; let mark; let set = null;
  if (item.options) {
    if (item.q) parts.push(h('p', { class: 'bigq' }, rich(item.q)));
    set = choiceSet(item.shuffled || item.options, { mono: item.mono });
    parts.push(set.el);
    get = () => (set.value() == null ? '' : (item.shuffled || item.options)[set.value()]);
    mark = () => set.lock((item.shuffled || item.options).indexOf(item.a));
  } else {
    const input = h('input', { class: 'field mono', type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': `Answer ${i + 1}` });
    parts.push(h('div', { class: 'valrow' }, input));
    get = () => input.value;
    mark = (ok) => { input.readOnly = true; input.classList.add(ok ? 'good' : 'bad'); };
  }
  const el = h('div', { class: 'card mt' }, parts);
  const judged = () => (item.options ? get() === item.a : accepts(item, get()));
  return { el, get, mark, judged };
}
// A round of answer rows on one screen: every row answered, then Check, each row marked and explained.
export function answersRound({ title, intro, intro2, items, after }) {
  return {
    title, intro, intro2: intro2 || 'Answer every one, then press Check.',
    async run(box, ctx) {
      const list = (typeof items === 'function' ? items() : items);
      const rows = list.map((it, i) => answerRow(it, i));
      rows.forEach((r) => box.append(r.el));
      let pts = 0;
      const note = h('span', { class: 'note' }, 'Answer every one first.');
      await checkButton(ctx, () => {
        const empty = rows.filter((r) => r.get() === '').length;
        if (empty) { note.textContent = `${empty} still to answer.`; return false; }
        rows.forEach((r, i) => {
          const ok = r.judged(); const it = list[i];
          r.mark(ok); if (ok) pts++;
          const shown = it.options ? it.a : it.answer;
          r.el.append(fb(ok ? 'good' : 'bad', ok ? 'Right.' : `Not that. The answer is ${shown}.`, ...(it.why ? [it.why] : [])));
        });
        (pts === list.length ? sfx.good : sfx.bad)();
        const f = fb(pts === list.length ? 'good' : 'bad', `${pts} of ${list.length} right.`);
        box.append(f);
        if (after) box.append(explain(after));
      }, 'Check', note);
      await ctx.next();
      return { score: pts, max: list.length };
    },
  };
}
export { icon };
