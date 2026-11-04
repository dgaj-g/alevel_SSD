// B1 Substring Surgeon: tap the boxes a call takes, then type the call that takes the lit boxes.
import { h, fb, codeBlock, pick, randInt, sfx } from '../../../arcade/engine/ui.js';
import { runRounds, checkButton } from '../../../arcade/engine/kit.js';
import { boxRow } from './_t4.js';
import { SURGERY_WORDS } from '../data/b.js';

const HOW = ' The second number is how many, not where to stop.';
const lines = (w, s, c) => [`string word = "${w}";`, `word.Substring(${s}, ${c})`];
function tapRound(k) {
  const w = pick(SURGERY_WORDS); const s = randInt(0, w.length - 2); const c = randInt(1, Math.min(4, w.length - s)); const piece = w.substr(s, c);
  return {
    title: `Take the piece out. Call ${k} of 8.`, intro: 'Tap exactly the boxes this call takes, then press Check.', intro2: '',
    async run(box, ctx) {
      const sel = new Set(); let done = false;
      const row = boxRow(w, { tap: (i, el) => { if (done) return; if (sel.has(i)) sel.delete(i); else sel.add(i); el.classList.toggle('sel', sel.has(i)); } });
      box.append(codeBlock(lines(w, s, c)).el, row.el);
      let pts = 0; const note = h('span', { class: 'note' }, '');
      await checkButton(ctx, () => {
        if (!sel.size) { note.textContent = 'Tap at least one box first.'; return false; }
        done = true; const want = [...Array(c).keys()].map((n) => n + s);
        const ok = sel.size === c && want.every((i) => sel.has(i));
        row.boxes.forEach((b, i) => { if (want.includes(i)) b.classList.add(sel.has(i) ? 'good' : 'hi'); else if (sel.has(i)) b.classList.add('wrong'); b.disabled = true; });
        if (ok) pts = 1;
        const endRead = c > s && (sel.has(c) || sel.has(c - 1)) && !sel.has(s + c) && sel.size !== c;
        (ok ? sfx.good : sfx.bad)();
        box.append(fb(ok ? 'good' : 'bad', ok ? `Right. It starts at box ${s} and takes ${c}: "${piece}".` : `Not that. Substring(${s}, ${c}) starts at box ${s} and takes ${c}: "${piece}".${endRead ? HOW : ''}`));
      }, 'Check', note);
      await ctx.next();
      return { score: pts, max: 1 };
    },
  };
}
const squash = (t) => t.replace(/\s+/g, '').toLowerCase().replace(/^(word|text)\./, '').replace(/;$/, '');
function typeRound(k) {
  const w = pick(SURGERY_WORDS); const s = randInt(0, w.length - 2); const c = randInt(1, Math.min(4, w.length - s)); const piece = w.substr(s, c);
  const toEnd = s + c === w.length;
  return {
    title: `Write the call. Call ${k} of 8.`, intro: 'The lit boxes are the piece we want. Type the Substring call that takes them, then press Check.', intro2: '',
    async run(box, ctx) {
      const row = boxRow(w); row.boxes.forEach((b, i) => { if (i >= s && i < s + c) b.classList.add('hi'); });
      const input = h('input', { class: 'field mono', type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: 'word.Substring(…)', 'aria-label': 'The Substring call' });
      box.append(codeBlock([`string word = "${w}";`]).el, row.el, h('div', { class: 'valrow' }, input));
      let pts = 0; const note = h('span', { class: 'note' }, '');
      await checkButton(ctx, () => {
        const t = squash(input.value);
        if (!t) { note.textContent = 'Type the call first.'; return false; }
        const two = t === `substring(${s},${c})`; const one = toEnd && t === `substring(${s})`; const ok = two || one;
        input.readOnly = true; input.classList.add(ok ? 'good' : 'bad');
        if (ok) pts = 1; (ok ? sfx.good : sfx.bad)();
        const twoNums = /^substring\(\d+,\d+\)$/.test(t);
        box.append(fb(ok ? 'good' : 'bad', ok ? `Right. "${piece}".${toEnd ? ` Substring(${s}) on its own also runs to the end.` : ''}` : `Not that. The piece starts at box ${s} and is ${c} long, so it is Substring(${s}, ${c}).${twoNums ? HOW : ''}`));
      }, 'Check', note);
      await ctx.next();
      return { score: pts, max: 1 };
    },
  };
}
export default {
  mount(stage, api) {
    const rounds = []; for (let k = 1; k <= 8; k++) rounds.push(k <= 4 ? tapRound(k) : typeRound(k));
    runRounds(stage, api, rounds);
  },
};
