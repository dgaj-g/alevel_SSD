// Zone E content — booklet section 10: eight real exam parts, word for word as the booklet prints them (adapted
// where the booklet says so), each with its mark scheme, model answer and the rounds built on it.
// Every program carries cs + expect (verify/verify_all.py runs them with dotnet). expect.loops = the program never
// stops: dotnet must time out with the output starting as shown.
import { Q14B_MODEL, toInt32, stdoutOf, crashLine } from './d.js';

const O = (out, more) => ({ out, ...more });
const E = (...msgs) => ({ errors: [...new Set(msgs.map((m) => m[0]))], msgs });
const stdin = (ev) => ev.filter((e) => e[0] === 'in').map((e) => e[1] + '\n').join('');
function fromEvents(methods, main, ev) { return { ev, cs: { methods, main, stdin: stdin(ev) }, expect: O(stdoutOf(ev)) }; }
function loops(methods, main, ev) { return { ev, cs: { methods, main, stdin: stdin(ev) }, expect: { out: stdoutOf(ev), loops: true } }; }
const prog = (methods, main, expect, stdinText = '') => ({ cs: { methods, main, stdin: stdinText }, expect });
const pad = (d) => '    '.repeat(d);
const indent = (src, d) => src.split('\n').map((l) => (l ? pad(d) + l : l)).join('\n');
const swap = (src, a, b) => { if (!src.includes(a)) throw new Error('swap: not found ' + a); return src.replace(a, b); };

/* ---------- the methods the questions use ---------- */
export const FIND_COST_BOARD = [
  { t: 'public static double findCost(char style, int size)', d: 0 },
  { t: '{', d: 0 },
  { t: 'double cost = 0;', d: 1, slot: true },
  { t: 'switch (style)', d: 1, slot: true },
  { t: '{', d: 1 },
  { t: "case 'S':", d: 2 },
  { t: 'cost = 120.00;', d: 3 },
  { t: 'break;', d: 3 },
  { t: "case 'R':", d: 2, slot: true },
  { t: 'cost = 139.99;', d: 3 },
  { t: 'break;', d: 3 },
  { t: "case 'I':", d: 2 },
  { t: 'cost = 215.00;', d: 3, slot: true },
  { t: 'break;', d: 3 },
  { t: "case 'C':", d: 2 },
  { t: 'cost = 349.99;', d: 3 },
  { t: 'break;', d: 3 },
  { t: '}', d: 1 },
  { t: 'if (size == 2)', d: 1, slot: true },
  { t: '{', d: 1 },
  { t: 'cost = cost * 1.5;', d: 2, slot: true },
  { t: '}', d: 1 },
  { t: 'cost = cost * 1.2;', d: 1, slot: true },
  { t: 'return cost;', d: 1, slot: true },
  { t: '}', d: 0 },
];
export const FIND_COST = FIND_COST_BOARD.map((r) => pad(r.d) + r.t).join('\n');
// The booklet's model answer prints each case on one line.
const FIND_COST_BODY = ['double cost = 0;', 'switch (style)', '{', "    case 'S': cost = 120.00; break;", "    case 'R': cost = 139.99; break;",
  "    case 'I': cost = 215.00; break;", "    case 'C': cost = 349.99; break;", '}', 'if (size == 2)', '{', '    cost = cost * 1.5;', '}', 'cost = cost * 1.2;', 'return cost;'];
export const PRICE_TEXT = { S1: '£144.00', S2: '£216.00', R1: '£167.99', R2: '£251.98', I1: '£258.00', I2: '£387.00', C1: '£419.99', C2: '£629.98' };
const PRICE_MAIN = ['S', 'R', 'I', 'C'].map((s) => `Console.WriteLine($"${s}: {findCost('${s}', 1):C} standard, {findCost('${s}', 2):C} deluxe");`).join('\n');
const priceOut = (p) => ['S', 'R', 'I', 'C'].map((s) => `${s}: ${p[s + '1']} standard, ${p[s + '2']} deluxe\n`).join('');
// Every price findCost gives, run for real.
export const PRICE_RUN = { ev: [['out', priceOut(PRICE_TEXT)]], cs: { methods: FIND_COST, main: PRICE_MAIN }, expect: O(priceOut(PRICE_TEXT)) };

const ITEMS_BODY = Q14B_MODEL;
const ITEMS_METHOD = 'public static int enter_No_Of_Items(int min, int max)\n{\n' + indent(ITEMS_BODY, 1) + '\n}';
const TEL_METHOD = 'public static bool validTelephoneNo(string telNo)\n{\n    return telNo.Length == 11 && telNo.StartsWith("0");\n}';

export const SHED_MAIN_BOARD = [
  { t: 'static void Main(string[] args)', d: 0 },
  { t: '{', d: 0 },
  { t: 'char style;', d: 1 },
  { t: 'int size;', d: 1 },
  { t: 'double cost;', d: 1 },
  { t: 'string entry = "";', d: 1 },
  { t: 'do', d: 1 },
  { t: '{', d: 1 },
  { t: 'Console.Write("Style (S, R, I or C): ");', d: 2 },
  { t: 'entry = Console.ReadLine();', d: 2 },
  { t: 'if (entry != "S" && entry != "R" && entry != "I" && entry != "C")', d: 2, slot: true },
  { t: '{', d: 2 },
  { t: 'Console.WriteLine("Error: enter S, R, I or C.");', d: 3 },
  { t: '}', d: 2 },
  { t: '} while (entry != "S" && entry != "R" && entry != "I" && entry != "C");', d: 1, slot: true },
  { t: 'style = Convert.ToChar(entry);', d: 1, slot: true },
  { t: 'do', d: 1 },
  { t: '{', d: 1 },
  { t: 'Console.Write("Size (1 standard, 2 deluxe): ");', d: 2 },
  { t: 'size = Convert.ToInt32(Console.ReadLine());', d: 2, slot: true },
  { t: 'if (size != 1 && size != 2)', d: 2, slot: true },
  { t: '{', d: 2 },
  { t: 'Console.WriteLine("Error: enter 1 or 2.");', d: 3 },
  { t: '}', d: 2 },
  { t: '} while (size != 1 && size != 2);', d: 1 },
  { t: 'cost = findCost(style, size);', d: 1, slot: true },
  { t: 'Console.WriteLine($"Cost of shed: {cost:C}");', d: 1, slot: true },
  { t: '}', d: 0 },
];
// The body of Main, as the probe wraps it.
export const SHED_MAIN = SHED_MAIN_BOARD.slice(2, -1).map((r) => pad(r.d - 1) + r.t).join('\n');
const SHED_BODY = SHED_MAIN_BOARD.slice(5, -1).map((r) => pad(r.d - 1) + r.t);

/* ---------- the shed simulator (e8 Be the User): same rules as the real Main, checked by SHED_CASES ---------- */
const LETTERS = ['S', 'R', 'I', 'C'];
export function runShed(inputs) {
  const ev = [], log = { badStyles: [], sizeErrs: 0, sizeLine: null };
  let i = 0, style = null, size = null;
  for (;;) {
    ev.push(['out', 'Style (S, R, I or C): ']);
    if (i >= inputs.length) return { ev, waiting: 'style', done: false, log };
    const line = inputs[i++];
    ev.push(['in', line]);
    if (LETTERS.includes(line)) { style = line; break; }
    log.badStyles.push(line);
    ev.push(['out', 'Error: enter S, R, I or C.\n']);
  }
  for (;;) {
    ev.push(['out', 'Size (1 standard, 2 deluxe): ']);
    if (i >= inputs.length) return { ev, waiting: 'size', done: false, log, style };
    const line = inputs[i++];
    ev.push(['in', line]);
    const r = toInt32(line);
    if (r.ex) { ev.push(['crash', r.ex, r.msg]); return { ev, crashed: r, done: true, log, style }; }
    if (r.v === 1 || r.v === 2) { size = r.v; log.sizeLine = line; break; }
    log.sizeErrs++;
    ev.push(['out', 'Error: enter 1 or 2.\n']);
  }
  ev.push(['out', `Cost of shed: ${PRICE_TEXT[style + size]}\n`]);
  return { ev, done: true, log, style, size };
}
function shedProgram(inputs) {
  const r = runShed(inputs);
  const crash = r.crashed ? { crash: true, err: crashLine(r.crashed.ex, r.crashed.msg) } : {};
  return { ev: r.ev, cs: { methods: FIND_COST, main: SHED_MAIN, stdin: stdin(r.ev) }, expect: O(stdoutOf(r.ev), crash) };
}
export const SHED_RUN = shedProgram(['Shed', 'R', '3', '2']);
export const SHED_CASES = [
  ['Shed', 'R', '3', '2'], ['S', '1'], ['C', '2'], ['I', '1'], ['R', '1'], ['s', 'S', ' 2'], ['', 'C', 'two'],
  ['SR', 'I', '99999999999'], [' S', 'S', '+1'], ['c', 'C', '02'], ['I', '0', '-1', '2'], ['S', '1.5'], ['Igloo', 'I', ''],
].map(shedProgram);

/* ---------- the eight papers ---------- */
// blocks: ['p', text] · ['code', lines] · ['ul', items] · ['table', head, rows] · ['tasks', items] · ['ask', text] · ['note', text]
// points: one row per mark; find = a pattern that suggests the point is in the pupil's answer (a hint, never the mark).
export const PAPERS = {
  e1: {
    paper: '2015 Q2(a)', also: 'also 2019 Q2(a), word for word', marks: 3, kind: 'prose', any: 3,
    blocks: [
      ['p', 'Methods are the basic building blocks of structured software solutions and are widely used in object-oriented programs.'],
      ['ask', 'Give three advantages of their use.'],
      ['scheme', 'Marks: [3] — any three, one mark each.'],
    ],
    points: [
      { t: 'Reuse of code', find: /reus|re-us|used again|more than once|many times|wherever|again and again/i },
      { t: 'Structured design that simplifies the solution', find: /structur|split|broken|break|divid|smaller|modul|simpl/i },
      { t: 'Several developers can work on different methods at once', find: /develop|programmers|team|same time|at once|parallel|people/i },
      { t: 'Faster development', find: /fast|quick|less time|saves? time|speed/i },
      { t: 'Simpler testing', find: /test|debug/i },
    ],
    model: [['ul', [
      'The same code is written once and reused wherever it is needed, instead of being written out again.',
      'The problem is broken into smaller methods, which gives a structured design and simplifies the solution.',
      'Several developers can work on different methods at the same time.']]],
    notes: ['Write a phrase, not a word: "reuse" on its own has been refused; "the same code is reused wherever it is needed" earns the mark.',
      'The 2015 mark scheme also lists overloading and overriding. Overloading comes later in this topic, overriding in Topic 11 (Inheritance) — the five here are the ones to learn now.'],
  },
  e2: {
    paper: '2014 Q2(a)', adapted: 'The Java headers are dropped; String is written string. The paper\'s mark for what public and static mean is the Classes topics (Topics 8 and 9), so this version is out of 5.',
    marks: 5, kind: 'prose',
    blocks: [
      ['p', 'Methods are common features of programs. Explain the structure of a method, referring to the two headers below to illustrate your answer.'],
      ['p', 'The two headers:'],
      ['code', ['public static int enter_No_Of_Items(int min, int max)', 'public static void displayMessage(int row, int col, string message)']],
      ['tasks', ['Say what each part of a header is for — return type, name, parameters. (Every header starts public static; what those two words mean is the Classes topics.)',
        'Point at both headers as you go: which returns a value and which does not, and what each parameter is.',
        'Say how the values get into min, max, row, col and message when the method is called.']],
      ['scheme', 'Marks: [5] — five points, one mark each.'],
    ],
    points: [
      { t: 'The name — the call uses it to run the method', find: /name/i },
      { t: 'Parameters receive copies of the arguments — min, max, row, col are passed by value', find: /cop(y|ies)|by value|passed/i },
      { t: 'message is a string: it gets a copy the same way, and cannot change the caller\'s variable', find: /message/i },
      { t: 'enter_No_Of_Items returns an int with a return statement', find: /return/i },
      { t: 'displayMessage is void — it returns nothing', find: /void|nothing|no value/i },
    ],
    model: [
      ['p', 'A header gives the return type, the name and the parameters. The name is what a call uses to run the method: enter_No_Of_Items(1, 20) runs the first one.'],
      ['p', 'enter_No_Of_Items has the return type int, so it must end with a return statement that hands a whole number back to the caller. displayMessage is void: it does its job and returns nothing.'],
      ['p', 'The parameters are the variables in the brackets: min and max are ints; row and col are ints and message is a string.'],
      ['p', 'When a method is called, each parameter receives a copy of the argument in the same position — the arguments are passed by value. message gets a copy too, so the method cannot change the caller\'s variable.'],
    ],
    notes: ['Point at the headers: every mark names something you can see in them — int, void, min, message.'],
  },
  e3: {
    paper: '2014 Q2(b)', adapted: 'The mark for checking the entry is a whole number (Topic 4) is dropped: out of 7, not 8.',
    marks: 7, kind: 'code',
    blocks: [
      ['p', 'A shop program needs the number of items bought. The number must be between min and max.'],
      ['p', 'The method header is written for you:'],
      ['code', ['public static int enter_No_Of_Items(int min, int max)']],
      ['p', 'min is the smallest number allowed and max the largest; both already hold values when the method is called.'],
      ['tasks', ['Declare a new int called noOfItems and start it at 0.',
        'Use a do … while loop that runs until noOfItems is between min and max.',
        'Inside the loop, prompt "Enter the number of items (min to max): " showing the two values, and read the entry with Convert.ToInt32.',
        'If the entry is out of range, print "Error: enter a number from min to max."',
        'After the loop, return noOfItems.']],
      ['note', 'Not needed: a class, Main, or the header line.'],
      ['scheme', 'Marks: declaration [1] · loop control [1] · prompt and input [1] · range check [2] · error message [1] · return [1].'],
    ],
    points: [
      { t: '`int noOfItems = 0;` — declared and started', find: /int\s+\w+\s*=\s*0/i },
      { t: 'A do … while loop that runs until the entry is in range', find: /while\s*\(/i },
      { t: 'The prompt shows both values, and the entry is read with Convert.ToInt32', find: /Convert\s*\.\s*ToInt32|int\s*\.\s*Parse/i },
      { t: 'Range check, the low side: `noOfItems < min`', find: /\w+\s*<\s*min\b|\bmin\s*>\s*\w+/i },
      { t: 'Range check, the high side: `noOfItems > max`', find: /\w+\s*>\s*max\b|\bmax\s*<\s*\w+/i },
      { t: 'The error message, printed only when the check fails', find: /if[\s\S]*Write(Line)?\s*\(/i },
      { t: '`return noOfItems;` after the loop', find: /return\s+\w+/i },
    ],
    model: [['code', Q14B_MODEL.split('\n')]],
    notes: ['The same test appears twice — in the if and in the while. That is correct: the if decides whether to print the error, the while decides whether to go round again.'],
  },
  e4: {
    paper: '2014 Q2(d)', marks: 2, kind: 'code',
    blocks: [
      ['p', 'Two methods exist, and Main needs to use them. The following variables have already been declared and hold values:'],
      ['code', ['public static int enter_No_Of_Items(int min, int max)', 'public static bool validTelephoneNo(string telNo)', '',
        'int noOfItems;', 'int min = 1;', 'int max = 20;', 'string telNo = "02830262000";', 'bool validTelNo;']],
      ['ul', ['noOfItems is to hold the number of items the method returns.', 'min and max are the smallest and largest numbers of items allowed.',
        'telNo holds the phone number typed by the user.', 'validTelNo is to hold true if that number is valid and false if not.']],
      ['ask', 'Write the two lines in Main that call each method and store what it returns.'],
      ['note', 'Not needed: a class, the rest of Main, or the bodies of the two methods.'],
      ['scheme', 'Marks: each call, stored [1].'],
    ],
    points: [
      { t: '`noOfItems = enter_No_Of_Items(min, max);`' },
      { t: '`validTelNo = validTelephoneNo(telNo);`' },
    ],
    model: [['code', ['noOfItems = enter_No_Of_Items(min, max);', 'validTelNo = validTelephoneNo(telNo);']]],
    notes: ['You do not need to know how validTelephoneNo works to call it — that is the point of a method.'],
  },
  e5: {
    paper: 'Specimen Q2(c)', adapted: 'The paper\'s pseudocode is written as C#; int &a becomes ref int a.', marks: 4, kind: 'prose',
    blocks: [
      ['p', 'A programmer writes a method to swap two numbers, and calls it from Main. The program prints x = 45 and y = 50.'],
      ['p', 'The method, and the lines in Main that call it:'],
      ['code', ['public static void Swap(int a, int b)', '{', '    int temp = a;', '    a = b;', '    b = temp;', '}', '',
        'int x = 45;', 'int y = 50;', 'Swap(x, y);', 'Console.WriteLine($"x = {x} and y = {y}");']],
      ['p', 'a and b are the method\'s two parameters; temp holds one value while the two are exchanged. x and y are the two variables in Main that the programmer meant to swap.'],
      ['ask', '(i) Explain why the output is not x = 50 and y = 45. [2]'],
      ['ask', '(ii) Say how the code could be changed so that the swap works, and give an example. [2]'],
      ['scheme', 'Marks: (i) [2] · (ii) [2].'],
    ],
    points: [
      { t: '(i) The arguments are passed by value — a and b are copies of x and y, and it is the copies that are swapped', find: /cop(y|ies)|by value/i },
      { t: '(i) The originals in Main are unchanged', find: /unchanged|original|not chang|still|stay|same/i },
      { t: '(ii) Pass the arguments by reference', find: /reference|\bref\b/i },
      { t: '(ii) The example: header `Swap(ref int a, ref int b)` and call `Swap(ref x, ref y)`', find: /ref\s+int[\s\S]*ref\s+x|ref\s+x[\s\S]*ref\s+int/i },
    ],
    model: [
      ['p', '(i) The arguments are passed by value: a and b are copies of x and y, and it is the copies that are swapped inside the method. The originals in Main are unchanged, so it still prints x = 45 and y = 50.'],
      ['p', '(ii) Pass the arguments by reference, so the method works on x and y themselves. ref goes in the header and in the call:'],
      ['code', ['public static void Swap(ref int a, ref int b)', 'Swap(ref x, ref y);']],
    ],
    notes: ['The example needs ref in BOTH places. With ref in the header only, C# will not build the call.'],
  },
  e6: {
    paper: '2022 Q1(a)', also: 'part (b) is in the Classes topics', marks: 2, kind: 'prose',
    blocks: [
      ['p', '(a) A method can generally be exited under three conditions, one of which is when execution reaches the last statement in it.'],
      ['ask', 'Describe one other condition where a method is exited.'],
      ['scheme', 'Marks: [2] — the condition, and a detail.'],
    ],
    points: [
      { t: 'A return statement is reached', find: /return/i },
      { t: 'The method ends at once and the value goes back to the caller, matching the return type', find: /back|caller|end|stop|at once|immediately|straight|match|leave|exit/i },
    ],
    model: [['p', 'When a return statement is reached. The method ends at once — no line after the return runs — and the value after return goes back to the caller, so it must match the method\'s return type.']],
    notes: ['The third way, an error that stops the method, is Topic 10.'],
  },
  e7: {
    paper: '2015 Q2(b)', marks: 10, kind: 'code',
    blocks: [
      ['p', 'A carpenter sells garden sheds in two sizes, standard and deluxe; deluxe costs 50% more than standard. Sheds come in the four styles in the table, prices excluding VAT for the standard size. VAT is 20%.'],
      ['table', ['Style code', 'Style', 'Standard price (excluding VAT)'], [['S', 'square', '£120.00'], ['R', 'rectangle', '£139.99'], ['I', 'igloo', '£215.00'], ['C', 'castle', '£349.99']]],
      ['p', 'The method header is written for you:'],
      ['code', ['public static double findCost(char style, int size)']],
      ['p', 'style holds one of the letters S, R, I or C from the table. size holds 1 for standard or 2 for deluxe. Both already hold valid values when the method is called.'],
      ['tasks', ['Declare a new double called cost and start it at 0.',
        'Use a switch on style to set cost to the standard price from the table — one case per letter, each ending in break.',
        'If size is 2, increase cost by 50%.', 'Add 20% VAT to cost.', 'Return cost.']],
      ['note', 'Not needed: a class, Main, or input and output.'],
      ['scheme', 'Marks: header — return type and each parameter type [3] · cost declared [1] · switch on style with correct cases [1] · a correct price and break [2] · the deluxe test [1] · VAT [1] · return [1].'],
    ],
    points: [
      { t: 'Header: the return type `double`', find: /double\s+findCost/i },
      { t: 'Header: `char style`', find: /char\s+style/i },
      { t: 'Header: `int size`', find: /int\s+size/i },
      { t: '`double cost = 0;`', find: /double\s+cost\s*=\s*0/i },
      { t: '`switch (style)` with a case for each of the four letters', find: /switch\s*\(\s*style\s*\)/i },
      { t: 'A correct price on each case', find: /case\s*'?[SRIC]'?\s*:\s*cost\s*=\s*(120|139\.99|215|349\.99)/i },
      { t: '`break;` after each price', find: /break/i },
      { t: '`if (size == 2)` — the deluxe test', find: /size\s*==\s*2/i },
      { t: 'VAT added: `cost = cost * 1.2;`', find: /\*\s*1\.20?\b|1\.20?\s*\*|0\.2/i },
      { t: '`return cost;`', find: /return\s+cost/i },
    ],
    model: [['code', ['public static double findCost(char style, int size)', '{', ...FIND_COST_BODY.map((l) => '    ' + l), '}']]],
    notes: ['The header is given, so its 3 marks are earned by copying it exactly. Copy it first.',
      'The deluxe line and the VAT line can come in either order: × 1.5 then × 1.2 gives the same price as × 1.2 then × 1.5.'],
  },
  e8: {
    paper: '2015 Q2(c)', adapted: 'The mark for a try/catch round the size entry (Topic 10) is dropped: out of 9, not 10.', marks: 9, kind: 'code',
    blocks: [
      ['p', 'Main asks the user for a style and a size, and prints the cost of the shed. findCost from part (b) exists. The following variables have already been declared:'],
      ['code', ['char style;', 'int size;', 'double cost;']],
      ['ul', ['style is to hold the letter the user types.', 'size is to hold the number 1 or 2.', 'cost is to hold the answer from findCost.']],
      ['tasks', ['Declare a new string called entry, starting at "". Prompt "Style (S, R, I or C): " and read the line into entry, repeating until it is one of the four letters — print "Error: enter S, R, I or C." when it is not. Then turn entry into a char in style with Convert.ToChar.',
        'Prompt "Size (1 standard, 2 deluxe): " and read size with Convert.ToInt32, repeating until it is 1 or 2 — print "Error: enter 1 or 2." when it is not.',
        'Call findCost with style and size and store the result in cost.',
        'Print cost with :C after the words "Cost of shed: ".']],
      ['note', 'Not needed: a class, the Main header, or findCost itself. All of your code goes inside Main.'],
      ['scheme', 'Marks: style loop [1] · style test [1] · style error message [1] · size entry [1] · size range test [1] · size error message [1] · loop for size [1] · the call, stored [1] · the output [1].'],
    ],
    points: [
      { t: 'A do … while loop round the style entry', find: /do[\s\S]*Style[\s\S]*while\s*\(\s*entry/i },
      { t: 'The style test: all four letters, joined with &&', find: /"S"[\s\S]*&&[\s\S]*"R"[\s\S]*&&[\s\S]*"I"[\s\S]*&&[\s\S]*"C"/i },
      { t: '"Error: enter S, R, I or C." printed when the test fails', find: /Error[^\n]*S, R/i },
      { t: '`size = Convert.ToInt32(Console.ReadLine());`', find: /size\s*=\s*(Convert\s*\.\s*ToInt32|int\s*\.\s*Parse)/i },
      { t: 'The size test: `size != 1 && size != 2`', find: /size\s*!=\s*1\s*&&\s*size\s*!=\s*2/i },
      { t: '"Error: enter 1 or 2." printed when it fails', find: /Error[^\n]*1 or 2/i },
      { t: 'A do … while loop round the size entry', find: /while\s*\(\s*size/i },
      { t: '`cost = findCost(style, size);`', find: /cost\s*=\s*findCost\s*\(\s*style\s*,\s*size\s*\)/i },
      { t: 'The output: `Console.WriteLine($"Cost of shed: {cost:C}");`', find: /Write(Line)?\s*\(.*cost/i },
    ],
    model: [['code', SHED_BODY]],
    notes: ['The Topic 2 line style = Convert.ToChar(Console.ReadLine()); also earns the marks, but it crashes unless exactly one character is typed: Shed, or Enter on its own, stops the program.',
      'The model tests the line as text first — "S" in double quotes, because entry is a string — and turns it into a char only once it is one of the four letters, so it cannot crash.'],
  },
};

/* ---------- e1 ---------- */
export const E1_PICK = [
  { t: 'The same code is written once and reused wherever it is needed.', pt: 'reuse' },
  { t: 'A method can be called many times, so its code is never written out twice.', pt: 'reuse' },
  { t: 'The problem is broken into smaller parts, which simplifies the solution.', pt: 'structure' },
  { t: 'Several programmers can each write a different method at the same time.', pt: 'team' },
  { t: 'Each method can be tested on its own, so errors are easier to find.', pt: 'testing' },
  { t: 'Development is faster: methods that already work are used, not written again.', pt: 'faster' },
  { t: 'Reuse.', why: 'One word is not an advantage explained. The examiner has refused "reuse" on its own — say what is reused, and where.' },
  { t: 'Methods make the program run faster.', why: 'A method call does not speed the program up. The advantage is faster DEVELOPMENT: the programmer saves time, not the computer.' },
  { t: 'Methods use less memory.', why: 'Not in the scheme. The advantages are about writing, organising and testing the code.' },
  { t: 'Methods stop the user typing in wrong values.', why: 'That is validation — a job a method can DO, like EnterNumber. It is not an advantage of methods themselves.' },
];
export const E1_POINT_NAME = { reuse: 'reuse of code', structure: 'structured design', team: 'several developers at once', testing: 'simpler testing', faster: 'faster development' };
export const E1_MATCH = {
  chips: ['Reuse of code', 'Structured design', 'Several developers at once', 'Simpler testing', 'Faster development', 'Methods make the program run faster'],
  scenes: [
    { t: 'EnterNumber is written once. Main calls it for the age, the year group and the year of birth.', want: 'Reuse of code' },
    { t: 'Two pupils share a project. One writes ShowMenu while the other writes CalculateTotal, on the same afternoon.', want: 'Several developers at once' },
    { t: 'Before Main exists, EnterNumber is tried on its own with 10, 11, 19 and 20.', want: 'Simpler testing' },
    { t: 'The shed program is split into findCost, which works out a price, and Main, which talks to the user.', want: 'Structured design' },
  ],
  why: ['Faster development is the fifth point: it follows from the others — code reused, work shared, faults found sooner.',
    '"Methods make the program run faster" is never a mark. The time saved is the programmer\'s.'],
};

/* ---------- e2 ---------- */
export const E2_HEADERS = ['public static int enter_No_Of_Items(int min, int max)', 'public static void displayMessage(int row, int col, string message)'];
export const E2_QUIZ = [
  { q: 'Which method hands a value back to the caller?', options: ['enter_No_Of_Items — its return type is int', 'displayMessage — it has the most parameters', 'Both of them', 'Neither — values only come back through parameters'], a: 0,
    why: 'The word before the name is the return type. int means a whole number comes back; void means nothing does.' },
  { q: 'How many parameters does displayMessage have?', options: ['3', '2', '1', '4'], a: 0,
    why: 'Count the variables in the brackets: row, col and message. Each has its own type in front.' },
  { q: 'What type is message?', options: ['string', 'void', 'int', 'char'], a: 0,
    why: 'The type is written in front of each parameter: `string message`. void belongs to the method, not to a parameter.' },
  { q: 'Main runs `int n = enter_No_Of_Items(1, 20);` — which parameter receives 20?', options: ['max', 'min', 'n', 'Both: min and max each get 20'], a: 0,
    why: 'Arguments go to parameters by position: the first argument into the first parameter (min = 1), the second into the second (max = 20).' },
  { q: 'Which line calls displayMessage correctly?', options: ['`displayMessage(5, 10, "Ready");`', '`string s = displayMessage(5, 10, "Ready");`', '`displayMessage("Ready", 5, 10);`', '`displayMessage(int 5, int 10, string "Ready");`'], a: 0,
    why: 'void returns nothing, so there is nothing to store. The arguments follow the order of the parameters — row, col, message — and a call never has types in it.' },
  { q: 'What does void mean in front of displayMessage?', options: ['It returns no value', 'It takes no parameters', 'It is empty and does nothing', 'It returns an empty string'], a: 0,
    why: 'void is a return type: nothing comes back. displayMessage still has parameters, and still does its job — it prints.' },
];
export const E2_SORT = [
  { t: 'min and max receive copies of the two arguments in the call.', ok: true, why: 'Passed by value: each parameter gets a copy.' },
  { t: 'displayMessage is void, so it hands nothing back.', ok: true, why: 'Points at the header: void is its return type.' },
  { t: 'enter_No_Of_Items must end with return and an int value.', ok: true, why: 'int is its return type, so a return statement hands an int back.' },
  { t: 'message gets a copy of the string, so the method cannot change the caller\'s variable.', ok: true, why: 'The same rule as min and max — a copy.' },
  { t: 'The call uses the method\'s name: enter_No_Of_Items(1, 20) runs it.', ok: true, why: 'The name is how a call finds the method.' },
  { t: 'min and max are typed in by the user inside the method.', ok: false, why: 'They arrive from the call: the caller\'s arguments are copied in. Nothing is typed into a parameter.' },
  { t: 'displayMessage returns the message it displays.', ok: false, why: 'void means it returns nothing. Printing is not returning.' },
  { t: 'Changing min inside the method changes the variable in Main.', ok: false, why: 'min holds a copy. Main\'s variable is untouched — that is passing by value.' },
  { t: 'The int in front of the name means the parameters must be ints.', ok: false, why: 'The int in front is the RETURN type. Each parameter has its own type inside the brackets.' },
  { t: 'message is passed by reference because it is text.', ok: false, why: 'Nothing in the header says ref. message is passed by value like the others: the method gets a copy.' },
];

/* ---------- e3: write it line by line, then find the faults ---------- */
const LOW = '(noofitems<min|min>noofitems)', HIGH = '(noofitems>max|max<noofitems)';
const OUT_OF_RANGE = `(${LOW}\\|\\|${HIGH}|${HIGH}\\|\\|${LOW})`;
const IN_RANGE = '(noofitems>=min&&noofitems<=max|noofitems<=max&&noofitems>=min|min<=noofitems&&noofitems<=max)';
const rangeSlips = (kw) => [
  { re: new RegExp(`^${kw}(${LOW}&&${HIGH}|${HIGH}&&${LOW})$`), say: '&& needs both sides true at once — and no number is below min AND above max. Out of range is too small OR too big: ||.' },
  { re: new RegExp(`^${kw}${IN_RANGE}$`), say: kw === 'while'
    ? 'That goes round again while the entry is GOOD — a bad entry ends the loop and is handed back. Repeat while it is out of range.'
    : 'That is the in-range test — true for a GOOD entry. The error belongs to the out-of-range test.' },
  { re: new RegExp(`^${kw}.*(noofitems<=min|min>=noofitems|noofitems>=max|max<=noofitems)`), say: '<= min refuses min itself — but min is allowed. The test is < min and > max.' },
  { re: new RegExp(`^${kw}.*(<1|>20|1>|20<)`), say: 'The range arrives as min and max — use the parameters, not numbers. This method has to work for any range.' },
  { re: new RegExp(`^${kw}(${LOW}|${HIGH})$`), say: 'Only one side is checked. Both are needed — too small OR too big — and each side is a mark.' },
];
export const E3_LINES = [
  { t: 'int noOfItems = 0;', d: 0, ask: 'Declare a new int called noOfItems and start it at 0.',
    checks: [{ re: /^intnoofitems=0$/, ok: true },
      { re: /^intnoofitems$/, say: 'Declared, but not started. The task says start it at 0 — and the mark is for both.' },
      { re: /^noofitems=0$/, say: 'That sets it, but a new variable needs its type in front: int.' }] },
  { t: 'do', d: 0 }, { t: '{', d: 0 },
  { t: 'Console.Write($"Enter the number of items ({min} to {max}): ");', d: 1, ask: 'Prompt "Enter the number of items (min to max): " showing the two values.',
    checks: [{ re: /^console\.write(line)?\(\$".*\{min\}.*\{max\}/, on: 'T', ok: true },
      { re: /^console\.write(line)?\(".*\{min\}.*\{max\}/, on: 'T', ok: true, say: 'The examiner gives it. C# needs the $ in front of the quotes, or it prints {min} and {max} as they are.' },
      { re: /^console\.write(line)?\(".*"\+min\+".*"\+max/, on: 'T', ok: true, say: 'Joining with + works too.' },
      { re: /^console\.write(line)?\("[^"{]*min[^"{]*max[^"{]*"\)/, on: 'T', say: 'Inside quotes, min and max are just words: it prints "(min to max)", not the numbers. Put the values in: $"… ({min} to {max}): ".' },
      { re: /^console\.write(line)?.*min.*max/, ok: true },
      { re: /^console\.write(line)?/, say: 'The prompt must show both values — min and max — so the user knows the range.' }] },
  { t: 'noOfItems = Convert.ToInt32(Console.ReadLine());', d: 1, ask: 'Read the entry into noOfItems with Convert.ToInt32.',
    checks: [{ re: /^noofitems=convert\.toint32console\.readline$/, ok: true },
      { re: /^noofitems=int\.parseconsole\.readline$/, ok: true, say: 'int.Parse does the same job; the task asked for Convert.ToInt32.' },
      { re: /^intnoofitems=(convert\.toint32|int\.parse)console\.readline$/, ok: true, say: 'Earns the mark — but drop the int. noOfItems was declared at the top, and C# will not declare it twice.' },
      { re: /^noofitems=console\.readline$/, say: 'ReadLine hands back text. noOfItems is an int, so the text must be converted: Convert.ToInt32(…).' },
      { re: /^console\.readline$/, say: 'Read, but never stored — the entry is lost. Store it: noOfItems = …' },
      { re: /^(convert\.toint32|int\.parse)console\.readline$/, say: 'Converted, then thrown away. Store it in noOfItems.' }] },
  { t: 'if (noOfItems < min || noOfItems > max)', d: 1, ask: 'Start the if that checks the entry is out of range.',
    checks: [{ re: new RegExp(`^if${OUT_OF_RANGE}$`), ok: true }, ...rangeSlips('if'),
      { re: /^while/, say: 'That is a while. The if comes first, inside the loop: it decides whether to print the error.' }] },
  { t: '{', d: 1 },
  { t: 'Console.WriteLine($"Error: enter a number from {min} to {max}.");', d: 2, ask: 'Inside the if: print the error message.',
    checks: [{ re: /^console\.write(line)?\(noofitems\)/, on: 'T', say: 'That prints the number back. The user needs a message saying what went wrong.' },
      { re: /^console\.write(line)?\(\$?".{3,}"/, on: 'T', ok: true },
      { re: /^console\.write(line)?.{3,}/, ok: true }] },
  { t: '}', d: 1 },
  { t: '} while (noOfItems < min || noOfItems > max);', d: 0, ask: 'Close the loop: the while that sends it round again.',
    checks: [{ re: new RegExp(`^while${OUT_OF_RANGE}$`), ok: true }, ...rangeSlips('while'),
      { re: /^until/, say: 'C# has no until. do … while repeats WHILE its test is true.' },
      { re: /^if/, say: 'That is an if. The loop closes with } while (…);' }] },
  { t: 'return noOfItems;', d: 0, ask: 'After the loop: hand the number back.',
    checks: [{ re: /^returnnoofitems$/, ok: true },
      { re: /^return$/, say: 'An int method must return a value: return noOfItems;' },
      { re: /^console\.write/, say: 'Printing is not returning. Main gets nothing back — return hands the value to the caller.' },
      { re: /^return(min|max|0)$/, say: 'That hands back the wrong value. The caller wants the entry: return noOfItems;' },
      { re: /^returnint/, say: 'No type after return — just the value.' }] },
];
// Three answers to 2014 Q2(b). bad: the line loses a mark · ok: looks odd but costs nothing (with the reason).
export const E3_FAULTS = [
  { who: 'Answer P', lines: [
    ['int noOfItems = 0;'], ['do'], ['{'],
    ['    Console.Write("Enter the number of items: ");', 'bad', 'The prompt does not show the two values — the scheme\'s prompt mark asks for both.'],
    ['    noOfItems = Convert.ToInt32(Console.ReadLine());'],
    ['    if (noOfItems > max || noOfItems < min)', 'ok', 'The two sides are in the other order. || does not care — same test, full marks.'],
    ['    {'],
    ['        Console.WriteLine("Out of range - try again.");', 'ok', 'Different words, same job: an error message, printed only when the check fails.'],
    ['    }'],
    ['} while (noOfItems >= min && noOfItems <= max);', 'bad', 'The wrong way round: it goes round again while the entry is GOOD, and hands a bad entry back.'],
    ['return noOfItems;']] },
  { who: 'Answer Q', lines: [
    ['int noOfItems = 0;'], ['do'], ['{'],
    ['    Console.WriteLine($"Enter the number of items ({min} to {max}): ");', 'ok', 'WriteLine instead of Write only moves the cursor to the next line. The mark stands.'],
    ['    Console.ReadLine();', 'bad', 'The entry is read and thrown away: noOfItems never changes. Store it — noOfItems = Convert.ToInt32(Console.ReadLine());'],
    ['    if (noOfItems < min || noOfItems > max)'],
    ['    {'],
    ['        Console.WriteLine($"Error: enter a number from {min} to {max}.");'],
    ['    }'],
    ['} while (noOfItems < min || noOfItems > max);'],
    ['return min;', 'bad', 'It hands back min, not the entry. The caller wants the number the user typed: return noOfItems;']] },
  { who: 'Answer R', lines: [
    ['int noOfItems;', 'bad', 'Declared but not started. The scheme\'s first mark is for both: int noOfItems = 0; (C# itself would let this one through — the do sets it before the while reads it.)'],
    ['do'], ['{'],
    ['    Console.Write($"Enter the number of items ({min} to {max}): ");'],
    ['    noOfItems = Convert.ToInt32(Console.Readline());', 'ok', 'A capitals slip — C# wants ReadLine. On the paper the examiner reads past it: the line still reads and converts.'],
    ['    if (max < noOfItems || min > noOfItems)', 'ok', 'Written backwards, but max < noOfItems means the same as noOfItems > max. Both sides, both marks.'],
    ['    {'],
    ['        Console.WriteLine($"Error: enter a number from {min} to {max}.");'],
    ['    }'],
    ['} while (noOfItems < min || noOfItems > max);'],
    ['Console.WriteLine(noOfItems);', 'bad', 'Printing is not returning. The method promises an int back: return noOfItems;']] },
];

/* ---------- e4: the two calls ---------- */
export const E4_LINES = [
  { t: 'int noOfItems;', d: 0 }, { t: 'int min = 1;', d: 0 }, { t: 'int max = 20;', d: 0 }, { t: 'string telNo = "02830262000";', d: 0 }, { t: 'bool validTelNo;', d: 0 },
  { t: 'noOfItems = enter_No_Of_Items(min, max);', d: 0, ask: 'Call enter_No_Of_Items and store what it returns.',
    checks: [{ re: /^noofitems=enter_no_of_itemsmin,max$/, ok: true },
      { re: /^intnoofitems=enter_no_of_itemsmin,max$/, ok: true, say: 'Earns the mark — but noOfItems is already declared. C# will not declare it twice: leave the int off.' },
      { re: /^noofitems=enter_no_of_items1,20$/, ok: true, say: 'Works today — but min and max already hold the range. Pass the variables: if the range changes, the call does not need to.' },
      { re: /^noofitems=enter_no_of_itemsmax,min$/, say: 'Swapped. Arguments go to parameters by position: min first, then max. This asks for a number from 20 to 1 — and no number is.' },
      { re: /^enter_no_of_itemsmin,max$/, say: 'Called, but what it returns is not stored — the number is lost. Store it: noOfItems = …' },
      { re: /^noofitems=enter_no_of_itemsintmin,intmax$/, say: 'No types in a call. Types belong in the header; a call just passes the values.' },
      { re: /^noofitems=enter_no_of_items$/, say: 'No brackets — that names the method but does not call it. The brackets carry the arguments: (min, max).' },
      { re: /^enter_no_of_itemsmin,max=noofitems$/, say: 'Backwards. The variable that stores the result goes on the left of =.' },
      { re: /^noofitems==/, say: '== asks a question: are these equal? To store what the method hands back, use one = .' }] },
  { t: 'validTelNo = validTelephoneNo(telNo);', d: 0, ask: 'Call validTelephoneNo and store what it returns.',
    checks: [{ re: /^(bool)?validtelno=validtelephoneno\(["']telno["']\);?$/, on: 'T', say: 'The quotes make it the text "telNo" — five letters, not the phone number. Pass the variable: telNo, no quotes.' },
      { re: /^validtelno=validtelephonenotelno$/, ok: true },
      { re: /^boolvalidtelno=validtelephonenotelno$/, ok: true, say: 'Earns the mark — but validTelNo is already declared. Leave the bool off.' },
      { re: /^validtelno=validtelephoneno02830262000$/, say: 'That checks one fixed number. telNo holds whatever the user typed — pass the variable.' },
      { re: /^validtelno=validtelephonenostringtelno$/, say: 'No types in a call. Just the variable: validTelephoneNo(telNo).' },
      { re: /^validtelephonenotelno$/, say: 'Called, but the true or false it returns is not stored. Store it: validTelNo = …' },
      { re: /^validtelephonenotelno=validtelno$/, say: 'Backwards. The variable that stores the result goes on the left of =.' },
      { re: /^validtelno==/, say: '== asks a question: are these equal? To store what the method hands back, use one = .' }] },
];

const E4_METHODS = ITEMS_METHOD + '\n' + TEL_METHOD;
const E4_DECL = 'int noOfItems;\nint min = 1;\nint max = 20;\nstring telNo = "02830262000";\nbool validTelNo;\n';
const itemsMain = (line) => E4_DECL + line + '\nConsole.WriteLine($"noOfItems = {noOfItems}");';
const telMain = (line) => E4_DECL + line + '\nConsole.WriteLine($"validTelNo = {validTelNo}");';
const P120 = 'Enter the number of items (1 to 20): ';
const P201 = 'Enter the number of items (20 to 1): ';
const ERR201 = 'Error: enter a number from 20 to 1.\n';
// Does each line earn the mark? mark = the examiner's verdict; the program shows what C# does with it.
export const E4_VERDICTS = [
  { t: 'noOfItems = enter_No_Of_Items(min, max);', mark: true, why: 'Called with the two variables, in order, and stored. The method runs — here the user types 7.',
    ...fromEvents(E4_METHODS, itemsMain('noOfItems = enter_No_Of_Items(min, max);'), [['out', P120], ['in', '7'], ['out', 'noOfItems = 7\n']]) },
  { t: 'enter_No_Of_Items(min, max);', mark: false, why: 'The method runs, but the number it returns is thrown away — noOfItems never gets a value, so C# will not use it.',
    cs: { methods: E4_METHODS, main: itemsMain('enter_No_Of_Items(min, max);') }, expect: E(['CS0165', "Use of unassigned local variable 'noOfItems'"]) },
  { t: 'noOfItems = enter_No_Of_Items(max, min);', mark: false, why: 'Swapped: min gets 20 and max gets 1. It builds — and then no number is ever accepted. Entries 7, 15, 1:',
    ...loops(E4_METHODS, itemsMain('noOfItems = enter_No_Of_Items(max, min);'), [['out', P201], ['in', '7'], ['out', ERR201], ['out', P201], ['in', '15'], ['out', ERR201], ['out', P201], ['in', '1'], ['out', ERR201], ['sys', '…and it never stops: nothing is 20 or more AND 1 or less.']]) },
  { t: 'validTelNo = validTelephoneNo(telNo);', mark: true, why: 'The variable is passed, and the answer is stored.',
    ...fromEvents(E4_METHODS, telMain('validTelNo = validTelephoneNo(telNo);'), [['out', 'validTelNo = True\n']]) },
  { t: 'validTelNo = validTelephoneNo("telNo");', mark: false, why: 'It builds and runs — and says False. "telNo" in quotes is five letters of text, not the phone number.',
    ...fromEvents(E4_METHODS, telMain('validTelNo = validTelephoneNo("telNo");'), [['out', 'validTelNo = False\n']]) },
  { t: 'validTelNo = validTelephoneNo(string telNo);', mark: false, why: 'A type inside a call. Types belong in the header; the call passes the value.',
    cs: { methods: E4_METHODS, main: telMain('validTelNo = validTelephoneNo(string telNo);') },
    expect: E(['CS1525', "Invalid expression term 'string'"], ['CS1003', "Syntax error, ',' expected"]) },
  { t: 'noOfItems = enter_No_Of_Items;', mark: false, why: 'No brackets, so nothing is called. C# sees the name of a method where a number should be.',
    cs: { methods: E4_METHODS, main: itemsMain('noOfItems = enter_No_Of_Items;') },
    expect: E(['CS0428', "Cannot convert method group 'enter_No_Of_Items' to non-delegate type 'int'. Did you intend to invoke the method?"]) },
  { t: 'validTelephoneNo(telNo) = validTelNo;', mark: false, why: 'Backwards. A call is a value, and you cannot store something INTO a value: the variable goes on the left.',
    cs: { methods: E4_METHODS, main: telMain('validTelephoneNo(telNo) = validTelNo;') },
    expect: E(['CS0131', 'The left-hand side of an assignment must be a variable, property or indexer'], ['CS0165', "Use of unassigned local variable 'validTelNo'"]) },
  { t: 'noOfItems = enter_No_Of_Items(min, max)', mark: true, why: 'The examiner gives it: punctuation never costs a mark on the paper. C# is stricter — it wants the semicolon.',
    cs: { methods: E4_METHODS, main: itemsMain('noOfItems = enter_No_Of_Items(min, max)') }, expect: E(['CS1002', '; expected']) },
];

// Call any method: the header, the variables Main has, four lines. Every line is run for real.
const STUBS = {
  findCost: FIND_COST,
  isLeapYear: 'public static bool isLeapYear(int year)\n{\n    return (year % 4 == 0 && year % 100 != 0) || year % 400 == 0;\n}',
  displayMessage: 'public static void displayMessage(int row, int col, string message)\n{\n    Console.WriteLine($"Row {row}, column {col}: {message}");\n}',
  makeCode: 'public static string makeCode(string name, int year)\n{\n    return name.Substring(0, 3).ToUpper() + year;\n}',
  biggest: 'public static int biggest(int a, int b, int c)\n{\n    int big = a;\n    if (b > big)\n    {\n        big = b;\n    }\n    if (c > big)\n    {\n        big = c;\n    }\n    return big;\n}',
  average: 'public static double average(int total, int count)\n{\n    return (double)total / count;\n}',
};
function callItem(name, decl, print, task, opts) {
  const header = STUBS[name].split('\n')[0];
  return {
    title: name, header, decl: decl ? decl.split('\n') : [], q: task,
    options: opts.map((o) => o.line), a: 0, whys: opts.map((o) => o.why),
    progs: opts.map((o) => ({ cs: { methods: STUBS[name], main: (decl ? decl + '\n' : '') + o.line + (print ? '\n' + print : '') }, expect: o.expect })),
  };
}
export const E4_CALLS = [
  callItem('findCost', "char style = 'R';\nint size = 2;\ndouble cost;", 'Console.WriteLine($"cost = {cost:C}");', 'Which line works out the price of this shed and stores it?', [
    { line: 'cost = findCost(style, size);', why: 'Style first, then size — the order of the header — and the double it returns is stored.', expect: O('cost = £251.98\n') },
    { line: 'cost = findCost(size, style);', why: 'Swapped. Arguments go by position, and an int cannot go into the char parameter.', expect: E(['CS1503', "Argument 1: cannot convert from 'int' to 'char'"]) },
    { line: 'findCost(style, size) = cost;', why: 'Backwards: the variable that stores the answer goes on the LEFT of =.', expect: E(['CS0131', 'The left-hand side of an assignment must be a variable, property or indexer'], ['CS0165', "Use of unassigned local variable 'cost'"]) },
    { line: 'cost = findCost(char style, int size);', why: 'Types belong in the header. A call passes values only.', expect: E(['CS1525', "Invalid expression term 'char'"], ['CS1003', "Syntax error, ',' expected"], ['CS1525', "Invalid expression term 'int'"]) },
  ]),
  callItem('isLeapYear', 'int year = 2028;\nbool leap;', 'Console.WriteLine($"leap = {leap}");', 'Which line asks whether 2028 is a leap year and keeps the answer?', [
    { line: 'leap = isLeapYear(year);', why: 'The int goes in; the bool that comes back is stored in leap.', expect: O('leap = True\n') },
    { line: 'isLeapYear(year);', why: 'The answer comes back — and is thrown away. leap never gets a value.', expect: E(['CS0165', "Use of unassigned local variable 'leap'"]) },
    { line: 'leap = isLeapYear("year");', why: 'In quotes it is the text "year", not the number in the variable. The parameter wants an int.', expect: E(['CS1503', "Argument 1: cannot convert from 'string' to 'int'"]) },
    { line: 'bool = isLeapYear(year);', why: 'bool is a type, not a variable. Store the answer in leap.', expect: E(['CS1001', 'Identifier expected']) },
  ]),
  callItem('displayMessage', '', '', 'Which line shows "Welcome" at row 3, column 10?', [
    { line: 'displayMessage(3, 10, "Welcome");', why: 'void: nothing comes back, so nothing is stored. Row, then column, then the message — the header\'s order.', expect: O('Row 3, column 10: Welcome\n') },
    { line: 'string shown = displayMessage(3, 10, "Welcome");', why: 'displayMessage is void — there is nothing to store.', expect: E(['CS0029', "Cannot implicitly convert type 'void' to 'string'"]) },
    { line: 'displayMessage(3, 10, Welcome);', why: 'Without quotes, Welcome is read as the name of a variable — and there is none.', expect: E(['CS0103', "The name 'Welcome' does not exist in the current context"]) },
    { line: 'displayMessage("Welcome", 3, 10);', why: 'The order is the header\'s: row, col, message. The text cannot go into the int row.', expect: E(['CS1503', "Argument 1: cannot convert from 'string' to 'int'"], ['CS1503', "Argument 3: cannot convert from 'int' to 'string'"]) },
  ]),
  callItem('makeCode', 'string pupil = "Aoife";\nint born = 2011;\nstring code;', 'Console.WriteLine($"code = {code}");', 'Which line makes this pupil\'s code and keeps it?', [
    { line: 'code = makeCode(pupil, born);', why: 'Main\'s variables go in — their names do not have to match the parameters. The string that comes back is stored.', expect: O('code = AOI2011\n') },
    { line: 'code = makeCode(name, year);', why: 'name and year are the method\'s parameters — Main has no variables with those names. Pass Main\'s own: pupil and born.', expect: E(['CS0103', "The name 'name' does not exist in the current context"], ['CS0103', "The name 'year' does not exist in the current context"]) },
    { line: 'code = makeCode(born, pupil);', why: 'Swapped: by position, the int would go into the string parameter.', expect: E(['CS1503', "Argument 1: cannot convert from 'int' to 'string'"], ['CS1503', "Argument 2: cannot convert from 'string' to 'int'"]) },
    { line: 'makeCode(pupil, born) = code;', why: 'Backwards: the variable that stores the answer goes on the left of =.', expect: E(['CS0131', 'The left-hand side of an assignment must be a variable, property or indexer'], ['CS0165', "Use of unassigned local variable 'code'"]) },
  ]),
  callItem('biggest', 'int x = 4;\nint y = 9;\nint z = 2;\nint top;', 'Console.WriteLine($"top = {top}");', 'Which line finds the biggest of x, y and z and keeps it?', [
    { line: 'top = biggest(x, y, z);', why: 'Three parameters, three arguments, and the answer stored.', expect: O('top = 9\n') },
    { line: 'top = biggest(a, b, c);', why: 'a, b and c live inside the method. Main passes its own variables: x, y, z.', expect: E(['CS0103', "The name 'a' does not exist in the current context"], ['CS0103', "The name 'b' does not exist in the current context"], ['CS0103', "The name 'c' does not exist in the current context"]) },
    { line: 'top = biggest(x, y);', why: 'Three parameters need three arguments. There is nothing for c.', expect: E(['CS7036', "There is no argument given that corresponds to the required parameter 'c' of 'Program.biggest(int, int, int)'"]) },
    { line: 'biggest(x, y, z);', why: 'The answer comes back and is thrown away. top never gets a value.', expect: E(['CS0165', "Use of unassigned local variable 'top'"]) },
  ]),
  callItem('average', 'int marks = 156;\nint pupils = 12;\ndouble avg;', 'Console.WriteLine($"avg = {avg}");', 'Which line works out the average mark and keeps it?', [
    { line: 'avg = average(marks, pupils);', why: 'The total first, then the count — the header\'s order. 156 ÷ 12 = 13.', expect: O('avg = 13\n') },
    { line: 'avg = average(pupils, marks);', why: 'Swapped. Both are ints, so C# cannot tell — it runs and works out 12 ÷ 156. The order is YOUR job.', expect: O('avg = 0.07692307692307693\n') },
    { line: 'avg = average(marks / pupils);', why: 'One argument for two parameters. Pass the two values; the method does the dividing.', expect: E(['CS7036', "There is no argument given that corresponds to the required parameter 'count' of 'Program.average(int, int)'"]) },
    { line: 'average(marks, pupils);', why: 'Worked out, then thrown away. avg never gets a value.', expect: E(['CS0165', "Use of unassigned local variable 'avg'"]) },
  ]),
];

/* ---------- e5: Swap ---------- */
const SWAP = 'public static void Swap(int a, int b)\n{\n    int temp = a;\n    a = b;\n    b = temp;\n}';
const SWAP_REF_M = 'public static void Swap(ref int a, ref int b)\n{\n    int temp = a;\n    a = b;\n    b = temp;\n}';
const swapMain = (call) => `int x = 45;\nint y = 50;\n${call}\nConsole.WriteLine($"x = {x} and y = {y}");`;
export const SWAP_RUNS = [
  { note: 'The paper\'s program, run:', ev: [['out', 'x = 45 and y = 50\n']], cs: { methods: SWAP, main: swapMain('Swap(x, y);') }, expect: O('x = 45 and y = 50\n') },
  { note: 'With ref in the header and the call:', ev: [['out', 'x = 50 and y = 45\n']], cs: { methods: SWAP_REF_M, main: swapMain('Swap(ref x, ref y);') }, expect: O('x = 50 and y = 45\n') },
];
export const E5_CLOZE = {
  text: '(i) The arguments are passed by {value}: a and b are {copies} of x and y. The method swaps the copies, so the {originals} in Main are {unchanged} and it prints x = 45 and y = 50. (ii) Pass the arguments by {reference} instead, so the method works on x and y themselves. The keyword {ref} goes in front of each parameter in the header AND in front of each argument in the {call}.',
  extra: ['return', 'swapped', 'static', 'void'],
};
export const E5_SORT = [
  { t: 'a and b are copies of x and y — it is the copies that get swapped.', ok: true, why: '(i), first mark: passed by value.' },
  { t: 'x and y in Main still hold 45 and 50: the originals are unchanged.', ok: true, why: '(i), second mark.' },
  { t: 'Pass the arguments by reference instead.', ok: true, why: '(ii), first mark: the fix, named.' },
  { t: 'Header Swap(ref int a, ref int b), call Swap(ref x, ref y).', ok: true, why: '(ii), second mark: the example, with ref in both places.' },
  { t: 'The arguments are passed by value, so the method cannot change x and y.', ok: true, why: '(i): passing by value is the cause.' },
  { t: 'Swap needs to return a and b.', ok: false, why: 'A method returns ONE value. The fix the paper wants is passing by reference.' },
  { t: 'The three lines inside Swap are in the wrong order.', ok: false, why: 'temp = a; a = b; b = temp; swaps a and b perfectly. The trouble is that a and b are copies.' },
  { t: 'Swap is void, so it does nothing.', ok: false, why: 'void only means nothing is returned. Swap does swap — its own copies.' },
  { t: 'Put ref in the header: Swap(ref int a, ref int b).', ok: false, why: 'Half the fix. C# needs ref in the call as well — with ref in the header only, it will not build:',
    cs: { methods: SWAP_REF_M, main: swapMain('Swap(x, y);') }, expect: E(['CS1620', "Argument 1 must be passed with the 'ref' keyword"], ['CS1620', "Argument 2 must be passed with the 'ref' keyword"]) },
  { t: 'x and y are passed by reference, so the method cannot change them.', ok: false, why: 'Backwards: passing by VALUE is what stops the method changing them. By reference is the fix.' },
];

/* ---------- e6: where does it end? ---------- */
const GRADE = 'public static string Grade(int mark)\n{\n    if (mark >= 70)\n    {\n        return "A";\n    }\n    if (mark >= 50)\n    {\n        return "B";\n    }\n    Console.WriteLine("Below 50");\n    return "C";\n}';
const GREET = 'public static void Greet(string name)\n{\n    if (name == "")\n    {\n        Console.WriteLine("No name given.");\n        return;\n    }\n    Console.WriteLine($"Hello, {name}!");\n}';
const FIRST = 'public static int FirstOver(int limit)\n{\n    for (int n = 1; n <= 10; n++)\n    {\n        if (n * n > limit)\n        {\n            return n;\n        }\n    }\n    return 0;\n}';
const lastLine = (src, text) => src.split('\n').findIndex((l) => l.trim() === text);
const exit = (name, src, call, text, out, why) => ({ name, lines: src.split('\n'), call, answer: lastLine(src, text), why, ev: [['out', out]], cs: { methods: src, main: call }, expect: O(out) });
export const E6_EXITS = [
  exit('Grade', GRADE, 'Console.WriteLine(Grade(65));', 'return "B";', 'B\n', '65 is not 70 or more, so the first return is skipped. 65 >= 50 is true: return "B" ends the method at once. The WriteLine and return "C" never run.'),
  exit('Grade', GRADE, 'Console.WriteLine(Grade(20));', 'return "C";', 'Below 50\nC\n', 'Both ifs are false, so it carries on to the end: it prints Below 50, then return "C" sends C back to Main.'),
  exit('Greet', GREET, 'Greet("");', 'return;', 'No name given.\n', 'The name is empty, so it prints the message and return; ends the method there. A void method can use return on its own: it leaves without a value.'),
  exit('Greet', GREET, 'Greet("Niamh");', 'Console.WriteLine($"Hello, {name}!");', 'Hello, Niamh!\n', 'The if is false, so the return inside it never runs. The method ends when it reaches its last statement — the condition the question gives you.'),
  exit('FirstOver', FIRST, 'Console.WriteLine(FirstOver(20));', 'return n;', '5\n', '1, 4, 9 and 16 are not over 20; 5 × 5 = 25 is. return n ends the method at once — inside the if, inside the loop. The loop never reaches 6.'),
  exit('FirstOver', FIRST, 'Console.WriteLine(FirstOver(200));', 'return 0;', '0\n', 'No square up to 10 × 10 = 100 is over 200, so the loop runs out and return 0 runs.'),
];
export const E6_SORT = [
  { t: 'A return statement is reached.', ok: true, why: 'The condition — the first mark.' },
  { t: 'The method stops at once and hands its value back to the caller.', ok: true, why: 'The detail — the second mark.' },
  { t: 'return ends the method even inside a loop: the rest of the loop never runs.', ok: true, why: 'A detail: "at once" means at once.' },
  { t: 'The value after return must match the return type: an int method returns an int.', ok: true, why: 'A detail the scheme names.' },
  { t: 'When the method is called.', ok: false, why: 'Calling a method STARTS it.' },
  { t: 'When break is reached.', ok: false, why: 'break leaves a loop or a switch. The method carries on after it.' },
  { t: 'When the user presses Enter.', ok: false, why: 'Enter ends a ReadLine, not a method.' },
  { t: 'When Console.WriteLine runs.', ok: false, why: 'Printing does not end anything — the next line runs.' },
  { t: 'When the closing brace } of an if is reached.', ok: false, why: 'That only ends the if\'s block. The method carries on.' },
];

/* ---------- e7: findCost ---------- */
const costTrap = (t, from, why, expect) => ({ t, why, cs: { methods: swap(FIND_COST, from, t), main: PRICE_MAIN }, expect, ev: expect.msgs ? undefined : [['out', expect.out]] });
export const E7_TRAPS = [
  costTrap('double cost;', 'double cost = 0;', 'Declared but not started. If no case matches, cost would have no value — C# refuses to read it.', E(['CS0165', "Use of unassigned local variable 'cost'"])),
  costTrap('case "R":', "case 'R':", 'style is a char, so each case needs a char: single quotes. "R" in double quotes is a string.', E(['CS0029', "Cannot implicitly convert type 'string' to 'char'"])),
  costTrap('case R:', "case 'R':", 'Without quotes, R is read as the name of a variable — and there is none.', E(['CS0103', "The name 'R' does not exist in the current context"])),
  costTrap('if (size = 2)', 'if (size == 2)', 'One = stores 2 in size. A test needs two: ==.', E(['CS0029', "Cannot implicitly convert type 'int' to 'bool'"])),
  costTrap('cost = cost * 0.5;', 'cost = cost * 1.5;', '× 0.5 HALVES the price. 50% more is × 1.5. Every deluxe shed comes out cheaper than the standard one:',
    O(priceOut({ S1: '£144.00', S2: '£72.00', R1: '£167.99', R2: '£83.99', I1: '£258.00', I2: '£129.00', C1: '£419.99', C2: '£209.99' }))),
  costTrap('cost = cost + 50;', 'cost = cost * 1.5;', '+ 50 adds fifty pounds, not fifty per cent. It builds, and every deluxe price is wrong:',
    O(priceOut({ S1: '£144.00', S2: '£204.00', R1: '£167.99', R2: '£227.99', I1: '£258.00', I2: '£318.00', C1: '£419.99', C2: '£479.99' }))),
  costTrap('cost = cost * 0.2;', 'cost = cost * 1.2;', '× 0.2 leaves only the VAT — a fifth of the price. Adding 20% is × 1.2:',
    O(priceOut({ S1: '£24.00', S2: '£36.00', R1: '£28.00', R2: '£42.00', I1: '£43.00', I2: '£64.50', C1: '£70.00', C2: '£105.00' }))),
  costTrap('return;', 'return cost;', 'A double method must hand a value back: return cost;', E(['CS0126', "An object of a type convertible to 'double' is required"])),
  costTrap('switch (size)', 'switch (style)', 'The switch must look at the letter. size is 1 or 2, so no case ever matches and every shed costs nothing:',
    O(priceOut({ S1: '£0.00', S2: '£0.00', R1: '£0.00', R2: '£0.00', I1: '£0.00', I2: '£0.00', C1: '£0.00', C2: '£0.00' }))),
];
const shedQ = (style, size, right, wrong, why) => ({ q: `A ${size === 2 ? 'deluxe' : 'standard'} ${{ S: 'square', R: 'rectangle', I: 'igloo', C: 'castle' }[style]} shed: findCost('${style}', ${size}). What does it print, shown with :C?`,
  options: [right, ...wrong], a: 0, why, cs: { methods: FIND_COST, main: `Console.WriteLine($"{findCost('${style}', ${size}):C}");` }, expect: O(right + '\n') });
export const E7_PRICES = [
  shedQ('R', 2, '£251.98', ['£209.99', '£227.99', '£167.99'], '139.99 × 1.5 for deluxe, then × 1.2 for VAT = 251.982 → £251.98. Without the VAT it would be about £209.99; adding £50 instead of 50% gives £227.99; £167.99 is the standard price.'),
  shedQ('C', 1, '£419.99', ['£349.99', '£629.98', '£524.99'], 'Standard, so no × 1.5 — just the VAT: 349.99 × 1.2 = 419.988 → £419.99. £349.99 forgot the VAT; £629.98 is the deluxe castle.'),
  shedQ('S', 2, '£216.00', ['£180.00', '£144.00', '£204.00'], '120 × 1.5 = 180, then × 1.2 = 216. £180.00 forgot the VAT; £144.00 is the standard square; £204.00 added £50 instead of 50%.'),
  shedQ('I', 2, '£387.00', ['£322.50', '£258.00', '£318.00'], '215 × 1.5 = 322.50, then × 1.2 = 387. £322.50 forgot the VAT; £258.00 is the standard igloo; £318.00 added £50 instead of 50%.'),
  { q: 'Someone swaps the deluxe line and the VAT line: VAT first, then × 1.5. What happens to the prices?', options: ['Nothing — every price is the same', 'Every deluxe price goes up', 'Every deluxe price goes down', 'It will not build'], a: 0,
    why: 'Multiplying works in any order: 120 × 1.5 × 1.2 = 120 × 1.2 × 1.5 = 216. The scheme gives the marks either way.' },
];

/* ---------- e8: the shed Main ---------- */
const shedTrap = (t, from, why, expect, ev) => ({ t, why, cs: { methods: FIND_COST, main: swap(SHED_MAIN, from, t.trim()), stdin: ev ? stdin(ev) : 'Shed\nR\n3\n2\n' }, expect, ev });
const STYLE_P = 'Style (S, R, I or C): ', STYLE_E = 'Error: enter S, R, I or C.\n', SIZE_P = 'Size (1 standard, 2 deluxe): ';
const RUN_EV = (last) => [['out', STYLE_P], ['in', 'Shed'], ['out', STYLE_E], ['out', STYLE_P], ['in', 'R'], ['out', SIZE_P], ['in', '3'], ['out', 'Error: enter 1 or 2.\n'], ['out', SIZE_P], ['in', '2'], ['out', last]];
export const E8_TRAPS = [
  shedTrap("if (entry != 'S' && entry != 'R' && entry != 'I' && entry != 'C')", 'if (entry != "S" && entry != "R" && entry != "I" && entry != "C")',
    'entry is a string, so it is compared with strings: "S" in double quotes. \'S\' is a char.', E(['CS0019', "Operator '!=' cannot be applied to operands of type 'string' and 'char'"])),
  shedTrap('size = Console.ReadLine();', 'size = Convert.ToInt32(Console.ReadLine());', 'ReadLine hands back text, and size is an int: Convert.ToInt32 turns one into the other.', E(['CS0029', "Cannot implicitly convert type 'string' to 'int'"])),
  shedTrap('cost = findCost(size, style);', 'cost = findCost(style, size);', 'Swapped. findCost(char style, int size): the letter first. An int cannot go into the char parameter.', E(['CS1503', "Argument 1: cannot convert from 'int' to 'char'"])),
  shedTrap('findCost(style, size);', 'cost = findCost(style, size);', 'The price comes back — and is thrown away. cost never gets a value, so the last line cannot print it.', E(['CS0165', "Use of unassigned local variable 'cost'"])),
  { ...shedTrap('Console.WriteLine("Cost of shed: {cost:C}");', 'Console.WriteLine($"Cost of shed: {cost:C}");', 'No $ in front of the quotes, so the braces are just text. It prints them exactly as typed. Entries Shed, R, 3, 2:',
    O(stdoutOf(RUN_EV('Cost of shed: {cost:C}\n')))), ev: RUN_EV('Cost of shed: {cost:C}\n') },
  shedTrap('style = entry;', 'style = Convert.ToChar(entry);', 'entry is a string and style a char. Even "S" is text — Convert.ToChar turns it into the letter.', E(['CS0029', "Cannot implicitly convert type 'string' to 'char'"])),
  { ...loops(FIND_COST, swap(SHED_MAIN, '} while (entry != "S" && entry != "R" && entry != "I" && entry != "C");', '} while (entry != "S" || entry != "R" || entry != "I" || entry != "C");'),
    [['out', STYLE_P], ['in', 'Shed'], ['out', STYLE_E], ['out', STYLE_P], ['in', 'R'], ['out', STYLE_P], ['in', 'S'], ['out', STYLE_P], ['sys', '…and it never lets you past: every letter is "not S" OR "not R".']]),
    t: '} while (entry != "S" || entry != "R" || entry != "I" || entry != "C");', why: 'With ||, one true side is enough — and every entry is not S OR not R. R is not S, so round it goes. Entries Shed, R, S:' },
  { ...shedTrap('Console.WriteLine($"Cost of shed: {cost}");', 'Console.WriteLine($"Cost of shed: {cost:C}");', 'Without :C the double prints as it is — no £, and every digit. Entries Shed, R, 3, 2:',
    O(stdoutOf(RUN_EV('Cost of shed: 251.982\n')))), ev: RUN_EV('Cost of shed: 251.982\n') },
];

// e8 Be the User: missions on the real Main. met(r) / hint(r) read runShed's result.
const finished = (r) => r.done && !r.crashed;
export const E8_MISSIONS = [
  { title: 'Every error message', goals: ['Get the style error AND the size error.', 'Then let the program finish — no crash.'],
    met: (r) => finished(r) && r.log.badStyles.length > 0 && r.log.sizeErrs > 0,
    hint: (r) => (r.crashed ? 'It crashed, so it never finished. The size error comes from a NUMBER that is not 1 or 2.'
      : [!r.log.badStyles.length ? 'No style error yet: every style you typed was accepted.' : '', !r.log.sizeErrs ? 'No size error yet: try a whole number that is not 1 or 2.' : ''].filter(Boolean).join(' ')),
    show: ['Shed', 'S', '3', '1'],
    why: ['Each error message is printed by an if. The while round it then asks the SAME question again.', 'Two loops, one after the other: the size is only asked once the style is good.'] },
  { title: 'The dearest shed', goals: ['Make the program print the price of the most expensive shed the carpenter sells.'],
    met: (r) => finished(r) && r.style === 'C' && r.size === 2,
    hint: (r) => (r.crashed ? 'It crashed. This one needs a shed at the end.' : `That was ${PRICE_TEXT[r.style + r.size]}. Read the prices in findCost — and remember what size 2 does.`),
    show: ['C', '2'],
    why: ['The castle is the dearest style, and deluxe adds 50%: 349.99 × 1.5 × 1.2 = 629.982 → £629.98.'] },
  { title: 'Crash it', goals: ['Make the program crash.'],
    met: (r) => !!r.crashed,
    hint: () => 'It finished. A style is kept as text, so no letter can crash it. Where does the program CONVERT what you type?',
    show: ['S', 'two'],
    why: ['The size line is the only one that converts: Convert.ToInt32 cannot read "two" as a number, and the program stops.', 'The style cannot crash: entry stays a string until it is one of the four letters. That is the point of testing it as text first. (A try/catch for the size is Topic 10.)'] },
  { title: 'So close', goals: ['Get the style error for something that LOOKS like one of the four letters —', 'then finish with a shed.'],
    met: (r) => finished(r) && r.log.badStyles.some((s) => LETTERS.includes(s.trim().toUpperCase())),
    hint: (r) => (r.crashed ? 'It crashed. Finish with a shed this time.' : r.log.badStyles.length ? `Refused: ${r.log.badStyles.map((s) => `"${s}"`).join(', ')} — but none of those looks like S, R, I or C.` : 'Nothing was refused. Which almost-right letters does the test turn away?'),
    show: ['s', 'S', '1'],
    why: ['The test compares text exactly: "s" is not "S", and " S" with a space is not "S" either.', 'Convert.ToInt32 forgives spaces round a number. A string comparison forgives nothing.'] },
  { title: 'Sneaky size', goals: ['Get a deluxe shed —', 'without typing the size as just 2.'],
    met: (r) => finished(r) && r.size === 2 && r.log.sizeLine !== '2',
    hint: (r) => (r.crashed ? 'It crashed. Convert.ToInt32 must still be able to read it as a number.' : r.size !== 2 ? 'That was a standard shed. Deluxe is size 2.' : 'You typed 2 exactly. Which extra characters does Convert.ToInt32 let through?'),
    show: ['R', '+2'],
    why: ['Convert.ToInt32 ignores spaces at either end, one + in front, and zeros in front: +2, 02 and " 2" are all stored as 2.', 'The test checks the NUMBER, so the shed is deluxe.'] },
];
export const SHED_LINES = [...FIND_COST.split('\n'), '', ...SHED_MAIN_BOARD.map((r) => pad(r.d) + r.t)];
