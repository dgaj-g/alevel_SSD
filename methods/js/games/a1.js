// A1 Squash the Copies — booklet section 2: the notice board pasted four times, then folded into ShowBanner.
import { h, codeBlock, codeSpan, consolePanel, fb, shuffle, choiceSet, setMark, sfx, para } from '../ui.js';
import { createBoard } from '../dnd.js';
import { runRounds, checkButton, explain, outLines } from '../kit.js';
import { PASTE, BANNER, NOTICES, BOARD_OUT } from '../data/a.js';

export default {
  mount(stage, api) {
    runRounds(stage, api, [
      {
        title: 'Spot the copies',
        intro: 'This notice board was written the Topic 1 way. Tap every line that is a pasted copy of the banner, then press Check.',
        intro2: 'The banner is the school\'s name, a line of = signs and a blank line.',
        async run(box, ctx) {
          const lines = ['static void Main(string[] args)', '{', ...PASTE.map((l) => '    ' + l), '}'];
          const marked = new Set();
          const cb = codeBlock(lines, {
            onLine(i, el) {
              if (i < 2 || i === lines.length - 1 || box.dataset.done) return;
              if (marked.has(i)) { marked.delete(i); el.classList.remove('hl'); } else { marked.add(i); el.classList.add('hl'); }
              sfx.tick();
              count.textContent = `${marked.size} marked`;
            },
          });
          const count = h('span', { class: 'note' }, '0 marked');
          box.append(cb.el);
          const isBanner = (i) => i >= 2 && i < lines.length - 1 && BANNER.includes(PASTE[i - 2]);
          let pts = 0;
          await checkButton(ctx, () => {
            box.dataset.done = '1';
            let right = 0, wrong = 0;
            cb.lines.forEach((el, i) => {
              if (i < 2 || i === lines.length - 1) return;
              el.classList.remove('hl');
              if (marked.has(i) && isBanner(i)) { right++; el.classList.add('good'); }
              else if (marked.has(i)) { wrong++; el.classList.add('bad'); }
              else if (isBanner(i)) { el.classList.add('bad'); el.appendChild(h('span', { class: 'why' }, 'missed')); }
            });
            const net = right - wrong;
            pts = net >= 12 ? 3 : net >= 10 ? 2 : net >= 6 ? 1 : 0;
            (pts === 3 ? sfx.good : sfx.bad)();
            box.append(fb(pts === 3 ? 'good' : 'bad', `You found ${right} of the 12 copied lines${wrong ? ` and marked ${wrong} that are not copies` : ''}.`),
              explain(['Twelve of the fifteen lines are the same three lines over and over. Now the school changes its name: four edits — and if you miss one, the board is wrong in one place only, the hardest kind of wrong to spot.']));
          }, 'Check', count);
          await ctx.next();
          return { score: pts, max: 3 };
        },
      },
      {
        title: 'Fold them into one method',
        intro: 'Build the ShowBanner method, then write Main with calls. Drag each line into a gap (or tap a line, then tap a gap). Some lines are not needed.',
        intro2: 'Fill every gap, then press Check.',
        async run(box, ctx) {
          const board = createBoard();
          const tray = h('div', { 'data-empty': 'Every line is placed' });
          board.tray(tray);
          const chips = [];
          const mk = (text, role) => { const c = board.chip(codeSpan(text), { text, role }, 'code-chip'); chips.push(c); return c; };
          BANNER.forEach((t, i) => mk(t, 'b' + i));
          NOTICES.forEach((t, i) => mk(t, 'n' + i));
          for (let i = 0; i < 4; i++) mk('ShowBanner();', 'call');
          mk('ShowBanner;', 'bad-nobrackets');
          mk('showBanner();', 'bad-case');
          shuffle(chips).forEach((c) => tray.appendChild(c));

          const mSlots = [0, 1, 2].map(() => board.slot(h('div', { class: 'cslot' })));
          const mainWant = ['call', 'n0', 'call', 'n1', 'call', 'n2', 'call'];
          const mainSlots = mainWant.map(() => board.slot(h('div', { class: 'cslot' })));
          const row = (t) => h('div', { class: 'crow' }, codeSpan(t));
          const cboard = h('div', { class: 'codeboard' },
            h('div', { class: 'cap' }, 'Above Main, inside the class'),
            row('public static void ShowBanner()'), row('{'), mSlots, row('}'), row(' '),
            h('div', { class: 'cap' }, 'Inside Main'),
            row('static void Main(string[] args)'), row('{'), mainSlots, row('}'));
          box.append(cboard, tray);

          let pts = 0;
          const gapNote = h('span', { class: 'note' }, 'Fill every gap.');
          await checkButton(ctx, () => {
            const all = [...mSlots, ...mainSlots];
            if (all.some((s) => !board.contents(s).length)) { gapNote.textContent = 'Fill every gap first.'; return false; }
            board.lock();
            const notes = new Set();
            mSlots.forEach((s, i) => {
              const c = board.contents(s)[0]; const ok = c.__data.role === 'b' + i;
              setMark(c, ok); if (ok) pts++;
            });
            mainSlots.forEach((s, i) => {
              const c = board.contents(s)[0]; const role = c.__data.role; const ok = role === mainWant[i];
              setMark(c, ok); if (ok) pts++;
              if (role === 'bad-nobrackets') notes.add('`ShowBanner;` — no brackets. A call needs its brackets: C# refuses with CS0201 "Only assignment, call, increment, decrement, await, and new object expressions can be used as a statement".');
              if (role === 'bad-case') notes.add('`showBanner();` — a small s. C# is fussy about capitals: CS0103 "The name \'showBanner\' does not exist in the current context".');
            });
            const full = pts === 10;
            (full ? sfx.good : sfx.bad)();
            const con = consolePanel();
            outLines(BOARD_OUT).forEach((l) => con.print(l));
            box.append(
              fb(full ? 'good' : 'bad', `${pts} of 10 gaps right.`, full ? 'Same output as before — the school\'s name now lives on one line.' : 'The ticks and crosses show which gaps are wrong. The fixed program prints this:'),
              notes.size ? explain([...notes]) : '',
              h('div', { class: 'mt' }, con.el),
              explain(['A named block of code that does one job is a method. The block goes ABOVE Main, inside the class; the four calls go inside Main.']));
          }, 'Check', gapNote);
          await ctx.next();
          return { score: pts, max: 10 };
        },
      },
      {
        title: 'Two quick questions',
        async run(box, ctx) {
          const qs = [
            { q: 'The school changes its name. With ShowBanner, how many lines of code do you edit?', options: ['1', '4', '12', '15'], a: '1',
              why: 'One. The school\'s name now lives on one line, inside ShowBanner. Every call prints the new name.' },
            { q: 'Where does the ShowBanner method go?', options: ['Inside the class, above Main', 'Inside Main, above the calls', 'Inside Main, after the last call', 'Inside the first call'], a: 'Inside the class, above Main',
              why: 'Inside the class, never inside Main. A public static method typed inside Main will not build.' },
          ];
          const sets = qs.map((q) => {
            const opts = shuffle(q.options);
            const cs = choiceSet(opts);
            box.append(h('div', { class: 'card' }, para(q.q, 'bigq'), cs.el));
            return { q, cs, opts };
          });
          let pts = 0;
          await checkButton(ctx, () => {
            if (sets.some((s) => s.cs.value() < 0)) return false;
            sets.forEach((s) => {
              const right = s.opts.indexOf(s.q.a);
              s.cs.lock(right);
              if (s.cs.value() === right) pts++;
              s.cs.el.after(fb(s.cs.value() === right ? 'good' : 'bad', s.q.why));
            });
            (pts === 2 ? sfx.good : sfx.bad)();
          }, 'Check', 'Answer both.');
          await ctx.next();
          return { score: pts, max: 2 };
        },
      },
    ]);
  },
};
