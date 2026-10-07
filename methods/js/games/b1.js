// B1 Argument or Parameter? — booklet section 3. A speed round, then "which parameter receives it?" by position.
import { h, icon, codeSpan, codeBlock, fb, shuffle, choiceSet, sfx, para, btn, wait, scrollIntoViewSoft } from '../ui.js';
import { runRounds, checkButton } from '../kit.js';
import { SPOT, RECEIVE } from '../data/b.js';

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function hlLine(line, hl) {
  const re = new RegExp((/^\w/.test(hl) ? '\\b' : '') + esc(hl) + (/\w$/.test(hl) ? '\\b' : ''));
  const m = re.exec(line);
  const i = m ? m.index : 0;
  return [codeSpan(line.slice(0, i)), h('span', { class: 'hlword' }, codeSpan(hl)), codeSpan(line.slice(i + hl.length))];
}
const fmt = (ms) => { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

export default {
  mount(stage, api) {
    let keyHandler = null;
    api.onCleanup(() => keyHandler && document.removeEventListener('keydown', keyHandler));
    runRounds(stage, api, [
      {
        title: 'Speed round',
        intro: 'Is the highlighted part an ARGUMENT or a PARAMETER? Press a button — or the A and P keys.',
        intro2: 'A wrong answer breaks your streak. The clock is only for bragging rights.',
        async run(box, ctx) {
          const items = shuffle(SPOT);
          let i = 0, pts = 0, streak = 0, bestStreak = 0;
          const t0 = performance.now();
          const nEl = h('b', null, `1 / ${items.length}`);
          const scEl = h('b', null, '0');
          const tEl = h('b', null, '0:00');
          const comboEl = h('span', { class: 'combo', hidden: true }, icon('flame'), h('span'));
          const timer = setInterval(() => { tEl.textContent = fmt(performance.now() - t0); }, 250);
          api.onCleanup(() => clearInterval(timer));
          const line = h('div', { class: 'bigline', 'aria-live': 'polite' });
          const after = h('div');
          let answer = null;
          const bA = btn('Argument', () => answer && answer('a'), 'cyan');
          const bP = btn('Parameter', () => answer && answer('p'), 'primary');
          bA.appendChild(h('kbd', null, 'A')); bP.appendChild(h('kbd', null, 'P'));
          box.append(
            h('div', { class: 'statrow' },
              h('div', { class: 'stat' }, h('small', null, 'Line'), nEl),
              h('div', { class: 'stat' }, h('small', null, 'Right'), scEl),
              h('div', { class: 'stat' }, h('small', null, icon('timer'), ' Time'), tEl),
              comboEl),
            line, h('div', { class: 'duo' }, bA, bP), after);
          keyHandler = (e) => {
            if (!answer || e.target.tagName === 'INPUT') return;
            const k = e.key.toLowerCase();
            if (k === 'a' || k === 'p') { e.preventDefault(); answer(k); }
          };
          document.addEventListener('keydown', keyHandler);
          ctx.setFoot(h('span', { class: 'note' }, 'Argument = a value in a CALL. Parameter = a name in a HEADER.'));

          for (; i < items.length; i++) {
            if (!api.alive) return null;
            const it = items[i];
            nEl.textContent = `${i + 1} / ${items.length}`;
            line.replaceChildren(...hlLine(it.line, it.hl));
            after.replaceChildren();
            bA.disabled = bP.disabled = false;
            const got = await new Promise((r) => { answer = r; });
            answer = null;
            bA.disabled = bP.disabled = true;
            if (got === it.k) {
              pts++; streak++; bestStreak = Math.max(bestStreak, streak);
              scEl.textContent = String(pts);
              sfx.good();
              line.classList.remove('flash-good'); void line.offsetWidth; line.classList.add('flash-good');
              if (streak >= 3) { comboEl.hidden = false; comboEl.lastChild.textContent = `${streak} in a row`; comboEl.classList.remove('pop'); void comboEl.offsetWidth; comboEl.classList.add('pop'); }
              await wait(420);
            } else {
              streak = 0; comboEl.hidden = true;
              sfx.bad();
              line.classList.remove('shake'); void line.offsetWidth; line.classList.add('shake');
              after.replaceChildren(fb('bad', `It is ${it.k === 'a' ? 'an ARGUMENT' : 'a PARAMETER'}.`, it.why));
              await ctx.next('Next line');
              ctx.setFoot(h('span', { class: 'note' }, 'Argument = a value in a CALL. Parameter = a name in a HEADER.'));
            }
          }
          clearInterval(timer);
          document.removeEventListener('keydown', keyHandler); keyHandler = null;
          const time = fmt(performance.now() - t0);
          line.replaceChildren(document.createTextNode(`${pts} of ${items.length} in ${time}`));
          after.replaceChildren(fb(pts === items.length ? 'good' : 'bad',
            `${pts} of ${items.length} right. Longest streak: ${bestStreak}.`,
            'In the header: parameters — each one a type and a name. In the call: arguments — the values handed over, worked out first.'));
          await ctx.next();
          return { score: pts, max: items.length };
        },
      },
      {
        title: 'Which parameter receives it?',
        intro: 'Arguments are matched to parameters by POSITION — first to first, second to second. Never by name.',
        async run(box, ctx) {
          const items = shuffle(RECEIVE);
          let pts = 0;
          for (let k = 0; k < items.length; k++) {
            if (!api.alive) return null;
            const it = items[k];
            box.replaceChildren();
            const opts = shuffle(it.options);
            const cs = choiceSet(opts, { mono: false });
            const card = h('div', { class: 'card' },
              h('p', { class: 'note', style: { margin: '0 0 8px' } }, `Question ${k + 1} of ${items.length}`),
              codeBlock(it.code.join('\n').split('\n'), { tab: false }).el,
              h('div', { class: 'mt' }), para(it.q, 'bigq'), cs.el);
            box.append(card);
            window.scrollTo(0, 0);
            await checkButton(ctx, () => {
              if (cs.value() < 0) return false;
              const right = opts.indexOf(it.options[it.a]);
              cs.lock(right);
              const ok = cs.value() === right;
              if (ok) { pts++; sfx.good(); } else sfx.bad();
              const f = fb(ok ? 'good' : 'bad', it.why);
              card.append(f);
              scrollIntoViewSoft(f);
            }, 'Check', 'Pick one.');
            await ctx.next(k === items.length - 1 ? 'See my score' : 'Next question');
          }
          return { score: pts, max: items.length };
        },
      },
    ]);
  },
};
