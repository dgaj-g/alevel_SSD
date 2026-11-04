// Zone H: twenty mixed questions drawn from the A3, B2, C1 and D4 pools. Word pools live in the data files; nothing new is taught.
import { CHARS, TESTS } from './a.js';
import { SEARCHES } from './b.js';
import { PARSES } from './c.js';
import { RULES, nameOf, genCodes } from '../rules.js';
import { shuffle } from '../../../arcade/engine/ui.js';

export const NO_BUILD = 'It will not build.';
export const LIVES = 3;
export const PER_STAGE = 10;

const lc = (s) => s.toLowerCase();
const uniq = (a) => a.filter((x, i) => a.indexOf(x) === i);
const a3 = CHARS.flatMap((row) => TESTS.map((t) => {
  const yes = !!row[t.k];
  return { q: `What does \`${t.name}(${row.lit})\` return?`, options: [yes ? 'true' : 'false', yes ? 'false' : 'true'], why: `\`${row.lit}\` ${yes ? 'passes' : 'does not pass'} \`${t.name}\`.`, mono: true };
}));
const b2 = SEARCHES.flatMap((S) => S.rows.map((r) => {
  let options;
  if (r.kind === 'bool') options = [lc(r.answer), r.answer === 'True' ? 'false' : 'true'];
  else {
    const others = uniq(S.rows.filter((x) => x.kind === r.kind && x.answer !== r.answer).map((x) => x.answer));
    const near = r.kind === 'num' ? [String(+r.answer + 1), String(+r.answer - 1), '-1', '0'] : [S.lit];
    options = [r.answer, ...uniq([...shuffle(others), ...near]).filter((o) => o !== r.answer).slice(0, 3)];
  }
  return { code: [`string text = "${S.lit}";`], q: `What does \`${r.expr}\` give?`, options, why: r.why, mono: true };
}));
const c1 = PARSES.map((p) => {
  const right = p.isNum ? `true, and number holds ${p.value}` : 'false, and number holds 0';
  const wrong = p.isNum ? ['false, and number holds 0', 'It crashes.'] : [`true, and number holds 0`, 'It crashes.'];
  return { code: [`int number;`, `bool ok = int.TryParse("${p.text}", out number);`], q: 'What does TryParse return, and what does number hold?', options: [right, ...wrong], why: p.why };
});
function d4() {
  return RULES.flatMap((rule) => {
    const plant = rule.plants ? rule.plants[0] : undefined;
    return genCodes(rule, plant).map((c) => ({
      code: [c.c], q: `${nameOf(rule, plant)} Does it accept this code?`,
      options: c.why ? ['It refuses it.', 'It accepts it.'] : ['It accepts it.', 'It refuses it.'],
      why: c.why ? `It breaks this rule: ${c.why}` : 'Every rule passes.',
    }));
  });
}
export const STAGES = [
  { name: 'Reading and cutting strings', from: 'Parts A and B', bank: () => [...a3, ...b2] },
  { name: 'Numbers and validators', from: 'Parts C and D', bank: () => [...c1, ...d4()] },
];
