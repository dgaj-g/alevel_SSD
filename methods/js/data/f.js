// Zone F content — booklet section 11: the four practicals (P1–P4), each built step by step from the booklet's own
// brief, plus the Bug Clinic. Every option's program carries cs + expect (verify/verify_all.py runs them with dotnet):
// a practical is a template with {{k}} gap lines; each wrong option is the right program with ONE gap changed.
// The two console simulators (the quote machine, the order desk) are checked against dotnet by QUOTE_CASES / ORDER_CASES.
import { toInt32, stdoutOf, crashLine } from './d.js';

const O = (out, more) => ({ out, ...more });
// The Error List shows each distinct message once (as the verifier reads it).
const E = (...all) => { const msgs = all.filter((m, i) => all.findIndex((x) => x[0] === m[0] && x[1] === m[1]) === i); return { errors: [...new Set(msgs.map((m) => m[0]))], msgs }; };
const stdin = (ev) => ev.filter((e) => e[0] === 'in').map((e) => e[1] + '\n').join('');
const swap = (src, a, b) => { if (!src.includes(a)) throw new Error('swap: not found ' + a); return src.replace(a, b); };
const pad = (d) => '    '.repeat(d);
const indent = (src, d) => src.split('\n').map((l) => (l ? pad(d) + l : l)).join('\n');

export const CLOSE = 'Console.WriteLine();\nConsole.WriteLine("Press Enter to close this window.");\nConsole.ReadLine();';
export const CLOSE_OUT = '\nPress Enter to close this window.\n';

// What dotnet must do for a run: its output, plus a crash or a loop that never ends.
function expectOf(ev, loops) {
  if (loops) return { out: stdoutOf(ev), loops: true };
  const last = ev[ev.length - 1];
  if (last && last[0] === 'crash') return O(stdoutOf(ev), { crash: true, err: crashLine(last[1], last[2]) });
  return O(stdoutOf(ev));
}

/* ---------- templates: a whole line `{{k}}` is gap k; '' removes the line; a multi-line option keeps the gap's indent ---------- */
export function fillSrc(src, pick) {
  return src.split('\n').flatMap((l) => {
    const m = /^(\s*)\{\{(\d+)\}\}$/.exec(l);
    if (!m) return [l];
    const t = pick(+m[2]);
    if (t === '') return [];
    return t.split('\n').map((x) => (x ? m[1] + x : x));
  }).join('\n');
}

// Builds every option's program. step.wrong[i]: {t, why, expect} for a program that does not build,
// {t, why, out} for one that runs with no input, {t, why, ev, loops?} for one that runs with input.
function practical(P) {
  const right = (k) => P.steps.find((s) => s.k === k).line;
  P.fill = (pick) => ({ methods: fillSrc(P.methods, pick), main: fillSrc(P.main, pick) });
  P.right = P.fill(right);
  P.steps.forEach((s) => s.wrong.forEach((w) => {
    const code = P.fill((k) => (k === s.k ? w.t : right(k)));
    if (w.ev) { w.cs = { ...code, stdin: stdin(w.ev) }; w.expect = expectOf(w.ev, w.loops); }
    else if (w.out != null) { w.cs = { ...code, stdin: '' }; w.expect = O(w.out); }
    else w.cs = { ...code, stdin: P.bookIn ? P.bookIn.map((x) => x + '\n').join('') : '' };
  }));
  P.run = P.bookEv ? { ev: P.bookEv, cs: { ...P.right, stdin: stdin(P.bookEv) }, expect: expectOf(P.bookEv) }
    : { cs: { ...P.right, stdin: '' }, expect: O(P.bookOut) };
  return P;
}

/* ---------- Convert.ToDouble and the :F2 / :C formats, as .NET does them (en-GB) ---------- */
const WS = /^[\t\n\v\f\r ]+|[\t\n\v\f\r ]+$/g;
export function toDouble(s) {
  const t = s.replace(WS, '');
  const bad = { ex: 'FormatException', msg: `The input string '${s}' was not in a correct format.` };
  const sp = /^([+-]?)(.*)$/.exec(t);
  const body = sp[2];
  if (/^nan$/i.test(t)) return { v: NaN };
  if (body === '∞') return { v: sp[1] === '-' ? -Infinity : Infinity };
  // digits with thousands commas (never first), an optional point and digits, an optional exponent
  const m = /^(\d[\d,]*)?(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/.exec(body);
  if (!m || !/\d/.test((m[1] || '') + (m[2] || ''))) return bad;
  const v = Number(sp[1] + (m[1] || '0').replace(/,/g, '') + '.' + (m[2] || '0') + (m[3] != null ? 'e' + m[3] : ''));
  return { v };
}
// Two decimal places, ties to even on the exact binary value (what .NET prints; JS toFixed differs).
function two(v) {
  const neg = v < 0 || Object.is(v, -0);
  const dv = new DataView(new ArrayBuffer(8));
  dv.setFloat64(0, Math.abs(v));
  const hi = dv.getUint32(0), lo = dv.getUint32(4);
  const e = (hi >>> 20) & 0x7ff;
  let mant = (BigInt(hi & 0xfffff) << 32n) | BigInt(lo);
  let exp;
  if (e === 0) exp = -1074; else { mant |= 1n << 52n; exp = e - 1075; }
  const n = mant * 100n;
  let q;
  if (exp >= 0) q = n << BigInt(exp);
  else {
    const den = 1n << BigInt(-exp);
    q = n / den;
    const r = n % den;
    if (2n * r > den || (2n * r === den && (q & 1n) === 1n)) q += 1n;
  }
  const s = q.toString().padStart(3, '0');
  return { neg, int: s.slice(0, -2), frac: s.slice(-2) };
}
const special = (v) => (Number.isNaN(v) ? 'NaN' : v === Infinity ? '∞' : v === -Infinity ? '-∞' : null);
export function fmtF2(v) { const sp = special(v); if (sp) return sp; const t = two(v); return (t.neg ? '-' : '') + t.int + '.' + t.frac; }
export function fmtC(v) {
  const sp = special(v); if (sp) return sp;
  const t = two(v);
  return (t.neg ? '-' : '') + '£' + t.int.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + t.frac;
}

/* =====================================================================================================
   P1 — The Notice Board
   ===================================================================================================== */
const B_OUT = "=== OUR LADY'S NOTICE BOARD ===\n===============================\n\n";
const H_OUT = 'Open 8.30 am to 4.00 pm, Monday to Friday\nClosed at weekends\n';
const R_OUT = '1. Walk on the left\n2. Phones away in class\n3. Be kind\n';
export const P1_PARTS = { ShowBanner: B_OUT, ShowOpeningHours: H_OUT, ShowRules: R_OUT };

export const P1 = practical({
  id: 'p1', name: 'The Notice Board',
  building: 'A notice board that prints a banner, the opening hours and three rules, then the banner again. Three methods do the printing — ShowBanner is called twice; Main only calls them.',
  methods: [
    '{{1}}',
    '{',
    '    Console.WriteLine("=== OUR LADY\'S NOTICE BOARD ===");',
    '    Console.WriteLine("===============================");',
    '    Console.WriteLine();',
    '}',
    '',
    'public static void ShowOpeningHours()',
    '{',
    '    {{2}}',
    '    Console.WriteLine("Closed at weekends");',
    '}',
    '',
    'public static void ShowRules()',
    '{',
    '    Console.WriteLine("1. Walk on the left");',
    '    Console.WriteLine("2. Phones away in class");',
    '    {{3}}',
    '}',
  ].join('\n'),
  main: ['{{4}}', 'ShowOpeningHours();', '{{5}}', '{{6}}', CLOSE].join('\n'),
  bookOut: B_OUT + H_OUT + R_OUT + B_OUT + CLOSE_OUT,
  steps: [
    { k: 1, at: 'ShowBanner · the header', brief: 'The header names the method ShowBanner and says it returns nothing.',
      line: 'public static void ShowBanner()',
      wrong: [
        { t: 'public static void showBanner()', why: 'C# is case-sensitive. The method is now called showBanner, so the calls to ShowBanner find nothing.',
          expect: E(['CS0103', "The name 'ShowBanner' does not exist in the current context"]) },
        { t: 'public static string ShowBanner()', why: 'string promises to hand back text, but the body has no return line. A method that only prints is void.',
          expect: E(['CS0161', "'Program.ShowBanner()': not all code paths return a value"]) },
        { t: 'public static void ShowBanner(void)', why: 'Empty brackets already mean "takes nothing". void goes in front of the name, never inside the brackets.',
          expect: E(['CS1536', "Invalid parameter type 'void'"], ['CS1001', 'Identifier expected']) },
      ] },
    { k: 2, at: 'ShowOpeningHours · line 1', brief: 'Print "Open 8.30 am to 4.00 pm, Monday to Friday".',
      line: 'Console.WriteLine("Open 8.30 am to 4.00 pm, Monday to Friday");',
      wrong: [
        { t: 'Console.Write("Open 8.30 am to 4.00 pm, Monday to Friday");', why: 'Console.Write leaves the cursor on the same line, so "Closed at weekends" joins straight on.',
          out: B_OUT + 'Open 8.30 am to 4.00 pm, Monday to FridayClosed at weekends\n' + R_OUT + B_OUT + CLOSE_OUT },
        { t: 'console.WriteLine("Open 8.30 am to 4.00 pm, Monday to Friday");', why: 'C# is case-sensitive: console is not Console.',
          expect: E(['CS0103', "The name 'console' does not exist in the current context"]) },
        { t: "Console.WriteLine('Open 8.30 am to 4.00 pm, Monday to Friday');", why: 'Single quotes hold one character (a char). Text goes in double quotes.',
          expect: E(['CS1012', 'Too many characters in character literal']) },
      ] },
    { k: 3, at: 'ShowRules · line 3', brief: 'Print "3. Be kind".',
      line: 'Console.WriteLine("3. Be kind");',
      wrong: [
        { t: 'return "3. Be kind";', why: 'ShowRules is void, so it cannot hand a value back. And return does not print anything anyway.',
          expect: E(['CS0127', "Since 'Program.ShowRules()' returns void, a return keyword must not be followed by an object expression"]) },
        { t: 'Console.WriteLine("3. Be kind")', why: 'Every statement ends with a semicolon.',
          expect: E(['CS1002', '; expected']) },
        { t: 'Console.Write("3. Be kind");', why: 'Write does not end the line. The next thing printed (the banner) joins on the end of the rule.',
          out: B_OUT + H_OUT + '1. Walk on the left\n2. Phones away in class\n3. Be kind' + B_OUT + CLOSE_OUT },
      ] },
    { k: 4, at: 'Main · call 1', brief: 'Call ShowBanner.',
      line: 'ShowBanner();',
      wrong: [
        { t: 'ShowBanner;', why: 'Without the brackets it is just the method\'s name, not a call. The brackets make it run.',
          expect: E(['CS0201', 'Only assignment, call, increment, decrement, await, and new object expressions can be used as a statement']) },
        { t: 'showBanner();', why: 'The call must match the header exactly, capital S included.',
          expect: E(['CS0103', "The name 'showBanner' does not exist in the current context"]) },
        { t: 'Console.WriteLine(ShowBanner());', why: 'ShowBanner hands nothing back (void), so WriteLine has nothing to print. Call it on its own: it does its own printing.',
          expect: E(['CS1503', "Argument 1: cannot convert from 'void' to 'bool'"]) },
      ] },
    { k: 5, at: 'Main · call 3', brief: 'Call ShowRules.',
      line: 'ShowRules();',
      wrong: [
        { t: 'ShowRules(3);', why: 'The header has empty brackets, so ShowRules takes nothing. A call must send exactly what the header asks for.',
          expect: E(['CS1501', "No overload for method 'ShowRules' takes 1 arguments"]) },
        { t: 'string rules = ShowRules();', why: 'ShowRules is void: it hands nothing back, so there is nothing to store.',
          expect: E(['CS0029', "Cannot implicitly convert type 'void' to 'string'"]) },
        { t: 'ShowOpeningHours();', why: 'The hours print twice and the rules never print. A method only runs when it is called.',
          out: B_OUT + H_OUT + H_OUT + B_OUT + CLOSE_OUT },
      ] },
    { k: 6, at: 'Main · call 4', brief: 'Call ShowBanner again, so the board ends with the banner.',
      line: 'ShowBanner();',
      wrong: [
        { t: '', show: '(nothing — it has been called once already)', why: 'A method runs once for each call. To print the banner twice, call it twice.',
          out: B_OUT + H_OUT + R_OUT + CLOSE_OUT },
        { t: 'ShowBanner(2);', why: 'This does not mean "twice". ShowBanner takes nothing, so a number in its brackets will not build.',
          expect: E(['CS1501', "No overload for method 'ShowBanner' takes 1 arguments"]) },
        { t: 'Console.WriteLine("ShowBanner");', why: 'In quotes, ShowBanner is just text, so it prints the word. A call has no quotes.',
          out: B_OUT + H_OUT + R_OUT + 'ShowBanner\n' + CLOSE_OUT },
      ] },
  ],
  closing: ['Main only calls. Each method does one job, and ShowBanner is written once but used twice.',
    'A void method is called on its own line: its name, the brackets, the semicolon. There is nothing to store.'],
});

// Round 2 — read the board, write Main: call chips into slots, then the real output of that order.
const boardProgram = (calls) => ({ cs: { methods: P1.right.methods, main: calls.map((c) => c + '();').join('\n') + '\n' + CLOSE, stdin: '' },
  expect: O(calls.map((c) => P1_PARTS[c]).join('') + CLOSE_OUT) });
export const P1_BOARDS = [
  { name: 'The short board', calls: ['ShowBanner', 'ShowOpeningHours'] },
  { name: 'Rules first', calls: ['ShowBanner', 'ShowRules', 'ShowOpeningHours', 'ShowBanner'] },
  { name: 'The sandwich', calls: ['ShowRules', 'ShowBanner', 'ShowOpeningHours', 'ShowBanner', 'ShowRules'] },
  { name: 'Two banners on top', calls: ['ShowBanner', 'ShowBanner', 'ShowRules'] },
].map((b) => ({ ...b, ...boardProgram(b.calls) }));

// Round 3 — on your own: ShowDivider.
const DIVIDER = 'public static void ShowDivider()\n{\n    for (int i = 1; i <= 30; i++)\n    {\n        Console.Write("-");\n    }\n    Console.WriteLine();\n}';
const DASHES = '-'.repeat(30) + '\n';
const P1_OWN_MAIN = ['ShowBanner();', 'ShowOpeningHours();', 'ShowDivider();', 'ShowRules();', 'ShowDivider();', 'ShowBanner();', CLOSE].join('\n');
export const P1_OWN = {
  problem: [
    'The notice board needs a line of 30 dashes between its parts. Write a method called ShowDivider that prints them. Inside it, use a for loop that prints one dash each time round, with Console.Write so the dashes stay on one line. After the loop, end the line.',
    'Call it twice in Main: between the opening hours and the rules, and between the rules and the last banner.',
  ],
  model: [...DIVIDER.split('\n'), '', '// in Main:', ...P1_OWN_MAIN.split('\n').slice(0, 6)],
  cs: { methods: P1.right.methods + '\n\n' + DIVIDER, main: P1_OWN_MAIN, stdin: '' },
  expect: O(B_OUT + H_OUT + DASHES + R_OUT + DASHES + B_OUT + CLOSE_OUT),
  points: [
    { t: 'The header: `public static void ShowDivider()`', find: /void\s+ShowDivider\s*\(\s*\)/i },
    { t: 'A for loop that runs 30 times (1 to 30, or 0 to 29)', find: /for\s*\([^)]*(<=?\s*(30|29))/i },
    { t: '`Console.Write("-");` inside the loop', find: /Console\.Write\s*\(\s*["']-["']\s*\)/i },
    { t: '`Console.WriteLine();` after the loop', find: /\}\s*Console\.WriteLine\s*\(\s*\)/i },
    { t: 'Two calls in Main: after ShowOpeningHours, and after ShowRules', find: /ShowOpeningHours\s*\(\s*\)\s*;?\s*ShowDivider\s*\(\s*\)[\s\S]*ShowRules\s*\(\s*\)\s*;?\s*ShowDivider\s*\(\s*\)/i },
  ],
  notes: ['Any loop that runs 30 times is right (0 to 29 works too). Any loop variable name is fine.',
    'Common slips: Console.WriteLine inside the loop prints 30 lines of one dash; leaving out the Console.WriteLine(); after the loop puts "1. Walk on the left" on the end of the dashes.'],
};

// Round 4 — slips: what does each version of ShowDivider do?
const SLIP_MAIN_P1 = 'ShowOpeningHours();\nShowDivider();\nShowRules();';
const divider = (loop, body, after = '    Console.WriteLine();') => `public static void ShowDivider()\n{\n    ${loop}\n    {\n        ${body}\n    }\n${after ? after + '\n' : ''}}`;
const p1Slip = (code, a, why, out) => ({ code, a, why, cs: { methods: P1.right.methods + '\n\n' + code, main: SLIP_MAIN_P1, stdin: '' }, ...(out == null ? {} : { expect: O(out) }) });
export const P1_SLIPS = {
  main: SLIP_MAIN_P1,
  outcomes: ['30 dashes on one line — it works', '30 lines, each with one dash', 'The dashes, with "1. Walk on the left" joined on the end', '29 dashes', '31 dashes', 'It will not build'],
  versions: [
    p1Slip(divider('for (int i = 0; i < 30; i++)', 'Console.Write("-");'), 0, '0 to 29 is 30 times round. Starting at 0 with < is the other common way to count to 30.', H_OUT + DASHES + R_OUT),
    p1Slip(divider('for (int i = 1; i <= 30; i++)', "Console.Write('-');"), 0, "'-' in single quotes is one char, and Console.Write prints a char happily. It works.", H_OUT + DASHES + R_OUT),
    p1Slip(divider('for (int i = 1; i <= 30; i++)', 'Console.WriteLine("-");'), 1, 'WriteLine ends the line every time round: 30 lines of one dash, then the WriteLine after the loop adds a blank line.', H_OUT + '-\n'.repeat(30) + '\n' + R_OUT),
    p1Slip(divider('for (int i = 1; i <= 30; i++)', 'Console.Write("-");', ''), 2, 'Nothing ends the line after the loop, so the next thing printed joins on the end of the dashes.', H_OUT + '-'.repeat(30) + R_OUT),
    p1Slip(divider('for (int i = 1; i < 30; i++)', 'Console.Write("-");'), 3, 'Starting at 1 and stopping before 30 is 29 times round.', H_OUT + '-'.repeat(29) + '\n' + R_OUT),
    p1Slip(divider('for (int i = 0; i <= 30; i++)', 'Console.Write("-");'), 4, '0 up to and including 30 is 31 times round.', H_OUT + '-'.repeat(31) + '\n' + R_OUT),
    { ...p1Slip(divider('for (i = 1; i <= 30; i++)', 'Console.Write("-");'), 5, 'The loop variable is never declared: it needs int in front of i.'),
      expect: E(['CS0103', "The name 'i' does not exist in the current context"], ['CS0103', "The name 'i' does not exist in the current context"], ['CS0103', "The name 'i' does not exist in the current context"]) },
  ],
};

/* =====================================================================================================
   P2 — The Quote Machine
   ===================================================================================================== */
export const QUOTE_IN = ['4.5', '3.2', '12.99'];
const ASKS = [['length', 'Room length in metres: '], ['width', 'Room width in metres: '], ['ppm', 'Price per square metre: ']];
// o can change a sum to match a wrong line: cost(area, ppm), vat(x), vatOf(area, cost), total(cost, vat), fitting(length, width).
export function runQuote(inputs, o = {}) {
  const f = { cost: (a, p) => a * p, vat: (x) => x * 0.2, vatOf: (a, c) => c, total: (c, v) => c + v, ...o };
  const ev = [['out', '=== THE QUOTE MACHINE ===\n\n']];
  const v = {};
  let i = 0;
  for (const [k, p] of ASKS) {
    ev.push(['out', p]);
    if (i >= inputs.length) return { ev, waiting: k, done: false, v };
    const line = inputs[i++];
    ev.push(['in', line]);
    const r = toDouble(line);
    if (r.ex) { ev.push(['crash', r.ex, r.msg]); return { ev, crashed: r, at: k, done: true, v }; }
    v[k] = r.v;
  }
  v.area = v.length * v.width;
  v.cost = f.cost(v.area, v.ppm);
  v.vat = f.vat(f.vatOf(v.area, v.cost));
  v.total = f.total(v.cost, v.vat);
  const t = { area: fmtF2(v.area), ppm: fmtC(v.ppm), cost: fmtC(v.cost), vat: fmtC(v.vat), total: fmtC(v.total) };
  const lines = [`Area: ${t.area} square metres`, `Price per square metre: ${t.ppm}`, `Cost before VAT: ${t.cost}`, `VAT: ${t.vat}`, `Total: ${t.total}`];
  if (f.fitting) {
    v.fit = f.fitting(v.length, v.width);
    t.fit = fmtC(v.fit);
    t.withFit = fmtC(v.cost + v.vat + v.fit);
    lines.push(`Fitting: ${t.fit}`, `Total with fitting: ${t.withFit}`);
  }
  ev.push(['out', '\n' + lines.join('\n') + '\n' + CLOSE_OUT]);
  return { ev, done: true, v, t };
}

const P2_MAIN_HEAD = [
  'Console.WriteLine("=== THE QUOTE MACHINE ===");',
  'Console.WriteLine();',
  'Console.Write("Room length in metres: ");',
  'double length = Convert.ToDouble(Console.ReadLine());',
  'Console.Write("Room width in metres: ");',
  'double width = Convert.ToDouble(Console.ReadLine());',
  'Console.Write("Price per square metre: ");',
  'double pricePerMetre = Convert.ToDouble(Console.ReadLine());',
];
const q = (o) => runQuote(QUOTE_IN, o).ev;
export const P2 = practical({
  id: 'p2', name: 'The Quote Machine',
  building: 'A carpet quote. Main reads the room\'s length and width and the price per square metre; four methods work out the area, the cost, the VAT, and print each money line.',
  methods: [
    'public static double Area(double length, double width)',
    '{',
    '    return length * width;',
    '}',
    '',
    'public static double Cost(double area, double pricePerMetre)',
    '{',
    '    {{1}}',
    '}',
    '',
    'public static double Vat(double amount)',
    '{',
    '    {{2}}',
    '}',
    '',
    '{{3}}',
    '{',
    '    Console.WriteLine($"{label}: {amount:C}");',
    '}',
  ].join('\n'),
  main: [...P2_MAIN_HEAD,
    '{{4}}',
    'double cost = Cost(area, pricePerMetre);',
    '{{5}}',
    'Console.WriteLine();',
    'Console.WriteLine($"Area: {area:F2} square metres");',
    'PrintLine("Price per square metre", pricePerMetre);',
    '{{6}}',
    'PrintLine("VAT", vat);',
    '{{7}}',
    CLOSE].join('\n'),
  bookIn: QUOTE_IN,
  bookEv: q(),
  steps: [
    { k: 1, at: 'Cost · the body', brief: 'Return area multiplied by pricePerMetre.',
      line: 'return area * pricePerMetre;',
      wrong: [
        { t: 'Console.WriteLine(area * pricePerMetre);', why: 'The header says double, so Cost must hand a double back. Printing is not returning: Main gets nothing to store.',
          expect: E(['CS0161', "'Program.Cost(double, double)': not all code paths return a value"]) },
        { t: 'return area + pricePerMetre;', why: '+ adds the area to the price. The cost is the area TIMES the price per square metre.',
          ev: q({ cost: (a, p) => a + p }) },
        { t: 'double cost = area * pricePerMetre;', why: 'The cost is worked out and kept in a variable, but never handed back. A double method must end with return.',
          expect: E(['CS0161', "'Program.Cost(double, double)': not all code paths return a value"]) },
      ] },
    { k: 2, at: 'Vat · the body', brief: 'Return amount multiplied by 0.2 (VAT is 20%).',
      line: 'return amount * 0.2;',
      wrong: [
        { t: 'return amount * 20;', why: '20% is 0.2 of the amount, not 20 times it.',
          ev: q({ vat: (x) => x * 20 }) },
        { t: 'return 0.2;', why: 'This hands back 0.2 every time and ignores the amount. The parameter has to be used.',
          ev: q({ vat: () => 0.2 }) },
        { t: 'return amount * 20%;', why: 'C# has no percent sign for numbers (% means remainder). 20% is written as 0.2.',
          expect: E(['CS1525', "Invalid expression term ';'"]) },
      ] },
    { k: 3, at: 'PrintLine · the header', brief: 'PrintLine takes a string label and a double amount, and returns nothing.',
      line: 'public static void PrintLine(string label, double amount)',
      wrong: [
        { t: 'public static double PrintLine(string label, double amount)', why: 'double promises a value back, but PrintLine only prints. It returns nothing, so it is void.',
          expect: E(['CS0161', "'Program.PrintLine(string, double)': not all code paths return a value"]) },
        { t: 'public static void PrintLine(string label, int amount)', why: 'An int cannot hold 12.99. Every call sends a double, and a double will not squeeze into an int.',
          expect: E(...Array(4).fill(['CS1503', "Argument 2: cannot convert from 'double' to 'int'"])) },
        { t: 'public static void PrintLine(string label double amount)', why: 'Parameters are separated by commas.',
          expect: E(['CS1003', "Syntax error, ',' expected"]) },
      ] },
    { k: 4, at: 'Main · the area', brief: 'Declare a new double called area and store what Area returns when it is given length and width.',
      line: 'double area = Area(length, width);',
      wrong: [
        { t: 'double area = Area;', why: 'Without brackets and arguments it is the method\'s name, not a call. Nothing is worked out.',
          expect: E(['CS0428', "Cannot convert method group 'Area' to non-delegate type 'double'. Did you intend to invoke the method?"]) },
        { t: 'Area(length, width);', why: 'The area is worked out and handed back, but nothing stores it. Then area does not exist when the next line needs it.',
          expect: E(['CS0103', "The name 'area' does not exist in the current context"], ['CS0103', "The name 'area' does not exist in the current context"]) },
        { t: 'double area = Area(width);', why: 'Area has two parameters, so the call must send two arguments.',
          expect: E(['CS7036', "There is no argument given that corresponds to the required parameter 'width' of 'Program.Area(double, double)'"]) },
      ] },
    { k: 5, at: 'Main · the VAT', brief: 'Declare a new double called vat and store what Vat returns when it is given cost.',
      line: 'double vat = Vat(cost);',
      wrong: [
        { t: 'double vat = Vat(area);', why: 'VAT is charged on the cost, not on the square metres. It builds and runs, and the answer is wrong.',
          ev: q({ vatOf: (a) => a }) },
        { t: 'double vat = Vat;', why: 'Without brackets it is the method\'s name, not a call.',
          expect: E(['CS0428', "Cannot convert method group 'Vat' to non-delegate type 'double'. Did you intend to invoke the method?"]) },
        { t: 'double vat = Vat(cost, 0.2);', why: 'Vat has one parameter. The 0.2 is inside the method already.',
          expect: E(['CS1501', "No overload for method 'Vat' takes 2 arguments"]) },
      ] },
    { k: 6, at: 'Main · money line 2', brief: 'Call PrintLine with "Cost before VAT" and cost.',
      line: 'PrintLine("Cost before VAT", cost);',
      wrong: [
        { t: 'PrintLine(cost, "Cost before VAT");', why: 'Arguments are matched to parameters by position: the label first, then the amount.',
          expect: E(['CS1503', "Argument 1: cannot convert from 'double' to 'string'"], ['CS1503', "Argument 2: cannot convert from 'string' to 'double'"]) },
        { t: 'PrintLine("Cost before VAT");', why: 'PrintLine has two parameters. The amount is missing.',
          expect: E(['CS7036', "There is no argument given that corresponds to the required parameter 'amount' of 'Program.PrintLine(string, double)'"]) },
        { t: 'PrintLine("Cost before VAT", Cost);', why: 'Cost with a capital C is the method. The stored value is cost.',
          expect: E(['CS1503', "Argument 2: cannot convert from 'method group' to 'double'"]) },
      ] },
    { k: 7, at: 'Main · money line 4', brief: 'Call PrintLine with "Total" and cost + vat.',
      line: 'PrintLine("Total", cost + vat);',
      wrong: [
        { t: 'PrintLine("Total", cost + Vat);', why: 'Vat is the method; vat is the stored value. You cannot add a method to a number.',
          expect: E(['CS0019', "Operator '+' cannot be applied to operands of type 'double' and 'method group'"]) },
        { t: 'PrintLine("Total", "cost + vat");', why: 'In quotes it is text, not a sum. The amount must be a double.',
          expect: E(['CS1503', "Argument 2: cannot convert from 'string' to 'double'"]) },
        { t: 'PrintLine("Total", cost);', why: 'It builds, but the total leaves out the VAT.',
          ev: q({ total: (c) => c }) },
      ] },
  ],
  closing: ['Each working-out method hands one value back, and Main stores it: double area = Area(length, width);. The next method is given what the last one handed back.',
    'PrintLine is void. It does the printing itself, so its call stands on its own line.'],
});

// Missions: the quote machine, live.
export const P2_LINES = (() => { const m = P2.right.main.split('\n').map((l) => (l ? pad(1) + l : l)); return ['static void Main(string[] args)', '{', ...m, '}', '', ...P2.right.methods.split('\n')]; })();
export const P2_PC = Object.fromEntries(ASKS.map(([k, p]) => [k, P2_LINES.findIndex((l) => l.includes(`Console.Write("${p}")`))]));
const fin = (r) => r.done && !r.crashed;
export const P2_MISSIONS = [
  { title: 'VAT of exactly £10.00', goals: ['Make the quote print VAT: £10.00.'],
    met: (r) => fin(r) && r.t.vat === '£10.00',
    hint: (r) => (r.crashed ? 'It crashed. This one needs numbers the program can read.' : `VAT came out as ${r.t.vat}. VAT is 0.2 of the cost before VAT, so what cost gives £10.00? The cost is the area times the price.`),
    show: ['5', '2', '5'],
    why: ['Work backwards through the methods: Vat needs 50 to hand back 10, so Cost must hand back 50 — an area of 10 at £5 a square metre.',
      'Each method hands its answer to the next one: Area, then Cost, then Vat.'] },
  { title: 'A total of exactly £120.00', goals: ['Make the quote print Total: £120.00.'],
    met: (r) => fin(r) && r.t.total === '£120.00',
    hint: (r) => (r.crashed ? 'It crashed. Use numbers.' : `Total came out as ${r.t.total}. The total is the cost plus 20%, so the cost is the total divided by 1.2.`),
    show: ['10', '1', '10'],
    why: ['Total = cost + VAT = cost × 1.2. For £120.00 the cost must be £100.00: for example 10 m × 1 m at £10.'] },
  { title: 'A negative total', goals: ['Make the quote print a total below zero.', 'No crash.'],
    met: (r) => fin(r) && r.v.total < 0,
    hint: (r) => (r.crashed ? 'It crashed. Convert.ToDouble must be able to read every entry.' : `Total: ${r.t.total}. Nothing in this program checks the numbers you type.`),
    show: ['-4.5', '3.2', '12.99'],
    why: ['Nothing checks the entries. Convert.ToDouble reads -4.5 happily, and the methods just do the sums.',
      'That is what validation is for. A loop like EnterNumber in P4 would refuse it.'] },
  { title: 'Crash it at the last question', goals: ['Answer the first two questions with numbers.', 'Then make the program crash at the price.'],
    met: (r) => !!r.crashed && r.at === 'ppm',
    hint: (r) => (r.crashed ? `It crashed, but at the ${r.at === 'length' ? 'length' : 'width'}. This mission wants the first two answered.` : 'It finished. Convert.ToDouble reads any number. What can it not read?'),
    show: ['4.5', '3.2', '£12.99'],
    why: ['Convert.ToDouble cannot read £, so the program stops on that line.',
      'None of the methods ever runs: the crash happens in Main, before Area is called.'] },
  { title: 'A sneaky price', goals: ['Make the price print as £1,000.00 —', 'without typing 1000 exactly.'],
    met: (r) => fin(r) && r.t.ppm === '£1,000.00' && r.v.ppm === 1000 && r.ev.filter((e) => e[0] === 'in')[2][1] !== '1000',
    hint: (r) => (r.crashed ? 'It crashed. Convert.ToDouble could not read one of those.' : r.t.ppm === '£1,000.00' ? 'You typed 1000 exactly. Convert.ToDouble accepts other ways of writing the same number.' : `The price printed as ${r.t.ppm}.`),
    show: ['2', '3', '1,000'],
    why: ['Convert.ToDouble reads 1,000 (the comma is a thousands separator), 1000.00, 01000 and even 1e3.',
      'The variable holds the NUMBER, not what was typed. :C then prints it with £ and a comma.'] },
];

// On your own: FittingCharge.
const FITTING = 'public static double FittingCharge(double length, double width)\n{\n    double edge = (length + width) * 2;\n    return edge * 3.50;\n}';
const FIT_MAIN_TAIL = 'double fitting = FittingCharge(length, width);\nPrintLine("Fitting", fitting);\nPrintLine("Total with fitting", cost + vat + fitting);';
const withFit = (tail = FIT_MAIN_TAIL) => P2.right.main.replace('PrintLine("Total", cost + vat);', 'PrintLine("Total", cost + vat);\n' + tail);
const fitEv = (fitting) => runQuote(QUOTE_IN, { fitting }).ev;
const FIT_RIGHT = (l, w) => ((l + w) * 2) * 3.50;
export const P2_OWN = {
  problem: [
    'The shop also charges for fitting the carpet: £3.50 for every metre round the edge of the room. The distance round the edge is (length + width) × 2.',
    'Write a method called FittingCharge that is given the room\'s length and width and hands back the fitting charge. You decide its header: what goes in, and what comes back.',
    'In Main, after the Total line, call it and store what it hands back. Then use PrintLine twice more: once for the fitting charge, labelled Fitting, and once for the total plus the fitting charge, labelled Total with fitting.',
    'Run it with 4.5, 3.2 and 12.99.',
  ],
  model: [...FITTING.split('\n'), '', '// in Main, after the Total line:', ...FIT_MAIN_TAIL.split('\n')],
  ev: fitEv(FIT_RIGHT),
  points: [
    { t: 'The header hands back a double: `public static double FittingCharge(…)`', find: /double\s+FittingCharge/i },
    { t: 'Two double parameters, for the length and the width', find: /FittingCharge\s*\(\s*double\s+\w+\s*,\s*double\s+\w+\s*\)/i },
    { t: 'Brackets round the addition: `(length + width) * 2`', find: /\(\s*\w+\s*\+\s*\w+\s*\)\s*\*\s*2/ },
    { t: 'Returns the edge × 3.50', find: /return[^;]*3\.5/i },
    { t: 'Main stores the call: `double fitting = FittingCharge(length, width);`', find: /double\s+\w+\s*=\s*FittingCharge\s*\(/i },
    { t: 'Two PrintLine calls: "Fitting", and "Total with fitting" with cost + vat + fitting', find: /PrintLine\s*\(\s*"Total with fitting"\s*,[^)]*\+[^)]*\+/i },
  ],
  notes: ['The header is the point: two doubles in, a double back. Any parameter names are right.',
    'Common slips: void as the return type, so there is nothing to store; no brackets round length + width, which gives £38.15 instead of £53.90; printing inside FittingCharge instead of returning.'],
};
P2_OWN.cs = { methods: P2.right.methods + '\n\n' + FITTING, main: withFit(), stdin: stdin(P2_OWN.ev) };
P2_OWN.expect = expectOf(P2_OWN.ev);

const p2Slip = (code, a, why, res, tail) => {
  const cs = { methods: P2.right.methods + '\n\n' + code, main: withFit(tail), stdin: QUOTE_IN.map((x) => x + '\n').join('') };
  return res.ev ? { code, a, why, cs, ev: res.ev, expect: expectOf(res.ev) } : { code, a, why, cs, expect: res };
};
const fit = (body, head = 'public static double FittingCharge(double length, double width)') => `${head}\n{\n${indent(body, 1)}\n}`;
export const P2_SLIPS = {
  outcomes: ['It works: Fitting £53.90', 'It runs, but the fitting charge is wrong', 'It will not build'],
  versions: [
    p2Slip(fit('return (length + width) * 2 * 3.50;'), 0, 'One line instead of two: the same sum, so it works.', { ev: fitEv(FIT_RIGHT) }),
    p2Slip(fit('double edge = length + width * 2;\nreturn edge * 3.50;'), 1, 'Without brackets, * is done first: 4.5 + 6.4 = 10.9 metres, which gives £38.15.', { ev: fitEv((l, w) => (l + w * 2) * 3.50) }),
    p2Slip(fit('double edge = (length + width) * 2;\nreturn edge * 3.50;', 'public static void FittingCharge(double length, double width)'), 2, 'void hands nothing back, so return cannot carry a value, and Main has nothing to store.',
      E(['CS0127', "Since 'Program.FittingCharge(double, double)' returns void, a return keyword must not be followed by an object expression"], ['CS0029', "Cannot implicitly convert type 'void' to 'double'"])),
    p2Slip(fit('double edge = (length + width) * 2;\nConsole.WriteLine(edge * 3.50);'), 2, 'The header promises a double, but the body only prints it. Nothing is returned.',
      E(['CS0161', "'Program.FittingCharge(double, double)': not all code paths return a value"])),
    p2Slip(fit('double edge = (length + width) * 2;\nreturn edge * 3.50;', 'public static int FittingCharge(double length, double width)'), 2, 'The answer is a double (it has pence). An int return type cannot hold it without a cast.',
      E(['CS0266', "Cannot implicitly convert type 'double' to 'int'. An explicit conversion exists (are you missing a cast?)"])),
    p2Slip(fit('return (length + width) * 3.50;'), 1, 'The × 2 is missing: that is only half the way round the room.', { ev: fitEv((l, w) => (l + w) * 3.50) }),
    p2Slip(fit('return length * 2 * 3.50;', 'public static double FittingCharge(double length)'), 2, 'One parameter, but Main sends two arguments. The header and the call must agree.',
      E(['CS1501', "No overload for method 'FittingCharge' takes 2 arguments"])),
  ],
};

// Simulator parity: every Convert.ToDouble and :C / :F2 rule the missions rely on, run for real.
export const QUOTE_CASES = [
  ['4.5', '3.2', '12.99'], ['5', '2', '5'], ['10', '1', '10'], ['-4.5', '3.2', '12.99'], ['4.5', '3.2', '£12.99'],
  ['2', '3', '1,000'], ['1e3', '1', '1'], [' 4.5 ', '+3.2', '00012.99'], ['4.', '.5', '2'], ['4,5', '1,,5', '5,'],
  ['0.125', '1', '1'], ['2.675', '1', '1'], ['1.005', '1', '1'], ['-0', '1', '1'], ['0.001', '-1', '2'],
  ['1000000', '1000', '1'], ['NaN', '1', '1'], ['1e400', '1', '1'], ['∞', '-1', '2'],
  ['four', '3', '2'], ['4.5', '', '2'], ['4..5'], [',5'], ['1e'], ['Infinity'], ['1_000'], ['0x10'], ['5m'], ['4.5', ' '], ['−4'],
].map((inputs) => { const r = runQuote(inputs); return { ev: r.ev, cs: { ...P2.right, stdin: stdin(r.ev) }, expect: expectOf(r.ev) }; });

/* =====================================================================================================
   P3 — Swap and Twins
   ===================================================================================================== */
const P3_TITLE = '=== SWAP AND TWINS ===\n\n';
const twins = (after, d3 = 'seven is text') => P3_TITLE + `Before: x = 45, y = 50\n${after}\n\n7 is a whole number\n7.5 is a decimal\n${d3}\n` + CLOSE_OUT;
const SWAPPED = 'After: x = 50, y = 45';
export const P3 = practical({
  id: 'p3', name: 'Swap and Twins',
  building: 'Part 1: a Swap method that exchanges two numbers — once ref is in the header and at the call. Part 2: three Describe methods with the same name and different parameter types.',
  methods: [
    '{{1}}',
    '{',
    '    {{2}}',
    '    a = b;',
    '    b = temp;',
    '}',
    '',
    'public static void Describe(int n)',
    '{',
    '    Console.WriteLine($"{n} is a whole number");',
    '}',
    '',
    '{{3}}',
    '{',
    '    Console.WriteLine($"{n} is a decimal");',
    '}',
    '',
    'public static void Describe(string s)',
    '{',
    '    {{4}}',
    '}',
  ].join('\n'),
  main: [
    'Console.WriteLine("=== SWAP AND TWINS ===");',
    'Console.WriteLine();',
    'int x = 45;',
    'int y = 50;',
    'Console.WriteLine($"Before: x = {x}, y = {y}");',
    '{{5}}',
    'Console.WriteLine($"After: x = {x}, y = {y}");',
    'Console.WriteLine();',
    'Describe(7);',
    'Describe(7.5);',
    '{{6}}',
    CLOSE].join('\n'),
  bookOut: twins(SWAPPED),
  steps: [
    { k: 1, at: 'Swap · the header', brief: 'The fixed header: ref means Swap works on the caller\'s own variables, not copies.',
      line: 'public static void Swap(ref int a, ref int b)',
      wrong: [
        { t: 'public static void Swap(int a, int b)', why: 'Without ref the method gets copies, and the call says ref. The header and the call must match.',
          expect: E(['CS1615', "Argument 1 may not be passed with the 'ref' keyword"], ['CS1615', "Argument 2 may not be passed with the 'ref' keyword"]) },
        { t: 'public static void Swap(ref int a, int b)', why: 'ref is needed on BOTH parameters. Here b is still a copy, so the call\'s ref y does not match.',
          expect: E(['CS1615', "Argument 2 may not be passed with the 'ref' keyword"]) },
        { t: 'public static int Swap(ref int a, ref int b)', why: 'int promises a number back, but there is no return. Swap does its work through ref and hands nothing back: void.',
          expect: E(['CS0161', "'Program.Swap(ref int, ref int)': not all code paths return a value"]) },
      ] },
    { k: 2, at: 'Swap · line 1', brief: 'Keep a copy of a in temp, before a is overwritten.',
      line: 'int temp = a;',
      wrong: [
        { t: 'int temp = b;', why: 'temp must keep a\'s value, because a is about to be overwritten. Keeping b loses a for good: both end up 50.',
          out: twins('After: x = 50, y = 50') },
        { t: 'temp = a;', why: 'temp has never been declared. A new variable needs its type first: int temp.',
          expect: E(['CS0103', "The name 'temp' does not exist in the current context"], ['CS0103', "The name 'temp' does not exist in the current context"]) },
        { t: 'double temp = a;', why: 'b is an int, and a double cannot be put back into an int without a cast. temp holds an int, so it is an int.',
          expect: E(['CS0266', "Cannot implicitly convert type 'double' to 'int'. An explicit conversion exists (are you missing a cast?)"]) },
      ] },
    { k: 3, at: 'Describe · twin 2', brief: 'The second Describe: the same name, and it takes a double.',
      line: 'public static void Describe(double n)',
      wrong: [
        { t: 'public static void Describe(int n)', why: 'There is already a Describe that takes an int. Methods with one name must differ in their parameter types.',
          expect: E(['CS0111', "Type 'Program' already defines a member called 'Describe' with the same parameter types"]) },
        { t: 'public static void Describe2(double n)', why: 'A different name makes it a different method. Describe(7.5) still needs a Describe that takes a double, and 7.5 will not fit an int.',
          expect: E(['CS1503', "Argument 1: cannot convert from 'double' to 'int'"]) },
        { t: 'public static double Describe(double n)', why: 'double here means it hands a number back, and there is no return line. The parameters tell the twins apart, not the return type.',
          expect: E(['CS0161', "'Program.Describe(double)': not all code paths return a value"]) },
      ] },
    { k: 4, at: 'Describe · twin 3, the body', brief: 'Print $"{s} is text".',
      line: 'Console.WriteLine($"{s} is text");',
      wrong: [
        { t: 'Console.WriteLine($"{n} is text");', why: 'This method\'s parameter is s. n belongs to the other two methods, and each method only sees its own parameters.',
          expect: E(['CS0103', "The name 'n' does not exist in the current context"]) },
        { t: 'Console.WriteLine("{s} is text");', why: 'Without the $ the braces are just characters, so it prints {s} is text.',
          out: twins(SWAPPED, '{s} is text') },
        { t: 'return $"{s} is text";', why: 'A void method hands nothing back, so return cannot carry a value. Returning would not print it anyway.',
          expect: E(['CS0127', "Since 'Program.Describe(string)' returns void, a return keyword must not be followed by an object expression"]) },
      ] },
    { k: 5, at: 'Main · the swap', brief: 'Call Swap with x and y, with ref at the call as well.',
      line: 'Swap(ref x, ref y);',
      wrong: [
        { t: 'Swap(x, y);', why: 'The header says ref, so the call must say ref too: both places, every time.',
          expect: E(['CS1620', "Argument 1 must be passed with the 'ref' keyword"], ['CS1620', "Argument 2 must be passed with the 'ref' keyword"]) },
        { t: 'Swap(ref x, y);', why: 'Each ref parameter needs ref at the call, and y is missing it.',
          expect: E(['CS1620', "Argument 2 must be passed with the 'ref' keyword"]) },
        { t: 'Swap(ref 45, ref 50);', why: 'ref hands over a variable for the method to change. 45 is a value, not a variable, so there is nothing to change.',
          expect: E(['CS1510', 'A ref or out value must be an assignable variable'], ['CS1510', 'A ref or out value must be an assignable variable']) },
      ] },
    { k: 6, at: 'Main · Describe call 3', brief: 'Call Describe with the text "seven", quote marks included.',
      line: 'Describe("seven");',
      wrong: [
        { t: 'Describe(seven);', why: 'Without quotes, seven is read as a variable name, and there is no variable called seven.',
          expect: E(['CS0103', "The name 'seven' does not exist in the current context"]) },
        { t: "Describe('seven');", why: 'Single quotes hold one char. Text goes in double quotes.',
          expect: E(['CS1012', 'Too many characters in character literal']) },
        { t: 'Describe("7");', why: 'In quotes, 7 is text, so it prints "7 is text". The task asked for the word seven.',
          out: twins(SWAPPED, '7 is text') },
      ] },
  ],
  closing: ['ref goes in two places: the header and the call. Then the method works on the caller\'s own x and y.',
    'Three methods, one name, different parameter types. C# picks the one that matches the argument. That is overloading.'],
});

// Round 2 — predict the After line.
const SWAP_BODY = (temp = 'int temp = a;') => `{\n    ${temp}\n    a = b;\n    b = temp;\n}`;
const swapProg = (header, call, temp, out, expect) => {
  const methods = `${header}\n${SWAP_BODY(temp)}`;
  const main = `int x = 45;\nint y = 50;\nConsole.WriteLine($"Before: x = {x}, y = {y}");\n${call}\nConsole.WriteLine($"After: x = {x}, y = {y}");`;
  return { methods, main, cs: { methods, main, stdin: '' }, expect: expect || O(`Before: x = 45, y = 50\n${out}\n`) };
};
const AFTER_OPTS = ['After: x = 45, y = 50', 'After: x = 50, y = 45', 'After: x = 50, y = 50', 'It will not build'];
export const P3_PREDICT = [
  { title: 'No ref anywhere', ...swapProg('public static void Swap(int a, int b)', 'Swap(x, y);', undefined, 'After: x = 45, y = 50'), a: 0,
    why: 'Swap gets COPIES of x and y. It swaps the copies, then throws them away when it ends. x and y never change.' },
  { title: 'ref in both places', ...swapProg('public static void Swap(ref int a, ref int b)', 'Swap(ref x, ref y);', undefined, SWAPPED), a: 1,
    why: 'With ref, a IS x and b IS y. Swapping a and b swaps x and y.' },
  { title: 'ref in the header only', ...swapProg('public static void Swap(ref int a, ref int b)', 'Swap(x, y);', undefined, null,
    E(['CS1620', "Argument 1 must be passed with the 'ref' keyword"], ['CS1620', "Argument 2 must be passed with the 'ref' keyword"])), a: 3,
    why: 'ref must be in the header AND at the call. One without the other will not build.' },
  { title: 'temp keeps the wrong one', ...swapProg('public static void Swap(ref int a, ref int b)', 'Swap(ref x, ref y);', 'int temp = b;', 'After: x = 50, y = 50'), a: 2,
    why: 'temp keeps b (50). a becomes 50, then b gets temp: 50 again. a\'s 45 is lost.' },
  { title: 'The call the other way round', ...swapProg('public static void Swap(ref int a, ref int b)', 'Swap(ref y, ref x);', undefined, SWAPPED), a: 1,
    why: 'Swapping y with x is the same as swapping x with y. The order of the arguments does not matter to a swap.' },
].map((it) => ({ ...it, options: AFTER_OPTS }));

// Round 3 — the twins: which Describe runs, and what does it print?
const DESCRIBES = P3.right.methods.slice(P3.right.methods.indexOf('public static void Describe(int n)'));
const call = (arg, opts, a, why, out, expect) => ({ arg, q: `Describe(${arg});`, options: opts, a, why, cs: { methods: DESCRIBES, main: `Describe(${arg});`, stdin: '' }, expect: expect || O(out + '\n') });
const NB = 'It will not build';
export const P3_TWINS = [
  call('7', ['7 is a whole number', '7 is a decimal', '7 is text', NB], 0, '7 is an int, so Describe(int n) runs.', '7 is a whole number'),
  call('7.5', ['7.5 is a decimal', '7.5 is a whole number', '7 is a whole number', NB], 0, '7.5 is a double, so Describe(double n) runs.', '7.5 is a decimal'),
  call('"seven"', ['seven is text', '"seven" is text', 'seven is a whole number', NB], 0, 'In double quotes it is a string, so Describe(string s) runs. The quotes are not printed.', 'seven is text'),
  call('7.0', ['7 is a decimal', '7.0 is a decimal', '7 is a whole number', NB], 0, '7.0 is a double (it has a point), so the double version runs. A double prints without the .0.', '7 is a decimal'),
  call('"7"', ['7 is text', '7 is a whole number', '"7" is text', NB], 0, 'In quotes, 7 is a string. The quotes decide, not what is inside them.', '7 is text'),
  call('2.50', ['2.5 is a decimal', '2.50 is a decimal', '2 is a whole number', NB], 0, 'A double keeps the number, not the way it was typed: 2.50 prints as 2.5.', '2.5 is a decimal'),
  call('7 / 2', ['3 is a whole number', '3.5 is a decimal', '3.5 is a whole number', NB], 0, 'An int divided by an int is an int: 7 / 2 is 3. So the int version runs.', '3 is a whole number'),
  call('7 / 2.0', ['3.5 is a decimal', '3 is a whole number', '3.5 is a whole number', NB], 0, '2.0 is a double, so the answer is a double: 3.5, and the double version runs.', '3.5 is a decimal'),
  call('7, 5', ['7 is a whole number', '7.5 is a decimal', '75 is a whole number', NB], 3, 'Every Describe takes ONE argument. No version takes two, so it will not build.', null,
    E(['CS1501', "No overload for method 'Describe' takes 2 arguments"])),
  call('true', ['true is text', 'True is text', '1 is a whole number', NB], 3, 'true is a bool. There is no Describe(bool), and a bool will not turn into an int, a double or a string by itself.', null,
    E(['CS1503', "Argument 1: cannot convert from 'bool' to 'int'"])),
];

// Round 4 — on your own: swapping decimals.
const DSWAP = 'public static void Swap(ref double a, ref double b)\n{\n    double temp = a;\n    a = b;\n    b = temp;\n}';
const PQ = 'Console.WriteLine();\ndouble p = 1.5;\ndouble q = 2.5;\nConsole.WriteLine($"Before: p = {p}, q = {q}");\nSwap(ref p, ref q);\nConsole.WriteLine($"After: p = {p}, q = {q}");';
export const P3_OWN = {
  problem: [
    'Your Swap only works on whole numbers: its parameters are ref int. Write a second method, also called Swap, that swaps two double variables. Keep the first one. Two methods with the same name and different parameter lists: that is overloading, as with Describe.',
    'Test it at the end of Main, before the closing lines: print a blank line, declare double p = 1.5; and double q = 2.5;, print a Before line, swap them, then print an After line, in the same style as Part 1.',
  ],
  model: [...DSWAP.split('\n'), '', '// at the end of Main, before the closing lines:', ...PQ.split('\n')],
  cs: { methods: P3.right.methods + '\n\n' + DSWAP, main: P3.right.main.replace(CLOSE, PQ + '\n' + CLOSE), stdin: '' },
  expect: O(twins(SWAPPED).replace(CLOSE_OUT, '\nBefore: p = 1.5, q = 2.5\nAfter: p = 2.5, q = 1.5\n' + CLOSE_OUT)),
  points: [
    { t: 'The header: `public static void Swap(ref double a, ref double b)`', find: /Swap\s*\(\s*ref\s+double\s+\w+\s*,\s*ref\s+double\s+\w+\s*\)/i },
    { t: 'temp is a double: `double temp = a;`', find: /double\s+\w+\s*=\s*\w+\s*;/i },
    { t: 'Then `a = b;` and `b = temp;`', find: /(\w+)\s*=\s*(\w+)\s*;\s*\2\s*=\s*\w+\s*;/ },
    { t: 'The int Swap is kept: two methods called Swap', find: /Swap\s*\(\s*ref\s+int[\s\S]*Swap\s*\(\s*ref\s+double|Swap\s*\(\s*ref\s+double[\s\S]*Swap\s*\(\s*ref\s+int/i },
    { t: 'In Main: p and q declared, a Before line, `Swap(ref p, ref q);`, an After line', find: /Swap\s*\(\s*ref\s+p\s*,\s*ref\s+q\s*\)/i },
  ],
  notes: ['Keep the int Swap: C# picks the method whose parameters match the arguments.',
    'Common slips: int temp inside the new Swap will not build, because a double cannot be stored in an int; leaving out ref in both the header and the call builds, but After shows the values unswapped; leaving it out of only one will not build.'],
};

// Round 5 — slips in the double Swap.
const INT_SWAP = 'public static void Swap(ref int a, ref int b)\n{\n    int temp = a;\n    a = b;\n    b = temp;\n}';
const PQ_MAIN = (c) => `int x = 45;\nint y = 50;\nSwap(ref x, ref y);\ndouble p = 1.5;\ndouble q = 2.5;\n${c}\nConsole.WriteLine($"After: p = {p}, q = {q}");`;
const dswap = (header, temp = 'double temp = a;') => `${header}\n{\n    ${temp}\n    a = b;\n    b = temp;\n}`;
const p3Slip = ({ code, callLine = 'Swap(ref p, ref q);', keepInt = true, a, why, out, expect }) => ({
  code, callLine, keepInt, a, why,
  cs: { methods: (keepInt ? INT_SWAP + '\n\n' : '') + code, main: PQ_MAIN(callLine), stdin: '' }, expect: expect || O(out + '\n') });
export const P3_SLIPS = {
  outcomes: ['It works: After: p = 2.5, q = 1.5', 'It runs, but p and q are not swapped', 'It runs, but p and q are both 2.5', 'It will not build'],
  versions: [
    p3Slip({ code: dswap('public static void Swap(ref double a, ref double b)'), a: 0, why: 'ref double in the header, ref at the call, a double temp. It works, and the int Swap still works beside it.', out: 'After: p = 2.5, q = 1.5' }),
    p3Slip({ code: dswap('public static void Swap(ref double a, ref double b)', 'int temp = a;'), a: 3, why: 'temp is an int, and a double will not go into an int without a cast.',
      expect: E(['CS0266', "Cannot implicitly convert type 'double' to 'int'. An explicit conversion exists (are you missing a cast?)"]) }),
    p3Slip({ code: dswap('public static void Swap(double a, double b)'), callLine: 'Swap(p, q);', a: 1, why: 'No ref anywhere: it builds, but the method swaps copies. p and q do not change.', out: 'After: p = 1.5, q = 2.5' }),
    p3Slip({ code: dswap('public static void Swap(ref double a, ref double b)'), callLine: 'Swap(p, q);', a: 3, why: 'ref in the header but not at the call. Both need it.',
      expect: E(['CS1620', "Argument 1 must be passed with the 'ref' keyword"], ['CS1620', "Argument 2 must be passed with the 'ref' keyword"]) }),
    p3Slip({ code: dswap('public static void Swap(ref double a, ref double b)'), keepInt: false, a: 3, why: 'The int Swap was deleted, so Swap(ref x, ref y) has nothing to match: ref int will not go in as ref double. Keep both.',
      expect: E(['CS1503', "Argument 1: cannot convert from 'ref int' to 'ref double'"], ['CS1503', "Argument 2: cannot convert from 'ref int' to 'ref double'"]) }),
    p3Slip({ code: dswap('public static void Swap(ref double a, ref double b)', 'double temp = b;'), a: 2, why: 'temp keeps b, so a\'s value is lost: both end up 2.5.', out: 'After: p = 2.5, q = 2.5' }),
  ],
};

/* =====================================================================================================
   P4 — The Order Desk
   ===================================================================================================== */
export const ORDER_IN = ['Large', 'L', '25', '12'];
const PRICE = { S: 6.5, M: 8, L: 9.5 };
// o changes a rule to match a wrong line: esShow(s)/esBad(s) for EnterSize, enShow(n)/enBad(n) for EnterNumber,
// min/max at the call, price, disc(cost); yesNo: true asks for delivery (the On your own version).
export function runOrder(inputs, o = {}) {
  const f = { esBad: (s) => s !== 'S' && s !== 'M' && s !== 'L', enBad: (n, a, b) => n < a || n > b, min: 1, max: 20, price: PRICE, disc: (c) => c * 0.9, ...o };
  const esShow = f.esShow || f.esBad, enShow = f.enShow || f.enBad;
  const ev = [['out', '=== THE ORDER DESK ===\n\n']];
  const log = { badSizes: [], qtyErrs: 0, qtyLines: [], badYN: [] };
  let i = 0, size, qty, del;
  for (;;) {
    ev.push(['out', 'Size (S, M or L): ']);
    if (i >= inputs.length) return { ev, waiting: 'size', done: false, log };
    const s = inputs[i++];
    ev.push(['in', s]);
    if (esShow(s)) ev.push(['out', 'Error: enter S, M or L.\n']);
    if (!f.esBad(s)) { size = s; break; }
    log.badSizes.push(s);
  }
  for (;;) {
    ev.push(['out', 'How many pizzas (1 to 20): ']);
    if (i >= inputs.length) return { ev, waiting: 'qty', done: false, log, size };
    const s = inputs[i++];
    ev.push(['in', s]);
    log.qtyLines.push(s);
    const r = toInt32(s);
    if (r.ex) { ev.push(['crash', r.ex, r.msg]); return { ev, crashed: r, done: true, log, size }; }
    if (enShow(r.v, f.min, f.max)) ev.push(['out', `Error: enter a number from ${f.min} to ${f.max}.\n`]);
    if (!f.enBad(r.v, f.min, f.max)) { qty = r.v; break; }
    log.qtyErrs++;
  }
  if (f.yesNo) {
    for (;;) {
      ev.push(['out', 'Delivery (Y or N): ']);
      if (i >= inputs.length) return { ev, waiting: 'yn', done: false, log, size, qty };
      const s = inputs[i++];
      ev.push(['in', s]);
      if (s === 'Y' || s === 'N') { del = s; break; }
      log.badYN.push(s);
      ev.push(['out', 'Error: enter Y or N.\n']);
    }
  }
  let cost = (f.price[size] ?? 0) * qty;
  if (qty >= 10) cost = f.disc(cost);
  if (del === 'Y') cost = cost + 2.50;
  const costText = fmtC(cost);
  ev.push(['out', `\nCost of order: ${costText}\n` + CLOSE_OUT]);
  return { ev, done: true, log, size, qty, cost, costText };
}
const od = (o) => runOrder(ORDER_IN, o).ev;
// A run that never ends: the simulator stops when the typing runs out; the note says what happens next.
const neverEnds = (o, note, inputs = ORDER_IN) => [...runOrder(inputs, o).ev, ['sys', note]];

export const P4 = practical({
  id: 'p4', name: 'The Order Desk',
  building: 'A pizza order desk. EnterSize keeps asking until it gets S, M or L; EnterNumber keeps asking until it gets a number in range; CostOf works out the price; Main calls all three and prints the cost.',
  methods: [
    'public static int EnterNumber(string prompt, int min, int max)',
    '{',
    '    int number = 0;',
    '    do',
    '    {',
    '        Console.Write(prompt);',
    '        number = Convert.ToInt32(Console.ReadLine());',
    '        {{1}}',
    '        {',
    '            Console.WriteLine($"Error: enter a number from {min} to {max}.");',
    '        }',
    '    } while (number < min || number > max);',
    '    return number;',
    '}',
    '',
    'public static char EnterSize()',
    '{',
    '    string entry = "";',
    '    do',
    '    {',
    '        Console.Write("Size (S, M or L): ");',
    '        {{2}}',
    '        {{3}}',
    '        {',
    '            Console.WriteLine("Error: enter S, M or L.");',
    '        }',
    '    } while (entry != "S" && entry != "M" && entry != "L");',
    '    {{4}}',
    '}',
    '',
    'public static double CostOf(char size, int quantity)',
    '{',
    '    double cost = 0;',
    '    switch (size)',
    '    {',
    "        case 'S':",
    '            cost = 6.50;',
    '            break;',
    "        case 'M':",
    '            cost = 8.00;',
    '            break;',
    '        {{5}}',
    '    }',
    '    cost = cost * quantity;',
    '    if (quantity >= 10)',
    '    {',
    '        {{6}}',
    '    }',
    '    return cost;',
    '}',
  ].join('\n'),
  main: [
    'Console.WriteLine("=== THE ORDER DESK ===");',
    'Console.WriteLine();',
    'char size = EnterSize();',
    '{{7}}',
    '{{8}}',
    'Console.WriteLine();',
    'Console.WriteLine($"Cost of order: {cost:C}");',
    CLOSE].join('\n'),
  bookIn: ORDER_IN,
  bookEv: od(),
  steps: [
    { k: 1, at: 'EnterNumber · the error test', brief: 'If number is less than min or more than max, the error is printed.',
      line: 'if (number < min || number > max)',
      wrong: [
        { t: 'if (number < min && number > max)', why: '&& needs BOTH sides true, and no number is below min AND above max at once. The error never prints, though the loop still asks again.',
          ev: od({ enShow: (n, a, b) => n < a && n > b }) },
        { t: 'if (number >= min && number <= max)', why: 'This is the test for a GOOD number, so the error prints for 12 and not for 25.',
          ev: od({ enShow: (n, a, b) => n >= a && n <= b }) },
        { t: 'if (number < 1 || number > 20)', why: 'It prints the same here, but the method is now stuck on 1 to 20. EnterNumber gets its range from its parameters, so one method works for every call.',
          ev: od({ enShow: (n) => n < 1 || n > 20 }) },
      ] },
    { k: 2, at: 'EnterSize · read the line', brief: 'Read the line the user types into entry.',
      line: 'entry = Console.ReadLine();',
      wrong: [
        { t: 'string entry = Console.ReadLine();', why: 'entry was declared at the top of the method. Declaring it again inside the loop makes a second entry, and C# will not allow that.',
          expect: E(['CS0136', "A local or parameter named 'entry' cannot be declared in this scope because that name is used in an enclosing local scope to define a local or parameter"]) },
        { t: 'entry = Convert.ToChar(Console.ReadLine());', why: 'entry is a string. The line stays text until it is safe; Convert.ToChar would also crash on Large.',
          expect: E(['CS0029', "Cannot implicitly convert type 'char' to 'string'"]) },
        { t: 'Console.ReadLine(entry);', why: 'ReadLine takes nothing in its brackets. It HANDS BACK the line, and = stores it.',
          expect: E(['CS1501', "No overload for method 'ReadLine' takes 1 arguments"]) },
      ] },
    { k: 3, at: 'EnterSize · the error test', brief: 'If entry is not "S" and not "M" and not "L", the error is printed.',
      line: 'if (entry != "S" && entry != "M" && entry != "L")',
      wrong: [
        { t: "if (entry != 'S' && entry != 'M' && entry != 'L')", why: 'entry is a string, and single quotes make a char. C# will not compare the two. Text is compared with double quotes.',
          expect: E(...Array(3).fill(['CS0019', "Operator '!=' cannot be applied to operands of type 'string' and 'char'"])) },
        { t: 'if (entry != "S" || entry != "M" || entry != "L")', why: 'With ||, one true side is enough, and every entry is "not S" or "not M". The error prints even for L.',
          ev: od({ esShow: (s) => s !== 'S' || s !== 'M' || s !== 'L' }) },
        { t: 'if (entry == "S" || entry == "M" || entry == "L")', why: 'This is the test for a GOOD size, so the error prints for L and not for Large.',
          ev: od({ esShow: (s) => s === 'S' || s === 'M' || s === 'L' }) },
      ] },
    { k: 4, at: 'EnterSize · return', brief: 'Return the letter as a char.',
      line: 'return Convert.ToChar(entry);',
      wrong: [
        { t: 'return entry;', why: 'entry is a string, but the header promises a char. Convert it on the way out.',
          expect: E(['CS0029', "Cannot implicitly convert type 'string' to 'char'"]) },
        { t: "return 'entry';", why: "Single quotes hold one character. 'entry' is not a char, and it is not the variable either.",
          expect: E(['CS1012', 'Too many characters in character literal']) },
        { t: 'return Convert.ToInt32(entry);', why: 'ToInt32 makes a whole number, and the header promises a char. It would crash on L anyway.',
          expect: E(['CS0266', "Cannot implicitly convert type 'int' to 'char'. An explicit conversion exists (are you missing a cast?)"]) },
      ] },
    { k: 5, at: 'CostOf · the large case', brief: "case 'L' sets cost to 9.50, ending in break.",
      line: "case 'L':\n    cost = 9.50;\n    break;",
      wrong: [
        { t: "case 'l':\n    cost = 9.50;\n    break;", why: "'l' never matches 'L', so cost stays 0 for a large order. £0.00.",
          ev: od({ price: { ...PRICE, L: 0 } }) },
        { t: 'case "L":\n    cost = 9.50;\n    break;', why: 'size is a char, so the case needs a char: single quotes.',
          expect: E(['CS0029', "Cannot implicitly convert type 'string' to 'char'"]) },
        { t: "case 'L':\n    cost = 9.50;", why: 'Every case ends with break. Even the last one.',
          expect: E(['CS8070', "Control cannot fall out of switch from final case label ('case 'L':')"]) },
      ] },
    { k: 6, at: 'CostOf · the discount', brief: 'If quantity is 10 or more, multiply cost by 0.9 (10% off).',
      line: 'cost = cost * 0.9;',
      wrong: [
        { t: 'cost = cost * 0.1;', why: '× 0.1 keeps just 10% of the cost. 10% OFF leaves 90%: × 0.9.',
          ev: od({ disc: (c) => c * 0.1 }) },
        { t: 'cost = cost - 0.1;', why: 'This takes 10p off, not 10%.',
          ev: od({ disc: (c) => c - 0.1 }) },
        { t: 'cost * 0.9;', why: 'The sum is worked out and thrown away. It has to be stored back in cost.',
          expect: E(['CS0201', 'Only assignment, call, increment, decrement, await, and new object expressions can be used as a statement']) },
      ] },
    { k: 7, at: 'Main · the quantity', brief: 'Declare a new int called quantity and store what EnterNumber returns when it is given "How many pizzas (1 to 20): ", 1 and 20.',
      line: 'int quantity = EnterNumber("How many pizzas (1 to 20): ", 1, 20);',
      wrong: [
        { t: 'int quantity = EnterNumber(1, 20, "How many pizzas (1 to 20): ");', why: 'Arguments go in the order of the parameters: the prompt, then min, then max.',
          expect: E(['CS1503', "Argument 1: cannot convert from 'int' to 'string'"], ['CS1503', "Argument 3: cannot convert from 'string' to 'int'"]) },
        { t: 'int quantity = EnterNumber("How many pizzas (1 to 20): ", 20, 1);', why: 'min is now 20 and max is 1. Every number is below 20 or above 1, so every entry is an error: it never stops asking.',
          ev: neverEnds({ min: 20, max: 1 }, '(it never stops asking: no number can pass)'), loops: true },
        { t: 'EnterNumber("How many pizzas (1 to 20): ", 1, 20);', why: 'The number is handed back, but nothing stores it. Then quantity does not exist when CostOf needs it.',
          expect: E(['CS0103', "The name 'quantity' does not exist in the current context"]) },
      ] },
    { k: 8, at: 'Main · the cost', brief: 'Declare a new double called cost and store what CostOf returns when it is given size and quantity.',
      line: 'double cost = CostOf(size, quantity);',
      wrong: [
        { t: 'double cost = CostOf(quantity, size);', why: 'The size comes first in the header. An int will not go in as a char.',
          expect: E(['CS1503', "Argument 1: cannot convert from 'int' to 'char'"]) },
        { t: 'char cost = CostOf(size, quantity);', why: 'CostOf hands back a double (pounds and pence). It is stored in a double.',
          expect: E(['CS0266', "Cannot implicitly convert type 'double' to 'char'. An explicit conversion exists (are you missing a cast?)"]) },
        { t: 'double cost = CostOf();', why: 'CostOf has two parameters, so the call must send both.',
          expect: E(['CS7036', "There is no argument given that corresponds to the required parameter 'size' of 'Program.CostOf(char, int)'"]) },
      ] },
  ],
  closing: ['The tests appear twice in each input method: the if decides whether to print the error, the while decides whether to ask again.',
    'Main is four calls and a print. Every value comes back from a method and is stored: size, quantity, cost.'],
});

export const P4_LINES = (() => { const m = P4.right.main.split('\n').map((l) => (l ? pad(1) + l : l)); return ['static void Main(string[] args)', '{', ...m, '}', '', ...P4.right.methods.split('\n')]; })();
export const P4_PC = { size: P4_LINES.findIndex((l) => l.includes('Console.Write("Size')), qty: P4_LINES.findIndex((l) => l.includes('Console.Write(prompt)')) };
export const P4_MISSIONS = [
  { title: 'Every error message', goals: ['Get the size error AND the number error.', 'Then let the program finish — no crash.'],
    met: (r) => fin(r) && r.log.badSizes.length > 0 && r.log.qtyErrs > 0,
    hint: (r) => (r.crashed ? 'It crashed, so it never finished. The number error comes from a NUMBER outside 1 to 20, not from a word.'
      : [!r.log.badSizes.length ? 'No size error yet: every size you typed was accepted.' : '', !r.log.qtyErrs ? 'No number error yet: try a whole number outside 1 to 20.' : ''].filter(Boolean).join(' ')),
    show: ['Large', 'L', '25', '12'],
    why: ['Each error is printed by an if, and the while round it asks the SAME question again.', 'The size is only asked once it is good, then the number.'] },
  { title: 'Exactly £19.50', goals: ['Make the order cost exactly £19.50.'],
    met: (r) => fin(r) && r.costText === '£19.50',
    hint: (r) => (r.crashed ? 'It crashed. Use a whole number for the pizzas.' : `That came to ${r.costText}. Read the prices in CostOf.`),
    show: ['S', '3'],
    why: ['3 small pizzas at £6.50 is £19.50. No other order gives it: medium and large never end in .50 at that price.'] },
  { title: 'Just enough for the discount', goals: ['Get the 10% discount —', 'with as few pizzas as possible.'],
    met: (r) => fin(r) && r.qty === 10,
    hint: (r) => (r.crashed ? 'It crashed.' : r.qty < 10 ? `${r.qty} pizzas: no discount. Read the test in CostOf.` : `${r.qty} pizzas gets the discount, but fewer would too.`),
    show: ['M', '10'],
    why: ['The test is quantity >= 10, and >= includes 10 itself. 10 is the boundary: the smallest quantity that gets 10% off.'] },
  { title: 'The dearest order', goals: ['Make the most expensive order the desk will take.'],
    met: (r) => fin(r) && r.size === 'L' && r.qty === 20,
    hint: (r) => (r.crashed ? 'It crashed.' : `That came to ${r.costText}. Which size is dearest, and what is the most pizzas EnterNumber allows?`),
    show: ['L', '20'],
    why: ['20 large: 20 × £9.50 = £190.00, less 10% = £171.00. EnterNumber will not let 21 through.'] },
  { title: 'Crash it', goals: ['Make the program crash.'],
    met: (r) => !!r.crashed,
    hint: () => 'It finished. The size is kept as text until it is S, M or L, so it cannot crash. Where is a line CONVERTED to a number?',
    show: ['M', 'ten'],
    why: ['Convert.ToInt32 cannot read "ten", and the program stops. The range check never runs.',
      'EnterSize cannot crash: it only converts once the line is S, M or L.'] },
];

// On your own: EnterYesNo.
const YESNO = 'public static char EnterYesNo()\n{\n    string entry = "";\n    do\n    {\n        Console.Write("Delivery (Y or N): ");\n        entry = Console.ReadLine();\n        if (entry != "Y" && entry != "N")\n        {\n            Console.WriteLine("Error: enter Y or N.");\n        }\n    } while (entry != "Y" && entry != "N");\n    return Convert.ToChar(entry);\n}';
const YN_MAIN = P4.right.main
  .replace('int quantity = EnterNumber("How many pizzas (1 to 20): ", 1, 20);', 'int quantity = EnterNumber("How many pizzas (1 to 20): ", 1, 20);\nchar delivery = EnterYesNo();')
  .replace('double cost = CostOf(size, quantity);', "double cost = CostOf(size, quantity);\nif (delivery == 'Y')\n{\n    cost = cost + 2.50;\n}");
const ynRun = (inputs) => { const r = runOrder(inputs, { yesNo: true }); return { ev: r.ev, cs: { methods: P4.right.methods + '\n\n' + YESNO, main: YN_MAIN, stdin: stdin(r.ev) }, expect: expectOf(r.ev) }; };
export const P4_OWN = {
  problem: [
    'The desk now offers delivery for £2.50. Write a validation routine called EnterYesNo. It asks Delivery (Y or N): and, if the answer is not Y or N, prints Error: enter Y or N. and asks again. When the answer is Y or N, it hands it back. It works like EnterSize: you decide the header and write the body.',
    'In Main, call it straight after the number of pizzas and store what it hands back. After the cost is worked out, add £2.50 to the cost if the answer was Y.',
    'Run it with L, 12, Yes and Y. Then run it with L, 12 and N: the cost should be £102.60.',
  ],
  model: [...YESNO.split('\n'), '', '// in Main:', 'char delivery = EnterYesNo(); // after the number of pizzas', 'double cost = CostOf(size, quantity);', "if (delivery == 'Y')", '{', '    cost = cost + 2.50;', '}'],
  runs: [ynRun(['L', '12', 'Yes', 'Y']), ynRun(['L', '12', 'N'])],
  points: [
    { t: 'The header hands back a char: `public static char EnterYesNo()` (a string prompt parameter is also right)', find: /(char|string)\s+EnterYesNo\s*\(/i },
    { t: 'The line is kept as a string: `string entry = "";` then `entry = Console.ReadLine();`', find: /string\s+\w+[\s\S]*=\s*Console\.ReadLine\s*\(\s*\)/i },
    { t: 'A do … while loop with the test `entry != "Y" && entry != "N"`', find: /while\s*\(\s*\w+\s*!=\s*"Y"\s*&&\s*\w+\s*!=\s*"N"\s*\)/i },
    { t: 'The same test in an if that prints `Error: enter Y or N.`', find: /if\s*\([^)]*!=\s*"Y"[^)]*\)\s*\{?\s*Console\.WriteLine\s*\(\s*"Error: enter Y or N\.?"/i },
    { t: 'Returns the letter: `return Convert.ToChar(entry);`', find: /return\s+Convert\.ToChar\s*\(/i },
    { t: 'Main stores it after the quantity: `char delivery = EnterYesNo();`', find: /char\s+\w+\s*=\s*EnterYesNo\s*\(/i },
    { t: "After CostOf: `if (delivery == 'Y')` adds 2.50 to cost", find: /if\s*\(\s*\w+\s*==\s*'Y'\s*\)[\s\S]*\+\s*2\.5/i },
  ],
  notes: ['Also right: a header with a string prompt parameter, called with the prompt.',
    "Common slips: || instead of && in the loop's condition loops for ever, since every entry is either not Y or not N; void as the return type leaves Main nothing to test; reading with Convert.ToChar(Console.ReadLine()) crashes when Yes is typed; testing the string entry against 'Y' in single quotes will not build — text is compared with \"Y\", and the char delivery in Main with 'Y'."],
};

// Slips in EnterYesNo. Main: just the delivery question, then the answer stored.
const YN_SLIP_MAIN = 'char delivery = EnterYesNo();\nConsole.WriteLine($"Stored: {delivery}");';
const YN_IN = ['Yes', 'Y'];
const ynMethod = ({ head = 'public static char EnterYesNo()', decl = 'string entry = "";', read = 'entry = Console.ReadLine();', test = 'entry != "Y" && entry != "N"', ifBlock = true, ret = 'return Convert.ToChar(entry);' }) =>
  [head, '{', `    ${decl}`, '    do', '    {', '        Console.Write("Delivery (Y or N): ");', `        ${read}`,
    ...(ifBlock ? [`        if (${test})`, '        {', '            Console.WriteLine("Error: enter Y or N.");', '        }'] : []),
    `    } while (${test});`, `    ${ret}`, '}'].join('\n');
const ynSlip = (code, a, why, res) => {
  const cs = { methods: code, main: YN_SLIP_MAIN, stdin: YN_IN.map((x) => x + '\n').join('') };
  return res.ev ? { code, a, why, cs, ev: res.ev, expect: expectOf(res.ev, res.loops) } : { code, a, why, cs, expect: res };
};
const P = 'Delivery (Y or N): ', ERR = 'Error: enter Y or N.\n';
export const P4_SLIPS = {
  typed: YN_IN,
  outcomes: ['It works: an error after Yes, then it stores Y', 'It crashes when Yes is typed', 'It never stops asking', 'It asks again after Yes, but prints no error', 'It will not build'],
  versions: [
    ynSlip(ynMethod({}), 0, 'A string until it is safe, && in both tests, double quotes, then Convert.ToChar on the way out. It works.',
      { ev: [['out', P], ['in', 'Yes'], ['out', ERR + P], ['in', 'Y'], ['out', 'Stored: Y\n']] }),
    ynSlip(ynMethod({ test: 'entry != "Y" || entry != "N"' }), 2, 'With ||, every entry is either not Y or not N. The test is always true, so it never stops.',
      { ev: [['out', P], ['in', 'Yes'], ['out', ERR + P], ['in', 'Y'], ['out', ERR + P], ['sys', '(it never stops asking: even Y is "not N")']], loops: true }),
    ynSlip(ynMethod({ head: 'public static void EnterYesNo()' }), 4, 'void hands nothing back, so return cannot carry the letter, and Main has nothing to store.',
      E(['CS0127', "Since 'Program.EnterYesNo()' returns void, a return keyword must not be followed by an object expression"], ['CS0029', "Cannot implicitly convert type 'void' to 'char'"])),
    ynSlip(ynMethod({ decl: "char entry = ' ';", read: 'entry = Convert.ToChar(Console.ReadLine());', test: "entry != 'Y' && entry != 'N'", ret: 'return entry;' }), 1,
      'Convert.ToChar needs exactly one character. Yes is three, so the program stops before the test runs.',
      { ev: [['out', P], ['in', 'Yes'], ['crash', 'FormatException', 'String must be exactly one character long.']] }),
    ynSlip(ynMethod({ test: "entry != 'Y' && entry != 'N'" }), 4, "entry is a string, and 'Y' is a char. C# will not compare the two: text is compared with \"Y\".",
      E(...Array(4).fill(['CS0019', "Operator '!=' cannot be applied to operands of type 'string' and 'char'"]))),
    ynSlip(ynMethod({ ifBlock: false }), 3, 'The while still sends it round again, but with no if there is no error message. The user is never told why.',
      { ev: [['out', P], ['in', 'Yes'], ['out', P], ['in', 'Y'], ['out', 'Stored: Y\n']] }),
  ],
};

// Simulator parity for the order desk.
export const ORDER_CASES = [
  ['Large', 'L', '25', '12'], ['S', '1'], ['S', '3'], ['M', '10'], ['L', '20'], ['M', '9'], ['L', '1'], ['S', '20'],
  ['s', '', ' S', 'S', '0', '21', '-3', '5'], ['M', 'ten'], ['L', ' 12 '], ['M', '+10'], ['L', '99999999999'], ['M', '4.5'], ['XL', 'L', '012'],
].map((inputs) => { const r = runOrder(inputs); return { ev: r.ev, cs: { ...P4.right, stdin: stdin(r.ev) }, expect: expectOf(r.ev) }; });

/* =====================================================================================================
   F5 — Bug Clinic: one line is wrong. Find it, then choose the fix.
   ===================================================================================================== */
const P1_OWN_CS = P1_OWN.cs;
// base: the right program (cs) and its run; from → to: the line that breaks it; also: other lines that count as the fault.
function bug({ prog, base, baseRun, where = 'main', from, to, symptom, should, fixes, also = [], fix, cure }) {
  const cs = { ...base, [where]: swap(base[where], from, to) };
  const out = symptom.ev ? { ev: symptom.ev, expect: expectOf(symptom.ev, symptom.loops) } : symptom.out != null ? { expect: O(symptom.out) } : { expect: symptom };
  if (symptom.ev) cs.stdin = stdin(symptom.ev);
  return { prog, cs, ...out, bad: to.split('\n')[0].trim(), also, should, fixes: [{ t: fix || from, ok: true, why: cure }, ...fixes], fixed: baseRun };
}
const P1B = { ...P1.right, stdin: '' }, P1RUN = { expect: P1.run.expect };
const P2B = P2.run.cs, P2RUN = { ev: P2.run.ev };
const P3B = { ...P3.right, stdin: '' }, P3RUN = { expect: P3.run.expect };
const P4B = P4.run.cs, P4RUN = { ev: P4.run.ev };
const qEv = (o, inputs = QUOTE_IN) => runQuote(inputs, o).ev;
export const BUGS = [
  bug({ fix: 'ShowBanner();', cure: 'The call must spell the name exactly as the header does: ShowBanner.', prog: 'P1 The Notice Board', base: P1B, baseRun: P1RUN, from: 'ShowBanner();\nShowOpeningHours();', to: 'ShowBaner();\nShowOpeningHours();',
    symptom: E(['CS0103', "The name 'ShowBaner' does not exist in the current context"]), should: 'It should build and print the notice board.',
    fixes: [{ t: 'ShowBaner;', why: 'Still the wrong spelling, and now the brackets are gone too.' }, { t: 'public static void ShowBaner();', why: 'A header does not belong in Main. The call must use the name the method already has.' }] }),
  bug({ cure: 'The brackets make it a call. Without them the method never runs.', prog: 'P1 The Notice Board', base: P1B, baseRun: P1RUN, from: 'ShowRules();', to: 'ShowRules;',
    symptom: E(['CS0201', 'Only assignment, call, increment, decrement, await, and new object expressions can be used as a statement']), should: 'It should build and print the notice board.',
    fixes: [{ t: 'ShowRules()', why: 'The brackets are right, but now the semicolon is missing.' }, { t: 'void ShowRules();', why: 'void belongs in the header. A call is just the name, the brackets and the semicolon.' }] }),
  bug({ cure: 'WriteLine ends the line, so the banner starts on a new one.', prog: 'P1 The Notice Board', base: P1B, baseRun: P1RUN, where: 'methods', from: 'Console.WriteLine("3. Be kind");', to: 'Console.Write("3. Be kind");',
    symptom: { out: B_OUT + H_OUT + '1. Walk on the left\n2. Phones away in class\n3. Be kind' + B_OUT + CLOSE_OUT }, should: 'The second banner should start on a line of its own.',
    fixes: [{ t: 'Console.Write("3. Be kind ");', why: 'A space is not a new line. The banner still joins on the end of the rule.' }, { t: 'Console.Write("3. Be kind"); ShowBanner();', why: 'That prints the banner a third time, still on the end of the rule.' }] }),
  bug({ cure: 'Cost promises a double, so it must hand the cost back with return. Main stores it.', prog: 'P2 The Quote Machine', base: P2B, baseRun: P2RUN, where: 'methods', from: 'return area * pricePerMetre;', to: 'Console.WriteLine(area * pricePerMetre);',
    also: ['public static double Cost(double area, double pricePerMetre)'],
    symptom: E(['CS0161', "'Program.Cost(double, double)': not all code paths return a value"]), should: 'It should build and print the quote.',
    fixes: [{ t: 'return;', why: 'A double method must hand a VALUE back. return on its own will not build.' }, { t: 'Console.WriteLine(area * pricePerMetre); return 0;', why: 'It builds, but every cost would be £0.00. The cost itself must be returned.' }] }),
  bug({ cure: 'Area hands back the area, so its return type is double, the type Main stores it in.', prog: 'P2 The Quote Machine', base: P2B, baseRun: P2RUN, where: 'methods', from: 'public static double Area(double length, double width)', to: 'public static void Area(double length, double width)',
    also: ['return length * width;', 'double area = Area(length, width);'],
    symptom: E(['CS0127', "Since 'Program.Area(double, double)' returns void, a return keyword must not be followed by an object expression"], ['CS0029', "Cannot implicitly convert type 'void' to 'double'"]),
    should: 'It should build and print the quote.',
    fixes: [{ t: 'public static int Area(double length, double width)', why: 'An int cannot hold 14.4, and it is stored in a double. The area is a double.' }, { t: 'public static Area(double length, double width)', why: 'A header must have a return type.' }] }),
  bug({ cure: 'VAT is 20% of the cost before VAT, so Vat is given cost.', prog: 'P2 The Quote Machine', base: P2B, baseRun: P2RUN, from: 'double vat = Vat(cost);', to: 'double vat = Vat(area);',
    symptom: { ev: qEv({ vatOf: (a) => a }) }, should: 'With 4.5, 3.2 and 12.99: VAT £37.41, Total £224.47.',
    fixes: [{ t: 'double vat = Vat(pricePerMetre);', why: 'VAT is charged on the cost before VAT, not on the price of one square metre.' }, { t: 'double vat = Vat(area) * cost;', why: 'That multiplies again by the cost: a huge VAT.' }] }),
  bug({ cure: 'vat with a small v is the value Main stored. Vat is the method.', prog: 'P2 The Quote Machine', base: P2B, baseRun: P2RUN, from: 'PrintLine("Total", cost + vat);', to: 'PrintLine("Total", cost + Vat);',
    symptom: E(['CS0019', "Operator '+' cannot be applied to operands of type 'double' and 'method group'"]), should: 'It should build and print the quote.',
    fixes: [{ t: 'PrintLine("Total", cost + Vat());', why: 'Vat needs an amount: calling it with nothing will not build.' }, { t: 'PrintLine("Total", "cost + vat");', why: 'In quotes it is text, not a number.' }] }),
  bug({ cure: 'Arguments match the parameters by position: the label (a string) first, then the amount (a double).', prog: 'P2 The Quote Machine', base: P2B, baseRun: P2RUN, from: 'PrintLine("Cost before VAT", cost);', to: 'PrintLine(cost, "Cost before VAT");',
    symptom: E(['CS1503', "Argument 1: cannot convert from 'double' to 'string'"], ['CS1503', "Argument 2: cannot convert from 'string' to 'double'"]), should: 'It should build and print the quote.',
    fixes: [{ t: 'PrintLine(string "Cost before VAT", double cost);', why: 'Types go in the header, never in a call.' }, { t: 'PrintLine("Cost before VAT" + cost);', why: 'That joins them into one piece of text, and PrintLine needs two arguments.' }] }),
  bug({ cure: 'The brackets make the addition happen first: (4.5 + 3.2) × 2 = 15.4 metres.', prog: 'P2 The Quote Machine + fitting', base: P2_OWN.cs, baseRun: { ev: P2_OWN.ev }, where: 'methods', from: 'double edge = (length + width) * 2;', to: 'double edge = length + width * 2;',
    symptom: { ev: fitEv((l, w) => (l + w * 2) * 3.50) }, should: 'With 4.5, 3.2 and 12.99: Fitting £53.90, Total with fitting £278.37.',
    fixes: [{ t: 'double edge = length + width + 2;', why: 'The distance round the edge is the two sides added, THEN doubled.' }, { t: 'double edge = length * width * 2;', why: 'length × width is the area, not the distance round the edge.' }] }),
  bug({ cure: 'ref goes in front of each argument, matching the ref in the header.', prog: 'P3 Swap and Twins', base: P3B, baseRun: P3RUN, from: 'Swap(ref x, ref y);', to: 'Swap(x, y);',
    symptom: E(['CS1620', "Argument 1 must be passed with the 'ref' keyword"], ['CS1620', "Argument 2 must be passed with the 'ref' keyword"]), should: 'It should build, and the After line should read x = 50, y = 45.',
    fixes: [{ t: 'Swap(ref x, y);', why: 'Both arguments need ref, not just the first.' }, { t: 'ref Swap(x, y);', why: 'ref goes in front of each argument, not in front of the call.' }] }),
  bug({ cure: 'temp keeps a copy of a before a is overwritten. Then b gets that copy.', prog: 'P3 Swap and Twins', base: P3B, baseRun: P3RUN, where: 'methods', from: 'int temp = a;', to: 'int temp = b;',
    symptom: { out: twins('After: x = 50, y = 50') }, should: 'The After line should read x = 50, y = 45.',
    fixes: [{ t: 'int temp = 45;', why: 'That only works for 45. Swap must work for any two numbers.' }, { t: 'int temp = a + b;', why: 'temp must be a copy of a, so a\'s value is not lost.' }] }),
  bug({ cure: 'The second twin takes a double. Then Describe(7.5) has a method that matches.', prog: 'P3 Swap and Twins', base: P3B, baseRun: P3RUN, where: 'methods', from: 'public static void Describe(double n)', to: 'public static void Describe(int n)',
    symptom: E(['CS0111', "Type 'Program' already defines a member called 'Describe' with the same parameter types"]),
    should: 'It should build and print 7.5 is a decimal.',
    fixes: [{ t: 'public static void Describe2(int n)', why: 'A new name removes the clash, but then Describe(7.5) has no method that takes a double.' }, { t: 'public static void Describe(string n)', why: 'There is already a Describe that takes a string, so it clashes again.' }] }),
  bug({ cure: "'L' matches the capital L that EnterSize hands back.", prog: 'P4 The Order Desk', base: P4B, baseRun: P4RUN, where: 'methods', from: "case 'L':", to: "case 'l':",
    symptom: { ev: od({ price: { ...PRICE, L: 0 } }) }, should: 'With Large, L, 25 and 12: Cost of order: £102.60.',
    fixes: [{ t: 'case "L":', why: 'size is a char: the case needs single quotes.' }, { t: 'case L:', why: 'Without quotes, L is read as a variable name.' }] }),
  bug({ fix: 'cost = 8.00;\nbreak;', cure: 'Every case ends with break. C# will not let one case run on into the next.', prog: 'P4 The Order Desk', base: P4B, baseRun: P4RUN, where: 'methods', from: 'cost = 8.00;\n            break;', to: 'cost = 8.00;',
    also: ["case 'M':"],
    symptom: E(['CS0163', "Control cannot fall through from one case label ('case 'M':') to another"]), should: 'It should build and take the order.',
    fixes: [{ t: 'cost = 8.00; continue;', why: 'continue is for loops. A case ends with break.' }, { t: 'cost = 8.00; return;', why: 'CostOf must hand back a value, and that would skip the quantity and the discount.' }] }),
  bug({ cure: 'entry is a string, so it is compared with strings: double quotes.', prog: 'P4 The Order Desk', base: P4B, baseRun: P4RUN, where: 'methods', from: 'if (entry != "S" && entry != "M" && entry != "L")', to: "if (entry != 'S' && entry != 'M' && entry != 'L')",
    symptom: E(...Array(3).fill(['CS0019', "Operator '!=' cannot be applied to operands of type 'string' and 'char'"])), should: 'It should build and take the order.',
    fixes: [{ t: "if (Convert.ToChar(entry) != 'S' && Convert.ToChar(entry) != 'M' && Convert.ToChar(entry) != 'L')", why: 'It builds, but Convert.ToChar crashes on Large. That is why the line stays text.' }, { t: 'if (entry != S && entry != M && entry != L)', why: 'Without quotes, S, M and L are read as variable names.' }] }),
  bug({ cure: 'Convert.ToChar turns the safe one-letter string into the char the header promises.', prog: 'P4 The Order Desk', base: P4B, baseRun: P4RUN, where: 'methods', from: 'return Convert.ToChar(entry);', to: 'return entry;',
    symptom: E(['CS0029', "Cannot implicitly convert type 'string' to 'char'"]), should: 'It should build and take the order.',
    fixes: [{ t: "return 'entry';", why: 'In single quotes it is not the variable, and it is too long for a char.' }, { t: 'return Convert.ToInt32(entry);', why: 'That makes a number, not a char, and it would crash on L.' }] }),
  bug({ cure: 'min comes first, then max: 1, then 20.', prog: 'P4 The Order Desk', base: P4B, baseRun: P4RUN, from: 'int quantity = EnterNumber("How many pizzas (1 to 20): ", 1, 20);', to: 'int quantity = EnterNumber("How many pizzas (1 to 20): ", 20, 1);',
    symptom: { ev: neverEnds({ min: 20, max: 1 }, '(it never stops asking: no number can pass)'), loops: true }, should: 'With Large, L, 25 and 12: one error for 25, then the cost.',
    fixes: [{ t: 'int quantity = EnterNumber("How many pizzas (20 to 1): ", 20, 1);', why: 'Changing the prompt does not change the test. min must be the smaller number.' }, { t: 'int quantity = EnterNumber("How many pizzas (1 to 20): ", 1, 1);', why: 'Then only 1 is accepted.' }] }),
  bug({ cure: '10% off leaves 90% of the cost: × 0.9.', prog: 'P4 The Order Desk', base: P4B, baseRun: P4RUN, where: 'methods', from: 'cost = cost * 0.9;', to: 'cost = cost * 0.1;',
    symptom: { ev: od({ disc: (c) => c * 0.1 }) }, should: 'With Large, L, 25 and 12: Cost of order: £102.60.',
    fixes: [{ t: 'cost = cost - 0.9;', why: 'That takes 90p off, not 10%.' }, { t: 'cost = cost - 0.1;', why: 'That takes 10p off, not 10%.' }] }),
  bug({ cure: 'Console.Write keeps the dashes on one line. The WriteLine after the loop ends it.', prog: 'P1 The Notice Board + divider', base: P1_OWN_CS, baseRun: { expect: P1_OWN.expect }, where: 'methods', from: 'Console.Write("-");', to: 'Console.WriteLine("-");',
    symptom: { out: B_OUT + H_OUT + '-\n'.repeat(30) + '\n' + R_OUT + '-\n'.repeat(30) + '\n' + B_OUT + CLOSE_OUT }, should: 'Each divider should be one line of 30 dashes.',
    fixes: [{ t: 'Console.WriteLine("------------------------------");', why: 'Inside the loop that prints 30 lines of 30 dashes.' }, { t: 'Console.Write("-\\n");', why: '\\n ends the line, so it is still 30 lines.' }] }),
];
