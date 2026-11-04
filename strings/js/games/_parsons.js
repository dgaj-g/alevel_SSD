// Copied from Methods D1 with its wording tidied: fill a board of gaps from a tray of lines and traps.
import { h, icon, codeSpan, codeInline, fb, shuffle, sample, setMark, sfx, para, sameAnswer, scrollIntoViewSoft } from '../../../arcade/engine/ui.js';
import { createBoard } from '../../../arcade/engine/dnd.js';
import { runRounds, checkButton, explain, realResult, transcript } from '../../../arcade/engine/kit.js';

const pad = (d) => '    '.repeat(d);

export function parsonsRound({ title, intro, rows, traps, run, runNote, closing }) {
  return {
    title,
    intro,
    intro2: 'Drag each line into its gap, or tap a line and then tap a gap. Fill every gap, then press Check.',
    async run(box, ctx) {
      const board = createBoard();
      const tray = h('div', { 'data-empty': 'Every gap is filled' });
      board.tray(tray);
      const want = rows.filter((r) => r.slot).map((r) => r.t);
      const chips = [...want.map((t) => board.chip(codeSpan(t), { t }, 'code-chip')),
        ...traps.map((tr) => board.chip(codeSpan(tr.t), { t: tr.t, trap: tr }, 'code-chip'))];
      shuffle(chips).forEach((c) => tray.appendChild(c));
      const slots = [];
      const cboard = h('div', { class: 'codeboard' }, rows.map((r) => {
        if (!r.slot) return h('div', { class: 'crow' }, codeSpan(pad(r.d) + r.t));
        const s = board.slot(h('div', { class: 'cslot d' + r.d }));
        slots.push(s);
        return s;
      }));
      box.append(cboard, tray);
      let pts = 0;
      const note = h('span', { class: 'note' }, 'Fill every gap.');
      await checkButton(ctx, () => {
        const empty = slots.filter((s) => !board.contents(s).length).length;
        if (empty) { note.textContent = `${empty} gap${empty > 1 ? 's' : ''} still empty.`; return false; }
        board.lock();
        const placedTraps = [];
        let misplaced = 0;
        slots.forEach((s, i) => {
          const c = board.contents(s)[0];
          const ok = c.__data.t === want[i];
          setMark(c, ok);
          if (!ok) s.append(h('div', { class: 'cwant' }, icon('check'), codeSpan(want[i])));
          if (ok) pts++;
          else if (c.__data.trap) placedTraps.push(c.__data.trap);
          else misplaced++;
        });
        const full = pts === want.length;
        (full ? sfx.good : sfx.bad)();
        const f = fb(full ? 'good' : 'bad', `${pts} of ${want.length} lines right.`,
          misplaced ? 'A right line in the wrong place still loses the mark.' : '');
        box.append(f);
        placedTraps.forEach((tr) => box.append(h('div', { class: 'card mt' },
          h('p', { class: 'bigq', style: { margin: '0 0 6px' } }, icon('x'), ' ', codeInline(tr.t)),
          para(tr.why),
          h('div', { class: 'mt-s' }, tr.ev ? transcript(tr.ev).el : realResult(tr.expect)))));
        box.append(h('div', { class: 'split mt' },
          h('div', null, para(runNote, 'note'), transcript(run.ev).el),
          explain(closing)));
        scrollIntoViewSoft(f);
      }, 'Check', note);
      await ctx.next();
      return { score: pts, max: want.length };
    },
  };
}

