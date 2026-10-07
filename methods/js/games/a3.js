// A3 Label the Header — booklet section 2: every word of a header has a job.
import { h, codeSpan, fb, shuffle, sample, choiceSet, setMark, sfx, para } from '../ui.js';
import { createBoard } from '../dnd.js';
import { runRounds, checkButton, explain } from '../kit.js';
import { LABELS, LABEL_HEADERS, READ_HEADERS } from '../data/a.js';

export default {
  mount(stage, api) {
    runRounds(stage, api, [
      {
        title: 'Label the parts',
        intro: 'Drag a label under each part of the two headers (or tap a label, then tap a gap). Two labels are not parts of a header.',
        intro2: 'Fill every gap, then press Check.',
        async run(box, ctx) {
          const board = createBoard();
          const tray = h('div', { 'data-empty': 'Every label is placed' });
          board.tray(tray);
          const chips = [];
          LABEL_HEADERS.forEach(() => LABELS.forEach((l) => chips.push(board.chip(l, { l }))));
          ['argument', 'body'].forEach((l) => chips.push(board.chip(l, { l })));
          shuffle(chips).forEach((c) => tray.appendChild(c));
          const slots = [];
          LABEL_HEADERS.forEach((hd, k) => {
            const row = h('div', { class: 'hdr', style: k ? { marginTop: '14px' } : null });
            hd.parts.forEach((p, i) => {
              const s = board.slot(h('div'));
              s.__want = LABELS[i];
              slots.push(s);
              row.appendChild(h('div', { class: 'seg' }, h('div', { class: 'tx' }, codeSpan(p)), s));
            });
            box.appendChild(row);
          });
          box.appendChild(tray);
          const note = h('span', { class: 'note' }, 'Fill every gap.');
          let pts = 0;
          await checkButton(ctx, () => {
            if (slots.some((s) => !board.contents(s).length)) { note.textContent = 'Fill every gap first.'; return false; }
            board.lock();
            slots.forEach((s) => { const c = board.contents(s)[0]; const ok = c.__data.l === s.__want; setMark(c, ok); if (ok) pts++; });
            (pts === slots.length ? sfx.good : sfx.bad)();
            box.append(fb(pts === slots.length ? 'good' : 'bad', `${pts} of ${slots.length} labels right.`),
              explain([
                '`public static` is the opening — type both words on every method; what they mean comes later, in the Classes topics.',
                '`void` is the return type — it hands nothing back. Then the name, then the parameter list: what it needs to be given.',
                'An argument is a value in a CALL, not part of a header. The body is everything between the braces after the header.',
                LABEL_HEADERS[1].note,
              ]));
          }, 'Check', note);
          await ctx.next();
          return { score: pts, max: slots.length };
        },
      },
      {
        title: 'Read the header',
        intro: 'A header tells you what a method is given and what it hands back. Answer each question from the header alone.',
        async run(box, ctx) {
          const sets = sample(READ_HEADERS, 6).map((q) => {
            const opts = shuffle(q.options);
            const cs = choiceSet(opts, { mono: false });
            box.append(h('div', { class: 'card' },
              h('div', { class: 'code', style: { marginBottom: '12px' } }, h('pre', null, h('div', { class: 'ln' }, h('span', { class: 't', style: { paddingLeft: '14px' } }, codeSpan(q.h))))),
              para(q.q, 'bigq'), cs.el));
            return { cs, right: opts.indexOf(q.options[q.a]) };
          });
          let pts = 0;
          await checkButton(ctx, () => {
            if (sets.some((s) => s.cs.value() < 0)) return false;
            sets.forEach((s) => { s.cs.lock(s.right); if (s.cs.value() === s.right) pts++; });
            (pts === sets.length ? sfx.good : sfx.bad)();
            box.append(fb(pts === sets.length ? 'good' : 'bad', `${pts} of ${sets.length} right.`, 'After public static: the return type, the name, then the parameter list — each parameter a type and a name.'));
          }, 'Check', 'Answer all six.');
          await ctx.next();
          return { score: pts, max: sets.length };
        },
      },
    ]);
  },
};
