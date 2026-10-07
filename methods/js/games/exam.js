// E Past Papers — the eight exam questions on methods (booklet section 9). Each cabinet is one question:
// round 1 is the real question, answered then marked by the pupil against the scheme; rounds 2 and 3 drill the same marks.
import { h, icon, codeBlock, codeSpan, codeInline, consolePanel, fb, shuffle, sample, setMark, sfx, para, rich, btn, scrollIntoViewSoft } from '../ui.js';
import { createBoard } from '../dnd.js';
import { runRounds, checkButton, explain, quizRound, realResult, transcript, playEvents } from '../kit.js';
import { parsonsRound } from './d1.js';
import {
  PAPERS, E1_PICK, E1_POINT_NAME, E1_MATCH, E2_HEADERS, E2_QUIZ, E2_SORT, E3_LINES, E3_FAULTS, E4_LINES, E4_VERDICTS, E4_CALLS,
  SWAP_RUNS, E5_CLOZE, E5_SORT, E6_EXITS, E6_SORT, FIND_COST, FIND_COST_BOARD, PRICE_RUN, E7_TRAPS, E7_PRICES,
  SHED_MAIN_BOARD, SHED_RUN, E8_TRAPS, E8_MISSIONS, runShed,
} from '../data/e.js';

const pad = (d) => '    '.repeat(d);

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

/* ---------- the paper ---------- */
function paperBlocks(list, model) {
  return list.map(([type, a, b]) => {
    if (type === 'p') return para(a);
    if (type === 'ask') return para(a, 'ask');
    if (type === 'note') return para(a, 'pnote');
    if (type === 'scheme') return para(a, 'pscheme');
    if (type === 'code') return model ? h('div', { class: 'mt-s', style: { marginBottom: '10px' } }, codeBlock(a, { tab: false }).el) : h('pre', { class: 'pcode' }, a.join('\n'));
    if (type === 'ul') return h('ul', null, a.map((t) => h('li', null, rich(t))));
    if (type === 'tasks') return h('ol', null, a.map((t) => h('li', null, rich(t))));
    if (type === 'table') {
      return h('table', null, h('thead', null, h('tr', null, a.map((t) => h('th', null, t)))),
        h('tbody', null, b.map((r) => h('tr', null, r.map((t) => h('td', null, t))))));
    }
    return null;
  });
}
function paperCard(q) {
  return h('div', { class: 'paper' },
    h('div', { class: 'paper-top' },
      h('span', { class: 'paper-tag' }, 'PAST PAPER'),
      h('span', { class: 'paper-name' }, q.paper),
      q.also ? h('span', { class: 'paper-also' }, `(${q.also})`) : null,
      h('span', { class: 'paper-marks', 'aria-label': `${q.marks} marks` }, h('span', null, 'Marks'), h('b', null, String(q.marks)))),
    q.adapted ? h('p', { class: 'paper-adapt' }, 'Adapted: ' + q.adapted) : null,
    paperBlocks(q.blocks));
}
function modelCard(q) {
  return h('div', { class: 'card model-card' },
    h('p', { class: 'bigq', style: { margin: '0 0 8px' } }, `Model answer — ${q.marks} of ${q.marks}`),
    h('div', { class: 'stack' }, paperBlocks(q.model, true)));
}

// Round 1 of every paper: answer it, then give yourself the marks point by point. Self-marks are shown, never scored.
function writeRound(q, after) {
  const code = q.kind === 'code';
  return {
    title: 'Answer the question',
    intro: 'This is the real exam question. Answer it as you would on the paper, then mark your own answer against the mark scheme.',
    intro2: code ? 'Type the code in the box — punctuation and capitals never cost a mark on the paper. Or answer on paper, then press "I wrote it on paper".'
      : 'Write in full sentences, as on the paper. Or answer on paper, then press "I wrote it on paper".',
    async run(box, ctx) {
      const ta = h('textarea', {
        class: 'field' + (code ? ' mono code-in' : ''), rows: code ? 14 : 6, spellcheck: code ? 'false' : 'true',
        autocapitalize: code ? 'off' : null, autocomplete: 'off', id: 'answer-' + q.paper.replace(/\W/g, ''),
        placeholder: code ? 'Your code…' : 'Your answer…',
      });
      if (code) {
        ta.addEventListener('keydown', (e) => {
          if (e.key !== 'Tab' || e.shiftKey) return;
          e.preventDefault();
          const s = ta.selectionStart;
          ta.setRangeText('    ', s, ta.selectionEnd, 'end');
        });
      }
      const wbox = h('div', { class: 'wbox' }, h('label', { for: ta.id }, 'Your answer'), ta);
      box.append(paperCard(q), wbox);
      setTimeout(() => ta.focus({ preventScroll: true }), 80);

      const text = await new Promise((resolve) => {
        const note = h('span', { class: 'note' }, '');
        ctx.setFoot(note,
          btn('I wrote it on paper', () => resolve(''), 'ghost', 'file-pen'),
          btn('Mark my answer', () => {
            if (!ta.value.trim()) { note.textContent = 'Write your answer first.'; ta.focus(); return; }
            resolve(ta.value);
          }, 'primary', 'check'));
      });
      if (!ctx.alive) return null;

      const cap = q.any || q.points.length;
      const rows = q.points.map((p) => {
        const t = makeTog(['Earned', 'Not earned'], p.t.replace(/`/g, ''));
        const spotted = text && p.find && p.find.test(text);
        return {
          t, row: h('div', { class: 'mrow' },
            h('div', { class: 'mlabel' }, para(p.t), spotted ? h('span', { class: 'spot' }, icon('scan-line'), 'Spotted in your answer') : null),
            t.el),
        };
      });
      const total = h('span', { class: 'wtotal' }, '');
      const upd = () => {
        const set = rows.filter((r) => r.t.pick >= 0);
        const got = Math.min(cap, set.filter((r) => r.t.pick === 0).length);
        const left = rows.length - set.length;
        total.textContent = `You: ${got} of ${q.marks}` + (left ? ` · ${left} still to mark` : '');
      };
      rows.forEach((r) => { r.t.onChange = upd; });
      upd();
      const mine = text
        ? h('div', { class: 'card' }, h('p', { class: 'note', style: { margin: '0 0 6px' } }, 'Your answer'), h('pre', { class: 'mine' + (code ? ' mono' : '') }, text))
        : h('div', { class: 'card' }, para('Put your paper answer beside you and mark it against the scheme.', 'note'));
      const scheme = h('div', { class: 'card' },
        h('p', { class: 'bigq', style: { margin: '0 0 4px' } }, 'The mark scheme'),
        para(q.any ? `Any ${q.any} of these ${q.points.length} points, one mark each. Give yourself each mark your answer earns.`
          : 'One mark per point. Give yourself each mark your answer earns.', 'note'),
        text && q.points.some((p) => p.find) ? para('"Spotted" only means the words are there — you decide whether the meaning is.', 'note') : null,
        h('div', { class: 'mrows' }, rows.map((r) => r.row)),
        h('div', { class: 'mt-s' }, total));
      wbox.replaceWith(h('div', { class: 'split mt' }, h('div', { class: 'stack' }, mine, modelCard(q)), scheme));
      scrollIntoViewSoft(scheme);

      let given = 0;
      const note = h('span', { class: 'note' }, 'Mark every point.');
      await checkButton(ctx, () => {
        const left = rows.filter((r) => r.t.pick < 0).length;
        if (left) { note.textContent = `${left} point${left > 1 ? 's' : ''} still to mark.`; return false; }
        rows.forEach((r) => r.t.lock());
        given = Math.min(cap, rows.filter((r) => r.t.pick === 0).length);
        const f = fb(given === q.marks ? 'good' : 'info', `You gave yourself ${given} of ${q.marks}.`,
          given === q.marks ? 'Full marks. The next two rounds check it from other angles.' : 'The next two rounds drill the marks you missed.');
        box.append(f, explain(q.notes));
        if (after) box.append(after());
        sfx.place();
        scrollIntoViewSoft(f);
      }, 'Done marking', note);
      await ctx.next();
      return { score: 0, max: 0, label: `marked by you: ${given} / ${q.marks}` };
    },
  };
}

/* ---------- e1 ---------- */
const pickRound = {
  title: 'Three that score',
  intro: 'Ten answers to "Give three advantages of methods". Pick the three that together earn all 3 marks.',
  intro2: 'Two answers that make the same point earn one mark between them. Pick exactly three, then press Check.',
  async run(box, ctx) {
    let on = [];
    const note = h('span', { class: 'note' }, 'Pick three.');
    const cards = shuffle(E1_PICK).map((it) => {
      const b = h('button', { type: 'button', class: 'choice pickc', 'aria-pressed': 'false' }, h('span', { class: 'box' }, icon('check')), h('span', null, it.t));
      const c = { it, b };
      b.addEventListener('click', () => {
        if (b.disabled) return;
        if (on.includes(c)) on = on.filter((x) => x !== c);
        else if (on.length >= 3) { note.textContent = 'Three only — untick one first.'; return; }
        else on.push(c);
        b.classList.toggle('on', on.includes(c));
        b.setAttribute('aria-pressed', String(on.includes(c)));
        note.textContent = on.length === 3 ? 'Three picked.' : `${on.length} of 3 picked.`;
      });
      return c;
    });
    box.append(h('div', { class: 'picks' }, cards.map((c) => c.b)));
    let pts = 0;
    await checkButton(ctx, () => {
      if (on.length !== 3) { note.textContent = `Pick exactly three — you have ${on.length}.`; return false; }
      cards.forEach((c) => { c.b.disabled = true; });
      const seen = new Set();
      const lines = on.map((c) => {
        const pt = c.it.pt;
        const fresh = pt && !seen.has(pt);
        if (pt) seen.add(pt);
        setMark(c.b, !!fresh);
        const say = !pt ? c.it.why : fresh ? `Earns a mark: ${E1_POINT_NAME[pt]}.` : `The same point as another pick (${E1_POINT_NAME[pt]}) — it cannot earn a second mark.`;
        return h('div', { class: 'markline ' + (fresh ? 'ok' : 'no') }, icon(fresh ? 'check' : 'x'), h('div', null, para(`"${c.it.t}"`), para(say, 'note')));
      });
      pts = seen.size;
      (pts === 3 ? sfx.good : sfx.bad)();
      const f = fb(pts === 3 ? 'good' : 'bad', `${pts} of 3 marks.`);
      box.append(f, h('div', { class: 'card mt' }, lines),
        explain(['The scheme has five points: reuse of code, structured design, several developers at once, simpler testing and faster development. Any three earn the marks — each point once.']));
      scrollIntoViewSoft(f);
    }, 'Check', note);
    await ctx.next();
    return { score: pts, max: 3 };
  },
};

const matchRound = {
  title: 'Which advantage is it?',
  intro: 'Each story shows one advantage of methods at work. Put the right advantage under each story.',
  intro2: 'Drag an advantage onto a gap — or tap it, then tap a gap. Two advantages are left over.',
  async run(box, ctx) {
    const board = createBoard();
    const tray = h('div', { 'data-empty': 'Every advantage is placed' });
    board.tray(tray);
    shuffle(E1_MATCH.chips).forEach((t) => tray.appendChild(board.chip(t, { t }, 'long')));
    const scenes = shuffle(E1_MATCH.scenes).map((s) => ({ s, slot: board.slot(h('div', { class: 'sslot' })) }));
    box.append(h('div', { class: 'picks' }, scenes.map((x) => h('div', { class: 'card' }, para(x.s.t), x.slot))), tray);
    let pts = 0;
    const note = h('span', { class: 'note' }, 'Fill every gap.');
    await checkButton(ctx, () => {
      const empty = scenes.filter((x) => !board.contents(x.slot).length).length;
      if (empty) { note.textContent = `${empty} gap${empty > 1 ? 's' : ''} still empty.`; return false; }
      board.lock();
      scenes.forEach((x) => {
        const c = board.contents(x.slot)[0];
        const ok = c.__data.t === x.s.want;
        setMark(c, ok);
        if (ok) pts++;
        else x.slot.append(h('div', { class: 'cwant' }, icon('check'), x.s.want));
      });
      const full = pts === scenes.length;
      (full ? sfx.good : sfx.bad)();
      const f = fb(full ? 'good' : 'bad', `${pts} of ${scenes.length} matched.`);
      box.append(f, explain(E1_MATCH.why));
      scrollIntoViewSoft(f);
    }, 'Check', note);
    await ctx.next();
    return { score: pts, max: scenes.length };
  },
};

/* ---------- mark or no mark (e2, e5, e6) ---------- */
function markSortRound({ title, intro, items, ok = 4, no = 4 }) {
  return {
    title, intro,
    intro2: 'Drag each line into a box — or tap it, then tap a box. Place them all, then press Check.',
    async run(box, ctx) {
      const list = shuffle([...sample(items.filter((x) => x.ok), ok), ...sample(items.filter((x) => !x.ok), no)]);
      const board = createBoard();
      const yes = h('div', null, h('h4', null, icon('check'), 'Earns a mark'));
      const nope = h('div', null, h('h4', null, icon('x'), 'No mark'));
      board.bucket(yes); board.bucket(nope);
      const tray = h('div', { 'data-empty': 'Every line is sorted' });
      board.tray(tray);
      list.forEach((it) => tray.appendChild(board.chip(rich(it.t), it, 'long')));
      box.append(h('div', { class: 'buckets' }, yes, nope), tray);
      let pts = 0;
      const note = h('span', { class: 'note' }, 'Sort every line.');
      await checkButton(ctx, () => {
        const left = board.contents(tray).length;
        if (left) { note.textContent = `${left} still to sort.`; return false; }
        board.lock();
        const lines = [];
        [[yes, true], [nope, false]].forEach(([b, want]) => board.contents(b).forEach((c) => {
          const it = c.__data;
          const good = it.ok === want;
          setMark(c, good);
          if (good) pts++;
          lines.push(h('div', { class: 'markline ' + (good ? 'ok' : 'no') }, icon(good ? 'check' : 'x'),
            h('div', null, para(`"${it.t}" — ${it.ok ? 'earns a mark' : 'no mark'}.`), para(it.why, 'note'),
              it.expect ? h('div', { class: 'mt-s' }, realResult(it.expect)) : null)));
        }));
        const full = pts === list.length;
        (full ? sfx.good : sfx.bad)();
        const f = fb(full ? 'good' : 'bad', `${pts} of ${list.length} sorted right.`);
        box.append(f, h('div', { class: 'card mt' }, lines));
        scrollIntoViewSoft(f);
      }, 'Check', note);
      await ctx.next();
      return { score: pts, max: list.length };
    },
  };
}

/* ---------- type the lines (e3, e4) ---------- */
const straight = (s) => String(s).replace(/[“”„]/g, '"').replace(/[‘’]/g, "'");
const lForm = (s, keepCase) => (keepCase ? straight(s) : straight(s).toLowerCase()).replace(/\s+/g, '').replace(/[;"'$(){}[\]]/g, '');
const tForm = (s) => straight(s).toLowerCase().replace(/\s+/g, '');
// Marks one typed line to the written-paper standard; C# tips ride along on a line that earns the mark.
export function markLine(row, typed) {
  const L = lForm(typed), T = tForm(typed);
  const c = row.checks.find((k) => k.re.test(k.on === 'T' ? T : L));
  if (!c) return { ok: false, say: 'Not quite — compare your line with the model.' };
  const tips = [c.say];
  if (c.ok) {
    if (L === lForm(row.t) && lForm(typed, true) !== lForm(row.t, true)) tips.push('C# would need the capitals exactly as in the model. The exam would not mind.');
    if (/;$/.test(row.t.trim()) && !/;$/.test(T)) tips.push('C# needs the ; at the end — the exam would not take a mark.');
  }
  return { ok: !!c.ok, say: tips.filter(Boolean).join(' ') };
}

function typeLines(box, lines, head) {
  const wrap = !!head;
  const asks = [];
  const at = (el, d) => { el.style.setProperty('--d', String(d)); return el; };
  const fixed = (t, d) => at(h('div', { class: 'tl-row tl-fixed' }, codeSpan(t)), d);
  const rows = lines.map((r) => {
    const d = r.d + (wrap ? 1 : 0);
    if (!r.ask) return fixed(r.t, d);
    const inp = h('input', { class: 'field mono', type: 'text', autocomplete: 'off', spellcheck: 'false', autocapitalize: 'off', 'aria-label': r.ask });
    const res = h('div', { class: 'tl-res' });
    asks.push({ r, inp, res });
    return at(h('div', { class: 'tl-row' }, h('p', { class: 'tl-ask' }, r.ask), inp, res), d);
  });
  asks.forEach((a, i) => a.inp.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (asks[i + 1]) asks[i + 1].inp.focus();
  }));
  box.append(h('div', { class: 'tl' }, wrap ? fixed(head, 0) : null, wrap ? fixed('{', 0) : null, rows, wrap ? fixed('}', 0) : null));
  setTimeout(() => asks[0]?.inp.focus({ preventScroll: true }), 80);
  return {
    asks,
    check() {
      const empty = asks.find((a) => !a.inp.value.trim());
      if (empty) { empty.inp.focus(); return null; }
      let pts = 0;
      asks.forEach((a) => {
        const m = markLine(a.r, a.inp.value);
        if (m.ok) pts++;
        a.inp.disabled = true;
        a.inp.classList.add(m.ok ? 'good' : 'bad');
        a.res.append(h('div', { class: 'markline ' + (m.ok ? 'ok' : 'no') }, icon(m.ok ? 'check' : 'x'),
          h('div', null, para(m.ok && !/^Earns the mark/.test(m.say) ? 'Earns the mark.' + (m.say ? ' ' + m.say : '') : m.say))),
        h('div', { class: 'model' }, h('span', null, 'Model'), codeSpan(a.r.t)));
      });
      return pts;
    },
  };
}

function typeLinesRound({ title, intro, intro2, lines, head, paper, closing }) {
  return {
    title, intro, intro2,
    async run(box, ctx) {
      if (paper) box.append(paperCard(paper), h('div', { class: 'mt' }));
      const tl = typeLines(box, lines, head);
      const max = tl.asks.length;
      let pts = 0;
      const note = h('span', { class: 'note' }, 'Type every line.');
      await checkButton(ctx, () => {
        const got = tl.check();
        if (got === null) { note.textContent = 'Type every line first.'; return false; }
        pts = got;
        (pts === max ? sfx.good : sfx.bad)();
        const f = fb(pts === max ? 'good' : 'bad', `${pts} of ${max} marks.`);
        box.append(f, closing ? explain(closing) : null);
        scrollIntoViewSoft(f);
      }, 'Check', note);
      await ctx.next();
      return { score: pts, max };
    },
  };
}

/* ---------- e3: find the lines that lose marks ---------- */
const flagRound = {
  title: 'Find the lost marks',
  intro: 'Three pupils answered 2014 Q2(b). Tap every line that loses a mark. Some lines look odd but cost nothing — leave those alone.',
  intro2: 'A right flag scores a point; a flag on a line that is fine loses one. Tap a line again to take its flag off.',
  async run(box, ctx) {
    const answers = E3_FAULTS.map((a) => {
      const flags = new Set();
      const cb = codeBlock(a.lines.map((l) => l[0]), {
        title: a.who,
        onLine(i, ln) {
          if (box.dataset.locked || !tappable(a.lines[i][0])) return;
          if (flags.has(i)) { flags.delete(i); ln.classList.remove('flagged'); ln.querySelector('.flagmk')?.remove(); }
          else { flags.add(i); ln.classList.add('flagged'); ln.append(h('span', { class: 'flagmk', 'aria-label': 'flagged' }, icon('flag'))); }
        },
      });
      cb.lines.forEach((ln, i) => {
        if (tappable(a.lines[i][0])) return;
        ln.classList.remove('clickable'); ln.removeAttribute('tabindex'); ln.removeAttribute('role');
      });
      const res = h('div');
      box.append(h('div', { class: 'card' }, cb.el, res));
      return { a, cb, flags, res };
    });
    const total = E3_FAULTS.reduce((n, a) => n + a.lines.filter((l) => l[1] === 'bad').length, 0);
    let pts = 0;
    const note = h('span', { class: 'note' }, 'Flag the lines, then Check.');
    await checkButton(ctx, () => {
      if (!answers.some((x) => x.flags.size)) { note.textContent = 'Flag at least one line first.'; return false; }
      box.dataset.locked = '1';
      let hits = 0, falses = 0;
      answers.forEach((x) => {
        let h1 = 0, f1 = 0;
        const notes = [];
        x.a.lines.forEach(([t, kind, why], i) => {
          const ln = x.cb.lines[i];
          ln.classList.remove('clickable');
          ln.removeAttribute('tabindex');
          const flagged = x.flags.has(i);
          if (kind === 'bad' && flagged) { h1++; ln.classList.add('good'); notes.push(['ok', 'check', 'Found — ', t, why]); }
          else if (kind === 'bad') { ln.classList.add('missed'); notes.push(['no', 'x', 'Missed — ', t, why]); }
          else if (flagged) { f1++; ln.classList.add('bad'); notes.push(['no', 'x', 'Costs nothing — ', t, why || 'This line is fine as it is.']); }
          else if (kind === 'ok') notes.push(['info', 'info', 'Looks odd, costs nothing — ', t, why]);
        });
        hits += h1; falses += f1;
        x.res.append(h('div', { class: 'mt-s' }, notes.map(([cls, ic, lead, t, why]) => h('div', { class: 'markline ' + cls }, icon(ic),
          h('div', null, h('p', null, lead, codeInline(t.trim())), para(why, 'note'))))));
        pts += Math.max(0, h1 - f1);
      });
      const full = hits === total && !falses;
      (full ? sfx.good : sfx.bad)();
      const f = fb(full ? 'good' : 'bad', `${hits} of ${total} lost marks found` + (falses ? `, and ${falses} line${falses > 1 ? 's' : ''} flagged that cost nothing.` : '.'));
      box.append(f, explain(['The examiner marks what the line DOES. A different order, different words or a capitals slip cost nothing; a value thrown away, the wrong test or the wrong thing returned cost the mark.']));
      scrollIntoViewSoft(f);
    }, 'Check', note);
    await ctx.next();
    return { score: pts, max: total };
  },
};
function tappable(t) { const s = t.trim(); return !!s && !['{', '}', 'do'].includes(s); }

/* ---------- e4: would it get the mark? ---------- */
const verdictRound = {
  title: 'Mark or no mark?',
  intro: 'Each line is a pupil\'s answer to one of the two calls. Would the examiner give the mark? Then see what C# does with it.',
  intro2: 'The examiner and C# do not always agree: punctuation never costs a mark on the paper.',
  async run(box, ctx) {
    const items = shuffle([...sample(E4_VERDICTS.filter((v) => v.mark), 2), ...sample(E4_VERDICTS.filter((v) => !v.mark), 4)]);
    const list = h('div', { class: 'vlist' });
    box.append(list);
    const rows = items.map((it) => {
      const t = makeTog(['Mark', 'No mark'], it.t);
      const res = h('div', { class: 'vres' });
      list.append(h('div', null, h('div', { class: 'vrow2' }, h('span', { class: 'vcode' }, codeSpan(it.t)), t.el), res));
      return { it, t, res };
    });
    let pts = 0;
    const note = h('span', { class: 'note' }, 'Decide every line.');
    await checkButton(ctx, () => {
      const left = rows.filter((r) => r.t.pick < 0).length;
      if (left) { note.textContent = `${left} line${left > 1 ? 's' : ''} still to decide.`; return false; }
      rows.forEach((r) => {
        r.t.lock();
        const ok = (r.t.pick === 0) === r.it.mark;
        if (ok) pts++;
        r.t.el.classList.add(ok ? 'right' : 'wrong');
        r.res.append(h('div', { class: 'markline ' + (ok ? 'ok' : 'no') }, icon(ok ? 'check' : 'x'),
          h('div', null, para((r.it.mark ? 'The examiner gives the mark. ' : 'No mark. ') + r.it.why))),
        h('div', { class: 'mt-s' }, r.it.ev ? transcript(r.it.ev).el : realResult(r.it.expect)));
      });
      const full = pts === rows.length;
      (full ? sfx.good : sfx.bad)();
      const f = fb(full ? 'good' : 'bad', `${pts} of ${rows.length} right.`);
      box.append(f);
      scrollIntoViewSoft(rows[0].res);
    }, 'Check', note);
    await ctx.next();
    return { score: pts, max: rows.length };
  },
};

/* ---------- e5: fill the gaps ---------- */
function clozeRound({ title, intro, cloze }) {
  return {
    title, intro,
    intro2: 'Drag a word into each gap — or tap it, then tap a gap. Four words are left over.',
    async run(box, ctx) {
      const board = createBoard();
      const tray = h('div', { 'data-empty': 'Every gap is filled' });
      board.tray(tray);
      const gaps = [];
      const words = [];
      const paras = cloze.text.split(/ (?=\(ii\))/).map((part) => h('p', null, part.split(/\{(\w+)\}/).map((bit, i) => {
        if (i % 2 === 0) return bit;
        words.push(bit);
        const g = board.slot(h('span', { class: 'gap' }));
        gaps.push({ g, want: bit });
        return g;
      })));
      shuffle([...words, ...cloze.extra]).forEach((w) => tray.appendChild(board.chip(w, { w })));
      box.append(h('div', { class: 'card cloze' }, paras), tray);
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
        box.append(f, explain(['That paragraph is a full-mark answer: (i) by value, copies, originals unchanged; (ii) by reference, with ref in the header and the call.']));
        scrollIntoViewSoft(f);
      }, 'Check', note);
      await ctx.next();
      return { score: pts, max: gaps.length };
    },
  };
}

function swapRuns() {
  return h('div', { class: 'split mt' }, SWAP_RUNS.map((r) => h('div', null, para(r.note, 'note'), transcript(r.ev).el)));
}

/* ---------- e6: tap where it ends ---------- */
const endsRound = {
  title: 'Where does it end?',
  intro: 'A method is called. Tap the line where it ends — the last line of the method that runs.',
  intro2: 'Tap a line to pick it, then press Check. Follow the values: an if that is false skips its block, and a return ends the method at once.',
  async run(box, ctx) {
    const items = shuffle(E6_EXITS);
    let pts = 0;
    for (let k = 0; k < items.length; k++) {
      if (!ctx.alive) return null;
      const it = items[k];
      box.replaceChildren();
      let picked = -1;
      const can = (i) => {
        const s = it.lines[i].trim();
        return i > 0 && s && !['{', '}'].includes(s);
      };
      const cb = codeBlock(it.lines, {
        title: it.name,
        onLine(i, ln) {
          if (box.dataset.locked || !can(i)) return;
          picked = i;
          cb.lines.forEach((l, j) => l.classList.toggle('hl2', j === i));
          ln.focus({ preventScroll: true });
        },
      });
      cb.lines.forEach((ln, i) => { if (!can(i)) { ln.classList.remove('clickable'); ln.removeAttribute('tabindex'); ln.removeAttribute('role'); } });
      const res = h('div');
      box.append(h('div', { class: 'card' },
        h('p', { class: 'note', style: { margin: '0 0 8px' } }, `Question ${k + 1} of ${items.length}`),
        h('p', { class: 'bigq' }, 'Main runs ', codeInline(it.call), ' — where does the method end?'),
        cb.el, res));
      delete box.dataset.locked;
      window.scrollTo(0, 0);
      await checkButton(ctx, () => {
        if (picked < 0) return false;
        box.dataset.locked = '1';
        const ok = picked === it.answer;
        if (ok) pts++;
        cb.lines.forEach((l) => { l.classList.remove('hl2', 'clickable'); l.removeAttribute('tabindex'); });
        cb.lines[it.answer].classList.add('good');
        if (!ok) cb.lines[picked].classList.add('bad');
        (ok ? sfx.good : sfx.bad)();
        const f = fb(ok ? 'good' : 'bad', ok ? 'Right — it ends there.' : `It ends on line ${it.answer + 1}.`, it.why);
        res.append(f, h('div', { class: 'mt-s' }, para('Run for real:', 'note'), transcript(it.ev).el));
        scrollIntoViewSoft(f);
      }, 'Check', 'Tap a line.');
      await ctx.next(k === items.length - 1 ? 'Finish the round' : 'Next question');
    }
    delete box.dataset.locked;
    return { score: pts, max: items.length };
  },
};

/* ---------- e8: be the user of the shed program ---------- */
const SHED_VIEW = [...SHED_MAIN_BOARD.map((r) => pad(r.d) + r.t), '', ...FIND_COST.split('\n')];
const PC = { style: SHED_VIEW.findIndex((l) => l.includes('Console.Write("Style')), size: SHED_VIEW.findIndex((l) => l.includes('Console.Write("Size')) };

const missionsRound = {
  title: 'Be the user',
  intro: 'You are the user. The shed program is running: type an answer, then press Enter. It does exactly what the real program does.',
  intro2: 'Five missions. First run 2 points, a later run 1 point. Starting again counts as a run. After three runs you can ask to see it done.',
  async run(box, ctx) {
    let total = 0;
    for (let k = 0; k < E8_MISSIONS.length; k++) {
      if (!ctx.alive) return null;
      const ms = E8_MISSIONS[k];
      box.replaceChildren();
      window.scrollTo(0, 0);
      const cb = codeBlock(SHED_VIEW);
      const con = consolePanel();
      const goal = h('div', { class: 'goal' }, ms.goals.map((g) => h('div', { class: 'gl' }, icon('crosshair'), h('span', null, g))));
      const dots = h('div', { class: 'runs' }, 'Runs:', [0, 1, 2].map(() => h('i')));
      const result = h('div');
      const res = h('div');
      box.append(h('div', { class: 'split wide-left rev-m' }, cb.el,
        h('div', null,
          h('div', { class: 'card' }, h('p', { class: 'note', style: { margin: '0 0 6px' } }, `Mission ${k + 1} of ${E8_MISSIONS.length} · ${ms.title}`), goal, h('div', { class: 'mt-s' }, dots)),
          h('div', { class: 'mt' }, con.el), result)), res);

      let runs = 0, inputs = [], live = true, pts = 0;
      const now = (w) => cb.lines.forEach((l, i) => l.classList.toggle('pc', w != null && i === PC[w]));
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
          const r = runShed(ms.show);
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
          const r = runShed(inputs);
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
      await ctx.next(k === E8_MISSIONS.length - 1 ? 'Finish the round' : 'Next mission');
    }
    return { score: total, max: E8_MISSIONS.length * 2 };
  },
};

/* ---------- the eight cabinets ---------- */
const findCostView = () => codeBlock(FIND_COST.split('\n')).el;
const ROUNDS = {
  e1: () => [writeRound(PAPERS.e1), pickRound, matchRound],
  e2: () => [
    writeRound(PAPERS.e2),
    quizRound({ title: 'Read the headers', intro: 'Six questions on the two headers from the paper.', items: shuffle(E2_QUIZ), show: () => codeBlock(E2_HEADERS, { tab: false }).el }),
    markSortRound({ title: 'Mark or no mark?', intro: 'Lines from pupils\' answers to 2014 Q2(a). Which would earn a mark?', items: E2_SORT }),
  ],
  e3: () => [
    writeRound(PAPERS.e3),
    typeLinesRound({
      title: 'Line by line', intro: 'The same method, one line at a time. The loop is drawn for you: type each missing line.',
      intro2: 'Each line is marked as the examiner would — punctuation and capitals never cost a mark. Press Enter to move to the next line.',
      lines: E3_LINES, head: 'public static int enter_No_Of_Items(int min, int max)',
      closing: ['Mark scheme: declaration · loop control · prompt and input · range check, both sides · error message · return.'],
    }),
    flagRound,
  ],
  e4: () => [
    typeLinesRound({
      title: 'Answer the question', paper: PAPERS.e4,
      intro: 'This is the real exam question. Type the two lines — each is marked as the examiner would.',
      intro2: 'Punctuation and capitals never cost a mark on the paper; C# tips are shown alongside. Press Enter to move to the next line.',
      lines: E4_LINES, closing: PAPERS.e4.notes,
    }),
    verdictRound,
    quizRound({
      title: 'Call any method', intro: 'The same skill on six other methods: read the header, see what Main has, pick the line that calls it properly.',
      intro2: 'Every line here was run for real — after each answer you see what C# does with your pick.',
      items: shuffle(E4_CALLS), mono: true, cols: 1,
      show: (it) => h('div', { class: 'callhead' }, para('The method:', 'note'), codeBlock([it.header], { tab: false }).el,
        it.decl.length ? [para('Main already has:', 'note'), codeBlock(it.decl, { tab: false }).el] : null),
      why: (it, picked) => it.whys[picked],
      after: (it, ok, picked) => h('div', { class: 'mt-s' },
        para(ok ? 'Run for real:' : 'Your pick, run for real:', 'note'), realResult(it.progs[picked].expect),
        ok ? null : [para('The right line, run:', 'note'), realResult(it.progs[it.a].expect)]),
    }),
  ],
  e5: () => [
    writeRound(PAPERS.e5, swapRuns),
    clozeRound({ title: 'Fill the gaps', intro: 'A full-mark answer to both parts, with seven words missing.', cloze: E5_CLOZE }),
    markSortRound({ title: 'Mark or no mark?', intro: 'Lines from pupils\' answers to the Swap question. Which would earn a mark?', items: E5_SORT }),
  ],
  e6: () => [
    writeRound(PAPERS.e6),
    endsRound,
    markSortRound({ title: 'Mark or no mark?', intro: 'Answers to "Describe one other condition where a method is exited". Which would earn a mark?', items: E6_SORT }),
  ],
  e7: () => [
    writeRound(PAPERS.e7),
    parsonsRound({
      title: 'Build findCost',
      intro: 'Eight lines are missing from the model answer to 2015 Q2(b). Put each in its gap — some lines are traps.',
      rows: FIND_COST_BOARD, traps: sample(E7_TRAPS, 4), run: PRICE_RUN,
      runNote: 'findCost for every shed, standard and deluxe:', closing: PAPERS.e7.notes,
    }),
    quizRound({
      title: 'Price check', intro: 'findCost is finished. What does it give for each shed?', items: [...shuffle(E7_PRICES.slice(0, 4)), ...E7_PRICES.slice(4)],
      show: findCostView,
      after: (it) => (it.expect ? h('div', { class: 'mt-s' }, para('Run for real:', 'note'), realResult(it.expect)) : null),
    }),
  ],
  e8: () => [
    writeRound(PAPERS.e8),
    parsonsRound({
      title: 'Build the shed program',
      intro: 'Seven lines are missing from the model answer to 2015 Q2(c). Put each in its gap — some lines are traps.',
      rows: SHED_MAIN_BOARD, traps: sample(E8_TRAPS, 4), run: SHED_RUN,
      runNote: 'Entries Shed, R, 3, 2:', closing: PAPERS.e8.notes,
    }),
    missionsRound,
  ],
};

export default {
  mount(stage, api, arg) {
    api.wide();
    runRounds(stage, api, ROUNDS[arg]());
  },
};
