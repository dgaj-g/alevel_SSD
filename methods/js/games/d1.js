// D1 Build EnterNumber — booklet section 8 and P4: put the validated-input routine together line by line (traps
// included, each with its real result), then the string version EnterSize, then type the calls that use it.
import { h, icon, codeSpan, codeInline, fb, shuffle, sample, setMark, sfx, para, sameAnswer, scrollIntoViewSoft } from '../ui.js';
import { createBoard } from '../dnd.js';
import { runRounds, checkButton, explain, realResult, transcript } from '../kit.js';
import { EN_BOARD, EN_TRAPS, EN_RUN, ES_BOARD, ES_TRAPS, ES_RUN, CALL_TASKS } from '../data/d.js';

const pad = (d) => '    '.repeat(d);

function parsonsRound({ title, intro, rows, traps, run, runNote, closing }) {
  return {
    title,
    intro,
    intro2: 'Drag each line into its gap — or tap a line, then tap a gap. Some lines are traps. Fill every gap, then press Check.',
    async run(box, ctx) {
      const board = createBoard();
      const tray = h('div', { 'data-empty': 'Every gap is filled' });
      board.tray(tray);
      const want = rows.filter((r) => r.slot).map((r) => r.t);
      const chips = [...want.map((t) => board.chip(codeSpan(t), { t }, 'code-chip')),
        ...traps.map((tr) => board.chip(codeSpan(tr.t), { t: tr.t, trap: tr }, 'code-chip'))];
      shuffle(chips).forEach((c) => tray.appendChild(c));
      const slots = [];
      const cboard = h('div', { class: 'codeboard' }, rows.map((r) => {
        if (!r.slot) return h('div', { class: 'crow' }, codeSpan(pad(r.d) + r.t));
        const s = board.slot(h('div', { class: 'cslot' + (r.d > 1 ? ' d' + r.d : '') }));
        slots.push(s);
        return s;
      }));
      box.append(cboard, tray);
      let pts = 0;
      const note = h('span', { class: 'note' }, 'Fill every gap.');
      await checkButton(ctx, () => {
        const empty = slots.filter((s) => !board.contents(s).length).length;
        if (empty) { note.textContent = `${empty} gap${empty > 1 ? 's' : ''} still empty.`; return false; }
        board.lock();
        const placedTraps = [];
        let misplaced = 0;
        slots.forEach((s, i) => {
          const c = board.contents(s)[0];
          const ok = c.__data.t === want[i];
          setMark(c, ok);
          if (!ok) s.append(h('div', { class: 'cwant' }, icon('check'), codeSpan(want[i])));
          if (ok) pts++;
          else if (c.__data.trap) placedTraps.push(c.__data.trap);
          else misplaced++;
        });
        const full = pts === want.length;
        (full ? sfx.good : sfx.bad)();
        const f = fb(full ? 'good' : 'bad', `${pts} of ${want.length} lines right.`,
          misplaced ? 'A right line in the wrong place still loses the mark — the order is the method.' : '');
        box.append(f);
        placedTraps.forEach((tr) => box.append(h('div', { class: 'card mt' },
          h('p', { class: 'bigq', style: { margin: '0 0 6px' } }, icon('x'), ' ', codeInline(tr.t)),
          para(tr.why),
          h('div', { class: 'mt-s' }, tr.expect.msgs ? realResult(tr.expect) : transcript(tr.ev).el))));
        box.append(h('div', { class: 'split mt' },
          h('div', null, para(runNote, 'note'), transcript(run.ev).el),
          explain(closing)));
        scrollIntoViewSoft(f);
      }, 'Check', note);
      await ctx.next();
      return { score: pts, max: want.length };
    },
  };
}

// Reads a typed call leniently: punctuation and capitals never cost a mark.
export function parseCall(s) {
  const t = String(s).replace(/[“”„]/g, '"').replace(/[‘’]/g, "'").trim();
  const m = /^(?:(\w+)\s+)?(\w+)\s*=\s*(\w+)\s*\(?\s*([\s\S]*?)\s*\)?\s*;?\s*$/.exec(t);
  if (!m) return null;
  const [, type, name, method, args] = m;
  let prompt = null, nums = [];
  const tail = /,?\s*(-?\d+)\s*,?\s*(-?\d+)\s*$/.exec(args);
  if (tail) {
    nums = [Number(tail[1]), Number(tail[2])];
    prompt = args.slice(0, tail.index).replace(/^\s*["']?|["']?\s*,?\s*$/g, '');
  } else prompt = args.replace(/^\s*["']?|["']?\s*$/g, '');
  const quoted = /^\s*["']/.test(args);
  return { type: type || '', name, method, prompt, quoted, nums };
}

export function markCall(text, task) {
  const p = parseCall(text);
  const L = (label, ok, note) => ({ label, ok, note });
  if (!p) return { score: 0, marks: [L('A call that stores its value looks like `int tickets = EnterNumber("…", 1, 6);`', false, 'The = and the method name were not found.')] };
  const marks = [];
  const nameOk = sameAnswer(p.name, task.name);
  const typeOk = p.type.toLowerCase() === 'int';
  marks.push(L(`Stored in a new int: \`int ${task.name} =\``, nameOk && typeOk,
    !typeOk ? (p.type ? `\`${p.type}\` — EnterNumber hands back an int.` : 'Declare it: the type int goes in front of the name.') : !nameOk ? `The task named it ${task.name}.` : null));
  const methOk = p.method.toLowerCase() === 'enternumber';
  marks.push(L('Calls `EnterNumber`', methOk, methOk ? (p.method !== 'EnterNumber' ? 'C# would need the capitals: EnterNumber. The exam would not mind.' : null) : `You called \`${p.method}\`.`));
  const promptOk = !!p.prompt && sameAnswer(p.prompt, task.prompt);
  marks.push(L(`The prompt first, in quotes: \`"${task.prompt}"\``, promptOk, promptOk ? (p.quoted ? null : 'C# would need the quotes round the text. The exam would not mind.') : (p.prompt ? `You wrote "${p.prompt}".` : 'The prompt is missing.')));
  const [a, b] = p.nums;
  const rangeOk = a === task.min && b === task.max;
  const swapped = a === task.max && b === task.min;
  marks.push(L(`Then min, then max: \`${task.min}, ${task.max}\``, rangeOk,
    rangeOk ? null : swapped ? 'Swapped. Arguments are matched to parameters by position: min comes before max in the header.' : p.nums.length ? `You wrote ${a}, ${b}.` : 'The two numbers are missing.'));
  return { score: marks.filter((x) => x.ok).length, marks };
}

const callsRound = {
  title: 'One method, every input',
  intro: 'EnterNumber is written once. Each call brings its own prompt and its own range. Write the call for each job.',
  intro2: 'EnterNumber(string prompt, int min, int max). The prompt is given in each job. 4 marks a call.',
  async run(box, ctx) {
    const tasks = sample(CALL_TASKS, 3);
    const rows = tasks.map((t, i) => {
      const inp = h('input', { class: 'field mono', type: 'text', autocomplete: 'off', spellcheck: 'false', autocapitalize: 'off', placeholder: 'int … = EnterNumber(…);', 'aria-label': `The call for job ${i + 1}` });
      const res = h('div');
      box.append(h('div', { class: 'card' },
        h('p', { class: 'note', style: { margin: 0 } }, `Job ${i + 1} of 3`),
        para(t.task, 'bigq'),
        h('p', { class: 'note' }, 'The prompt: ', codeInline(`"${t.prompt}"`)),
        inp, res));
      return { t, inp, res };
    });
    setTimeout(() => rows[0].inp.focus({ preventScroll: true }), 80);
    let pts = 0;
    await checkButton(ctx, () => {
      const empty = rows.find((r) => !r.inp.value.trim());
      if (empty) { empty.inp.focus(); return false; }
      rows.forEach((r) => {
        r.inp.disabled = true;
        const m = markCall(r.inp.value, r.t);
        pts += m.score;
        r.inp.classList.add(m.score === 4 ? 'good' : 'bad');
        const model = `int ${r.t.name} = EnterNumber("${r.t.prompt}", ${r.t.min}, ${r.t.max});`;
        r.res.append(h('div', { class: 'mt-s' },
          m.marks.map((x) => h('div', { class: 'markline' + (x.ok ? ' ok' : ' no') }, icon(x.ok ? 'check' : 'x'),
            h('div', null, para(x.label), x.note ? para(x.note, 'note') : ''))),
          h('div', { class: 'model' }, h('span', null, 'Model answer'), codeSpan(model)),
          h('p', { class: 'note' }, `${m.score} of 4 · the model call, run with ${r.t.inputs[0]} then ${r.t.inputs[1]}:`),
          transcript(r.t.run.ev).el));
      });
      (pts === 12 ? sfx.good : sfx.bad)();
      const f = fb(pts === 12 ? 'good' : 'bad', `${pts} of 12 marks.`);
      box.append(f, explain(['Three calls, three ranges, one loop. That is why the range comes in as parameters: the same method checks every input in the program.',
        'The arguments go in the order of the parameters: the prompt, then min, then max.']));
      scrollIntoViewSoft(f);
    }, 'Check', 'Write every call.');
    await ctx.next();
    return { score: pts, max: 12 };
  },
};

export default {
  mount(stage, api) {
    api.wide();
    runRounds(stage, api, [
      parsonsRound({
        title: 'Build EnterNumber',
        intro: 'Seven lines are missing from the exam\'s favourite method. Given a prompt and a range, it returns a number inside the range — and will not return until it has one.',
        rows: EN_BOARD, traps: sample(EN_TRAPS, 4), run: EN_RUN,
        runNote: 'The finished method, called with "Age: ", 11 and 19. Entries 150, then 17:',
        closing: ['The test appears twice — in the if and in the while. That is not a slip: the if decides whether to print the error, the while decides whether to go round again.',
          'Mark scheme: declare a variable · loop until valid · prompt · read and convert · range check, both ends · error message · return.'],
      }),
      parsonsRound({
        title: 'Build EnterSize',
        intro: 'The same shape for a letter. EnterSize keeps asking until it gets S, M or L. The line stays text until it is safe to turn it into a char.',
        rows: ES_BOARD, traps: sample(ES_TRAPS, 3), run: ES_RUN,
        runNote: 'The finished method. Entries Large, nothing (just Enter), m, then M:',
        closing: ['The line is text, so it is tested against "S", "M" and "L" — double quotes. && because a bad entry is not S AND not M AND not L.',
          'A small m is refused: "m" is not "M". Only a good letter is turned into a char, on the way out.'],
      }),
      callsRound,
    ]);
  },
};
