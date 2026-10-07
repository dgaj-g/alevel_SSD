// F1–F4 The practicals — booklet section 11. Each practical is built step by step from its brief (every wrong line
// shows what it really does), then played, then written on your own and self-marked, then its common slips.
import { h, icon, codeBlock, codeSpan, consolePanel, fb, shuffle, sample, setMark, sfx, para, btn, choiceSet, scrollIntoViewSoft } from '../ui.js';
import { createBoard } from '../dnd.js';
import { runRounds, checkButton, explain, quizRound, realResult, transcript, playEvents, programLines } from '../kit.js';
import {
  CLOSE, P1, P1_PARTS, P1_BOARDS, P1_OWN, P1_SLIPS,
  P2, P2_LINES, P2_PC, P2_MISSIONS, P2_OWN, P2_SLIPS, runQuote,
  P3, P3_PREDICT, P3_TWINS, P3_OWN, P3_SLIPS,
  P4, P4_LINES, P4_PC, P4_MISSIONS, P4_OWN, P4_SLIPS, runOrder,
} from '../data/f.js';

const resultOf = (r) => (r.ev ? transcript(r.ev).el : realResult(r.expect));

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

/* ---------- Round: build it step by step ---------- */
// Fills the template, remembering which gap every line came from, then lays it out as the pupil sees it.
function viewOf(P, pick) {
  const out = { methods: [], main: [] };
  for (const part of ['methods', 'main']) {
    for (const l of P[part].split('\n')) {
      const m = /^(\s*)\{\{(\d+)\}\}$/.exec(l);
      if (!m) { out[part].push([l, 0]); continue; }
      const k = +m[2];
      const t = pick(k);
      const text = t == null ? `// step ${P.steps.findIndex((s) => s.k === k) + 1}` : t === '' ? '// (nothing here)' : t;
      text.split('\n').forEach((x) => out[part].push([m[1] + x, k]));
    }
  }
  const rows = [...out.methods, ['', 0], ['static void Main(string[] args)', 0], ['{', 0], ...out.main.map(([l, k]) => [l ? '    ' + l : l, k]), ['}', 0]];
  return rows;
}

function buildRound(P) {
  return {
    title: 'Build it step by step',
    intro: P.building,
    intro2: 'Choose the right line for each step. Your program fills in as you choose. When every step has a line, press Check: every wrong line shows what it really does.',
    async run(box, ctx) {
      const picks = new Map();
      const stepCards = P.steps.map((s, i) => {
        const opts = shuffle([{ t: s.line, ok: true }, ...s.wrong]);
        const cs = choiceSet(opts.map((o) => (o.t === '' ? h('span', { class: 'nothing' }, o.show || '(nothing)') : codeSpan(o.t))), {
          mono: true, cols: 1,
          onPick: (j) => { picks.set(s.k, opts[j]); render(s.k); },
        });
        const card = h('div', { class: 'card step' },
          h('p', { class: 'note', style: { margin: '0 0 4px' } }, `Step ${i + 1} of ${P.steps.length} · ${s.at}`),
          para(s.brief, 'bigq'), cs.el);
        return { s, opts, cs, card };
      });
      const progBox = h('div', { class: 'prac-prog' });
      let lineEls = [];
      function render(flashK) {
        const rows = viewOf(P, (k) => (picks.has(k) ? picks.get(k).t : null));
        const cb = codeBlock(rows.map((r) => r[0]), { title: 'Program.cs — your program' });
        rows.forEach(([, k], i) => {
          if (!k) return;
          cb.lines[i].classList.add(picks.has(k) ? 'gapfill' : 'gapln');
          cb.lines[i].dataset.k = k;
        });
        progBox.replaceChildren(cb.el);
        lineEls = cb.lines;
        if (flashK) {
          const first = cb.lines.find((l) => l.dataset.k === String(flashK));
          if (first) {
            first.classList.add('flash');
            const pre = cb.el.querySelector('pre');
            if (pre.scrollHeight > pre.clientHeight + 4) pre.scrollTop = first.offsetTop - pre.clientHeight / 2;
          }
        }
      }
      render();
      const steps = h('div', { class: 'stack' }, stepCards.map((c) => c.card));
      box.append(h('div', { class: 'split prac-build' }, steps, progBox));
      let pts = 0;
      const note = h('span', { class: 'note' }, 'Choose a line for every step.');
      await checkButton(ctx, () => {
        const left = P.steps.filter((s) => !picks.has(s.k)).length;
        if (left) { note.textContent = `${left} step${left > 1 ? 's' : ''} still to choose.`; return false; }
        stepCards.forEach(({ s, opts, cs, card }) => {
          cs.lock(opts.findIndex((o) => o.ok));
          const p = picks.get(s.k);
          if (p.ok) { pts++; return; }
          card.append(fb('bad', p.why), h('div', { class: 'mt-s' }, para('What the program does with that line:', 'note'), resultOf(p)));
        });
        lineEls.forEach((l) => { if (l.dataset.k) l.classList.add(picks.get(+l.dataset.k).ok ? 'good' : 'bad'); });
        const full = pts === P.steps.length;
        (full ? sfx.good : sfx.bad)();
        const f = fb(full ? 'good' : 'bad', `${pts} of ${P.steps.length} steps right.`,
          full ? 'Your program is the booklet\'s program.' : 'Each wrong step is marked above, with what it really does.');
        box.append(f, h('div', { class: 'split mt' },
          h('div', null, para(P.bookIn ? `The finished program, run with ${P.bookIn.join(', ')}:` : 'The finished program, run:', 'note'), resultOf(P.run)),
          explain(P.closing)));
        scrollIntoViewSoft(f);
      }, 'Check', note);
      await ctx.next();
      return { score: pts, max: P.steps.length };
    },
  };
}

/* ---------- Round: P1 write Main to match a board ---------- */
const NAMES = Object.keys(P1_PARTS);
const boardsRound = {
  title: 'Write Main',
  intro: 'The three methods are written. Each board below was printed by a different Main. Put the calls in the right order to print it exactly.',
  intro2: 'Drag each call into a line of Main — or tap a call, then tap a line. There are spare calls. Then press Check.',
  async run(box, ctx) {
    const boards = sample(P1_BOARDS, 3).sort((a, b) => a.calls.length - b.calls.length);
    let pts = 0, max = 0;
    for (let k = 0; k < boards.length; k++) {
      if (!ctx.alive) return null;
      const bd = boards[k];
      box.replaceChildren();
      window.scrollTo(0, 0);
      const want = consolePanel({ title: 'The board to print' });
      bd.expect.out.replace(/\n$/, '').split('\n').forEach((l) => want.print(l));
      const board = createBoard();
      const tray = h('div', { 'data-empty': 'Every call is placed' });
      board.tray(tray);
      const spares = sample(NAMES, 2);
      shuffle([...bd.calls, ...spares]).forEach((n) => tray.appendChild(board.chip(codeSpan(n + '();'), { n }, 'code-chip')));
      const slots = bd.calls.map(() => board.slot(h('div', { class: 'cslot d1' })));
      const cboard = h('div', { class: 'codeboard' },
        h('div', { class: 'crow' }, codeSpan('static void Main(string[] args)')),
        h('div', { class: 'crow' }, codeSpan('{')),
        slots,
        CLOSE.split('\n').map((l) => h('div', { class: 'crow' }, codeSpan('    ' + l))),
        h('div', { class: 'crow' }, codeSpan('}')));
      box.append(h('p', { class: 'note' }, `Board ${k + 1} of ${boards.length} · ${bd.name}`),
        h('div', { class: 'split' }, h('div', null, cboard, tray), want.el));
      const note = h('span', { class: 'note' }, 'Fill every line of Main.');
      await checkButton(ctx, () => {
        const empty = slots.filter((s) => !board.contents(s).length).length;
        if (empty) { note.textContent = `${empty} line${empty > 1 ? 's' : ''} still empty.`; return false; }
        board.lock();
        let got = 0;
        const mine = slots.map((s, i) => {
          const c = board.contents(s)[0];
          const ok = c.__data.n === bd.calls[i];
          setMark(c, ok);
          if (ok) got++;
          else s.append(h('div', { class: 'cwant' }, icon('check'), codeSpan(bd.calls[i] + '();')));
          return c.__data.n;
        });
        pts += got; max += bd.calls.length;
        const full = got === bd.calls.length;
        (full ? sfx.good : sfx.bad)();
        const con = consolePanel({ title: 'What your Main prints' });
        (mine.map((n) => P1_PARTS[n]).join('') + '\nPress Enter to close this window.').split('\n').forEach((l) => con.print(l));
        const f = fb(full ? 'good' : 'bad', full ? 'Exactly the board.' : `${got} of ${bd.calls.length} calls in the right place.`,
          full ? '' : 'Compare what your Main prints with the board.');
        box.append(f, h('div', { class: 'mt' }, con.el));
        scrollIntoViewSoft(f);
      }, 'Check', note);
      await ctx.next(k === boards.length - 1 ? 'Finish the round' : 'Next board');
    }
    box.replaceChildren(explain(['Main is a list of calls. The order of the calls is the order of the output.',
      'A method is written once and can be called as often as you like: no copying, no pasting.']));
    await ctx.next();
    return { score: pts, max };
  },
};

/* ---------- Round: be the user (P2, P4) ---------- */
function missionsRound({ intro, lines, pc, runner, missions }) {
  return {
    title: 'Be the user',
    intro,
    intro2: `${missions.length} missions. First run 2 points, a later run 1 point. Starting again counts as a run. After three runs you can ask to see it done.`,
    async run(box, ctx) {
      let total = 0;
      for (let k = 0; k < missions.length; k++) {
        if (!ctx.alive) return null;
        const ms = missions[k];
        box.replaceChildren();
        window.scrollTo(0, 0);
        const cb = codeBlock(lines, { cls: 'tall' });
        const con = consolePanel();
        const goal = h('div', { class: 'goal' }, ms.goals.map((g) => h('div', { class: 'gl' }, icon('crosshair'), h('span', null, g))));
        const dots = h('div', { class: 'runs' }, 'Runs:', [0, 1, 2].map(() => h('i')));
        const result = h('div');
        const res = h('div');
        box.append(h('div', { class: 'split wide-left rev-m' }, cb.el,
          h('div', null,
            h('div', { class: 'card' }, h('p', { class: 'note', style: { margin: '0 0 6px' } }, `Mission ${k + 1} of ${missions.length} · ${ms.title}`), goal, h('div', { class: 'mt-s' }, dots)),
            h('div', { class: 'mt' }, con.el), result)), res);

        let runs = 0, inputs = [], live = true, pts = 0;
        const pre = cb.el.querySelector('pre');
        const now = (w) => cb.lines.forEach((l, i) => {
          const on = w != null && i === pc[w];
          l.classList.toggle('pc', on);
          if (on && pre.scrollHeight > pre.clientHeight + 4) pre.scrollTop = l.offsetTop - pre.clientHeight / 3;
        });
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
          const typed = (label, list) => h('p', { class: 'note' }, label, h('span', { class: 'typed' }, list.map((t) => h('code', null, t === '' ? '(Enter)' : t))));
          const showMe = () => btn('Show me', () => {
            con.cancel();
            live = false;
            con.clear();
            const r = runner(ms.show);
            playEvents(con, r.ev);
            if (!r.crashed) con.print('(the program has finished)', 'sys');
            result.replaceChildren(typed('Typed: ', ms.show));
            finish(0, true);
          }, 'ghost', 'eye');
          const midFoot = () => ctx.setFoot(runs >= 3 ? showMe() : null,
            btn('Start the program again', () => { if (!live) return; con.cancel(); countRun(); restart(); }, 'ghost', 'rotate-ccw'));
          const restart = () => { inputs = []; result.replaceChildren(); midFoot(); step(); };
          const step = async () => {
            if (!live || !ctx.alive) return;
            con.clear();
            const r = runner(inputs);
            playEvents(con, r.ev);
            if (r.done) {
              now(null);
              if (!r.crashed) con.print('(the program has finished)', 'sys');
              countRun();
              result.replaceChildren(typed('You typed: ', inputs));
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
            now(r.waiting);
            const v = await con.input();
            if (v === null || !live) return;
            inputs.push(v);
            step();
          };
          midFoot();
          step();
        });
        total += pts;
        await ctx.next(k === missions.length - 1 ? 'Finish the round' : 'Next mission');
      }
      return { score: total, max: missions.length * 2 };
    },
  };
}

/* ---------- Round: on your own, then mark it yourself ---------- */
function ownRound(O, title) {
  return {
    title,
    intro: 'Now the booklet\'s extension task, on your own. Write the code, then check it against the list and the model answer.',
    intro2: 'Type it in the box — punctuation and capitals never cost a mark here. Or write it on paper, then press "I wrote it on paper".',
    async run(box, ctx) {
      const runs = O.runs ? O.runs : [O];
      const ta = h('textarea', { class: 'field mono code-in', rows: 14, spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off', id: 'own-answer', placeholder: 'Your code…' });
      ta.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab' || e.shiftKey) return;
        e.preventDefault();
        ta.setRangeText('    ', ta.selectionStart, ta.selectionEnd, 'end');
      });
      const task = h('div', { class: 'card' }, h('p', { class: 'bigq', style: { margin: '0 0 6px' } }, 'The task'), O.problem.map((t) => para(t)));
      const target = h('div', { class: 'stack' }, para(runs.length > 1 ? 'When it works, the two runs look like this:' : 'When it works, the run looks like this:', 'note'),
        runs.map((r) => resultOf(r)));
      const wbox = h('div', { class: 'wbox mt' }, h('label', { for: ta.id }, 'Your code'), ta);
      box.append(h('div', { class: 'split' }, task, target), wbox);
      const text = await new Promise((resolve) => {
        const note = h('span', { class: 'note' }, '');
        ctx.setFoot(note,
          btn('I wrote it on paper', () => resolve(''), 'ghost', 'file-pen'),
          btn('Check my code', () => {
            if (!ta.value.trim()) { note.textContent = 'Write your code first.'; ta.focus(); return; }
            resolve(ta.value);
          }, 'primary', 'check'));
      });
      if (!ctx.alive) return null;
      const rows = O.points.map((p) => {
        const t = makeTog(['Yes', 'No'], p.t.replace(/`/g, ''));
        const spotted = text && p.find && p.find.test(text);
        return { t, row: h('div', { class: 'mrow' },
          h('div', { class: 'mlabel' }, para(p.t), spotted ? h('span', { class: 'spot' }, icon('scan-line'), 'Spotted in your code') : null), t.el) };
      });
      const total = h('span', { class: 'wtotal' }, '');
      const upd = () => {
        const set = rows.filter((r) => r.t.pick >= 0);
        const left = rows.length - set.length;
        total.textContent = `You: ${set.filter((r) => r.t.pick === 0).length} of ${rows.length}` + (left ? ` · ${left} still to check` : '');
      };
      rows.forEach((r) => { r.t.onChange = upd; });
      upd();
      const mine = text
        ? h('div', { class: 'card' }, h('p', { class: 'note', style: { margin: '0 0 6px' } }, 'Your code'), h('pre', { class: 'mine mono' }, text))
        : h('div', { class: 'card' }, para('Put your paper answer beside you and check it against the list.', 'note'));
      const model = h('div', { class: 'card model-card' }, h('p', { class: 'bigq', style: { margin: '0 0 8px' } }, 'Model answer'), codeBlock(O.model, { title: 'Model answer' }).el);
      const list = h('div', { class: 'card' },
        h('p', { class: 'bigq', style: { margin: '0 0 4px' } }, 'Does your code have…'),
        text && O.points.some((p) => p.find) ? para('"Spotted" only means the words are there — you decide whether the code is right.', 'note') : null,
        h('div', { class: 'mrows' }, rows.map((r) => r.row)),
        h('div', { class: 'mt-s' }, total));
      wbox.replaceWith(h('div', { class: 'split mt' }, h('div', { class: 'stack' }, mine, model), list));
      scrollIntoViewSoft(list);
      let given = 0;
      const note = h('span', { class: 'note' }, 'Answer every line.');
      await checkButton(ctx, () => {
        const left = rows.filter((r) => r.t.pick < 0).length;
        if (left) { note.textContent = `${left} line${left > 1 ? 's' : ''} still to answer.`; return false; }
        rows.forEach((r) => r.t.lock());
        given = rows.filter((r) => r.t.pick === 0).length;
        const full = given === rows.length;
        const f = fb(full ? 'good' : 'info', `You ticked ${given} of ${rows.length}.`,
          full ? 'All there. The next round shows the slips people make with it.' : 'The next round shows the slips people make with it — watch for yours.');
        box.append(f, explain(O.notes));
        sfx.place();
        scrollIntoViewSoft(f);
      }, 'Done checking', note);
      await ctx.next();
      return { score: 0, max: 0, label: `checked by you: ${given} / ${rows.length}` };
    },
  };
}

/* ---------- Round: slips — what does each version do? ---------- */
function slipsRound({ title = 'Spot the slip', intro, versions, outcomes, n, view, note }) {
  let items = sample(versions, Math.min(n, versions.length));
  if (!items.some((v) => v.a === 0)) items[items.length - 1] = versions.find((v) => v.a === 0);
  items = shuffle(items);
  return quizRound({
    title, intro,
    intro2: 'Each version has one change, or none. What happens when it runs? Every answer is checked against the real program.',
    items: items.map((v) => ({ ...v, options: outcomes, q: 'What happens?' })),
    cols: 1,
    show: (it) => h('div', null, note ? para(note, 'note') : null, codeBlock(view(it), { title: 'Program.cs' }).el),
    after: (it) => h('div', { class: 'mt' }, para('What it really does:', 'note'), resultOf(it)),
  });
}

/* ---------- the four practicals ---------- */
const lines = (s) => s.split('\n');
const ROUNDS = {
  p1: () => [
    buildRound(P1),
    boardsRound,
    ownRound(P1_OWN, 'On your own: ShowDivider'),
    slipsRound({ intro: 'Five people wrote ShowDivider. Main calls ShowOpeningHours, ShowDivider, then ShowRules.', versions: P1_SLIPS.versions, outcomes: P1_SLIPS.outcomes, n: 5,
      view: (it) => lines(it.code) }),
  ],
  p2: () => [
    buildRound(P2),
    missionsRound({ intro: 'You are the user. The quote machine is running: type an answer, then press Enter. It does exactly what the real program does.',
      lines: P2_LINES, pc: P2_PC, runner: (inp) => runQuote(inp), missions: P2_MISSIONS }),
    ownRound(P2_OWN, 'On your own: FittingCharge'),
    slipsRound({ intro: 'Five people wrote FittingCharge. Main calls it and prints the two extra lines, run with 4.5, 3.2 and 12.99.', versions: P2_SLIPS.versions, outcomes: P2_SLIPS.outcomes, n: 5,
      view: (it) => lines(it.code) }),
  ],
  p3: () => [
    buildRound(P3),
    quizRound({
      title: 'Predict the swap',
      intro: 'Five versions of the swap. Read each one and predict the After line.',
      intro2: 'Every answer is checked against the real program.',
      items: shuffle(P3_PREDICT).map(({ title, ...it }) => ({ ...it, q: 'What does the After line say?' })),
      cols: 1,
      show: (it) => codeBlock(programLines({ methods: it.methods, main: it.main })).el,
      after: (it) => h('div', { class: 'mt' }, para('What it really does:', 'note'), realResult(it.expect)),
    }),
    quizRound({
      title: 'Which twin?',
      intro: 'Three methods called Describe. C# picks the one whose parameter matches the argument. What does each call print?',
      intro2: 'Six calls. Some will not build.',
      items: sample(P3_TWINS, 6).map((it) => ({ ...it, q: 'What does this call print?' })),
      cols: 1,
      show: (it) => codeBlock([...lines(it.cs.methods), '', '// in Main:', it.cs.main]).el,
      after: (it) => h('div', { class: 'mt' }, para('What it really does:', 'note'), realResult(it.expect)),
    }),
    ownRound(P3_OWN, 'On your own: swap two decimals'),
    slipsRound({ intro: 'Five people wrote the decimal Swap. Main swaps x and y (whole numbers), then p = 1.5 and q = 2.5, and prints the After line.', versions: P3_SLIPS.versions, outcomes: P3_SLIPS.outcomes, n: 5,
      view: (it) => [...(it.keepInt ? [] : ['// the int Swap(ref int a, ref int b) has been deleted', '']), ...lines(it.code), '', '// in Main:', it.callLine] }),
  ],
  p4: () => [
    buildRound(P4),
    missionsRound({ intro: 'You are the user. The order desk is running: type an answer, then press Enter. It does exactly what the real program does.',
      lines: P4_LINES, pc: P4_PC, runner: (inp) => runOrder(inp), missions: P4_MISSIONS }),
    ownRound(P4_OWN, 'On your own: EnterYesNo'),
    slipsRound({ intro: 'Five people wrote EnterYesNo. Main calls it and prints what it stored. The user types Yes, then Y.', versions: P4_SLIPS.versions, outcomes: P4_SLIPS.outcomes, n: 5,
      view: (it) => [...lines(it.code), '', '// in Main:', ...lines(it.cs.main)] }),
  ],
};

export default {
  mount(stage, api, arg) {
    api.wide();
    runRounds(stage, api, ROUNDS[arg]());
  },
};
