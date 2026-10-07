// C1 Swap Trace — booklet section 5 and deck Activity 9: trace the swap trap with new numbers every time,
// then say why x and y never change, then judge copy-or-original programs.
import { h, icon, codeBlock, consolePanel, fb, shuffle, sample, randInt, setMark, sfx, para, btn, sameAnswer, scrollIntoViewSoft } from '../ui.js';
import { createBoard } from '../dnd.js';
import { runRounds, checkButton, explain, programLines, quizRound, realResult } from '../kit.js';
import { SWAP, SWAP_MAIN, EARN, COPY } from '../data/c.js';

const DASH = '–';
const isDash = (v) => /^\s*[-–—_]+\s*$/.test(v);

function traceRound(api) {
  return {
    title: 'Trace the swap',
    intro: 'Fill the trace table: the value of each variable AFTER each line runs. Type – for a variable that does not exist at that moment.',
    intro2: 'The first row is done for you. New numbers every time you play.',
    async run(box, ctx) {
      api.wide();
      let x = randInt(10, 60), y = randInt(10, 99);
      while (y === x || Math.abs(x - y) < 5) y = randInt(10, 99);
      const D = DASH;
      const rows = [
        ['int x = X; int y = Y;', [x, y, D, D, D], true],
        ['Swap(x, y);  (copies go in)', [x, y, x, y, D]],
        ['int temp = a;', [x, y, x, y, x]],
        ['a = b;', [x, y, y, y, x]],
        ['b = temp;', [x, y, y, x, x]],
        ['}  (the end of Swap)', [x, y, D, D, D]],
      ];
      let lastFocus = null;
      const cells = [];
      const tbody = h('tbody', null, rows.map(([label, vals, given], r) => {
        const tr = h('tr', null, h('td', null, label.replace('X', x).replace('Y', y)));
        vals.forEach((v, c) => {
          if (given) { tr.append(h('td', { class: 'given' }, String(v))); return; }
          const inp = h('input', { type: 'text', inputmode: 'text', autocomplete: 'off', spellcheck: 'false', maxlength: '4',
            'aria-label': `${['x', 'y', 'a', 'b', 'temp'][c]} after ${label.replace(/\s+\(.*/, '')}` });
          inp.addEventListener('focus', () => { lastFocus = inp; tbody.querySelectorAll('tr').forEach((t) => t.classList.remove('cur')); tr.classList.add('cur'); });
          inp.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); const i = cells.findIndex((q) => q.inp === inp); const nx = cells[i + 1]; if (nx) nx.inp.focus(); else afterInp.focus(); }
          });
          const td = h('td', null, inp);
          cells.push({ inp, want: v, td });
          tr.append(td);
        });
        return tr;
      }));
      const table = h('table', { class: 'trace' },
        h('thead', null, h('tr', null, h('th', null, 'After this line runs'), ['x', 'y', 'a', 'b', 'temp'].map((n) => h('th', null, n)))), tbody);
      const dashKey = btn(`Type ${DASH}`, () => {
        const t = lastFocus && !lastFocus.disabled ? lastFocus : cells.find((q) => !q.inp.value)?.inp;
        if (!t) return;
        t.value = DASH;
        const i = cells.findIndex((q) => q.inp === t);
        (cells[i + 1]?.inp || afterInp).focus();
      }, 'small ghost');
      const afterInp = h('input', { class: 'field mono', type: 'text', autocomplete: 'off', spellcheck: 'false', placeholder: 'After: …', 'aria-label': 'What the After line prints' });
      const res = h('div');
      box.append(
        h('div', { class: 'split' },
          codeBlock(programLines({ methods: SWAP, main: SWAP_MAIN(x, y) })).el,
          h('div', null,
            h('div', { class: 'card', style: { overflowX: 'auto', padding: '10px 8px' } }, table,
              h('div', { class: 'row mt-s', style: { gap: '10px', alignItems: 'center' } }, dashKey, h('span', { class: 'note' }, '– means the variable does not exist yet, or has gone.'))),
            h('div', { class: 'card' }, para('And the last line of Main prints:', 'bigq'), afterInp))),
        res);
      setTimeout(() => cells[0].inp.focus({ preventScroll: true }), 80);
      let pts = 0;
      const max = cells.length + 1;
      await checkButton(ctx, () => {
        const empty = cells.find((q) => !q.inp.value.trim()) || (!afterInp.value.trim() ? { inp: afterInp } : null);
        if (empty) { empty.inp.focus(); return false; }
        cells.forEach((q) => {
          q.inp.disabled = true;
          const v = q.inp.value.trim();
          const ok = q.want === DASH ? isDash(v) : v === String(q.want);
          if (ok) pts++;
          q.inp.classList.add(ok ? 'good' : 'bad');
          if (!ok) q.td.append(h('span', { class: 'want' }, String(q.want)));
        });
        afterInp.disabled = true;
        const want = `After: x = ${x}, y = ${y}`;
        const aOk = sameAnswer(afterInp.value, want) || sameAnswer(afterInp.value.replace(/^after:?\s*/i, ''), `x = ${x}, y = ${y}`);
        if (aOk) pts++;
        afterInp.classList.add(aOk ? 'good' : 'bad');
        tbody.querySelectorAll('tr').forEach((t) => t.classList.remove('cur'));
        (pts === max ? sfx.good : sfx.bad)();
        const con = consolePanel();
        con.print(`Before: x = ${x}, y = ${y}`); con.print(want);
        const f = fb(pts === max ? 'good' : 'bad', `${pts} of ${max} right.`, aOk ? null : `The last line prints ${want} — nothing changed.`);
        res.append(f, h('div', { class: 'split mt' }, con.el, explain([
          `Inside Swap the copies really are swapped: a ends as ${y} and b as ${x}.`,
          'Then the method ends, a, b and temp are thrown away — and x and y in Main were never touched. That is pass by value: the method works on a copy.'])));
        scrollIntoViewSoft(f);
      }, 'Check', 'Fill every cell.');
      await ctx.next();
      return { score: pts, max };
    },
  };
}

const earnRound = {
  title: 'Would it earn the mark?',
  intro: 'The exam asks why x and y do not change. Sort each sentence a pupil wrote. Drag it, or tap it and then tap a box.',
  intro2: 'Place every sentence, then press Check.',
  async run(box, ctx) {
    const items = shuffle([...sample(EARN.filter((e) => e.ok), 4), ...sample(EARN.filter((e) => !e.ok), 4)]);
    const board = createBoard();
    const yes = h('div', null, h('h4', null, icon('check'), 'Earns the mark'));
    const no = h('div', null, h('h4', null, icon('x'), 'Does not earn it'));
    board.bucket(yes); board.bucket(no);
    const tray = h('div', { 'data-empty': 'Every sentence is sorted' });
    board.tray(tray);
    items.forEach((e) => tray.appendChild(board.chip(e.t, e, 'long')));
    box.append(h('div', { class: 'buckets' }, yes, no), tray);
    let pts = 0;
    const note = h('span', { class: 'note' }, 'Sort every sentence.');
    await checkButton(ctx, () => {
      const left = board.contents(tray).length;
      if (left) { note.textContent = `${left} still to sort.`; return false; }
      board.lock();
      const whys = [];
      [[yes, true], [no, false]].forEach(([b, want]) => board.contents(b).forEach((c) => {
        const ok = c.__data.ok === want;
        setMark(c, ok);
        if (ok) pts++;
        else whys.push(c.__data.ok ? `"${c.__data.t}" — this earns it: it says a COPY is passed, or that x and y are not affected.` : `"${c.__data.t}" — ${c.__data.why}`);
      }));
      (pts === items.length ? sfx.good : sfx.bad)();
      box.append(fb(pts === items.length ? 'good' : 'bad', `${pts} of ${items.length} sorted right.`),
        whys.length ? explain(whys) : '',
        explain(['The examiner\'s wording: "The method receives a COPY of the value" · "changes to the parameter do not affect the original variable" · "the variables in Main are unchanged". Any of these, in a full sentence, earns the mark.']));
    }, 'Check', note);
    await ctx.next();
    return { score: pts, max: items.length };
  },
};

export default {
  mount(stage, api) {
    runRounds(stage, api, [
      traceRound(api),
      earnRound,
      quizRound({
        title: 'Copy or original?',
        intro: 'Each program passes a variable to a method. Does the variable in Main change?',
        items: shuffle(COPY),
        show: (it) => codeBlock(programLines(it.cs)).el,
        after: (it) => h('div', { class: 'mt' }, realResult(it.expect)),
      }),
    ]);
  },
};
