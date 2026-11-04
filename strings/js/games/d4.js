// D4 Accept or Refuse?: be the validator. Sort eight generated codes, then say why each refused code fails.
import { h, icon, fb, pick, shuffle, codeBlock, codeSpan, setMark, sfx, choiceSet } from '../../../arcade/engine/ui.js';
import { createBoard } from '../../../arcade/engine/dnd.js';
import { runRounds, checkButton } from '../../../arcade/engine/kit.js';
import { RULES, nameOf, exampleOf, genCodes } from '../rules.js';

export default {
  mount(stage, api) {
    const rule = pick(RULES); const plant = rule.plants ? pick(rule.plants) : undefined;
    const codes = genCodes(rule, plant); const bad = codes.filter((c) => c.why);
    const sort = {
      title: 'You are the validator', intro: nameOf(rule, plant),
      intro2: 'Sort every code into Accept or Refuse: drag it, or tap a code and then tap a bucket. When all eight are placed, press Check.',
      async run(box, ctx) {
        const board = createBoard();
        const yes = h('div', null, h('h4', null, icon('check'), 'Accept · return true')); const no = h('div', null, h('h4', null, icon('x'), 'Refuse · return false'));
        board.bucket(yes); board.bucket(no);
        const tray = h('div', { 'data-empty': 'All eight are placed. Press Check.' }); board.tray(tray);
        codes.forEach((c) => tray.appendChild(board.chip(codeSpan(c.c), c, 'code-chip')));
        box.append(codeBlock([`Example that passes: ${exampleOf(rule, plant)}`]).el, tray, h('div', { class: 'buckets' }, yes, no));
        let got = 0; const note = h('span', { class: 'note' }, '');
        await checkButton(ctx, () => {
          const left = board.contents(tray).length;
          if (left) { note.textContent = `${left} still to place.`; return false; }
          board.lock();
          [[yes, true], [no, false]].forEach(([b, acc]) => board.contents(b).forEach((chip) => { const d = chip.__data; const ok = acc === (d.why === null); setMark(chip, ok); if (ok) got++; else chip.append(h('small', { class: 'chipwhy' }, d.why ? `Refused: ${d.why}.` : 'Accepted: every rule passes.')); }));
          (got === 8 ? sfx.good : sfx.bad)();
          box.append(fb(got === 8 ? 'good' : 'bad', got === 8 ? 'All eight sorted right.' : `${got} of 8 sorted right. The red codes show the rule they break, or that nothing was wrong.`));
        }, 'Check', note);
        await ctx.next();
        return { score: got, max: 8 };
      },
    };
    const why = bad.map((c, i) => ({
      title: `Why does the validator refuse this code? Code ${i + 1} of ${bad.length}.`, intro: nameOf(rule, plant), intro2: 'Pick the reason, then press Check.',
      async run(box, ctx) {
        let opts = rule.checks.map((x) => x.n); if (opts.length < 4) opts.push('Nothing. Every rule passes.');
        opts = shuffle(opts).slice(0, 4); if (!opts.includes(c.why)) opts[0] = c.why; opts = shuffle(opts);
        const set = choiceSet(opts, {}); box.append(codeBlock([c.c]).el, set.el);
        let pts = 0; const note = h('span', { class: 'note' }, '');
        await checkButton(ctx, () => {
          if (set.value() == null) { note.textContent = 'Pick a reason first.'; return false; }
          const ok = opts[set.value()] === c.why; set.lock(opts.indexOf(c.why)); if (ok) pts = 1;
          (ok ? sfx.good : sfx.bad)();
          box.append(fb(ok ? 'good' : 'bad', ok ? 'Right.' : `Not that. The validator tests the rules in order and stops at the first one that fails: ${c.why}.`));
        }, 'Check', note);
        await ctx.next();
        return { score: pts, max: 1 };
      },
    }));
    runRounds(stage, api, [sort, ...why]);
  },
};
