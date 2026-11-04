// F1 to F4 The practicals, booklet section 11. Each practical is built step by step from its brief (every wrong line
// shows what it really does), then played, then written on your own and self-marked, then its common slips.
import { h, icon, codeBlock, codeSpan, fb, shuffle, sample, sfx, para, btn, choiceSet, scrollIntoViewSoft } from '../../../arcade/engine/ui.js';
import { runRounds, checkButton, explain, quizRound, realResult, transcript } from '../../../arcade/engine/kit.js';
import { PRACTICALS } from '../data/f.js';

const resultOf = (r) => (r.ev ? transcript(r.ev).el : realResult(r.expect));

function makeTog(labels, aria) {
  let pick = -1;
  const bs = labels.map((l) => h('button', { type: 'button', 'aria-pressed': 'false' }, l));
  const el = h('div', { class: 'tog', role: 'group', 'aria-label': aria }, bs);
  const t = {
    el, get pick() { return pick; }, onChange: null,
    lock() { bs.forEach((b) => { b.disabled = true; }); },
  };
  bs.forEach((b, i) => b.addEventListener('click', () => {
    pick = i;
    bs.forEach((x, j) => { x.classList.toggle('on', j === i); x.setAttribute('aria-pressed', String(j === i)); });
    if (t.onChange) t.onChange();
  }));
  return t;
}

/* ---------- Round: build it step by step ---------- */
// Fills the template, remembering which gap every line came from, then lays it out as the pupil sees it.
function viewOf(P, pick) {
  const out = { methods: [], main: [] };
  for (const part of ['methods', 'main']) {
    for (const l of P[part].split('\n')) {
      const m = /^(\s*)\{\{(\d+)\}\}$/.exec(l);
      if (!m) { out[part].push([l, 0]); continue; }
      const k = +m[2];
      const t = pick(k);
      const text = t == null ? `// step ${P.steps.findIndex((s) => s.k === k) + 1}` : t === '' ? '// (nothing here)' : t;
      text.split('\n').forEach((x) => out[part].push([m[1] + x, k]));
    }
  }
  const rows = [...out.methods, ['', 0], ['static void Main(string[] args)', 0], ['{', 0], ...out.main.map(([l, k]) => [l ? '    ' + l : l, k]), ['}', 0]];
  return rows;
}

function buildRound(P) {
  return {
    title: 'Build it step by step',
    intro: P.building,
    intro2: 'Choose the right line for each step. Your program fills in as you choose. When every step has a line, press Check: every wrong line shows what it really does.',
    async run(box, ctx) {
      const picks = new Map();
      const stepCards = P.steps.map((s, i) => {
        const opts = shuffle([{ t: s.line, ok: true }, ...s.wrong]);
        const cs = choiceSet(opts.map((o) => (o.t === '' ? h('span', { class: 'nothing' }, o.show || '(nothing)') : codeSpan(o.t))), {
          mono: true, cols: 1,
          onPick: (j) => { picks.set(s.k, opts[j]); render(s.k); },
        });
        const card = h('div', { class: 'card step' },
          h('p', { class: 'note', style: { margin: '0 0 4px' } }, `Step ${i + 1} of ${P.steps.length} · ${s.at}`),
          para(s.brief, 'bigq'), cs.el);
        return { s, opts, cs, card };
      });
      const progBox = h('div', { class: 'prac-prog' });
      let lineEls = [];
      function render(flashK) {
        const rows = viewOf(P, (k) => (picks.has(k) ? picks.get(k).t : null));
        const cb = codeBlock(rows.map((r) => r[0]), { title: 'Program.cs: your program' });
        rows.forEach(([, k], i) => {
          if (!k) return;
          cb.lines[i].classList.add(picks.has(k) ? 'gapfill' : 'gapln');
          cb.lines[i].dataset.k = k;
        });
        progBox.replaceChildren(cb.el);
        lineEls = cb.lines;
        if (flashK) {
          const first = cb.lines.find((l) => l.dataset.k === String(flashK));
          if (first) {
            first.classList.add('flash');
            const pre = cb.el.querySelector('pre');
            if (pre.scrollHeight > pre.clientHeight + 4) pre.scrollTop = first.offsetTop - pre.clientHeight / 2;
          }
        }
      }
      render();
      const steps = h('div', { class: 'stack' }, stepCards.map((c) => c.card));
      box.append(h('div', { class: 'split prac-build' }, steps, progBox));
      let pts = 0;
      const note = h('span', { class: 'note' }, 'Choose a line for every step.');
      await checkButton(ctx, () => {
        const left = P.steps.filter((s) => !picks.has(s.k)).length;
        if (left) { note.textContent = `${left} step${left > 1 ? 's' : ''} still to choose.`; return false; }
        stepCards.forEach(({ s, opts, cs, card }) => {
          cs.lock(opts.findIndex((o) => o.ok));
          const p = picks.get(s.k);
          if (p.ok) { pts++; return; }
          card.append(fb('bad', p.why), h('div', { class: 'mt-s' }, para('What the program does with that line:', 'note'), resultOf(p)));
        });
        lineEls.forEach((l) => { if (l.dataset.k) l.classList.add(picks.get(+l.dataset.k).ok ? 'good' : 'bad'); });
        const full = pts === P.steps.length;
        (full ? sfx.good : sfx.bad)();
        const f = fb(full ? 'good' : 'bad', `${pts} of ${P.steps.length} steps right.`,
          full ? 'Your program is the booklet\'s program.' : 'Each wrong step is marked above, with what it really does.');
        box.append(f, h('div', { class: 'split mt' },
          h('div', null, para(`The finished program, run with ${P.bookIn.filter(Boolean).join(', ')}:`, 'note'), resultOf(P.run)),
          explain(P.closing)));
        scrollIntoViewSoft(f);
      }, 'Check', note);
      await ctx.next();
      return { score: pts, max: P.steps.length };
    },
  };
}


function ownRound(O, title) {
  return {
    title,
    intro: 'Now on your own. Write the code, then check it against the list and the model answer.',
    intro2: 'Type it in the box. Punctuation and capitals never cost a mark here. Or write it on paper, then press "I wrote it on paper".',
    async run(box, ctx) {
      const runs = O.runs ? O.runs : [O];
      const ta = h('textarea', { class: 'field mono code-in', rows: 14, spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off', id: 'own-answer', placeholder: 'Your code…' });
      ta.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab' || e.shiftKey) return;
        e.preventDefault();
        ta.setRangeText('    ', ta.selectionStart, ta.selectionEnd, 'end');
      });
      const task = h('div', { class: 'card' }, h('p', { class: 'bigq', style: { margin: '0 0 6px' } }, 'The task'), O.problem.map((t) => para(t)));
      const target = h('div', { class: 'stack' }, para(runs.length > 1 ? 'When it works, the two runs look like this:' : 'When it works, the run looks like this:', 'note'),
        runs.map((r) => resultOf(r)));
      const wbox = h('div', { class: 'wbox mt' }, h('label', { for: ta.id }, 'Your code'), ta);
      box.append(h('div', { class: 'split' }, task, target), wbox);
      const text = await new Promise((resolve) => {
        const note = h('span', { class: 'note' }, '');
        ctx.setFoot(note,
          btn('I wrote it on paper', () => resolve(''), 'ghost', 'file-pen'),
          btn('Check my code', () => {
            if (!ta.value.trim()) { note.textContent = 'Write your code first.'; ta.focus(); return; }
            resolve(ta.value);
          }, 'primary', 'check'));
      });
      if (!ctx.alive) return null;
      const rows = O.points.map((p) => {
        const t = makeTog(['Yes', 'No'], p.t.replace(/`/g, ''));
        const spotted = text && p.find && new RegExp(p.find).test(text);
        return { t, row: h('div', { class: 'mrow' },
          h('div', { class: 'mlabel' }, para(p.t), spotted ? h('span', { class: 'spot' }, icon('scan-line'), 'Spotted in your code') : null), t.el) };
      });
      const total = h('span', { class: 'wtotal' }, '');
      const upd = () => {
        const set = rows.filter((r) => r.t.pick >= 0);
        const left = rows.length - set.length;
        total.textContent = `You: ${set.filter((r) => r.t.pick === 0).length} of ${rows.length}` + (left ? ` · ${left} still to check` : '');
      };
      rows.forEach((r) => { r.t.onChange = upd; });
      upd();
      const mine = text
        ? h('div', { class: 'card' }, h('p', { class: 'note', style: { margin: '0 0 6px' } }, 'Your code'), h('pre', { class: 'mine mono' }, text))
        : h('div', { class: 'card' }, para('Put your paper answer beside you and check it against the list.', 'note'));
      const model = h('div', { class: 'card model-card' }, h('p', { class: 'bigq', style: { margin: '0 0 8px' } }, 'Model answer'), codeBlock(O.model, { title: 'Program.cs' }).el);
      const list = h('div', { class: 'card' },
        h('p', { class: 'bigq', style: { margin: '0 0 4px' } }, 'Does your code have…'),
        text && O.points.some((p) => p.find) ? para('"Spotted" only means the words are there. You decide whether the code is right.', 'note') : null,
        h('div', { class: 'mrows' }, rows.map((r) => r.row)),
        h('div', { class: 'mt-s' }, total));
      wbox.replaceWith(h('div', { class: 'split mt' }, h('div', { class: 'stack' }, mine, model), list));
      scrollIntoViewSoft(list);
      let given = 0;
      const note = h('span', { class: 'note' }, 'Answer every line.');
      await checkButton(ctx, () => {
        const left = rows.filter((r) => r.t.pick < 0).length;
        if (left) { note.textContent = `${left} line${left > 1 ? 's' : ''} still to answer.`; return false; }
        rows.forEach((r) => r.t.lock());
        given = rows.filter((r) => r.t.pick === 0).length;
        const full = given === rows.length;
        const f = fb(full ? 'good' : 'info', `You ticked ${given} of ${rows.length}.`,
          full ? 'All there. The next round shows the slips people make with it.' : 'The next round shows the slips people make with it. Watch for yours.');
        box.append(f, explain(O.notes));
        sfx.place();
        scrollIntoViewSoft(f);
      }, 'Done checking', note);
      await ctx.next();
      return { score: 0, max: 0, label: `checked by you: ${given} / ${rows.length}` };
    },
  };
}

/* ---------- Round: slips, what does each version do? ---------- */

function slipsRound({ title = 'Spot the slip', intro, versions, outcomes, n, view, note }) {
  let items = sample(versions, Math.min(n, versions.length));
  if (!items.some((v) => v.a === 0)) items[items.length - 1] = versions.find((v) => v.a === 0);
  items = shuffle(items);
  return quizRound({
    title, intro,
    intro2: 'Each version has one change, or none. What happens when it runs? Every answer is checked against the real program.',
    items: items.map((v) => ({ ...v, options: outcomes, q: 'What happens?' })),
    cols: 1,
    show: (it) => h('div', null, note ? para(note, 'note') : null, codeBlock(view(it), { title: 'Program.cs' }).el),
    after: (it) => h('div', { class: 'mt' }, para('What it really does:', 'note'), resultOf(it)),
  });
}

/* ---------- the four practicals ---------- */
const lines = (s) => s.split('\n');
export default {
  mount(stage, api, arg) {
    api.wide();
    const P = PRACTICALS.find((p) => p.id === arg);
    const S = P.slipSet;
    runRounds(stage, api, [
      buildRound(P),
      ownRound(P.own, P.own.title),
      slipsRound({ intro: S.intro, note: S.note, versions: S.versions, outcomes: S.outcomes, n: 5, view: (it) => lines(it.code) }),
    ]);
  },
};
