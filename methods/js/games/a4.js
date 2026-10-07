// A4 Follow the Calls — click each line in the order it runs. Booklet section 2, deck Activities 1 and 4.
import { h, codeBlock, consolePanel, fb, shuffle, choiceSet, sfx, para, wait } from '../ui.js';
import { runRounds, checkButton, explain, programLines } from '../kit.js';
import { FLOWS } from '../data/a.js';

function flowRound(flow) {
  return {
    title: flow.name,
    intro: 'Main runs from the top. Click each line in the order it runs — when a call jumps into a method, follow it in.',
    intro2: 'Headers and braces do not run; click the lines inside them. A right first click scores a point.',
    async run(box, ctx) {
      const lines = programLines(flow.cs);
      const con = consolePanel();
      const status = h('p', { class: 'bigq', style: { margin: '0 0 10px' } }, 'Click the line that runs first.');
      let step = 0, misses = 0, pts = 0, busy = false;
      const want = flow.steps.filter((s) => !s[2]).length;
      let resolveDone;
      const done = new Promise((r) => { resolveDone = r; });
      let prev = null;

      function advance(el) {
        const s = flow.steps[step];
        if (prev) prev.classList.remove('pc');
        el.classList.add('pc', 'done');
        prev = el;
        if (s[1] !== undefined) con.print(s[1]);
        step++; misses = 0;
        status.textContent = step < flow.steps.length ? 'Click the next line that runs.' : 'Main has finished.';
      }
      async function autoSteps() {
        while (step < flow.steps.length && flow.steps[step][2]) {
          busy = true;
          status.textContent = 'Both calls have handed back their values — control comes back to finish the line…';
          await wait(900);
          advance(cb.lines[flow.steps[step][0]]);
          busy = false;
        }
        if (step >= flow.steps.length) resolveDone();
      }
      const cb = codeBlock(lines, {
        async onLine(i, el) {
          if (busy || step >= flow.steps.length) return;
          const s = flow.steps[step];
          if (i === s[0]) {
            if (misses === 0) { pts++; sfx.good(); } else sfx.tick();
            advance(el);
            await autoSteps();
          } else {
            misses++;
            sfx.bad();
            el.classList.remove('flash-bad'); void el.offsetWidth; el.classList.add('flash-bad');
            if (misses >= 2) {
              busy = true;
              status.textContent = 'Not that one. This is the line that runs next:';
              const right = cb.lines[s[0]];
              right.classList.add('hl2');
              await wait(1100);
              right.classList.remove('hl2');
              busy = false;
              advance(right);
              await autoSteps();
            } else status.textContent = 'Not that one — try again.';
          }
        },
      });
      box.append(status, h('div', { class: 'split wide-left' }, cb.el, h('div', null, con.el)));
      ctx.setFoot(h('span', { class: 'note' }, 'Click lines in the code.'));
      await done;
      sfx.win();
      box.append(fb(pts === want ? 'good' : 'bad', `${pts} of ${want} lines clicked right first time.`), explain([flow.why]));
      let extra = 0, extraMax = 0;
      if (flow.never) {
        extraMax = 1;
        const opts = shuffle(flow.never.options);
        const cs = choiceSet(opts);
        box.append(h('div', { class: 'card mt' }, para(flow.never.q, 'bigq'), cs.el));
        await checkButton(ctx, () => {
          if (cs.value() < 0) return false;
          const right = opts.indexOf(flow.never.options[flow.never.answer]);
          cs.lock(right);
          if (cs.value() === right) { extra = 1; sfx.good(); } else sfx.bad();
          cs.el.after(fb(extra ? 'good' : 'bad', flow.never.why));
        }, 'Check', 'Pick one.');
      }
      await ctx.next();
      return { score: pts + extra, max: want + extraMax };
    },
  };
}

export default {
  mount(stage, api) {
    api.wide();
    runRounds(stage, api, FLOWS.map(flowRound));
  },
};
