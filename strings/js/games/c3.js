// C3 Random Range: which numbers can each Next call give, and which call gives the range we want?
import { h, icon, codeBlock, codeSpan, fb, shuffle, setMark, sfx } from '../../../arcade/engine/ui.js';
import { createBoard } from '../../../arcade/engine/dnd.js';
import { runRounds, checkButton, explain } from '../../../arcade/engine/kit.js';
import { answersRound } from './_t4.js';
import { NEXT_CHIPS, NEXT_ROUNDS } from '../data/c.js';

const sortRound = (R, k) => ({
  title: `What can this call give? Call ${k} of 2.`,
  intro: 'Drag each number into its box, or tap it and then tap a box.', intro2: 'Place all six, then press Check.',
  async run(box, ctx) {
    const board = createBoard();
    const yes = h('div', null, h('h4', null, icon('check'), 'Can come out')); const no = h('div', null, h('h4', null, icon('x'), 'Can never come out'));
    board.bucket(yes); board.bucket(no);
    const tray = h('div', { 'data-empty': 'Every number is placed' }); board.tray(tray);
    shuffle(NEXT_CHIPS).forEach((n) => tray.appendChild(board.chip(codeSpan(String(n)), n, 'code-chip')));
    box.append(codeBlock(['Random random = new Random();', `int n = ${R.call};`]).el, tray, h('div', { class: 'buckets' }, yes, no));
    let pts = 0; const note = h('span', { class: 'note' }, '');
    await checkButton(ctx, () => {
      const left = board.contents(tray).length;
      if (left) { note.textContent = `${left} still to place.`; return false; }
      board.lock();
      [[yes, true], [no, false]].forEach(([b, can]) => board.contents(b).forEach((c) => { const n = c.__data; const ok = (n >= R.lo && n <= R.hi) === can; setMark(c, ok); if (ok) pts++; }));
      (pts === 6 ? sfx.good : sfx.bad)();
      box.append(fb(pts === 6 ? 'good' : 'bad', `${pts} of 6 numbers right.`), explain([R.why]));
    }, 'Check', note);
    await ctx.next();
    return { score: pts, max: 6 };
  },
});
export default {
  mount(stage, api) {
    runRounds(stage, api, [sortRound(NEXT_ROUNDS[0], 1), sortRound(NEXT_ROUNDS[1], 2),
      answersRound({ title: 'Write the call', intro: 'Type the call on `random` that gives a whole number from 1 to 6.', intro2: 'Type it, then press Check.',
        items: () => [{ answer: 'random.Next(1, 7)', kind: 'expr', alts: ['Next(1, 7)'], why: 'The second number never comes out, so 6 needs a 7. `Next(1, 6)` stops at 5.' }] }),
      answersRound({ title: 'Count the values', intro: 'How many different values can `random.Next(10, 20)` give? Type the number of values.', intro2: 'Type it, then press Check.',
        items: () => [{ answer: '10', kind: 'num', why: 'It gives 10 to 19, and that is ten different values.' }] }),
    ]);
  },
};
