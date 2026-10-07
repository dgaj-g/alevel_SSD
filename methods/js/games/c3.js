// C3 Which Version Runs? — booklet section 6: overloading. The compiler picks a version by the TYPES of the
// arguments, never their values; return type alone is never enough. Every verdict here was checked with dotnet.
import { h, icon, codeSpan, codeBlock, fb, shuffle, sample, setMark, sfx, para, sameAnswer, scrollIntoViewSoft, errorList } from '../ui.js';
import { createBoard } from '../dnd.js';
import { runRounds, checkButton, explain, programLines } from '../kit.js';
import { markHeader, parseHeader } from './b2.js';
import { SHOW, SHOW_CALLS, MULTIPLY, MULT_ROWS, LARGER_INT, LARGER_ROWS, LARGER_ALONE, PAIRS } from '../data/c.js';

const showRound = {
  title: 'The switchboard',
  intro: 'Three methods share the name Show. Sort each call into the version that runs — or into "Will not build".',
  intro2: 'n is an int holding 7. Drag a call, or tap it and then tap a box. Place them all, then press Check.',
  async run(box, ctx) {
    const by = (k) => SHOW_CALLS.filter((c) => c.k === k);
    const items = shuffle([...sample(by('int'), 3), ...sample(by('double'), 3), ...sample(by('string'), 2), ...sample(by('none'), 2)]);
    const board = createBoard();
    const KINDS = [['int', 'the int version'], ['double', 'the double version'], ['string', 'the string version'], ['none', 'Will not build']];
    const buckets = KINDS.map(([k, label]) => {
      const b = h('div', { dataset: { k } }, h('h4', null, icon(k === 'none' ? 'x' : 'git-fork'), label));
      board.bucket(b);
      return b;
    });
    const tray = h('div', { 'data-empty': 'Every call is placed' });
    board.tray(tray);
    items.forEach((c) => tray.appendChild(board.chip(codeSpan(c.call), c, 'code-chip')));
    box.append(h('div', { class: 'split wide-left' },
      codeBlock(SHOW.split('\n'), { title: 'The three Show methods' }).el,
      h('div', null, h('div', { class: 'buckets', style: { gridTemplateColumns: 'repeat(2, minmax(0,1fr))' } }, buckets), tray)));
    let pts = 0;
    const note = h('span', { class: 'note' }, 'Place every call.');
    await checkButton(ctx, () => {
      const left = board.contents(tray).length;
      if (left) { note.textContent = `${left} still to place.`; return false; }
      board.lock();
      const whys = [];
      buckets.forEach((b) => board.contents(b).forEach((c) => {
        const ok = c.__data.k === b.dataset.k;
        setMark(c, ok);
        if (ok) pts++;
        else whys.push(`\`${c.__data.call}\` → ${c.__data.k === 'none' ? 'will not build' : `the ${c.__data.k} version`}. ${c.__data.why}`);
      }));
      (pts === items.length ? sfx.good : sfx.bad)();
      box.append(fb(pts === items.length ? 'good' : 'bad', `${pts} of ${items.length} placed right.`),
        whys.length ? explain(whys) : '',
        explain(['C# looks only at the TYPE of each argument: whole number → int, a decimal point → double, speech marks → string.',
          'An expression is worked out first, and its type decides: int / int stays an int; one double anywhere makes it a double.']));
    }, 'Check', note);
    await ctx.next();
    return { score: pts, max: items.length };
  },
};

// Rows: a call, an int/double toggle and a "prints" box. 2 marks a row.
function versionRows(rows, holder) {
  holder.append(h('div', { class: 'vhead' }, h('span', null, 'The call'), h('span', null, 'Which version?'), h('span', null, 'It prints'), h('span')));
  const list = h('div', { class: 'vrows' });
  holder.append(list);
  const made = shuffle(rows).map((r) => {
    let pick = null;
    const bI = h('button', { type: 'button' }, 'int'), bD = h('button', { type: 'button' }, 'double');
    const tog = h('div', { class: 'tog', role: 'group', 'aria-label': `Which version runs for ${r.call}` }, bI, bD);
    [bI, bD].forEach((b) => b.addEventListener('click', () => {
      if (b.disabled) return;
      pick = b.textContent;
      bI.classList.toggle('on', pick === 'int'); bD.classList.toggle('on', pick === 'double');
      bI.setAttribute('aria-pressed', String(pick === 'int')); bD.setAttribute('aria-pressed', String(pick === 'double'));
    }));
    const inp = h('input', { class: 'field mono', type: 'text', autocomplete: 'off', spellcheck: 'false', inputmode: 'decimal', 'aria-label': `What Console.WriteLine(${r.call}) prints` });
    const mk = h('span', { class: 'mk' });
    const row = h('div', { class: 'vrow' }, h('div', { class: 'callc' }, codeSpan(r.call)), tog, inp, mk);
    list.append(row);
    return { r, row, tog, inp, mk, bI, bD, get pick() { return pick; } };
  });
  return {
    ready() {
      const m = made.find((x) => !x.pick || !x.inp.value.trim());
      if (m) { (m.pick ? m.inp : m.bI).focus(); return false; }
      return true;
    },
    mark() {
      let pts = 0;
      made.forEach((x) => {
        x.bI.disabled = x.bD.disabled = x.inp.disabled = true;
        const vOk = x.pick === x.r.v, oOk = sameAnswer(x.inp.value, x.r.out);
        pts += (vOk ? 1 : 0) + (oOk ? 1 : 0);
        x.tog.classList.add(vOk ? 'right' : 'wrong');
        x.inp.classList.add(oOk ? 'good' : 'bad');
        x.row.classList.add(vOk && oOk ? 'right' : 'wrong');
        x.mk.append(icon(vOk && oOk ? 'check' : 'x'));
        x.row.append(h('p', { class: 'why' }, `${vOk ? '' : `The ${x.r.v} version. `}${oOk ? '' : `It prints ${x.r.out}. `}${x.r.why}`));
      });
      return pts;
    },
    max: rows.length * 2,
  };
}

const multRound = {
  title: 'Multiply: int or double?',
  intro: 'Two versions of Multiply. For each call, pick the version that runs and type what the line prints.',
  intro2: 'n is an int holding 6. A double that is a whole number prints without its .0 — 10.0 prints as 10.',
  async run(box, ctx) {
    const holder = h('div', { class: 'card mt' });
    box.append(codeBlock(programLines({ methods: MULTIPLY, main: 'int n = 6;\n// each call below is printed: Console.WriteLine( the call );' })).el, holder);
    const v = versionRows(MULT_ROWS, holder);
    let pts = 0;
    await checkButton(ctx, () => {
      if (!v.ready()) return false;
      pts = v.mark();
      (pts === v.max ? sfx.good : sfx.bad)();
      const f = fb(pts === v.max ? 'good' : 'bad', `${pts} of ${v.max} marks.`);
      box.append(f, explain(['Two int arguments → the int version. Any double argument → the double version (an int can be turned into a double, never the other way).',
        'Watch the division: n / 4 is 1, but n / 4.0 is 1.5.']));
      scrollIntoViewSoft(f);
    }, 'Check', 'Pick a version and type the output on every row.');
    await ctx.next();
    return { score: pts, max: v.max };
  },
};

const largerRound = {
  title: 'Add the double version',
  intro: 'Booklet Activity 7. Larger only works for ints. Write the HEADER of a second Larger that works for two doubles.',
  intro2: 'Then say which version each call runs and what it prints.',
  async run(box, ctx) {
    const inp = h('input', { class: 'field mono', type: 'text', placeholder: 'public static …', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': 'The header of the double version of Larger' });
    const hres = h('div');
    const holder = h('div', { class: 'card mt' });
    box.append(h('div', { class: 'split' },
      codeBlock(LARGER_INT.split('\n'), { title: 'The int version' }).el,
      h('div', { class: 'card' }, para('The header of the double version:', 'bigq'), inp, hres)), holder);
    const v = versionRows(LARGER_ROWS, holder);
    setTimeout(() => inp.focus({ preventScroll: true }), 80);
    let pts = 0;
    const max = 4 + v.max;
    await checkButton(ctx, () => {
      if (!inp.value.trim()) { inp.focus(); return false; }
      if (!v.ready()) return false;
      inp.disabled = true;
      const m = markHeader(inp.value, ['double', 'Larger', ['double', 'double']]);
      const p = parseHeader(inp.value);
      if (!p.broken && m.marks[0].ok && p.name !== 'Larger') {
        m.marks[0].ok = false;
        m.marks[0].note = `You wrote \`${p.name}\`. To overload, the name must be EXACTLY the same — C# would treat \`${p.name}\` as a different method, and Larger(2.5, 4.0) would still not build.`;
        m.score--;
      }
      inp.classList.add(m.score === 4 ? 'good' : 'bad');
      hres.append(h('div', { class: 'mt-s' },
        m.marks.map((x) => h('div', { class: 'markline' + (x.ok === null ? ' info' : x.ok ? ' ok' : ' no') },
          icon(x.ok === null ? 'info' : x.ok ? 'check' : 'x'), h('div', null, para(x.label), x.note ? para(x.note, 'note') : null))),
        h('div', { class: 'model' }, h('span', null, 'Model answer'), codeSpan('public static double Larger(double a, double b)'))));
      pts = m.score + v.mark();
      (pts === max ? sfx.good : sfx.bad)();
      const f = fb(pts === max ? 'good' : 'bad', `${pts} of ${max} marks.`);
      box.append(f,
        explain(['The mark scheme: the same name [1], double parameters [1], a double return type [1], and the double version is chosen by the TYPES of the arguments [1].',
          'Without the double version, Larger(2.5, 4.0) does not build at all:']),
        errorList(LARGER_ALONE.expect.msgs));
      scrollIntoViewSoft(f);
    }, 'Check', 'Write the header, then fill every row.');
    await ctx.next();
    return { score: pts, max };
  },
};

const VERDICTS = ['Both can be in one program', 'It will not build'];
const pairsRound = {
  title: 'Can they live together?',
  intro: 'Each card shows two methods in the same program. Can both be there at once — or will C# refuse to build?',
  intro2: 'The rule: the parameter lists must differ in NUMBER or in TYPES. Decide every card, then press Check.',
  async run(box, ctx) {
    const items = shuffle([...sample(PAIRS.filter((p) => p.ok), 4), ...sample(PAIRS.filter((p) => !p.ok), 4)]);
    const cards = items.map((p, k) => {
      let pick = null;
      const bs = VERDICTS.map((t, i) => h('button', { type: 'button', 'aria-pressed': 'false' }, t));
      const tog = h('div', { class: 'tog', role: 'group', 'aria-label': `Verdict for pair ${k + 1}` }, bs);
      bs.forEach((b, i) => b.addEventListener('click', () => {
        if (b.disabled) return;
        pick = i;
        bs.forEach((x, j) => { x.classList.toggle('on', j === i); x.setAttribute('aria-pressed', String(j === i)); });
      }));
      const res = h('div');
      const card = h('div', { class: 'card paircard' },
        h('p', { class: 'note', style: { margin: '0 0 8px' } }, `Pair ${k + 1} of ${items.length}`),
        h('div', { class: 'two' }, codeBlock(p.a.split('\n'), { tab: false }).el, codeBlock(p.b.split('\n'), { tab: false }).el),
        h('div', { class: 'verdict' }, tog), res);
      return { p, card, tog, bs, res, get pick() { return pick; } };
    });
    box.append(h('div', { class: 'pairs' }, cards.map((c) => c.card)));
    let pts = 0;
    const note = h('span', { class: 'note' }, 'Decide every pair.');
    await checkButton(ctx, () => {
      const open = cards.filter((c) => c.pick === null);
      if (open.length) { note.textContent = `${open.length} still to decide.`; open[0].bs[0].focus(); scrollIntoViewSoft(open[0].card); return false; }
      cards.forEach((c) => {
        c.bs.forEach((b) => { b.disabled = true; });
        const ok = (c.pick === 0) === c.p.ok;
        if (ok) pts++;
        c.tog.classList.add(ok ? 'right' : 'wrong');
        c.res.append(fb(ok ? 'good' : 'bad', `${ok ? 'Right' : 'Not quite'} — ${c.p.ok ? 'both can live together' : 'it will not build'}. ${c.p.why}`),
          c.p.ok ? '' : h('div', { class: 'mt-s' }, errorList(c.p.expect.msgs)));
      });
      (pts === items.length ? sfx.good : sfx.bad)();
      const f = fb(pts === items.length ? 'good' : 'bad', `${pts} of ${items.length} right.`);
      box.append(f, explain(['Different NUMBER of parameters, or different TYPES (or the same types in a different order): fine.',
        'Only the return type different, or only the parameter NAMES different: C# cannot tell the calls apart, so it refuses.']));
      scrollIntoViewSoft(f);
    }, 'Check', note);
    await ctx.next();
    return { score: pts, max: items.length };
  },
};

export default {
  mount(stage, api) {
    api.wide();
    runRounds(stage, api, [showRound, multRound, largerRound, pairsRound]);
  },
};
