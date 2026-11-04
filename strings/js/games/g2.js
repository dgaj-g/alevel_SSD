// G2 Missing Words: a word bank, sentences with a gap. New sentences each play.
import { h, icon, fb, pick, rich, shuffle, sample, setMark, sfx, scrollIntoViewSoft } from '../../../arcade/engine/ui.js';
import { createBoard } from '../../../arcade/engine/dnd.js';
import { runRounds, checkButton, explain } from '../../../arcade/engine/kit.js';
import { openTerms } from '../../../arcade/engine/locks.js';
import { bridge } from '../../../arcade/engine/bridge.js';
import { BANK } from '../data/g.js';

const GAPS = 6;
export default {
  mount(stage, api) {
    const bank = openTerms(BANK, bridge.embed ? bridge.open : 'ABCDEFGH');
    const chosen = sample(bank, Math.min(GAPS, bank.length));
    const spare = bank.length - chosen.length;
    runRounds(stage, api, [{
      title: 'Fill the gaps',
      intro: spare ? `Drag a word into each gap, or tap a word and then tap a gap. ${spare === 1 ? 'One word is' : `${spare} words are`} left over.` : 'Drag a word into each gap, or tap a word and then tap a gap.',
      intro2: 'Fill every gap, then press Check.',
      async run(box, ctx) {
        const board = createBoard();
        const tray = h('div', { 'data-empty': 'Every gap is filled' });
        board.tray(tray);
        const gaps = [];
        const rows = chosen.map((b) => {
          const [before, after] = pick(b.s).split('___');
          const g = board.slot(h('span', { class: 'gap' }));
          gaps.push({ g, want: b.w });
          return h('div', { class: 'crow' }, h('p', { class: 'ctext' }, rich(before), g, rich(after)));
        });
        shuffle(bank).forEach((b) => tray.appendChild(board.chip(b.w, { w: b.w })));
        box.append(h('div', { class: 'card cloze' }, rows), tray);
        let pts = 0;
        const note = h('span', { class: 'note' }, 'Fill every gap.');
        await checkButton(ctx, () => {
          const empty = gaps.filter((x) => !board.contents(x.g).length).length;
          if (empty) { note.textContent = `${empty} gap${empty > 1 ? 's' : ''} still empty.`; return false; }
          board.lock();
          gaps.forEach((x) => {
            const c = board.contents(x.g)[0];
            const ok = c.__data.w === x.want;
            setMark(c, ok);
            if (ok) pts++;
            else x.g.append(h('span', { class: 'cwant' }, icon('check'), x.want));
          });
          const full = pts === gaps.length;
          (full ? sfx.good : sfx.bad)();
          const f = fb(full ? 'good' : 'bad', `${pts} of ${gaps.length} gaps right.`);
          box.append(f, explain(['These are the words that carry the marks, so learn them exactly.']));
          scrollIntoViewSoft(f);
        }, 'Check', note);
        await ctx.next();
        return { score: pts, max: gaps.length };
      },
    }]);
  },
};
