// H1 Final Challenge — thirty questions across the whole topic, three stages, three lives.
// A wrong answer costs a life; clearing a stage wins one back. Every program's result is the real one.
import { h, clear, icon, btn, fb, para, shuffle, sample, choiceSet, codeBlock, sfx, instr, scrollIntoViewSoft } from '../ui.js';
import { programLines, realResult, transcript } from '../kit.js';
import { STAGES, PER_STAGE, LIVES, NO_BUILD } from '../data/h.js';

const TOTAL = STAGES.length * PER_STAGE;

// An option in a "what happens" question is printed output (shown as console lines) unless it is a sentence about the run.
const isProse = (o) => o === NO_BUILD || /^(It |Nothing)/.test(o);
function optionNode(it, o) {
  if (!it.out || isProse(o)) return o;
  return h('span', { class: 'olines' }, o.split('\n').map((l) => h('span', null, l)));
}

function heartsRow(lives, lostNow) {
  return h('div', { class: 'hearts', 'aria-label': `${lives} of ${LIVES} lives left` },
    Array.from({ length: LIVES }, (_, i) => h('span', {
      class: 'heart' + (i < lives ? ' full' : '') + (i === lives && lostNow ? ' lost' : ''),
    }, icon('heart'))));
}

export default {
  mount(stage, api) {
    let lives = LIVES, correct = 0, asked = 0;
    const perStage = STAGES.map(() => ({ right: 0, asked: 0 }));
    const missed = [];
    const hud = h('div', { class: 'hhud' });
    const box = h('div');
    const foot = h('div', { class: 'actions' });

    const drawHud = (lostNow) => hud.replaceChildren(
      heartsRow(lives, lostNow),
      h('span', { class: 'pill' }, `${correct} right`));

    const press = (label, ic = 'chevron-right', note) => new Promise((resolve) => {
      clear(foot);
      if (note) foot.append(h('span', { class: 'note' }, note));
      const b = btn(label, () => resolve(), 'primary', ic);
      foot.append(b);
      setTimeout(() => { b.focus({ preventScroll: true }); scrollIntoViewSoft(b); }, 60);
    });

    function end(cleared) {
      api.progress(cleared ? TOTAL : asked, TOTAL);
      api.progressText(cleared ? 'Run complete' : 'Out of lives');
      const rows = STAGES.map((st, i) => h('tr', null,
        h('td', null, `Stage ${i + 1} · ${st.name}`),
        h('td', { class: 'c' }, perStage[i].asked ? `${perStage[i].right} / ${perStage[i].asked}` : 'not reached')));
      const detail = h('div', null,
        h('table', { class: 'grid' }, h('tbody', null, rows)),
        h('p', { class: 'note mt-s' }, cleared
          ? `All ${TOTAL} questions answered with ${lives} ${lives === 1 ? 'life' : 'lives'} left.`
          : `The run ended at question ${asked} of ${TOTAL}.`),
        missed.length ? h('div', { class: 'hmissed' },
          h('p', { class: 'note' }, 'Look again at:'),
          missed.map((m) => {
            const code = m.code || (m.cs ? programLines(m.cs) : null);
            return h('div', { class: 'hm' }, para(m.q, 'hmq'),
              code ? codeBlock(code, { tab: false, cls: 'mini' }).el : null,
              h('div', { class: 'hma' }, icon('check'), optionNode(m, m.options[0])));
          })) : null);
      const title = cleared ? (correct === TOTAL ? 'A perfect run' : 'All three stages cleared') : 'Out of lives';
      api.finish({ score: correct, max: TOTAL, title, detail });
    }

    async function ask(it, s, k) {
      if (!api.alive) return false;
      api.progress(asked, TOTAL);
      drawHud();
      const order = shuffle(it.options.map((_, i) => i));
      const cs = choiceSet(order.map((i) => optionNode(it, it.options[i])), { mono: it.mono, cols: it.out && it.options.some((o) => o.includes('\n')) ? 2 : undefined });
      const code = it.code || (it.cs ? programLines(it.cs) : null);
      const card = h('div', { class: 'card' },
        h('p', { class: 'note', style: { margin: '0 0 8px' } }, `Question ${asked + 1} of ${TOTAL}`),
        code ? codeBlock(code, { tab: false }).el : null,
        it.cs && it.cs.stdin ? h('p', { class: 'note mt-s' }, icon('keyboard'), ' The user types: ', h('b', null, it.cs.stdin.trim().split('\n').join(', then '))) : null,
        h('div', { class: 'mt' }), para(it.q, 'bigq'), cs.el);
      box.replaceChildren(card);
      window.scrollTo(0, 0);
      await new Promise((resolve) => {
        const note = h('span', { class: 'note' }, 'Pick one.');
        const b = btn('Check', () => {
          if (cs.value() < 0) { note.textContent = 'Pick an answer first.'; return; }
          const ok = order[cs.value()] === 0;
          cs.lock(order.indexOf(0));
          asked++;
          perStage[s].asked++;
          if (ok) { correct++; perStage[s].right++; sfx.good(); } else {
            lives--;
            missed.push(it);
            sfx.bad();
            card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
          }
          drawHud(!ok);
          const f = fb(ok ? 'good' : 'bad', ok ? 'Right.' : (lives ? `Not right — that costs a life. ${lives} left.` : 'Not right — and that was your last life.'), it.why);
          card.append(f);
          if (it.ev) card.append(h('p', { class: 'note mt-s' }, 'What the real program does:'), transcript(it.ev).el);
          else if (it.expect) card.append(h('p', { class: 'note mt-s' }, 'What the real program does:'), realResult(it.expect));
          scrollIntoViewSoft(f);
          resolve();
        }, 'primary', 'check');
        clear(foot); foot.append(note, b);
      });
      if (!api.alive) return false;
      const last = asked === TOTAL || k === PER_STAGE - 1;
      await press(!lives || asked === TOTAL ? 'See my score' : last ? 'Finish the stage' : 'Next question');
      return true;
    }

    async function run() {
      clear(stage);
      stage.append(
        h('h2', { class: 'round-title' }, 'Final Challenge'),
        instr('Thirty questions from the whole of Topic 3, in three stages of ten. You have three lives.',
          'A wrong answer costs a life. Clear a stage and you win a life back (up to three). Lose all three and the run ends.'),
        h('div', { class: 'card hstages' }, STAGES.map((st, i) => h('div', { class: 'hst' },
          h('span', { class: 'hnum' }, String(i + 1)),
          h('div', null, h('p', { class: 'hname' }, st.name), h('p', { class: 'note' }, st.from))))),
        h('div', { class: 'hhud intro' }, heartsRow(LIVES), h('span', { class: 'note' }, 'Three lives to start')),
        foot);
      api.progress(0, TOTAL);
      api.progressText('Ready');
      await press('Start the run', 'play');
      if (!api.alive) return;
      for (let s = 0; s < STAGES.length; s++) {
        const st = STAGES[s];
        clear(stage);
        stage.append(h('h2', { class: 'round-title' }, st.name, h('span', { class: 'pill' }, `Stage ${s + 1} of ${STAGES.length}`)), hud, box, foot);
        const items = sample(st.bank, PER_STAGE);
        for (let k = 0; k < items.length; k++) {
          if (!(await ask(items[k], s, k))) return;
          if (!lives) { end(false); return; }
        }
        if (s === STAGES.length - 1) break;
        // Stage cleared: a life back.
        const back = lives < LIVES;
        if (back) lives++;
        sfx.win();
        drawHud();
        box.replaceChildren(h('div', { class: 'card hclear' },
          h('div', { class: 'hbadge' }, icon('shield-check')),
          h('h3', null, `Stage ${s + 1} cleared`),
          para(`**${perStage[s].right} of ${PER_STAGE}** right in this stage.`),
          para(back ? `You win back a life: **${lives} of ${LIVES}**.` : `Still **${LIVES} of ${LIVES}** lives — not one lost.`),
          h('p', { class: 'note' }, `Next: Stage ${s + 2} · ${STAGES[s + 1].name} (${STAGES[s + 1].from.toLowerCase()}).`)));
        window.scrollTo(0, 0);
        await press(`Start stage ${s + 2}`, 'play');
        if (!api.alive) return;
      }
      end(true);
    }
    run();
  },
};
