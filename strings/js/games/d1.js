// D1 Position Map: place each rule piece on its box, the length bar or the bin; then say which line tests each piece.
import { h, icon, fb, shuffle, pick, setMark, sfx, choiceSet } from '../../../arcade/engine/ui.js';
import { createBoard } from '../../../arcade/engine/dnd.js';
import { runRounds, checkButton, explain } from '../../../arcade/engine/kit.js';
import { show } from './_t4.js';
import { POSITION_MAPS } from '../data/d.js';

const place = (rule) => ({
  title: 'Put each rule piece on the map',
  intro: `${rule.name} A code that passes is ${rule.ex}.`,
  intro2: 'Drag each piece, or tap a piece and then tap a box, the length bar or the bin. The length piece goes on first. A piece that covers several boxes goes on any one of them. When every piece is placed, press Check.',
  async run(box, ctx) {
    const board = createBoard();
    const lenSlot = board.slot(h('div', { class: 'lenbar' }, h('span', { class: 'note' }, 'Length bar: the first test')));
    const cells = [...rule.ex].map((ch, i) => { const s = board.slot(h('div')); return h('div', { class: 'pcell' }, h('div', { class: 'sbox' }, show(ch), h('span', { class: 'ix' }, String(i))), s); });
    const slots = cells.map((c) => c.lastChild);
    const bin = h('div', { class: 'bin' }, h('h4', null, icon('x'), 'Belongs to no box')); board.bucket(bin);
    const tray = h('div', { 'data-empty': 'Every piece is placed' }); board.tray(tray);
    const pieces = shuffle([{ t: rule.lenChip, kind: 'len' }, ...rule.slots.map((s) => ({ t: s.chip, kind: 'slot' })), ...rule.decoys.map((t) => ({ t, kind: 'decoy' }))]);
    pieces.forEach((p) => tray.appendChild(board.chip(p.t, p, 'code-chip long')));
    const pmap = h('div', { class: 'pmap' }, cells); pmap.style.setProperty('--n', rule.len);
    box.append(h('div', { class: 'mapwrap' }, lenSlot, pmap), bin, tray);
    let got = 0; const note = h('span', { class: 'note' }, '');
    await checkButton(ctx, () => {
      const left = board.contents(tray).length;
      if (left) { note.textContent = `${left} still to place.`; return false; }
      board.lock();
      const mark = (c, ok) => { setMark(c, ok); if (ok) got++; };
      board.contents(lenSlot).forEach((c) => mark(c, c.__data.kind === 'len'));
      board.contents(bin).forEach((c) => mark(c, c.__data.kind === 'decoy'));
      slots.forEach((s, i) => board.contents(s).forEach((c) => mark(c, rule.slots.some((r) => r.chip === c.__data.t && i >= r.at && i < r.at + r.w))));
      const n = pieces.length; (got === n ? sfx.good : sfx.bad)();
      box.append(fb(got === n ? 'good' : 'bad', got === n ? `Every piece is in its place: ${n} marks.` : `${got} of ${n} pieces in the right place.`),
        explain(['This is the map:', `The length must be ${rule.len}.`, ...rule.slots.map((r) => `${r.w > 1 ? `Boxes ${r.at} to ${r.at + r.w - 1}` : `Box ${r.at}`}: ${r.chip}.`)]));
    }, 'Check', note);
    await ctx.next();
    return { score: got, max: pieces.length };
  },
});
const flip = (l) => (l.includes('!=') ? l.replace(/!=/g, '==') : l.replace(/!/g, ''));
function lineRound(rule, what, right, k, n, all) {
  return {
    title: `Which line tests ${what}? Line ${k} of ${n}.`, intro: rule.name, intro2: 'Pick the line, then press Check.',
    async run(box, ctx) {
      const other = pick(all.filter((l) => l !== right));
      const parseVar = right.replace('return false', 'return true');
      const opts = shuffle([...new Set([right, flip(right), other, parseVar])]);
      const set = choiceSet(opts, { mono: true }); box.append(set.el);
      let pts = 0; const note = h('span', { class: 'note' }, '');
      await checkButton(ctx, () => {
        if (set.value() == null) { note.textContent = 'Pick a line first.'; return false; }
        const ok = opts[set.value()] === right; set.lock(opts.indexOf(right)); if (ok) pts = 1;
        (ok ? sfx.good : sfx.bad)();
        box.append(fb(ok ? 'good' : 'bad', ok ? 'Right.' : 'Not that. The marked line is the test; the others return the wrong way round, test the wrong box, or do nothing useful.'));
      }, 'Check', note);
      await ctx.next();
      return { score: pts, max: 1 };
    },
  };
}
export default {
  mount(stage, api) {
    const rule = pick(POSITION_MAPS);
    const asks = [{ what: 'the length', right: rule.lenLine }, ...rule.slots.map((s) => ({ what: s.w > 1 ? `boxes ${s.at} to ${s.at + s.w - 1}` : `box ${s.at}`, right: s.line }))];
    const all = asks.map((a) => a.right);
    runRounds(stage, api, [place(rule), ...asks.map((a, i) => lineRound(rule, a.what, a.right, i + 1, asks.length, all))]);
  },
};
