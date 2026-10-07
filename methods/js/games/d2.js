// D2 Be the Examiner — booklet section 8's line-by-line table, then the 2014 Q2(b) mark scheme (adapted, 7 marks):
// match the scheme to the lines, mark three pupils' answers point by point, then the why-questions.
import { h, icon, codeSpan, codeBlock, fb, shuffle, sample, setMark, sfx, para, btn, scrollIntoViewSoft } from '../ui.js';
import { createBoard } from '../dnd.js';
import { runRounds, checkButton, explain, quizRound } from '../kit.js';
import { SCHEME_ROWS, SCHEME_DECOYS, Q14B, Q14B_MODEL, PUPIL_ANSWERS, EXAM_QUIZ } from '../data/d.js';

const matchRound = {
  title: 'Match the mark scheme',
  intro: 'The examiner gives a mark for each line of EnterNumber. Put each mark-scheme point beside the line that earns it.',
  intro2: 'Drag a point onto a gap — or tap it, then tap a gap. Two points are not in the scheme at all.',
  async run(box, ctx) {
    const board = createBoard();
    const tray = h('div', { 'data-empty': 'Every point is placed' });
    board.tray(tray);
    const pts = SCHEME_ROWS.filter((r) => r.point).map((r) => r.point);
    shuffle([...pts, ...SCHEME_DECOYS]).forEach((t) => tray.appendChild(board.chip(t, { t }, 'long')));
    const slots = [];
    const last = SCHEME_ROWS.length - 1;
    const grid = h('div', { class: 'scheme' }, SCHEME_ROWS.map((r, i) => {
      const code = h('div', { class: 'sc' + (i === 0 ? ' first' : '') + (i === last ? ' last' : '') }, r.code.map((l) => h('div', null, codeSpan(l))));
      if (!r.point) return [code, h('div', { class: 'sgap' })];
      const s = board.slot(h('div', { class: 'sslot' }));
      slots.push({ s, want: r.point });
      return [code, s];
    }).flat());
    box.append(grid, tray);
    let score = 0;
    const note = h('span', { class: 'note' }, 'Fill every gap.');
    await checkButton(ctx, () => {
      const empty = slots.filter((x) => !board.contents(x.s).length).length;
      if (empty) { note.textContent = `${empty} gap${empty > 1 ? 's' : ''} still empty.`; return false; }
      board.lock();
      const decoys = [];
      slots.forEach((x) => {
        const c = board.contents(x.s)[0];
        const ok = c.__data.t === x.want;
        setMark(c, ok);
        if (!ok) x.s.append(h('div', { class: 'cwant' }, icon('check'), x.want));
        if (ok) score++;
        if (SCHEME_DECOYS.includes(c.__data.t)) decoys.push(c.__data.t);
      });
      const full = score === slots.length;
      (full ? sfx.good : sfx.bad)();
      const f = fb(full ? 'good' : 'bad', `${score} of ${slots.length} points in the right place.`);
      box.append(f, explain([
        ...decoys.map((d) => d.startsWith('check the entry')
          ? '"Check the entry is a whole number" is not a mark here: a word still crashes Convert.ToInt32, and that is fixed in Topic 10. Past papers that give it a mark are adapted in the booklet and say so.'
          : '"Print the number back" is not in the scheme: the method hands the number back with return — Main decides what to do with it.'),
        'The range check is worth testing BOTH ends: below min and above max. The loop mark is for repeating until the input is valid — checking once is not enough.']));
      scrollIntoViewSoft(f);
    }, 'Check', note);
    await ctx.next();
    return { score, max: slots.length };
  },
};

function makeTog(labels, aria) {
  let pick = -1;
  const bs = labels.map((l, i) => h('button', { type: 'button', 'aria-pressed': 'false' }, l));
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

const markRound = {
  title: 'Mark three answers',
  intro: 'Three pupils answered 2014 Q2(b). You are the examiner: for each mark point, give the mark or not.',
  intro2: 'Each point is marked on its own — a slip in one line does not cost the marks for the others.',
  async run(box, ctx) {
    const answers = sample(PUPIL_ANSWERS, 3);
    box.append(h('div', { class: 'card' }, h('p', { class: 'note', style: { margin: 0 } }, 'The question (adapted to 7 marks)'),
      para('`public static int enter_No_Of_Items(int min, int max)`'), para(Q14B.task)));
    const cards = answers.map((a, k) => {
      const rows = Q14B.points.map((p, i) => {
        const t = makeTog(['Mark', 'No mark'], `${a.who}: ${p}`);
        const res = h('div');
        const row = h('div', { class: 'mrow' }, h('div', { class: 'mlabel' }, para(p)), t.el);
        return { t, row, res, i };
      });
      const total = h('span', { class: 'note' }, 'Your total: – of 7');
      const upd = () => {
        const set = rows.filter((r) => r.t.pick >= 0);
        total.textContent = `Your total: ${set.filter((r) => r.t.pick === 0).length} of 7${set.length < 7 ? ` (${7 - set.length} still to mark)` : ''}`;
      };
      rows.forEach((r) => { r.t.onChange = upd; });
      const res = h('div');
      const card = h('div', { class: 'card' },
        h('h3', { style: { margin: '0 0 8px' } }, `${a.who} · ${k + 1} of 3`),
        h('div', { class: 'split wide-left' }, codeBlock(a.code.split('\n'), { tab: false }).el,
          h('div', { class: 'mrows' }, rows.map((r) => [r.row, r.res]).flat(), h('div', { class: 'mt-s' }, total))),
        res);
      box.append(card);
      return { a, rows, res, card };
    });
    let score = 0;
    const note = h('span', { class: 'note' }, 'Mark every point.');
    await checkButton(ctx, () => {
      const left = cards.reduce((n, c) => n + c.rows.filter((r) => r.t.pick < 0).length, 0);
      if (left) { note.textContent = `${left} point${left > 1 ? 's' : ''} still to mark.`; return false; }
      cards.forEach((c) => {
        let right = 0;
        c.rows.forEach((r) => {
          r.t.lock();
          const earned = c.a.marks[r.i] === 1;
          const ok = (r.t.pick === 0) === earned;
          if (ok) right++;
          r.t.el.classList.add(ok ? 'right' : 'wrong');
          const why = c.a.why[r.i];
          if (!ok || why) r.res.append(h('div', { class: 'markline ' + (earned ? 'ok' : 'no') }, icon(earned ? 'check' : 'x'),
            h('div', null, para(earned ? 'Earned.' + (ok ? '' : ' Look again — this line does what the point asks.') : why || 'Not earned.', 'note'))));
        });
        score += right;
        const got = c.a.marks.reduce((s, m) => s + m, 0);
        c.res.append(fb(right === 7 ? 'good' : 'bad', `You agreed with the scheme on ${right} of 7 points. ${c.a.who} earns ${got} of 7.`));
      });
      (score === 21 ? sfx.good : sfx.bad)();
      const model = h('div', { class: 'card mt' }, h('p', { class: 'bigq', style: { margin: '0 0 6px' } }, 'Model answer — 7 of 7'), codeBlock(Q14B_MODEL.split('\n'), { tab: false }).el);
      box.append(model);
      scrollIntoViewSoft(cards[0].res);
    }, 'Check', note);
    await ctx.next();
    return { score, max: 21 };
  },
};

export default {
  mount(stage, api) {
    api.wide();
    runRounds(stage, api, [
      matchRound,
      markRound,
      quizRound({
        title: 'Why it is written that way',
        intro: 'Five questions an examiner could ask about EnterNumber.',
        items: shuffle(EXAM_QUIZ),
      }),
    ]);
  },
};
