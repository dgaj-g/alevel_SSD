// E Past Papers: thirteen exam questions on strings. Each cabinet is one question: round 1 is the real question,
// answered then marked by the pupil against the scheme; rounds 2 and 3 drill the same marks.
import { h, icon, codeBlock, codeSpan, codeInline, consolePanel, fb, shuffle, sample, setMark, sfx, para, rich, btn, scrollIntoViewSoft } from '../../../arcade/engine/ui.js';
import { runRounds, checkButton, explain, quizRound, realResult, transcript, playEvents } from '../../../arcade/engine/kit.js';
import { PAPERS } from '../data/e.js';
import { rowsFromCode } from '../data/_q.js';
import { parsonsRound } from './_parsons.js';

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

/* ---------- the paper ---------- */
function paperBlocks(list, model) {
  return list.map(([type, a, b]) => {
    if (type === 'p') return para(a);
    if (type === 'ask') return para(a, 'ask');
    if (type === 'note') return para(a, 'pnote');
    if (type === 'scheme') return para(a, 'pscheme');
    if (type === 'code') return model ? h('div', { class: 'mt-s', style: { marginBottom: '10px' } }, codeBlock(a, { tab: false }).el) : h('pre', { class: 'pcode' }, a.join('\n'));
    if (type === 'ul') return h('ul', null, a.map((t) => h('li', null, rich(t))));
    if (type === 'tasks') return h('ol', null, a.map((t) => h('li', null, rich(t))));
    if (type === 'table') {
      return h('table', null, h('thead', null, h('tr', null, a.map((t) => h('th', null, t)))),
        h('tbody', null, b.map((r) => h('tr', null, r.map((t) => h('td', null, t))))));
    }
    return null;
  });
}
function paperCard(q) {
  return h('div', { class: 'paper' },
    h('div', { class: 'paper-top' },
      h('span', { class: 'paper-tag' }, 'PAST PAPER'),
      h('span', { class: 'paper-name' }, q.paper),
      q.also ? h('span', { class: 'paper-also' }, `(${q.also})`) : null,
      h('span', { class: 'paper-marks', 'aria-label': `${q.marks} marks` }, h('span', null, 'Marks'), h('b', null, String(q.marks)))),
    q.adapted ? h('p', { class: 'paper-adapt' }, 'Adapted: ' + q.adapted) : null,
    paperBlocks(q.blocks));
}
function modelCard(q) {
  return h('div', { class: 'card model-card' },
    h('p', { class: 'bigq', style: { margin: '0 0 8px' } }, `Model answer: ${q.marks} of ${q.marks} marks`),
    h('div', { class: 'stack' }, paperBlocks(q.model, true)));
}

// Round 1 of every paper: answer it, then give yourself the marks point by point. Self-marks are shown, never scored.
function writeRound(q, after) {
  const code = q.kind === 'code';
  return {
    title: 'Answer the question',
    intro: 'This is the real exam question. Answer it as you would on the paper, then mark your own answer against the mark scheme.',
    intro2: code ? 'Type the code in the box. Punctuation and capitals never cost a mark on the paper. Or answer on paper, then press "I wrote it on paper".'
      : 'Write in full sentences, as on the paper. Or answer on paper, then press "I wrote it on paper".',
    async run(box, ctx) {
      const ta = h('textarea', {
        class: 'field' + (code ? ' mono code-in' : ''), rows: code ? 14 : 6, spellcheck: code ? 'false' : 'true',
        autocapitalize: code ? 'off' : null, autocomplete: 'off', id: 'answer-' + q.paper.replace(/\W/g, ''),
        placeholder: code ? 'Your code…' : 'Your answer…',
      });
      if (code) {
        ta.addEventListener('keydown', (e) => {
          if (e.key !== 'Tab' || e.shiftKey) return;
          e.preventDefault();
          const s = ta.selectionStart;
          ta.setRangeText('    ', s, ta.selectionEnd, 'end');
        });
      }
      const wbox = h('div', { class: 'wbox' }, h('label', { for: ta.id }, 'Your answer'), ta);
      box.append(paperCard(q), wbox);
      setTimeout(() => ta.focus({ preventScroll: true }), 80);

      const text = await new Promise((resolve) => {
        const note = h('span', { class: 'note' }, '');
        ctx.setFoot(note,
          btn('I wrote it on paper', () => resolve(''), 'ghost', 'file-pen'),
          btn('Mark my answer', () => {
            if (!ta.value.trim()) { note.textContent = 'Write your answer first.'; ta.focus(); return; }
            resolve(ta.value);
          }, 'primary', 'check'));
      });
      if (!ctx.alive) return null;

      const cap = q.any || q.points.length;
      const rows = q.points.map((p) => {
        const t = makeTog(['Earned', 'Not earned'], p.t.replace(/`/g, ''));
        const spotted = text && p.find && p.find.test(text);
        return {
          t, row: h('div', { class: 'mrow' },
            h('div', { class: 'mlabel' }, para(p.t), spotted ? h('span', { class: 'spot' }, icon('scan-line'), 'Spotted in your answer') : null),
            t.el),
        };
      });
      const total = h('span', { class: 'wtotal' }, '');
      const upd = () => {
        const set = rows.filter((r) => r.t.pick >= 0);
        const got = Math.min(cap, set.filter((r) => r.t.pick === 0).length);
        const left = rows.length - set.length;
        total.textContent = `You: ${got} of ${q.marks} marks` + (left ? ` · ${left} still to mark` : '');
      };
      rows.forEach((r) => { r.t.onChange = upd; });
      upd();
      const mine = text
        ? h('div', { class: 'card' }, h('p', { class: 'note', style: { margin: '0 0 6px' } }, 'Your answer'), h('pre', { class: 'mine' + (code ? ' mono' : '') }, text))
        : h('div', { class: 'card' }, para('Put your paper answer beside you and mark it against the scheme.', 'note'));
      const scheme = h('div', { class: 'card' },
        h('p', { class: 'bigq', style: { margin: '0 0 4px' } }, 'The mark scheme'),
        para(q.any ? `Any ${q.any} of these ${q.points.length} points, one mark each. Give yourself each mark your answer earns.`
          : 'One mark per point. Give yourself each mark your answer earns.', 'note'),
        text && q.points.some((p) => p.find) ? para('"Spotted" only means the words are there. You decide whether the code is right.', 'note') : null,
        h('div', { class: 'mrows' }, rows.map((r) => r.row)),
        h('div', { class: 'mt-s' }, total));
      wbox.replaceWith(h('div', { class: 'split mt' }, h('div', { class: 'stack' }, mine, modelCard(q)), scheme));
      scrollIntoViewSoft(scheme);

      let given = 0;
      const note = h('span', { class: 'note' }, 'Mark every point.');
      await checkButton(ctx, () => {
        const left = rows.filter((r) => r.t.pick < 0).length;
        if (left) { note.textContent = `${left} point${left > 1 ? 's' : ''} still to mark.`; return false; }
        rows.forEach((r) => r.t.lock());
        given = Math.min(cap, rows.filter((r) => r.t.pick === 0).length);
        const f = fb(given === q.marks ? 'good' : 'info', `You gave yourself ${given} of ${q.marks}.`,
          given === q.marks ? 'Full marks. The next two rounds check it from other angles.' : 'The next two rounds drill the marks you missed.');
        box.append(f, explain(q.notes));
        if (after) box.append(after());
        sfx.place();
        scrollIntoViewSoft(f);
      }, 'Done marking', note);
      await ctx.next();
      return { score: 0, max: 0, label: `marked by you: ${given} of ${q.marks} marks` };
    },
  };
}

// Parsons of the model answer: at most twelve lines to place, the rest stay printed.
const MAX_GAPS = 12;
function buildRows(q) {
  const rows = rowsFromCode(q.code.join('\n'));
  const gaps = rows.filter((r) => r.slot);
  gaps.slice(0, Math.max(0, gaps.length - MAX_GAPS)).forEach((r) => { delete r.slot; });
  return rows;
}

export default {
  mount(stage, api, arg) {
    api.wide();
    const q = PAPERS[+arg.slice(1) - 1];
    const seen = q.quiz.find((x) => x.expect && x.expect.out != null);
    const items = sample(q.quiz, Math.min(5, q.quiz.length));
    runRounds(stage, api, [
      writeRound(q),
      parsonsRound({
        title: `Build ${q.method}`,
        intro: `Build the model answer for ${q.method}. The printed lines stay where they are.`,
        rows: buildRows(q),
        traps: [],
        run: { ev: [['out', seen ? seen.expect.out : '']] },
        runNote: seen ? seen.q : 'The finished method:',
        closing: [`This is the code that earns the ${q.marks} ${q.marks === 1 ? 'mark' : 'marks'} on the paper.`],
      }),
      quizRound({
        title: 'What does it do?',
        intro: `Now use the ${q.method} you built in the last round. Work out each answer from the code, then press Check.`,
        items, mono: true,
        show: () => codeBlock(q.code, { tab: false }).el,
      }),
    ]);
  },
};
