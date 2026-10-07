// Zone D content — booklet section 8 (the validated-input routine), P4's EnterSize and the 2014 Q2(b) mark scheme.
// Every program carries cs + expect (verify/verify_all.py runs them with dotnet). The console simulator below is
// checked against dotnet too: SIM_CASES are built BY the simulator, so a mismatch fails the verify run.

const O = (out, more) => ({ out, ...more });
const E = (...msgs) => ({ errors: [...new Set(msgs.map((m) => m[0]))], msgs });

export const ENTER_NUMBER = 'public static int EnterNumber(string prompt, int min, int max)\n{\n    int number = 0;\n    do\n    {\n        Console.Write(prompt);\n        number = Convert.ToInt32(Console.ReadLine());\n        if (number < min || number > max)\n        {\n            Console.WriteLine($"Error: enter a number from {min} to {max}.");\n        }\n    } while (number < min || number > max);\n    return number;\n}';
export const ENTER_SIZE = 'public static char EnterSize()\n{\n    string entry = "";\n    do\n    {\n        Console.Write("Size (S, M or L): ");\n        entry = Console.ReadLine();\n        if (entry != "S" && entry != "M" && entry != "L")\n        {\n            Console.WriteLine("Error: enter S, M or L.");\n        }\n    } while (entry != "S" && entry != "M" && entry != "L");\n    return Convert.ToChar(entry);\n}';

/* ---------- the simulator: Convert.ToInt32 and a Main made of EnterNumber calls ---------- */
const WS = /^[\t\n\v\f\r ]+|[\t\n\v\f\r ]+$/g;
// Same rules as .NET: spaces either side are fine, one + or - in front is fine, then digits 0–9 only.
export function toInt32(s) {
  const m = /^([+-]?)([0-9]+)$/.exec(s.replace(WS, ''));
  if (!m) return { ex: 'FormatException', msg: `The input string '${s}' was not in a correct format.` };
  const digits = m[2].replace(/^0+(?=\d)/, '');
  const v = Number(m[1] + digits);
  if (digits.length > 10 || v > 2147483647 || v < -2147483648) return { ex: 'OverflowException', msg: 'Value was either too large or too small for an Int32.' };
  return { v: v === 0 ? 0 : v };
}

// calls: [{name, prompt, min, max}]; fmt: the last line, e.g. '{age} {year} {born}'. inputs: the lines typed so far.
// Returns the events a real console shows — ['out', text] / ['in', typed] / ['crash', exception, message] — and
// `waiting` (the call that is asking) when the inputs run out.
export function runCalls(calls, fmt, inputs) {
  const ev = [], vals = {}, log = [];
  let i = 0;
  for (const c of calls) {
    for (;;) {
      ev.push(['out', c.prompt]);
      if (i >= inputs.length) return { ev, waiting: c, vals, log, done: false };
      const line = inputs[i++];
      ev.push(['in', line]);
      const r = toInt32(line);
      if (r.ex) { ev.push(['crash', r.ex, r.msg]); log.push({ call: c.name, line, crash: r.ex }); return { ev, crashed: r, at: c, vals, log, done: true }; }
      const ok = r.v >= c.min && r.v <= c.max;
      log.push({ call: c.name, line, v: r.v, ok });
      if (!ok) { ev.push(['out', `Error: enter a number from ${c.min} to ${c.max}.\n`]); continue; }
      vals[c.name] = r.v;
      break;
    }
  }
  ev.push(['out', fmt.replace(/\{(\w+)\}/g, (_, n) => vals[n]) + '\n']);
  return { ev, vals, log, done: true };
}
export const stdoutOf = (ev) => ev.filter((e) => e[0] === 'out').map((e) => e[1]).join('');
export const crashLine = (ex, msg) => `Unhandled exception. System.${ex}: ${msg}`;
export const callsMain = (calls, fmt) => calls.map((c) => `int ${c.name} = EnterNumber(${JSON.stringify(c.prompt)}, ${c.min}, ${c.max});`).join('\n') + `\nConsole.WriteLine($"${fmt}");`;

// A program + the transcript the simulator says it prints; verify_all checks dotnet agrees.
export function simProgram(calls, fmt, inputs) {
  const r = runCalls(calls, fmt, inputs);
  const crash = r.crashed ? { crash: true, err: crashLine(r.crashed.ex, r.crashed.msg) } : {};
  return { ev: r.ev, cs: { methods: ENTER_NUMBER, main: callsMain(calls, fmt), stdin: inputs.map((s) => s + '\n').join('') }, expect: O(stdoutOf(r.ev), crash) };
}
// A transcript written out by hand; the events give both the typed lines and the output dotnet must print.
function fromEvents(methods, main, ev) {
  return { ev, cs: { methods, main, stdin: ev.filter((e) => e[0] === 'in').map((e) => e[1] + '\n').join('') }, expect: O(stdoutOf(ev)) };
}

export const BOOK_CALLS = [
  { name: 'age', prompt: 'Age: ', min: 11, max: 19 },
  { name: 'year', prompt: 'Year group (8 to 14): ', min: 8, max: 14 },
  { name: 'born', prompt: 'Year of birth: ', min: 2000, max: 2020 },
];
export const BOOK_FMT = '{age} {year} {born}';
export const BOOK_MAIN = callsMain(BOOK_CALLS, BOOK_FMT);
export const BOOK_RUN = simProgram(BOOK_CALLS, BOOK_FMT, ['150', '17', '0', '13', '2009']);

// Simulator parity: every rule the Be the User console relies on, run for real.
export const SIM_CASES = [
  ['150', '17', '0', '13', '2009'],
  ['11', '8', '2000'],
  ['19', '14', '2020'],
  ['10', '20', '11', '7', '15', '8', '1999', '2021', '2000'],
  [' 17 ', '+13', '02009'],
  ['-5', '-0', '12', '008', '2000'],
  ['17', 'thirteen'],
  ['seventeen'],
  ['17', '13', ''],
  ['4.5'],
  ['17', '13.0'],
  ['1,000'],
  ['17', '13', '2,009'],
  ['17', '13', '99999999999'],
  ['2147483647', '2147483648'],
  ['-2147483648', '-2147483649'],
  ['17', '1 3'],
  ['17a'],
  ['£17'],
].map((inputs) => simProgram(BOOK_CALLS, BOOK_FMT, inputs));

/* ---------- D1 Build EnterNumber ---------- */
const AGE_ONLY = [BOOK_CALLS[0]];
const MAIN_AGE = 'int age = EnterNumber("Age: ", 11, 19);\nConsole.WriteLine($"Stored: {age}");';
export const EN_RUN = simProgram(AGE_ONLY, 'Stored: {age}', ['150', '17']);
const swapLine = (src, a, b) => src.replace(a, b);

// Lines in order; d = indent depth. `slot` lines are dragged in, the rest are printed.
export const EN_BOARD = [
  { t: 'public static int EnterNumber(string prompt, int min, int max)', d: 0 },
  { t: '{', d: 0 },
  { t: 'int number = 0;', d: 1, slot: true },
  { t: 'do', d: 1 },
  { t: '{', d: 1 },
  { t: 'Console.Write(prompt);', d: 2, slot: true },
  { t: 'number = Convert.ToInt32(Console.ReadLine());', d: 2, slot: true },
  { t: 'if (number < min || number > max)', d: 2, slot: true },
  { t: '{', d: 2 },
  { t: 'Console.WriteLine($"Error: enter a number from {min} to {max}.");', d: 3, slot: true },
  { t: '}', d: 2 },
  { t: '} while (number < min || number > max);', d: 1, slot: true },
  { t: 'return number;', d: 1, slot: true },
  { t: '}', d: 0 },
];
export const EN_TRAPS = [
  { t: 'number = Console.ReadLine();', why: 'ReadLine hands back text — a string. number is an int, so without Convert.ToInt32 it will not build.',
    cs: { methods: swapLine(ENTER_NUMBER, 'number = Convert.ToInt32(Console.ReadLine());', 'number = Console.ReadLine();'), main: MAIN_AGE },
    expect: E(['CS0029', "Cannot implicitly convert type 'string' to 'int'"]) },
  { t: 'if (number < min && number > max)', why: '&& needs BOTH sides true — and no number is below min AND above max at once. The error never prints; the loop still asks again, in silence. Entries 150 then 17:',
    ...fromEvents(swapLine(ENTER_NUMBER, 'if (number < min || number > max)', 'if (number < min && number > max)'), MAIN_AGE,
      [['out', 'Age: '], ['in', '150'], ['out', 'Age: '], ['in', '17'], ['out', 'Stored: 17\n']]) },
  { t: '} while (number >= min && number <= max);', why: 'The test is the wrong way round: this loop goes round again while the entry is GOOD. A bad entry ends the loop and is handed back. Entry 150:',
    ...fromEvents(swapLine(ENTER_NUMBER, '} while (number < min || number > max);', '} while (number >= min && number <= max);'), MAIN_AGE,
      [['out', 'Age: '], ['in', '150'], ['out', 'Error: enter a number from 11 to 19.\nStored: 150\n']]) },
  { t: 'return;', why: 'An int method must hand a value back. return on its own will not build.',
    cs: { methods: swapLine(ENTER_NUMBER, 'return number;', 'return;'), main: MAIN_AGE },
    expect: E(['CS0126', "An object of a type convertible to 'int' is required"]) },
  { t: 'Console.Write("prompt");', why: 'The quotes make it text: it prints the word prompt, not the value the parameter holds. Entry 17:',
    ...fromEvents(swapLine(ENTER_NUMBER, 'Console.Write(prompt);', 'Console.Write("prompt");'), MAIN_AGE,
      [['out', 'prompt'], ['in', '17'], ['out', 'Stored: 17\n']]) },
];

const MAIN_SIZE = 'char size = EnterSize();\nConsole.WriteLine($"Size: {size}");';
export const ES_RUN = fromEvents(ENTER_SIZE, MAIN_SIZE, [
  ['out', 'Size (S, M or L): '], ['in', 'Large'], ['out', 'Error: enter S, M or L.\n'],
  ['out', 'Size (S, M or L): '], ['in', ''], ['out', 'Error: enter S, M or L.\n'],
  ['out', 'Size (S, M or L): '], ['in', 'm'], ['out', 'Error: enter S, M or L.\n'],
  ['out', 'Size (S, M or L): '], ['in', 'M'], ['out', 'Size: M\n']]);
export const ES_BOARD = [
  { t: 'public static char EnterSize()', d: 0 },
  { t: '{', d: 0 },
  { t: 'string entry = "";', d: 1, slot: true },
  { t: 'do', d: 1 },
  { t: '{', d: 1 },
  { t: 'Console.Write("Size (S, M or L): ");', d: 2, slot: true },
  { t: 'entry = Console.ReadLine();', d: 2, slot: true },
  { t: 'if (entry != "S" && entry != "M" && entry != "L")', d: 2, slot: true },
  { t: '{', d: 2 },
  { t: 'Console.WriteLine("Error: enter S, M or L.");', d: 3, slot: true },
  { t: '}', d: 2 },
  { t: '} while (entry != "S" && entry != "M" && entry != "L");', d: 1, slot: true },
  { t: 'return Convert.ToChar(entry);', d: 1, slot: true },
  { t: '}', d: 0 },
];
export const ES_TRAPS = [
  { t: 'char entry = Convert.ToChar(Console.ReadLine());', why: 'Convert.ToChar crashes unless the line is exactly one character. Type Large — or press Enter on its own — and the program stops. That is why EnterSize keeps the line as a string and converts only on the way out.',
    cs: { methods: '', main: 'char size = Convert.ToChar(Console.ReadLine());\nConsole.WriteLine($"Size: {size}");', stdin: 'Large\n' },
    expect: O('', { crash: true, err: crashLine('FormatException', 'String must be exactly one character long.') }),
    ev: [['in', 'Large'], ['crash', 'FormatException', 'String must be exactly one character long.']] },
  { t: 'if (entry != "S" || entry != "M" || entry != "L")', why: '|| needs only ONE side true — and every entry is "not S" or "not M". So the error prints every time, even for a good size. Entry M:',
    ...fromEvents(swapLine(ENTER_SIZE, 'if (entry != "S" && entry != "M" && entry != "L")', 'if (entry != "S" || entry != "M" || entry != "L")'), MAIN_SIZE,
      [['out', 'Size (S, M or L): '], ['in', 'M'], ['out', 'Error: enter S, M or L.\nSize: M\n']]) },
  { t: "if (entry != 'S' && entry != 'M' && entry != 'L')", why: "Single quotes make a char, but entry is a string. C# will not compare the two — it will not build. The line is text, so the letters go in double quotes.",
    cs: { methods: swapLine(ENTER_SIZE, 'if (entry != "S" && entry != "M" && entry != "L")', "if (entry != 'S' && entry != 'M' && entry != 'L')"), main: MAIN_SIZE },
    expect: E(['CS0019', "Operator '!=' cannot be applied to operands of type 'string' and 'char'"]) },
  { t: 'return entry;', why: 'entry is a string; the header promises a char. It will not build without Convert.ToChar.',
    cs: { methods: swapLine(ENTER_SIZE, 'return Convert.ToChar(entry);', 'return entry;'), main: MAIN_SIZE },
    expect: E(['CS0029', "Cannot implicitly convert type 'string' to 'char'"]) },
];

// One method, every input: each scenario is a call the pupil types. inputs = a refused entry, then a good one.
export const CALL_TASKS = [
  { name: 'tickets', prompt: 'Tickets (1 to 6): ', min: 1, max: 6, inputs: ['9', '4'],
    task: 'A cinema sells 1 to 6 tickets at a time. Store how many in a new int called tickets.' },
  { name: 'mark', prompt: 'Mark (0 to 60): ', min: 0, max: 60, inputs: ['65', '48'],
    task: 'A test is out of 60. Store the mark in a new int called mark.' },
  { name: 'hour', prompt: 'Hour (0 to 23): ', min: 0, max: 23, inputs: ['24', '9'],
    task: 'A booking needs the hour, on the 24-hour clock (0 to 23). Store it in a new int called hour.' },
  { name: 'players', prompt: 'Players (2 to 4): ', min: 2, max: 4, inputs: ['1', '3'],
    task: 'A board game takes 2 to 4 players. Store how many in a new int called players.' },
  { name: 'floor', prompt: 'Floor (-2 to 12): ', min: -2, max: 12, inputs: ['-3', '-1'],
    task: 'A lift goes from floor -2 (the car park) to floor 12. Store the floor in a new int called floor.' },
  { name: 'pages', prompt: 'Pages (1 to 50): ', min: 1, max: 50, inputs: ['0', '12'],
    task: 'A printer prints 1 to 50 pages per job. Store how many in a new int called pages.' },
].map((t) => ({ ...t, run: simProgram([t], `Stored: {${t.name}}`, t.inputs) }));

/* ---------- D2 Be the Examiner ---------- */
// The booklet's own table: each line of EnterNumber beside the mark scheme's wording.
export const SCHEME_ROWS = [
  { code: ['public static int EnterNumber(string prompt, int min, int max)'], point: 'correct method header: return type int, three parameters' },
  { code: ['{'] },
  { code: ['    int number = 0;'], point: 'declare a variable to hold the input' },
  { code: ['    do', '    {'] },
  { code: ['        Console.Write(prompt);'], point: 'prompt the user' },
  { code: ['        number = Convert.ToInt32(Console.ReadLine());'], point: 'read the input and convert it to a number' },
  { code: ['        if (number < min || number > max)'], point: 'range check — both ends' },
  { code: ['        {'] },
  { code: ['            Console.WriteLine($"Error: enter a number from {min} to {max}.");'], point: 'error message when invalid' },
  { code: ['        }'] },
  { code: ['    } while (number < min || number > max);'], point: 'loop that repeats until the input is valid' },
  { code: ['    return number;'], point: 'return the validated value' },
  { code: ['}'] },
];
export const SCHEME_DECOYS = ['check the entry is a whole number, not a word', 'print the number back to the user'];

// 2014 Q2(b), adapted to 7 marks. Each point is marked on its own; the range check is a mark each side.
export const Q14B = {
  task: 'Write the body of enter_No_Of_Items(int min, int max): declare noOfItems at 0; a do … while loop that runs until noOfItems is between min and max; prompt showing both values and read with Convert.ToInt32; if out of range print the error; after the loop return noOfItems.',
  points: [
    'int noOfItems = 0; — declared and started',
    'the loop runs until the entry is in range',
    'the prompt shows both values; the entry is read with Convert.ToInt32',
    'range check: below min',
    'range check: above max',
    'the error message is printed only when the check fails',
    'return noOfItems; after the loop',
  ],
};
const MODEL = [
  'int noOfItems = 0;',
  'do',
  '{',
  '    Console.Write($"Enter the number of items ({min} to {max}): ");',
  '    noOfItems = Convert.ToInt32(Console.ReadLine());',
  '    if (noOfItems < min || noOfItems > max)',
  '    {',
  '        Console.WriteLine($"Error: enter a number from {min} to {max}.");',
  '    }',
  '} while (noOfItems < min || noOfItems > max);',
  'return noOfItems;',
];
export const Q14B_MODEL = MODEL.join('\n');
// Pupil answers. marks[i] says whether point i is earned; why[i] explains each lost mark.
export const PUPIL_ANSWERS = [
  { who: 'Answer A', code: [MODEL[0], MODEL[3].trim(), MODEL[4].trim(), MODEL[5].trim(), MODEL[6].trim(), MODEL[7].slice(4), MODEL[8].trim(), MODEL[10]].join('\n'),
    marks: [1, 0, 1, 1, 1, 1, 1],
    why: { 1: 'There is no loop. It checks once and carries on with a bad value — the check marks stay, the loop mark goes.' } },
  { who: 'Answer B', code: [MODEL[0], ...MODEL.slice(1, 3), '    Console.Write("Enter the number of items: ");', ...MODEL.slice(4, 10)].join('\n'),
    marks: [1, 1, 0, 1, 1, 1, 0],
    why: { 2: 'The prompt does not show min and max — the question asked for both values.', 6: 'There is no return. The method promises an int and never hands one back.' } },
  { who: 'Answer C', code: [...MODEL.slice(0, 5), '    Console.WriteLine($"Error: enter a number from {min} to {max}.");', ...MODEL.slice(9)].join('\n'),
    marks: [1, 1, 1, 1, 1, 0, 1],
    why: { 5: 'There is no if, so the error prints after EVERY entry — even a good one. The range check marks come from the while.' } },
  { who: 'Answer D', code: ['int noOfItems;', ...MODEL.slice(1, 4), '    noOfItems = Console.ReadLine();', ...MODEL.slice(5)].join('\n'),
    marks: [0, 1, 0, 1, 1, 1, 1],
    why: { 0: 'Declared but not started at 0 — the question said start it at 0.', 2: 'Read without Convert.ToInt32: ReadLine gives text, not a number.' } },
  { who: 'Answer E', code: [...MODEL.slice(0, 9), '} while (noOfItems >= min && noOfItems <= max);', MODEL[10]].join('\n'),
    marks: [1, 0, 1, 1, 1, 1, 1],
    why: { 1: 'The while is the wrong way round: it goes round again when the entry is GOOD and stops on a bad one. The range check marks come from the if.' } },
  { who: 'Answer F', code: [...MODEL.slice(0, 9), '    return noOfItems;', MODEL[9]].join('\n'),
    marks: [1, 0, 1, 1, 1, 1, 0],
    why: { 1: 'return sits inside the loop, so the method ends after the first entry — the loop never goes round again.', 6: 'The return must come AFTER the loop. Here it hands back whatever was typed first, good or bad.' } },
];

export const EXAM_QUIZ = [
  { q: 'EnterNumber tests number < min || number > max twice — in the if and in the while. Why?',
    options: ['The if decides whether to print the error; the while decides whether to go round again', 'It is a slip: one of them can be deleted', 'The while checks min and the if checks max', 'C# needs every test written twice'],
    a: 'The if decides whether to print the error; the while decides whether to go round again',
    why: 'Not a slip. The if decides whether to print the error; the while decides whether to go round again.' },
  { q: 'A pupil checks the range once with an if, and no loop. Which mark do they lose?',
    options: ['The loop mark', 'The range check marks', 'The error message mark', 'All of them'],
    a: 'The loop mark',
    why: 'A method that checks the range once and carries on with a bad value earns the check mark, not the loop mark.' },
  { q: 'Why does EnterNumber take the range as parameters min and max?',
    options: ['So the same one method can check every input in the program', 'Because a method cannot use numbers', 'So the user can type the range', 'Because Main cannot store numbers'],
    a: 'So the same one method can check every input in the program',
    why: 'Each call brings its own prompt and its own range — one copy of the loop checks every input.' },
  { q: 'What does EnterNumber do when the user types the word twelve?',
    options: ['The program crashes — Convert.ToInt32 cannot turn a word into a number', 'It prints the error and asks again', 'It stores 0', 'It stores 12'],
    a: 'The program crashes — Convert.ToInt32 cannot turn a word into a number',
    why: 'A word instead of a number still crashes Convert.ToInt32 (a FormatException). That is fixed in Topic 10.' },
  { q: 'The scenario says the number of items must be between 1 and 20. Which test finds a BAD entry?',
    options: ['n < 1 || n > 20', 'n < 1 && n > 20', 'n >= 1 && n <= 20', 'n > 1 || n < 20'],
    a: 'n < 1 || n > 20',
    why: 'Bad means too small OR too big. && can never be true here — no number is both. n >= 1 && n <= 20 finds a GOOD entry.' },
].map((q) => ({ ...q, a: q.options.indexOf(q.a) }));

/* ---------- D3 Be the User ---------- */
// Entries to sort: accepted as a number, or a crash. The verdicts come from the simulator, which SIM_CASES checks.
export const ENTRY_SORT = [
  { show: '" 15"', raw: ' 15', note: 'a space in front', why: 'Spaces at either end are ignored: it is read as 15.' },
  { show: '"+15"', raw: '+15', why: 'One + or - in front is allowed: it is read as 15.' },
  { show: '"015"', raw: '015', why: 'Zeros in front are ignored: it is read as 15.' },
  { show: '"-15"', raw: '-15', why: 'A minus in front is fine: -15. Out of range for most questions — but it is a number, so EnterNumber prints its error instead of crashing.' },
  { show: '"15.0"', raw: '15.0', why: 'A decimal point is not allowed in a whole number — FormatException, even though 15.0 equals 15.' },
  { show: '"fifteen"', raw: 'fifteen', why: 'A word is not a number: FormatException.' },
  { show: '"1,500"', raw: '1,500', why: 'A comma is not allowed: FormatException.' },
  { show: '""', raw: '', note: 'just Enter', why: 'An empty line is not a number: FormatException.' },
  { show: '"99999999999"', raw: '99999999999', why: 'Too big for an int — the largest is 2147483647: OverflowException.' },
  { show: '"15 cm"', raw: '15 cm', why: 'Letters after the number: FormatException.' },
  { show: '"1 5"', raw: '1 5', why: 'A space in the middle: FormatException.' },
].map((e) => ({ ...e, ok: !toInt32(e.raw).ex }));
export const SORT_CHECK = { cs: { methods: '', main: 'string[] ins = { ' + ENTRY_SORT.map((e) => JSON.stringify(e.raw)).join(', ') + ' };\nforeach (string s in ins)\n{\n    try { Console.WriteLine(Convert.ToInt32(s)); }\n    catch (Exception e) { Console.WriteLine(e.GetType().Name); }\n}' },
  expect: O(ENTRY_SORT.map((e) => { const r = toInt32(e.raw); return r.ex || String(r.v); }).join('\n') + '\n') };
