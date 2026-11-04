// Small builders for Topic 4 content. Every item with `cs` + `expect` is built and run by verify/verify_all.py under dotnet.
export const prog = (main, out, methods = '', stdin = '') => ({ cs: { methods, main, stdin }, expect: { out } });
export const crash = (main, out, err, methods = '') => ({ cs: { methods, main, stdin: '' }, expect: { out, crash: true, err } });
export const noBuild = (main, code, msg, methods = '') => ({ cs: { methods, main, stdin: '' }, expect: { errors: [code], msgs: [[code, msg]] } });
// One predict question: optional set-up lines, then an expression; its answer is what WriteLine prints.
export const val = (setup, expr, answer, more = {}) => ({ ...prog(`${setup ? setup + '\n' : ''}Console.WriteLine(${expr});`, `${answer}\n`), lines: [...(setup ? setup.split('\n') : []), expr], answer: String(answer), ...more });
// Parsons rows from a model method: braces, the header and `return false;` stay printed; every other line becomes a gap.
export const rowsFromCode = (code, fixed = /^(\{|\}|public static .*|return false;)$/) => code.split('\n').map((line) => { const t = line.trim(); const d = Math.floor((line.length - line.trimStart().length) / 4); return fixed.test(t) ? { t, d } : { t, d, slot: true }; });
