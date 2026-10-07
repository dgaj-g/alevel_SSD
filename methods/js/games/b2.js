// B2 Header Builder — deck Activity 3: write the header from a plain description. Marked like the scheme:
// the opening and name, the return type, the number of parameters, each parameter's type in order.
import { h, icon, codeSpan, fb, sfx, para } from '../ui.js';
import { runRounds, checkButton, explain } from '../kit.js';
import { HEADERS, EXAM_HEADERS } from '../data/b.js';

const KEYS = ['public static ', 'void ', 'int ', 'double ', 'string ', 'char ', 'bool ', '(', ')', ', '];
const TYPE_NOTES = {
  integer: '`integer` is not a C# type — it is `int`.',
  float: 'The course uses `double` for numbers with pence, not float.',
  decimal: 'The course uses `double` for numbers with pence.',
  boolean: '`boolean` is not a C# type — it is `bool`.',
  str: 'A text type is `string`.',
};

export function parseHeader(s) {
  let t = String(s || '').replace(/\s+/g, ' ').trim();
  const semi = /;$/.test(t);
  t = t.replace(/;$/, '').replace(/\{\s*\}?$/, '').trim();
  const m = /^(.*?)\(([^()]*)\)$/.exec(t);
  if (!m) return { broken: true, semi };
  const words = m[1].trim().split(' ').filter(Boolean);
  const name = words.pop() || '';
  const ret = words.pop() || '';
  const opening = words.join(' ');
  const params = m[2].trim() ? m[2].split(',').map((p) => p.trim().split(' ').filter(Boolean)) : [];
  return { opening, ret, name, params, semi };
}

// Returns {marks:[{label, ok, note}], score}
export function markHeader(text, want) {
  const [wRet, wName, wTypes] = want;
  const p = parseHeader(text);
  const L = (label, ok, note) => ({ label, ok, note });
  if (!text.trim()) return { score: 0, marks: [L('Nothing written', false)] };
  if (p.broken) {
    return { score: 0, marks: [L('A header ends with its parameter list in round brackets: `( … )`', false, 'Check you have one ( and one ) and nothing after them.')] };
  }
  const lc = (x) => x.toLowerCase();
  const marks = [];
  const openOk = lc(p.opening) === 'public static';
  const nameOk = lc(p.name) === lc(wName);
  let n1 = null;
  if (!openOk) n1 = p.opening ? `It starts \`${p.opening}\` — every header here starts \`public static\`.` : 'It needs `public static` at the start.';
  else if (!nameOk) n1 = `The method is called \`${wName}\`.`;
  else if (p.name !== wName || p.opening !== 'public static') n1 = `C# would want exactly \`${p.opening !== 'public static' ? 'public static ' : ''}${wName}\` — the exam is not fussy about capitals. C# is.`;
  marks.push(L(`Opening and name: \`public static … ${wName}\``, openOk && nameOk, n1));
  const retOk = lc(p.ret) === wRet;
  marks.push(L(`Return type: \`${wRet}\``, retOk, retOk ? null : (TYPE_NOTES[lc(p.ret)] || (p.ret ? `You wrote \`${p.ret}\`.` : 'The return type is missing.')) + (wRet === 'void' ? ' It hands nothing back, so: void.' : '')));
  const countOk = p.params.length === wTypes.length;
  marks.push(L(`${wTypes.length} parameter${wTypes.length > 1 ? 's' : ''}`, countOk, countOk ? null : `You wrote ${p.params.length}.`));
  let typesOk = countOk, tNote = null;
  if (countOk) {
    const names = new Set();
    p.params.forEach((pp, i) => {
      if (!typesOk) return;
      if (pp.length !== 2) { typesOk = false; tNote = pp.length < 2 ? `Parameter ${i + 1} needs a type AND a name, such as \`${wTypes[i]} x\`.` : `Parameter ${i + 1} has too many words.`; return; }
      if (lc(pp[0]) !== wTypes[i]) { typesOk = false; tNote = TYPE_NOTES[lc(pp[0])] || `Parameter ${i + 1} should be a \`${wTypes[i]}\` — you wrote \`${pp[0]}\`.`; return; }
      if (!/^[A-Za-z_]\w*$/.test(pp[1])) { typesOk = false; tNote = `\`${pp[1]}\` cannot be a name.`; return; }
      if (names.has(pp[1])) { typesOk = false; tNote = `Two parameters cannot share the name \`${pp[1]}\`.`; return; }
      names.add(pp[1]);
    });
  }
  marks.push(L(`Types in order: \`${wTypes.join(', ')}\``, typesOk, tNote));
  const score = marks.filter((m) => m.ok).length;
  if (p.semi) marks.push({ label: 'No semicolon after a header. With one, the body is cut off from it and C# refuses: CS1519 "Invalid token \'{\' in a member declaration".', ok: null });
  return { score, marks };
}

function headerRound(title, list, intro) {
  return {
    title,
    intro,
    intro2: 'Any sensible parameter names are fine. Type, or tap the keys under a box. Then press Check.',
    async run(box, ctx) {
      const rows = list.map((it, k) => {
        const inp = h('input', { class: 'field mono', type: 'text', placeholder: 'public static …', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': `Header for ${it.want[1]}` });
        const keys = h('div', { class: 'keys' }, KEYS.map((key) => h('button', {
          type: 'button', tabindex: '-1',
          onclick: () => {
            if (inp.disabled) return;
            const a = inp.selectionStart ?? inp.value.length, b = inp.selectionEnd ?? a;
            inp.value = inp.value.slice(0, a) + key + inp.value.slice(b);
            inp.focus(); inp.setSelectionRange(a + key.length, a + key.length);
          },
        }, key.trim() || key)));
        const res = h('div');
        box.append(h('div', { class: 'card' },
          h('p', { class: 'note', style: { margin: '0 0 6px' } }, `${k + 1} · ${it.src}`),
          para(it.d, 'bigq'), inp, keys, res));
        return { it, inp, res, keys };
      });
      let pts = 0;
      const max = list.length * 4;
      await checkButton(ctx, () => {
        if (rows.some((r) => !r.inp.value.trim())) {
          const empty = rows.find((r) => !r.inp.value.trim());
          empty.inp.focus();
          return false;
        }
        rows.forEach((r) => {
          r.inp.disabled = true;
          r.keys.hidden = true;
          const m = markHeader(r.inp.value, r.it.want);
          pts += m.score;
          r.inp.classList.add(m.score === 4 ? 'good' : 'bad');
          r.res.append(h('div', { class: 'mt-s' },
            m.marks.map((x) => h('div', { class: 'markline' + (x.ok === null ? ' info' : x.ok ? ' ok' : ' no') },
              icon(x.ok === null ? 'info' : x.ok ? 'check' : 'x'),
              h('div', null, para(x.label), x.note ? para(x.note, 'note') : null))),
            h('div', { class: 'model' }, h('span', null, 'Model answer'), codeSpan(r.it.model)),
            h('p', { class: 'note' }, `${m.score} of 4`)));
        });
        (pts === max ? sfx.good : sfx.bad)();
        box.append(fb(pts === max ? 'good' : 'bad', `${pts} of ${max} marks.`),
          explain(['Return type: `void` if it hands nothing back; `int` for a whole number; `double` for pence or decimals; `string` for text; `char` for one single letter; `bool` for true or false.',
            'Then the name, then each parameter as a type and a name, separated by commas, in the order the description gives them.']));
      }, 'Check', 'Write every header.');
      await ctx.next();
      return { score: pts, max };
    },
  };
}

export default {
  mount(stage, api) {
    runRounds(stage, api, [
      headerRound('Write the header', HEADERS, 'Write the HEADER only — no body — for each method described. Every header starts public static.'),
      headerRound('Exam headers', EXAM_HEADERS, 'These four headers come from real CCEA papers. Write each one from its description.'),
    ]);
  },
};
