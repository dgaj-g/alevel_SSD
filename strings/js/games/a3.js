// A3 Which test passes?: tick every Char test each character passes. A row scores when the whole row is right.
import { h, codeInline, fb, shuffle, sfx } from '../../../arcade/engine/ui.js';
import { runRounds, checkButton } from '../../../arcade/engine/kit.js';
import { CHARS, TESTS } from '../data/a.js';

const named = { "' '": 'a space', "'-'": 'a hyphen', "'#'": 'a hash' };
export default {
  mount(stage, api) {
    runRounds(stage, api, [{
      title: 'Tick every test the character passes',
      intro: 'Each card shows one character. Tick each test that returns true for it. Some characters pass none of them.',
      intro2: 'Tick what you think for all eight, then press Check.',
      async run(box, ctx) {
        const cards = shuffle(CHARS).map((c) => {
          const ticks = TESTS.map((t) => {
            const b = h('button', { type: 'button', class: 'tick', 'aria-pressed': 'false', onclick: () => b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true') }, codeInline(t.name));
            return { t, b };
          });
          const card = h('div', { class: 'card tickcard' }, h('div', { class: 'codebig' }, c.lit), h('div', { class: 'ticks' }, ticks.map((x) => x.b)));
          return { c, ticks, card };
        });
        box.append(h('div', { class: 'tickgrid' }, cards.map((x) => x.card)));
        let pts = 0;
        await checkButton(ctx, () => {
          cards.forEach(({ c, ticks, card }) => {
            let ok = true;
            ticks.forEach(({ t, b }) => { b.disabled = true; const on = b.getAttribute('aria-pressed') === 'true'; const want = !!c[t.k]; if (on !== want) ok = false; b.classList.add(on === want ? 'right' : 'wrong'); if (want) b.classList.add('should'); });
            if (ok) pts++;
            const passes = ticks.filter(({ t }) => c[t.k]).map(({ t }) => t.name);
            card.append(fb(ok ? 'good' : 'bad', `${named[c.lit] || c.lit} passes ${passes.length ? passes.join(' and ') : 'none of the four tests'}.`));
          });
          (pts === 8 ? sfx.good : sfx.bad)();
          box.append(fb(pts === 8 ? 'good' : 'bad', `${pts} of 8 characters right.`));
        }, 'Check');
        await ctx.next();
        return { score: pts, max: 8 };
      },
    }]);
  },
};
