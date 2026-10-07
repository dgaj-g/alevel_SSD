// D3 Be the User — booklet section 8's program, run live: three EnterNumber calls, and you are the one typing.
// Five missions (every error message, the smallest entries, crash it, crash it with a number, a sneaky number),
// then sort entries into accepted or crash. The console follows the same rules as dotnet (SIM_CASES prove it).
import { h, icon, codeBlock, consolePanel, fb, shuffle, sample, setMark, sfx, btn, scrollIntoViewSoft } from '../ui.js';
import { createBoard } from '../dnd.js';
import { runRounds, checkButton, explain, programLines, playEvents } from '../kit.js';
import { ENTER_NUMBER, BOOK_CALLS, BOOK_FMT, BOOK_MAIN, runCalls, ENTRY_SORT } from '../data/d.js';

// Main first, so the three calls (and their ranges) sit at the top beside the console. C# does not mind the order.
const MAIN_LINES = programLines({ main: BOOK_MAIN });
const LINES = [...MAIN_LINES, '', ...ENTER_NUMBER.split('\n')];
const CALL_LINE = Object.fromEntries(BOOK_CALLS.map((c) => [c.name, LINES.findIndex((l) => l.includes(`int ${c.name} =`))]));
const LABEL = { age: 'Age', year: 'Year group', born: 'Year of birth' };
const BOOKLET = 'The booklet: "A word instead of a number still crashes Convert.ToInt32; that is fixed in Topic 10."';
const shown = (s) => (s === '' ? '(nothing — just Enter)' : `"${s}"`);
const errorsAt = (r) => new Set(r.log.filter((x) => x.ok === false).map((x) => x.call));
const accepted = (r) => r.log.filter((x) => x.ok);

// Each mission: goals (lines shown beside the console), met(run) → true when the run achieves it, hint(run) → why not.
const MISSIONS = [
  {
    title: 'Every error message',
    goals: ['Get an error message from all three questions.', 'Then let the program finish — no crash.'],
    met: (r) => !r.crashed && errorsAt(r).size === 3,
    hint(r) {
      if (r.crashed) return 'It crashed, so it never finished. Errors come from numbers outside the range — not from words.';
      const miss = BOOK_CALLS.filter((c) => !errorsAt(r).has(c.name)).map((c) => LABEL[c.name]);
      return `No error message from: ${miss.join(', ')}. Read the call in Main — what range does each question accept?`;
    },
    show: ['10', '15', '7', '8', '1999', '2000'],
    why: ['The error message is printed by the if. The while then sends it round again, so the SAME question is asked until the answer is in range.',
      'Three calls, three ranges, one method: the range comes in through the parameters min and max.'],
  },
  {
    title: 'The smallest',
    goals: ['Give each question the SMALLEST number it accepts.', 'No error messages at all.'],
    met: (r) => !r.crashed && errorsAt(r).size === 0 && BOOK_CALLS.every((c) => r.vals[c.name] === c.min),
    hint(r) {
      if (r.crashed) return 'It crashed. This mission needs three numbers that are accepted.';
      const errs = [...errorsAt(r)].map((n) => LABEL[n]);
      const big = BOOK_CALLS.filter((c) => r.vals[c.name] !== c.min).map((c) => `${LABEL[c.name]}: ${r.vals[c.name]} was accepted — but a smaller number is accepted too.`);
      return [errs.length ? `An error message came up at ${errs.join(', ')}.` : '', ...big].filter(Boolean).join(' ');
    },
    show: ['11', '8', '2000'],
    why: ['The smallest number accepted is min itself. The test is number < min, so min is NOT an error — 11 is a good age.',
      'Testing right on the edge of the range is boundary testing: the exam expects the boundary to be accepted.'],
  },
  {
    title: 'Crash it',
    goals: ['Make the program crash.'],
    met: (r) => !!r.crashed,
    hint: () => 'It finished. Every entry was a number, so Convert.ToInt32 could read it — out-of-range numbers only get an error message.',
    show: ['fifteen'],
    why: ['Convert.ToInt32 cannot turn a word into a number. The program stops on that line — the range check never even runs.',
      'EnterNumber protects the range, not the type. ' + BOOKLET],
  },
  {
    title: 'Crash it with a number',
    goals: ['Crash the program again —', 'but this time type a whole number: digits only, no letters, no dots.'],
    met: (r) => r.crashed?.ex === 'OverflowException',
    hint(r) {
      if (r.crashed) return 'That was a FormatException: Convert.ToInt32 could not read it as a number at all. This mission wants a real whole number that still crashes it.';
      return 'It finished. Every number fitted. Think about how big a number an int can hold.';
    },
    show: ['99999999999'],
    why: ['An int holds whole numbers up to 2147483647. A bigger number is still digits, but it does not fit: OverflowException.',
      'Once again the crash comes before the range check. Big numbers never reach the if.'],
  },
  {
    title: 'A sneaky number',
    goals: ['Make the program print 17 11 2009 —', 'without typing 17, 11 or 2009 exactly as they print.'],
    met: (r) => !r.crashed && r.vals.age === 17 && r.vals.year === 11 && r.vals.born === 2009 && accepted(r).every((x) => x.line !== String(x.v)),
    hint(r) {
      if (r.crashed) return 'It crashed. Convert.ToInt32 must still be able to read each entry as a number.';
      const plain = accepted(r).filter((x) => x.line === String(x.v)).map((x) => LABEL[x.call]);
      const wrongVal = !(r.vals.age === 17 && r.vals.year === 11 && r.vals.born === 2009) ? `It printed ${r.vals.age} ${r.vals.year} ${r.vals.born}.` : '';
      return [wrongVal, plain.length ? `Typed exactly as it prints: ${plain.join(', ')}.` : '', 'Convert.ToInt32 lets a few extra characters through. Which ones?'].filter(Boolean).join(' ');
    },
    show: ['017', '+11', '02009'],
    why: ['Convert.ToInt32 ignores spaces at either end, one + or - in front, and zeros in front. 017 is stored as 17.',
      'The variable holds the NUMBER, not what was typed. That is why the last line prints 17, not 017.'],
  },
];

function missionRound(ms, k) {
  return {
    title: ms.title,
    intro: 'You are the user. The program is running on the right: type an answer, then press Enter. It does exactly what the real program does.',
    intro2: 'First run 2 points, a later run 1 point. Starting again counts as a run. After three runs you can ask to see it done.',
    async run(box, ctx) {
      const cb = codeBlock(LINES);
      const con = consolePanel();
      const goal = h('div', { class: 'goal' }, ms.goals.map((g) => h('div', { class: 'gl' }, icon('crosshair'), h('span', null, g))));
      const dots = h('div', { class: 'runs' }, 'Runs:', [0, 1, 2].map(() => h('i')));
      const result = h('div');
      const res = h('div');
      box.append(h('div', { class: 'split wide-left rev-m' }, cb.el,
        h('div', null,
          h('div', { class: 'card' }, h('p', { class: 'note', style: { margin: '0 0 6px' } }, `Mission ${k + 1} of ${MISSIONS.length}`), goal, h('div', { class: 'mt-s' }, dots)),
          h('div', { class: 'mt' }, con.el), result)), res);

      let runs = 0, inputs = [], live = true, pts = 0;
      const now = (name) => cb.lines.forEach((l, i) => l.classList.toggle('pc', name != null && i === CALL_LINE[name]));

      await new Promise((resolve) => {
        const finish = (score, showed) => {
          live = false;
          pts = score;
          now(null);
          const f = fb(showed ? 'info' : 'good', showed ? 'Here is one way that works.' : `Mission complete${runs === 1 ? ' — first run!' : '.'}`);
          res.append(f, explain(ms.why));
          scrollIntoViewSoft(f);
          resolve();
        };
        const countRun = () => {
          runs++;
          [...dots.querySelectorAll('i')].forEach((d, i) => d.classList.toggle('used', i < runs));
        };
        const showMe = () => btn('Show me', () => {
          con.cancel();
          live = false;
          con.clear();
          const r = runCalls(BOOK_CALLS, BOOK_FMT, ms.show);
          playEvents(con, r.ev);
          if (!r.crashed) con.print('(the program has finished)', 'sys');
          result.replaceChildren(h('p', { class: 'note' }, 'Typed: ', h('span', { class: 'typed' }, ms.show.map((t) => h('code', null, t)))));
          finish(0, true);
        }, 'ghost', 'eye');
        const midFoot = () => ctx.setFoot(runs >= 3 ? showMe() : null,
          btn('Start the program again', () => { if (!live) return; con.cancel(); countRun(); restart(); }, 'ghost', 'rotate-ccw'));
        const restart = () => { inputs = []; result.replaceChildren(); midFoot(); step(); };
        const step = async () => {
          if (!live || !ctx.alive) return;
          con.clear();
          const r = runCalls(BOOK_CALLS, BOOK_FMT, inputs);
          playEvents(con, r.ev);
          if (r.done) {
            now(null);
            if (!r.crashed) con.print('(the program has finished)', 'sys');
            countRun();
            result.replaceChildren(h('p', { class: 'note' }, 'You typed: ', h('span', { class: 'typed' }, inputs.map((t) => h('code', null, t === '' ? '(Enter)' : t)))));
            if (ms.met(r)) {
              sfx.good();
              goal.querySelectorAll('.gl').forEach((g) => g.classList.add('met'));
              finish(runs === 1 ? 2 : 1, false);
              return;
            }
            sfx.bad();
            const f = fb('bad', 'Not this time.', ms.hint(r));
            result.append(f);
            ctx.setFoot(runs >= 3 ? showMe() : null, btn('Run it again', restart, 'primary', 'play'));
            scrollIntoViewSoft(f);
            return;
          }
          now(r.waiting.name);
          const v = await con.input();
          if (v === null || !live) return;
          inputs.push(v);
          step();
        };
        midFoot();
        step();
      });
      await ctx.next();
      return { score: pts, max: 2 };
    },
  };
}

const sortRound = {
  title: 'Number or crash?',
  intro: 'Each entry is typed into EnterNumber. Does Convert.ToInt32 read it as a number, or does the program crash?',
  intro2: 'Drag each entry into a box — or tap it, then tap a box. Place them all, then press Check.',
  async run(box, ctx) {
    const items = shuffle([...sample(ENTRY_SORT.filter((e) => e.ok), 3), ...sample(ENTRY_SORT.filter((e) => !e.ok), 5)]);
    const board = createBoard();
    const yes = h('div', null, h('h4', null, icon('check'), 'Read as a number'));
    const no = h('div', null, h('h4', null, icon('x'), 'Crashes the program'));
    board.bucket(yes); board.bucket(no);
    const tray = h('div', { 'data-empty': 'Every entry is sorted' });
    board.tray(tray);
    items.forEach((e) => tray.appendChild(board.chip(h('span', null, h('span', { style: { fontFamily: 'var(--mono)', whiteSpace: 'pre' } }, e.show), e.note ? h('span', { class: 'note' }, ` (${e.note})`) : ''), e)));
    box.append(h('div', { class: 'buckets' }, yes, no), tray);
    let pts = 0;
    const note = h('span', { class: 'note' }, 'Sort every entry.');
    await checkButton(ctx, () => {
      const left = board.contents(tray).length;
      if (left) { note.textContent = `${left} still to sort.`; return false; }
      board.lock();
      const lines = [];
      [[yes, true], [no, false]].forEach(([b, want]) => board.contents(b).forEach((c) => {
        const ok = c.__data.ok === want;
        setMark(c, ok);
        if (ok) pts++;
        lines.push(h('div', { class: 'markline ' + (ok ? 'ok' : 'no') }, icon(ok ? 'check' : 'x'),
          h('div', null, h('p', null, h('code', { class: 'inl', style: { whiteSpace: 'pre' } }, c.__data.show), ' — ', c.__data.why))));
      }));
      const full = pts === items.length;
      (full ? sfx.good : sfx.bad)();
      const f = fb(full ? 'good' : 'bad', `${pts} of ${items.length} sorted right.`);
      box.append(f, h('div', { class: 'card mt' }, lines), explain(['Read as a number: digits, with spaces at either end, one + or - in front, or zeros in front. Anything else — a word, a dot, a comma, a space in the middle, nothing at all — crashes the program before the range check.',
        BOOKLET]));
      scrollIntoViewSoft(f);
    }, 'Check', note);
    await ctx.next();
    return { score: pts, max: items.length };
  },
};

export default {
  mount(stage, api) {
    api.wide();
    runRounds(stage, api, [...MISSIONS.map((ms, k) => missionRound(ms, k)), sortRound]);
  },
};
