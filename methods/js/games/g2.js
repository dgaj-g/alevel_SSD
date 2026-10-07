// G2 Missing Words — the booklet's definitions with the mark-earning words taken out, then one word swapped.
import { h, icon, fb, shuffle, sample, setMark, sfx, para, scrollIntoViewSoft } from '../ui.js';
import { createBoard } from '../dnd.js';
import { runRounds, checkButton, explain } from '../kit.js';
import { TERM, CLOZE_SETS, TERMS } from '../data/g.js';

function clozeRound(set, n) {
  return {
    title: `Fill the gaps · set ${n}`,
    intro: 'Drag a word into each gap — or tap it, then tap a gap. Four words are left over.',
    intro2: 'Fill every gap, then press Check.',
    async run(box, ctx) {
      const board = createBoard();
      const tray = h('div', { 'data-empty': 'Every gap is filled' });
      board.tray(tray);
      const gaps = [];
      const words = [];
      const rows = shuffle(set.terms).map((name) => {
        const t = TERM[name];
        const bits = t.cloze.split(/\[([^\]]+)\]/).map((bit, i) => {
          if (i % 2 === 0) return bit;
          words.push(bit);
          const g = board.slot(h('span', { class: 'gap' }));
          gaps.push({ g, want: bit });
          return g;
        });
        return h('div', { class: 'crow' }, h('p', { class: 'cterm' }, t.term), h('p', { class: 'ctext' }, bits));
      });
      shuffle([...words, ...set.extra]).forEach((w) => tray.appendChild(board.chip(w, { w })));
      box.append(h('div', { class: 'card cloze' }, rows), tray);
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
        const f = fb(full ? 'good' : 'bad', `${pts} of ${gaps.length} gaps right.`, 'The gaps are the words that carry the marks. Learn them exactly.');
        box.append(f);
        scrollIntoViewSoft(f);
      }, 'Check', note);
      await ctx.next();
      return { score: pts, max: gaps.length };
    },
  };
}

// '... does {every|one} job ...' → word tokens; the slip is one tappable unit.
function slipTokens(s) {
  const out = [];
  s.split(/(\{[^}]+\})/).forEach((part) => {
    const m = part.match(/^\{([^|]+)\|([^}]+)\}$/);
    if (m) { out.push({ w: m[1], right: m[2], slip: true }); return; }
    part.split(/\s+/).filter(Boolean).forEach((w) => out.push({ w }));
  });
  return out;
}

const slips = {
  title: 'Spot the slip',
  intro: 'Each definition has ONE wrong word. Tap the word that is wrong.',
  intro2: 'Answer all six, then press Check.',
  async run(box, ctx) {
    const cards = sample(TERMS, 6).map((t) => {
      const toks = slipTokens(t.slip);
      let picked = -1;
      const words = toks.map((tk, i) => {
        const b = h('button', { class: 'sw', type: 'button', 'aria-pressed': 'false' }, tk.w);
        b.addEventListener('click', () => {
          if (box.dataset.locked) return;
          picked = i;
          words.forEach((x, j) => { x.classList.toggle('picked', j === i); x.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
        });
        return b;
      });
      const card = h('div', { class: 'card' },
        h('p', { class: 'cterm', style: { margin: '0 0 8px' } }, t.term),
        h('p', { class: 'slipline' }, words));
      box.append(card);
      return { t, toks, words, card, get picked() { return picked; } };
    });
    delete box.dataset.locked;
    let pts = 0;
    const note = h('span', { class: 'note' }, 'Tap one word in each.');
    await checkButton(ctx, () => {
      const left = cards.filter((c) => c.picked < 0).length;
      if (left) { note.textContent = `${left} still to answer.`; return false; }
      box.dataset.locked = '1';
      cards.forEach((c) => {
        const at = c.toks.findIndex((tk) => tk.slip);
        const ok = c.picked === at;
        if (ok) pts++;
        c.words.forEach((b) => { b.disabled = true; });
        setMark(c.words[c.picked], ok);
        if (!ok) c.words[at].classList.add('missed');
        const tk = c.toks[at];
        c.card.append(fb(ok ? 'good' : 'bad',
          h('p', null, ok ? 'Found it: ' : 'The wrong word is ', h('b', null, tk.w), '. It should say ', h('b', null, tk.right), '.'),
          h('p', { class: 'note' }, c.t.wording)));
      });
      const full = pts === cards.length;
      (full ? sfx.good : sfx.bad)();
      const f = fb(full ? 'good' : 'bad', `${pts} of ${cards.length} slips found.`);
      box.append(f, explain(['One wrong word costs the mark: header not call, copy and UNCHANGED, parameter lists not return types, ends the METHOD.']));
      scrollIntoViewSoft(f);
    }, 'Check', note);
    await ctx.next();
    return { score: pts, max: cards.length };
  },
};

export default {
  mount(stage, api) {
    runRounds(stage, api, [clozeRound(CLOZE_SETS[0], 1), clozeRound(CLOZE_SETS[1], 2), slips]);
  },
};
