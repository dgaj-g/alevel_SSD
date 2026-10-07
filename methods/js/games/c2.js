// C2 Make the Swap Work — booklet section 5: the two ways out of the swap trap. Switch ref on and off in the header
// and in the call, build and run the REAL result (every one of the 16 versions was run through dotnet).
import { h, icon, codeSpan, codeBlock, fb, sfx, btn, shuffle, scrollIntoViewSoft } from '../ui.js';
import { runRounds, checkButton, explain, programLines, outLines, quizRound, realResult } from '../kit.js';
import { MISSIONS, SWAPS, swapCs } from '../data/c.js';

const PLACES = [
  [1, 'a in the header'], [2, 'b in the header'], [4, 'x in the call'], [8, 'y in the call'],
];
const afterLine = (m) => (SWAPS[m].expect.out ? outLines(SWAPS[m].expect.out)[1] : null);

export function whyMask(m) {
  const head = m & 3, call = (m >> 2) & 3;
  if (head !== call) {
    const lines = [];
    [[1, 'a', 'x', 1], [2, 'b', 'y', 2]].forEach(([bit, p, v, n]) => {
      const inHead = m & bit, inCall = m & (bit << 2);
      if (inHead && !inCall) lines.push(`Argument ${n}: the header says ref ${p}, so the call must say ref ${v} too (CS1620).`);
      if (!inHead && inCall) lines.push(`Argument ${n}: the call says ref ${v}, but the header does not say ref — C# will not allow it (CS1615).`);
    });
    return lines.join(' ') + ' ref has to appear in BOTH places, or in neither.';
  }
  if (m === 0) return 'No ref anywhere: Swap gets copies, swaps the copies, and throws them away. x and y do not move.';
  if (m === 15) return 'ref on both, in both places: a IS x and b IS y, so the swap reaches Main.';
  if (m === 5) return 'Only a is ref. a = b writes 50 straight into x; b is just a copy, so y stays 50. Both 50.';
  return 'Only b is ref. b = temp writes 45 straight into y; a was just a copy, so x stays 45. Both 45.';
}

function missionRound(ms, k) {
  return {
    title: ms.title,
    intro: ms.intro,
    intro2: 'Click a faint ref to switch it on. Click again to switch it off. Every result is what the real program does.',
    async run(box, ctx) {
      let mask = ms.start;
      let runs = 0, done = false, pts = 0;
      const cs0 = swapCs(0);
      const lines = programLines(cs0);
      const cb = codeBlock(lines);
      const togs = {};
      const tog = (bit, label) => {
        const locked = ms.lockCall && bit >= 4;
        const b = h('button', { type: 'button', class: 'reftog', 'aria-pressed': 'false', 'aria-label': `ref on ${label}` }, 'ref');
        if (locked) { b.disabled = true; b.title = 'Locked: you cannot change Main in this mission'; }
        b.addEventListener('click', () => { if (done) return; mask ^= bit; paint(); });
        togs[bit] = b;
        return b;
      };
      const t = (i) => cb.lines[i].querySelector('.t');
      t(0).replaceChildren(codeSpan('public static void Swap('), tog(1, 'a in the header'), codeSpan('int a, '), tog(2, 'b in the header'), codeSpan('int b)'));
      const callIdx = lines.findIndex((l) => /Swap\(x, y\)/.test(l));
      t(callIdx).replaceChildren(codeSpan('    Swap('), tog(4, 'x in the call'), codeSpan('x, '), tog(8, 'y in the call'), codeSpan('y);'));
      const paint = () => PLACES.forEach(([bit]) => {
        const on = !!(mask & bit);
        togs[bit].classList.toggle('on', on);
        togs[bit].setAttribute('aria-pressed', String(on));
      });
      paint();
      const dots = h('div', { class: 'runs' }, 'Runs:', [0, 1, 2].map(() => h('i')));
      const target = h('div', { class: 'card' },
        h('p', { class: 'note', style: { margin: 0 } }, `Mission ${k + 1} of ${MISSIONS.length}`),
        h('p', { class: 'bigq', style: { margin: '6px 0 0' } }, icon('crosshair'), ' Goal: ', h('code', { class: 'inl' }, ms.target)),
        h('div', { class: 'mt-s' }, dots));
      const result = h('div', null, h('p', { class: 'note' }, 'Press Build and run to see what happens.'));
      const res = h('div');
      box.append(h('div', { class: 'split' }, cb.el, h('div', null, target, h('div', { class: 'mt' }, result))), res);

      await new Promise((resolve) => {
        const finish = (score, shown) => {
          done = true;
          pts = score;
          Object.values(togs).forEach((b) => { b.disabled = true; });
          const f = fb(shown ? 'info' : 'good', shown ? 'Here is one way that works.' : `Mission complete${runs === 1 ? ' — first run!' : '.'}`);
          res.append(f, explain([ms.why]));
          scrollIntoViewSoft(f);
          resolve();
        };
        const run = () => {
          if (done) return;
          runs++;
          [...dots.querySelectorAll('i')].forEach((d, i) => d.classList.toggle('used', i < runs));
          const ex = SWAPS[mask].expect;
          const o = ex.out ?? null;
          result.replaceChildren(realResult(ex));
          if (ms.want(o)) { sfx.good(); finish(runs === 1 ? 2 : runs === 2 ? 1 : 0, false); return; }
          sfx.bad();
          const hint = h('p', { class: 'note' }, o === null ? 'It did not build. ' + whyMask(mask) : `Not the goal yet: it printed ${afterLine(mask)}.`);
          result.append(hint);
          const extra = runs >= 3 ? btn('Show me', () => { mask = ms.solution; paint(); result.replaceChildren(realResult(SWAPS[mask].expect)); finish(0, true); }, 'ghost', 'eye') : null;
          ctx.setFoot(extra, btn('Build and run', run, 'primary', 'play'));
        };
        ctx.setFoot(h('span', { class: 'note' }, 'Switch ref on or off, then run it.'), btn('Build and run', run, 'primary', 'play'));
      });
      await ctx.next();
      return { score: pts, max: 2 };
    },
  };
}

const PREDICT_OPTS = ['It will not build', 'After: x = 45, y = 50', 'After: x = 50, y = 45', 'After: x = 50, y = 50', 'After: x = 45, y = 45'];
function predictItems() {
  const bad = shuffle([1, 2, 3, 4, 6, 8, 9, 12]).slice(0, 2);
  return shuffle([0, 5, 10, 15, ...bad]).map((m) => {
    const a = afterLine(m);
    return { mask: m, q: 'What happens when you build and run it?', options: PREDICT_OPTS, a: a ? PREDICT_OPTS.indexOf(a) : 0, why: whyMask(m) };
  });
}

export default {
  mount(stage, api) {
    api.wide();
    runRounds(stage, api, [
      ...MISSIONS.map((ms, k) => missionRound(ms, k)),
      quizRound({
        title: 'Predict, then run',
        intro: 'No switches this time. Read where ref is, predict what happens, then see the real result.',
        intro2: 'x starts as 45 and y as 50.',
        items: predictItems(),
        show: (it) => codeBlock(programLines(swapCs(it.mask))).el,
        after: (it) => h('div', { class: 'mt' }, realResult(SWAPS[it.mask].expect)),
      }),
    ]);
  },
};
