// G1 Definition Match, booklet section 12: every open term to its wording.
import { h, icon, fb, shuffle, setMark, sfx, para, rich, scrollIntoViewSoft } from '../../../arcade/engine/ui.js';
import { createBoard } from '../../../arcade/engine/dnd.js';
import { runRounds, checkButton, explain } from '../../../arcade/engine/kit.js';
import { openTerms } from '../../../arcade/engine/locks.js';
import { bridge } from '../../../arcade/engine/bridge.js';
import { TERMS } from '../data/g.js';
import { STRINGS } from '../strings.js';

const label = (t) => t.short || t.term;
export default {
  mount(stage, api) {
    const terms = openTerms(TERMS, bridge.embed ? bridge.open : 'ABCDEFGH');
    const some = terms.length < TERMS.length;
    runRounds(stage, api, [{
      title: 'Match the term to its wording',
      intro: `Drag each term onto its wording, or tap a term and then tap a gap. Every term is used once.${some ? ' ' + STRINGS.fewTerms(terms.length) : ''}`,
      intro2: 'Place every term, then press Check.',
      async run(box, ctx) {
        const board = createBoard();
        const tray = h('div', { 'data-empty': 'Every term is placed' });
        board.tray(tray);
        shuffle(terms).forEach((t) => tray.appendChild(board.chip(label(t), { term: t.term })));
        const rows = shuffle(terms).map((t) => {
          const s = board.slot(h('div', { class: 'dslot' }));
          return { t, s, row: h('div', { class: 'drow' }, s, h('p', { class: 'dword' }, rich(t.wording))) };
        });
        box.append(h('div', { class: 'card drows' }, rows.map((r) => r.row)), tray);
        const note = h('span', { class: 'note' }, 'Place every term.');
        let pts = 0;
        await checkButton(ctx, () => {
          const left = rows.filter((r) => !board.contents(r.s).length).length;
          if (left) { note.textContent = `${left} still to place.`; return false; }
          board.lock();
          rows.forEach((r) => {
            const c = board.contents(r.s)[0];
            const ok = c.__data.term === r.t.term;
            setMark(c, ok);
            if (ok) pts++;
            else r.s.append(h('span', { class: 'cwant' }, icon('check'), label(r.t)));
          });
          const full = pts === rows.length;
          (full ? sfx.good : sfx.bad)();
          const f = fb(full ? 'good' : 'bad', `${pts} of ${rows.length} terms matched.`);
          box.append(f, explain(['Learn each wording exactly as it is here. These are the words that earn the mark.']));
          scrollIntoViewSoft(f);
        }, 'Check', note);
        await ctx.next();
        return { score: pts, max: rows.length };
      },
    }]);
  },
};
