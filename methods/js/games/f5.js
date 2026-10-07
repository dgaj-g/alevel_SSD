// F5 Bug Clinic — one line of a practical program is wrong. Find it from what the program does, then choose the fix.
import { h, icon, codeBlock, codeSpan, errorList, fb, shuffle, sample, sfx, para, choiceSet, scrollIntoViewSoft } from '../ui.js';
import { runRounds, checkButton, explain, realResult, transcript, programLines } from '../kit.js';
import { BUGS } from '../data/f.js';

const resultOf = (r) => (r.ev ? transcript(r.ev).el : realResult(r.expect));
const fixView = (t) => h('span', { class: 'fixv' }, t.split('\n').map((l) => h('span', { class: 'fixl' }, codeSpan(l.trim()))));
const N = 8;

const clinic = {
  title: 'Bug Clinic',
  intro: `${N} patients. Each is one of the practical programs with ONE line wrong. Read what it does, then tap the line you think is wrong.`,
  intro2: 'Then choose the line that fixes it. 1 point for the right line, 1 for the right fix. Every result is the real program, run.',
  async run(box, ctx) {
    const picks = sample(BUGS.map((b, i) => [b, i]), N).sort((a, b) => a[1] - b[1]).map(([b]) => b);
    let pts = 0;
    for (let k = 0; k < picks.length; k++) {
      if (!ctx.alive) return null;
      const bug = picks[k];
      box.replaceChildren();
      window.scrollTo(0, 0);
      const src = programLines(bug.cs);
      let flagged = -1;
      const cb = codeBlock(src, {
        cls: 'tall',
        onLine: (i, ln) => {
          if (box.dataset.locked) return;
          if (!src[i].trim() || /^[{}]$/.test(src[i].trim())) return;
          cb.lines.forEach((l) => { l.classList.remove('flagged'); l.querySelector('.flagmk')?.remove(); });
          flagged = i;
          ln.classList.add('flagged');
          ln.append(h('span', { class: 'flagmk', 'aria-label': 'flagged' }, icon('flag')));
          note.textContent = 'Line ' + (i + 1) + ' chosen. Press Check, or tap another line.';
        },
      });
      const isErr = !!bug.expect.msgs;
      const symptom = h('div', { class: 'card' },
        h('p', { class: 'note', style: { margin: '0 0 6px' } }, `Patient ${k + 1} of ${picks.length} · ${bug.prog}`),
        isErr
          ? h('div', null, para('It will not build. The Error List says:', 'bigq'), errorList(bug.expect.msgs))
          : h('div', null, para('It builds and runs, but something is wrong. What it does:', 'bigq'), resultOf(bug)),
        para(bug.should, 'note'));
      const after = h('div');
      delete box.dataset.locked;
      box.append(h('div', { class: 'split wide-left rev-m' }, cb.el, h('div', null, symptom, after)));
      const note = h('span', { class: 'note' }, 'Tap the line that is wrong.');
      // 1 — find the line
      await checkButton(ctx, () => {
        if (flagged < 0) { note.textContent = 'Tap a line in the code first.'; return false; }
        box.dataset.locked = '1';
        const t = src[flagged].trim();
        const ok = t === bug.bad || bug.also.includes(t);
        const real = src.findIndex((l) => l.trim() === bug.bad);
        cb.lines[flagged].classList.remove('flagged');
        cb.lines[flagged].classList.add(ok ? 'good' : 'bad');
        if (!ok && real >= 0) cb.lines[real].classList.add('missed');
        if (ok) pts++;
        (ok ? sfx.good : sfx.bad)();
        const f = fb(ok ? 'good' : 'bad',
          ok ? (t === bug.bad ? 'Found it.' : 'That line is part of the fault.') : 'Not that line.',
          h('p', null, ok && t === bug.bad ? 'The wrong line is ' : 'The line to change is ', codeSpan(bug.bad), ` (line ${real + 1}).`));
        after.append(f);
        scrollIntoViewSoft(f);
      }, 'Check', note);
      if (!ctx.alive) return null;
      // 2 — choose the fix
      const opts = shuffle(bug.fixes);
      const cs = choiceSet(opts.map((o) => fixView(o.t)), { mono: true, cols: 1 });
      const fixCard = h('div', { class: 'card mt' },
        h('p', { class: 'bigq', style: { margin: '0 0 8px' } }, 'Which line should replace it?'),
        h('p', { class: 'note', style: { margin: '0 0 8px' } }, 'Replacing: ', codeSpan(bug.bad)), cs.el);
      after.append(fixCard);
      scrollIntoViewSoft(fixCard);
      await checkButton(ctx, () => {
        if (cs.value() < 0) return false;
        const p = opts[cs.value()];
        cs.lock(opts.findIndex((o) => o.ok));
        if (p.ok) pts++;
        (p.ok ? sfx.good : sfx.bad)();
        const right = opts.find((o) => o.ok);
        const f = fb(p.ok ? 'good' : 'bad', p.ok ? 'Cured.' : p.why, p.ok ? right.why : h('p', null, 'The fix: ', fixView(right.t), ' — ', right.why));
        fixCard.append(f, h('div', { class: 'mt-s' }, para('With the fix, the real program:', 'note'), resultOf(bug.fixed)));
        scrollIntoViewSoft(f);
      }, 'Check', 'Pick one.');
      await ctx.next(k === picks.length - 1 ? 'Finish the round' : 'Next patient');
    }
    box.replaceChildren(explain(['Read the symptom first. An Error List names the problem; a wrong output tells you which value or which line of print to look at.',
      'Then fix the line, not the symptom: the right fix makes the program the booklet\'s again.']));
    await ctx.next();
    return { score: pts, max: picks.length * 2 };
  },
};

export default {
  mount(stage, api) {
    api.wide();
    runRounds(stage, api, [clinic]);
  },
};
