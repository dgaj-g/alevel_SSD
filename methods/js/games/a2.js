// A2 Advantages Sort — "Give three advantages of using methods" (2015 Q2(a), 2019 Q2(a)).
import { h, icon, fb, shuffle, choiceSet, setMark, sfx, para } from '../ui.js';
import { createBoard } from '../dnd.js';
import { runRounds, checkButton, explain } from '../kit.js';
import { ADVANTAGES, UPGRADES } from '../data/a.js';

export default {
  mount(stage, api) {
    runRounds(stage, api, [
      {
        title: 'Would it earn the mark?',
        intro: 'The exam asks: "Give three advantages of using methods." Sort each answer a pupil wrote. Drag it (or tap it, then tap a box).',
        intro2: 'Place every answer, then press Check.',
        async run(box, ctx) {
          const board = createBoard();
          const yes = h('div', null, h('h4', null, icon('check'), 'Earns the mark'));
          const no = h('div', null, h('h4', null, icon('x'), 'Does not earn the mark'));
          board.bucket(yes); board.bucket(no);
          const tray = h('div', { 'data-empty': 'Every answer is sorted' });
          board.tray(tray);
          shuffle(ADVANTAGES).forEach((a) => tray.appendChild(board.chip(a.t, a, 'long')));
          box.append(h('div', { class: 'buckets' }, yes, no), tray);
          let pts = 0;
          const note = h('span', { class: 'note' }, 'Sort every answer.');
          await checkButton(ctx, () => {
            if (board.contents(tray).length) { note.textContent = `${board.contents(tray).length} still to sort.`; return false; }
            board.lock();
            const whys = [];
            [[yes, true], [no, false]].forEach(([b, want]) => board.contents(b).forEach((c) => {
              const ok = c.__data.ok === want;
              setMark(c, ok);
              if (ok) pts++;
              else whys.push(c.__data.ok ? `"${c.__data.t}" — this earns the mark. It is one of the five phrases on the scheme.` : `"${c.__data.t}" — ${c.__data.why}`);
            }));
            (pts === ADVANTAGES.length ? sfx.good : sfx.bad)();
            box.append(fb(pts === ADVANTAGES.length ? 'good' : 'bad', `${pts} of ${ADVANTAGES.length} sorted right.`),
              whys.length ? explain(whys) : null,
              explain(['Any three of these five phrases: reuse of code — the same lines are written once and used wherever they are needed · structured design that simplifies the solution — a big problem broken into named jobs · several developers can work on different methods at once · faster development · simpler testing — each method can be tested on its own.',
                'Write a phrase, not a word.']));
          }, 'Check', note);
          await ctx.next();
          return { score: pts, max: ADVANTAGES.length };
        },
      },
      {
        title: 'Upgrade the answer',
        intro: 'Each answer below was refused a mark. Pick the rewrite that would earn it.',
        async run(box, ctx) {
          const sets = shuffle(UPGRADES).map((u) => {
            const opts = shuffle(u.options);
            const cs = choiceSet(opts, { cols: 1 });
            box.append(h('div', { class: 'card' }, para(`A pupil wrote: **${u.weak}**`, 'bigq'), cs.el));
            return { u, cs, right: opts.indexOf(u.options[0]) };
          });
          let pts = 0;
          await checkButton(ctx, () => {
            if (sets.some((s) => s.cs.value() < 0)) return false;
            sets.forEach((s) => { s.cs.lock(s.right); if (s.cs.value() === s.right) pts++; });
            (pts === sets.length ? sfx.good : sfx.bad)();
            box.append(fb(pts === sets.length ? 'good' : 'bad', `${pts} of ${sets.length} right.`, 'A one-word answer names a topic; the mark goes to the phrase that says what the advantage IS.'));
          }, 'Check', 'Answer all four.');
          await ctx.next();
          return { score: pts, max: sets.length };
        },
      },
    ]);
  },
};
