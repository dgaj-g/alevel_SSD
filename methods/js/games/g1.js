// G1 Definition Match — booklet section 12, Activity 11: every term to its wording, then spot each one in code.
import { h, icon, codeBlock, codeSpan, fb, shuffle, sample, setMark, sfx, para, choiceSet, scrollIntoViewSoft } from '../ui.js';
import { createBoard } from '../dnd.js';
import { runRounds, checkButton, explain, quizRound } from '../kit.js';
import { TERMS, SPOT, FACTS } from '../data/g.js';

const match = {
  title: 'Match the term to its wording',
  intro: 'Drag each term onto its wording (or tap a term, then tap a gap). Every term is used once.',
  intro2: 'Place all ten, then press Check.',
  async run(box, ctx) {
    const board = createBoard();
    const tray = h('div', { 'data-empty': 'Every term is placed' });
    board.tray(tray);
    shuffle(TERMS).forEach((t) => tray.appendChild(board.chip(t.term, { term: t.term })));
    const rows = shuffle(TERMS).map((t) => {
      const s = board.slot(h('div', { class: 'dslot' }));
      const row = h('div', { class: 'drow' }, s, h('p', { class: 'dword' }, t.wording));
      return { t, s, row };
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
        else r.s.append(h('span', { class: 'cwant' }, icon('check'), r.t.term));
      });
      const full = pts === rows.length;
      (full ? sfx.good : sfx.bad)();
      const f = fb(full ? 'good' : 'bad', `${pts} of ${rows.length} matched.`);
      box.append(f, explain(['Parameter and argument are the pair most often swapped: the parameter is in the HEADER and receives; the argument is in the CALL and is handed over.',
        'Return type is a type (int, double, void); return is the statement that hands the value back.']));
      scrollIntoViewSoft(f);
    }, 'Check', note);
    await ctx.next();
    return { score: pts, max: rows.length };
  },
};

// Code with parts lit up: marks [[line]] lights a whole line, [[line, text, from]] lights that text.
function spotCode(it) {
  const cb = codeBlock(it.lines, { tab: false });
  it.marks.forEach(([i, text, from]) => {
    const ln = cb.lines[i];
    if (text === undefined) { ln.classList.add('spot'); return; }
    const src = it.lines[i];
    const at = src.indexOf(text, from || 0);
    const t = ln.querySelector('.t');
    t.replaceChildren(codeSpan(src.slice(0, at)), h('mark', { class: 'spotm' }, codeSpan(text)), codeSpan(src.slice(at + text.length)));
  });
  return cb.el;
}

function spotRound() {
  const items = sample(SPOT, 8).map((s) => {
    const options = [s.a, ...s.not];
    return { ...s, options, a: 0, q: s.q || 'What is the lit-up part called?' };
  });
  return quizRound({
    title: 'Spot it in the code',
    intro: 'Part of each program is lit up. Name it with the right term.',
    items, show: spotCode,
    why: (it, picked) => (picked === it.a ? `Yes: ${it.options[0]}.` : `No — this is ${it.options[0]}, not ${it.options[picked]}.`),
    after: (it) => para(`**${it.options[0]}:** ${TERMS.find((t) => t.term === it.options[0]).wording}.`, 'note mt-s'),
  });
}

const FACT_LABEL = ['No facts', 'One fact', 'Two facts'];
const facts = {
  title: 'Two marks means two facts',
  intro: 'A two-mark definition needs two facts. How many does each answer give?',
  intro2: 'Answer all six, then press Check.',
  async run(box, ctx) {
    const pool = shuffle(FACTS);
    const chosen = [0, 1, 2].map((n) => pool.find((f) => f.facts === n));
    const items = shuffle([...chosen, ...pool.filter((f) => !chosen.includes(f)).slice(0, 3)]);
    const sets = items.map((it) => {
      const cs = choiceSet(FACT_LABEL, { cols: 3 });
      const card = h('div', { class: 'card' },
        h('p', { class: 'note', style: { margin: '0 0 6px' } }, `Define: ${it.term}`),
        para(`A pupil wrote: **${it.said}**`, 'bigq'), cs.el);
      box.append(card);
      return { it, cs, card };
    });
    let pts = 0;
    const note = h('span', { class: 'note' }, 'Answer all six.');
    await checkButton(ctx, () => {
      const left = sets.filter((s) => s.cs.value() < 0).length;
      if (left) { note.textContent = `${left} still to answer.`; return false; }
      sets.forEach((s) => {
        s.cs.lock(s.it.facts);
        const ok = s.cs.value() === s.it.facts;
        if (ok) pts++;
        s.card.append(fb(ok ? 'good' : 'bad', s.it.why));
      });
      const full = pts === sets.length;
      (full ? sfx.good : sfx.bad)();
      const f = fb(full ? 'good' : 'bad', `${pts} of ${sets.length} right.`, 'Learn the wording from the table: each one carries both facts.');
      box.append(f);
      scrollIntoViewSoft(f);
    }, 'Check', note);
    await ctx.next();
    return { score: pts, max: sets.length };
  },
};

export default {
  mount(stage, api) {
    runRounds(stage, api, [match, spotRound(), facts]);
  },
};
