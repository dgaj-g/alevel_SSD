// A2 char or string?: sort each value by its quotes, including those that will not compile.
import { h, icon, codeSpan, fb, shuffle, setMark, sfx } from '../../../arcade/engine/ui.js';
import { createBoard } from '../../../arcade/engine/dnd.js';
import { runRounds, checkButton, explain } from '../../../arcade/engine/kit.js';
import { QUOTES } from '../data/a.js';

export default {
  mount(stage, api) {
    runRounds(stage, api, [{
      title: 'What does each value make?',
      intro: 'Drag each value into its box, or tap it and then tap a box.',
      intro2: 'Place all ten, then press Check.',
      async run(box, ctx) {
        const board = createBoard();
        const bucket = (label, ic) => h('div', null, h('h4', null, icon(ic), label));
        const B = { char: bucket('A `char`'.replace(/`/g, ''), 'type'), string: bucket('A string', 'quote'), none: bucket('Will not compile', 'x') };
        Object.values(B).forEach((b) => board.bucket(b));
        const tray = h('div', { 'data-empty': 'Every value is sorted' }); board.tray(tray);
        shuffle(QUOTES).forEach((q) => tray.appendChild(board.chip(codeSpan(q.v), q, 'code-chip')));
        box.append(tray, h('div', { class: 'buckets' }, Object.values(B)));
        let pts = 0;
        const note = h('span', { class: 'note' }, 'Place every value first.');
        await checkButton(ctx, () => {
          const left = board.contents(tray).length;
          if (left) { note.textContent = `${left} still to place.`; return false; }
          board.lock(); const whys = [];
          Object.entries(B).forEach(([k, b]) => board.contents(b).forEach((c) => { const ok = c.__data.type === k; setMark(c, ok); if (ok) pts++; else whys.push(`\`${c.__data.v}\`: ${c.__data.why}`); }));
          (pts === 10 ? sfx.good : sfx.bad)();
          box.append(fb(pts === 10 ? 'good' : 'bad', `${pts} of 10 sorted right.`), whys.length ? explain(whys) : '');
        }, 'Check', note);
        await ctx.next();
        return { score: pts, max: 10 };
      },
    }]);
  },
};
