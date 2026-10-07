// Zone C content — booklet sections 5, 6 and 7, deck Activities 6, 7, 8 and 9.
// Every program carries cs + expect; error messages are exactly what dotnet printed (verify/verify_all.py checks them).

const O = (out) => ({ out });
const E = (...msgs) => ({ errors: [...new Set(msgs.map((m) => m[0]))], msgs });

/* ---------- C1 Swap Trace ---------- */
export const SWAP = 'public static void Swap(int a, int b)\n{\n    int temp = a;\n    a = b;\n    b = temp;\n}';
export const SWAP_MAIN = (x, y) => `int x = ${x};\nint y = ${y};\nConsole.WriteLine($"Before: x = {x}, y = {y}");\nSwap(x, y);\nConsole.WriteLine($"After: x = {x}, y = {y}");`;
export const SWAP_CHECK = { cs: { methods: SWAP, main: SWAP_MAIN(12, 30) }, expect: O('Before: x = 12, y = 30\nAfter: x = 12, y = 30\n') };

// "Why do x and y not change?" — would the sentence earn the pass-by-value mark (Specimen Q2(c))?
export const EARN = [
  { t: 'The method receives a copy of the value, not the variable itself.', ok: true },
  { t: 'Changes to the parameters a and b do not affect the original variables x and y.', ok: true },
  { t: 'Swap only swaps copies, so the variables in Main are unchanged.', ok: true },
  { t: 'x and y are passed by value: a and b are copies, and the copies are thrown away when the method ends.', ok: true },
  { t: 'a gets a copy of 45 and b gets a copy of 50; swapping the copies leaves x and y alone.', ok: true },
  { t: 'The method is wrong.', ok: false, why: 'It names no reason. The body swaps a and b perfectly — the point is that they are copies.' },
  { t: 'Because temp is not needed.', ok: false, why: 'temp IS needed — without it, a = b would lose the first value. It is not why x and y stay the same.' },
  { t: 'Because x and y are swapped back at the end.', ok: false, why: 'Nothing swaps them back. They were never changed at all.' },
  { t: 'Because it is passed by reference.', ok: false, why: 'The opposite: it is passed by VALUE. ref would make the swap work.' },
  { t: 'Because Swap does not have a return type.', ok: false, why: 'Swap has a return type — void. And even a return would not change x and y unless Main stored it.' },
  { t: 'Pass by value.', ok: false, why: 'The right idea, but three words are not a sentence. Say what it MEANS: a copy is passed, so x and y are not changed.' },
];

// Copy or original? One program each; which value does the last line print?
export const COPY = [
  { title: 'Add one', q: 'What does the last line print?', options: ['5', '6', '1', 'It will not build'], a: 0,
    why: 'n receives a copy of 5. The copy becomes 6 and is thrown away when AddOne ends. score is still 5.',
    cs: { methods: 'public static void AddOne(int n)\n{\n    n = n + 1;\n}', main: 'int score = 5;\nAddOne(score);\nConsole.WriteLine(score);' }, expect: O('5\n') },
  { title: 'Add one — returned', q: 'What does the last line print?', options: ['6', '5', '1', 'It will not build'], a: 0,
    why: 'Way out 1: return the new value, and STORE it. score = AddOne(score); puts 6 back into score.',
    cs: { methods: 'public static int AddOne(int n)\n{\n    return n + 1;\n}', main: 'int score = 5;\nscore = AddOne(score);\nConsole.WriteLine(score);' }, expect: O('6\n') },
  { title: 'Returned, then thrown away', q: 'What does the last line print?', options: ['5', '6', 'It will not build', 'Nothing'], a: 0,
    why: 'AddOne hands back 6 — but the call stands on its own line, so the 6 is thrown away. x was never touched: 5.',
    cs: { methods: 'public static int AddOne(int n)\n{\n    return n + 1;\n}', main: 'int x = 5;\nAddOne(x);\nConsole.WriteLine(x);' }, expect: O('5\n') },
  { title: 'Add one — ref', q: 'What does the last line print?', options: ['6', '5', 'It will not build', '0'], a: 0,
    why: 'Way out 2: ref in the header AND the call. n is another name for score itself, so score becomes 6.',
    cs: { methods: 'public static void AddOne(ref int n)\n{\n    n = n + 1;\n}', main: 'int score = 5;\nAddOne(ref score);\nConsole.WriteLine(score);' }, expect: O('6\n') },
  { title: 'Same name, still a copy', q: 'What does the last line print?', options: ['1', '99', 'It will not build', '0'], a: 0,
    why: 'Same NAME, different variable. The x in Change is a parameter that receives a copy of 1. Setting it to 99 changes the copy only.',
    cs: { methods: 'public static void Change(int x)\n{\n    x = 99;\n}', main: 'int x = 1;\nChange(x);\nConsole.WriteLine(x);' }, expect: O('1\n') },
  { title: 'Two lines out', q: 'What does the program print, top to bottom?', options: ['0 then 3', '0 then 0', '3 then 3', '3 then 0'], a: 0,
    why: 'Inside Reset the copy n becomes 0 and is printed: 0. Back in Main, lives was never touched: 3.',
    cs: { methods: 'public static void Reset(int n)\n{\n    n = 0;\n    Console.WriteLine(n);\n}', main: 'int lives = 3;\nReset(lives);\nConsole.WriteLine(lives);' }, expect: O('0\n3\n') },
  { title: 'Text is copied too', q: 'What does the program print, top to bottom?', options: ['HELLO then hello', 'HELLO then HELLO', 'hello then hello', 'hello then HELLO'], a: 0,
    why: 's.ToUpper() makes a new string and s is changed to it — only the parameter. word in Main still holds "hello".',
    cs: { methods: 'public static void Shout(string s)\n{\n    s = s.ToUpper();\n    Console.WriteLine(s);\n}', main: 'string word = "hello";\nShout(word);\nConsole.WriteLine(word);' }, expect: O('HELLO\nhello\n') },
];

/* ---------- C2 Make the Swap Work — all 16 ref switch settings, as dotnet built them ---------- */
// mask bits: 1 = ref before int a (header), 2 = ref before int b (header), 4 = ref before x (call), 8 = ref before y (call)
const R1 = (n) => ['CS1620', `Argument ${n} must be passed with the 'ref' keyword`];
const R2 = (n) => ['CS1615', `Argument ${n} may not be passed with the 'ref' keyword`];
const AFTER = (x, y) => `Before: x = 45, y = 50\nAfter: x = ${x}, y = ${y}\n`;
const SWAP_RESULTS = {
  0: O(AFTER(45, 50)), 1: E(R1(1)), 2: E(R1(2)), 3: E(R1(1), R1(2)),
  4: E(R2(1)), 5: O(AFTER(50, 50)), 6: E(R2(1), R1(2)), 7: E(R1(2)),
  8: E(R2(2)), 9: E(R1(1), R2(2)), 10: O(AFTER(45, 45)), 11: E(R1(1)),
  12: E(R2(1), R2(2)), 13: E(R2(2)), 14: E(R2(1)), 15: O(AFTER(50, 45)),
};
export function swapCs(m) {
  const r = (bit) => (m & bit ? 'ref ' : '');
  return {
    methods: `public static void Swap(${r(1)}int a, ${r(2)}int b)\n{\n    int temp = a;\n    a = b;\n    b = temp;\n}`,
    main: `int x = 45;\nint y = 50;\nConsole.WriteLine($"Before: x = {x}, y = {y}");\nSwap(${r(4)}x, ${r(8)}y);\nConsole.WriteLine($"After: x = {x}, y = {y}");`,
  };
}
export const SWAPS = Array.from({ length: 16 }, (_, m) => ({ mask: m, cs: swapCs(m), expect: SWAP_RESULTS[m] }));

export const MISSIONS = [
  { title: 'Make the swap work', start: 0, target: 'After: x = 50, y = 45', want: (o) => o === AFTER(50, 45),
    intro: 'Switch ref on or off in the four places, then press Build and run. Goal: After: x = 50, y = 45.',
    solution: 15, why: 'ref in BOTH places, for BOTH variables: a becomes another name for x, b another name for y.' },
  { title: 'Both 50', start: 15, target: 'After: x = 50, y = 50', want: (o) => o === AFTER(50, 50),
    intro: 'A broken swap on purpose. Make x AND y both end as 50.',
    solution: 5, why: 'ref on a only (header and call). a = b puts 50 straight into x; b is a copy, so y keeps its 50.' },
  { title: 'Both 45', start: 0, target: 'After: x = 45, y = 45', want: (o) => o === AFTER(45, 45),
    intro: 'Now make x and y both end as 45.',
    solution: 10, why: 'ref on b only. b = temp puts 45 straight into y; a was a copy, so x keeps its 45.' },
  { title: 'Fix it without touching Main', start: 3, lockCall: true, target: 'It builds', want: (o) => o !== null,
    intro: 'This one will not build. The ref switches in Main are locked. Make it build.',
    solution: 0, why: 'ref in the header demands ref in the call. With the call locked, the only cure is to take ref out of the header — and then it is the swap trap again: it builds, but nothing swaps.' },
];

/* ---------- C3 Which Version Runs? ---------- */
export const SHOW = 'public static void Show(int n)\n{\n    Console.WriteLine("the int version");\n}\npublic static void Show(double d)\n{\n    Console.WriteLine("the double version");\n}\npublic static void Show(string s)\n{\n    Console.WriteLine("the string version");\n}';
export const SHOW_BOOKLET = { cs: { methods: SHOW, main: 'Show(3);\nShow(3.0);\nShow("3");\nShow(3 + 0.5);\nint n = 7;\nShow(n / 2);' },
  expect: O('the int version\nthe double version\nthe string version\nthe double version\nthe int version\n') };
const showCall = (call, k, why, res) => ({ call, k, why, cs: { methods: SHOW, main: 'int n = 7;\n' + call }, expect: res || O(`the ${k} version\n`) });
// k: 'int' | 'double' | 'string' | 'none' (will not build). n is 7 in every call.
export const SHOW_CALLS = [
  showCall('Show(3);', 'int', '3 is a whole number — an int.'),
  showCall('Show(3.0);', 'double', '3.0 has a decimal point, so it is a double — even though it is a whole number.'),
  showCall('Show("3");', 'string', 'In speech marks, "3" is text — a string.'),
  showCall('Show(3 + 0.5);', 'double', 'The sum is worked out first: 3.5, a double.'),
  showCall('Show(n / 2);', 'int', 'n is an int and 2 is an int, so n / 2 is an int: 3, not 3.5.'),
  showCall('Show(7 / 2.0);', 'double', '2.0 is a double, so 7 / 2.0 is a double: 3.5.'),
  showCall('Show(10 / 4);', 'int', 'int divided by int stays an int: 2.'),
  showCall('Show("3" + 4);', 'string', 'Text + a number joins them: "34", a string.'),
  showCall('Show(2.5 * 2);', 'double', '2.5 * 2 is 5.0 — a double, even though it looks whole.'),
  showCall('Show(n + 1);', 'int', 'int + int is an int: 8.'),
  showCall('Show(n / 2.0);', 'double', 'One double in the sum makes the answer a double: 3.5.'),
  showCall('Show(true);', 'none', 'No Show takes a bool. C# says: Argument 1: cannot convert from \'bool\' to \'int\'.', E(['CS1503', "Argument 1: cannot convert from 'bool' to 'int'"])),
  showCall('Show(3, 4);', 'none', 'Every Show has ONE parameter. C# says: No overload for method \'Show\' takes 2 arguments.', E(['CS1501', "No overload for method 'Show' takes 2 arguments"])),
  showCall('Show();', 'none', 'Every Show needs one argument. C# says: No overload for method \'Show\' takes 0 arguments.', E(['CS1501', "No overload for method 'Show' takes 0 arguments"])),
];

export const MULTIPLY = 'public static int Multiply(int a, int b)\n{\n    return a * b;\n}\n\npublic static double Multiply(double a, double b)\n{\n    return a * b;\n}';
// Activity 6, plus three more calls. v = version that runs; out = what WriteLine prints.
export const MULT_ROWS = [
  { call: 'Multiply(3, 4)', v: 'int', out: '12', why: 'int, int — the int version.' },
  { call: 'Multiply(2.5, 4.0)', v: 'double', out: '10', why: 'double, double. It hands back 10.0; printed without :F2, a double leaves off the .0.' },
  { call: 'Multiply(n, 2)', v: 'int', out: '12', why: 'n is an int, 2 is an int.' },
  { call: 'Multiply(n / 4, 5)', v: 'int', out: '5', why: 'The catch: 6 / 4 is an int division — 1, not 1.5. So int, int: 1 × 5 = 5.' },
  { call: 'Multiply(2, 4.0)', v: 'double', out: '8', why: 'One double argument: only the double version can take it. 2 is turned into 2.0.' },
  { call: 'Multiply(1.5, 2)', v: 'double', out: '3', why: '1.5 is a double, so the double version runs: 3.0, printed as 3.' },
  { call: 'Multiply(n / 4.0, 2)', v: 'double', out: '3', why: '6 / 4.0 is 1.5, a double. 1.5 × 2 = 3.0, printed as 3.' },
];
export const MULT_CHECK = { cs: { methods: MULTIPLY, main: 'int n = 6;\n' + MULT_ROWS.map((r) => `Console.WriteLine(${r.call});`).join('\n') }, expect: O(MULT_ROWS.map((r) => r.out).join('\n') + '\n') };

export const LARGER_INT = 'public static int Larger(int a, int b)\n{\n    if (a > b)\n    {\n        return a;\n    }\n    return b;\n}';
export const LARGER_DOUBLE = 'public static double Larger(double a, double b)\n{\n    if (a > b)\n    {\n        return a;\n    }\n    return b;\n}';
export const LARGER_ROWS = [
  { call: 'Larger(3, 7)', v: 'int', out: '7', why: 'int, int — the int version.' },
  { call: 'Larger(2.5, 4.0)', v: 'double', out: '4', why: 'double, double. It hands back 4.0, printed as 4.' },
  { call: 'Larger(9, 4.5)', v: 'double', out: '9', why: 'One double, so the double version: 9 becomes 9.0 and wins. Printed as 9.' },
  { call: 'Larger(7 / 2, 3)', v: 'int', out: '3', why: '7 / 2 is an int division: 3. Larger(3, 3) — a is not bigger than b, so it returns b: 3.' },
];
export const LARGER_CHECK = { cs: { methods: LARGER_INT + '\n' + LARGER_DOUBLE, main: LARGER_ROWS.map((r) => `Console.WriteLine(${r.call});`).join('\n') }, expect: O('7\n4\n9\n3\n') };
// Without the double version, Larger(2.5, 4.0) cannot run.
export const LARGER_ALONE = { cs: { methods: LARGER_INT, main: 'Console.WriteLine(Larger(2.5, 4.0));' },
  expect: E(['CS1503', "Argument 1: cannot convert from 'double' to 'int'"], ['CS1503', "Argument 2: cannot convert from 'double' to 'int'"]) };

// Can they live together? Two methods in the same program.
const pair = (a, b, ok, why) => ({ a, b, ok, why, cs: { methods: a + '\n' + b, main: 'Console.WriteLine("built");' },
  expect: ok ? O('built\n') : E(['CS0111', `Type 'Program' already defines a member called '${/ (\w+)\(/.exec(a)[1]}' with the same parameter types`]) });
export const PAIRS = [
  pair('public static int Get()\n{\n    return 1;\n}', 'public static double Get()\n{\n    return 1.5;\n}', false, 'They differ only in return type. A call Get() could mean either.'),
  pair('public static void Show(int n)\n{\n}', 'public static void Show(double d)\n{\n}', true, 'Different parameter TYPES: int and double.'),
  pair('public static void Show(int n)\n{\n}', 'public static void Show(int m)\n{\n}', false, 'Only the parameter NAME differs. Both take one int — a call Show(4) could mean either.'),
  pair('public static int Add(int a, int b)\n{\n    return a + b;\n}', 'public static int Add(int a, int b, int c)\n{\n    return a + b + c;\n}', true, 'A different NUMBER of parameters: two and three.'),
  pair('public static void Describe(string s, int n)\n{\n}', 'public static void Describe(int n, string s)\n{\n}', true, 'The types come in a different ORDER: (string, int) and (int, string). That is a different list.'),
  pair('public static double Area(double w, double h)\n{\n    return w * h;\n}', 'public static int Area(double w, double h)\n{\n    return 0;\n}', false, 'Same parameter list; only the return type differs. Not enough.'),
  pair('public static void Greet(string name)\n{\n}', 'public static void Greet()\n{\n}', true, 'One parameter and none — a different number.'),
  pair('public static void Print(int a)\n{\n}', 'public static int Print(int b)\n{\n    return b;\n}', false, 'One int each. The different name and return type do not count.'),
  pair('public static void Box(string s)\n{\n}', 'public static void Box(char c)\n{\n}', true, 'string and char are different types.'),
  pair('public static double Total(double a, double b)\n{\n    return a + b;\n}', 'public static double Total(double x, double y)\n{\n    return x + y;\n}', false, 'Two doubles each. New names, same list.'),
];

/* ---------- C4 Will It Build? ---------- */
// Each case: methods + main, then options as [text, verdict] — 'b' builds, 'n' will not build. Option 0 is right.
// A wrong option with the right verdict still earns 1 of 2.
const SQ = 'public static int Square(int n)\n{\n    return n * n;\n}';
const GR = 'public static void Greet(string name)\n{\n    Console.WriteLine($"Hello, {name}!");\n}';
const BAN = 'public static void ShowBanner()\n{\n    Console.WriteLine("*** OLS ***");\n}';
const c = (methods, main, options, why, expect) => ({ cs: { methods, main }, options, why, expect });
const B = (t) => [t, 'b'], N = (t) => [t, 'n'];
export const BUILD = [
  c(SQ, 'int s = Square(4);\nConsole.WriteLine(s);',
    [B('It builds and prints 16'), B('It builds and prints 4'), N('It will not build: s and n are different names'), N('It will not build: the call needs the word int in it')],
    'An int comes back and goes into an int. The names s and n have nothing to do with each other.', O('16\n')),
  c('public static Square(int n)\n{\n    return n * n;\n}', 'int s = Square(4);\nConsole.WriteLine(s);',
    [N('It will not build: the header has no return type'), N('It will not build: static is missing'), B('It builds and prints 16'), N('It will not build: Square should be void')],
    'Every method says what it hands back. The cure: public static int Square(int n). Fix the first error and the second goes with it.',
    E(['CS1520', 'Method must have a return type'], ['CS0107', 'More than one protection modifier'])),
  c('public int Square(int n)\n{\n    return n * n;\n}', 'int s = Square(4);\nConsole.WriteLine(s);',
    [N('It will not build: static is missing'), B('It builds and prints 16'), N('It will not build: the header has no return type'), N('It will not build: public must come after int')],
    'Leave out static and C# says "An object reference is required". The cure: put static back.',
    E(['CS0120', "An object reference is required for the non-static field, method, or property 'Program.Square(int)'"])),
  c(GR, 'Greet();',
    [N('It will not build: Greet needs a string and the call gives nothing'), B('It builds and prints Hello, !'), B('It builds and prints Hello, name!'), N('It will not build: a void method cannot be called')],
    'The header promises a string parameter. The call has to keep the promise: Greet("Ana");',
    E(['CS7036', "There is no argument given that corresponds to the required parameter 'name' of 'Program.Greet(string)'"])),
  c('public static double Half(int n)\n{\n    return n / 2.0;\n}', 'int h = Half(7);\nConsole.WriteLine(h);',
    [N('It will not build: Half hands back a double, and a double will not go into an int'), B('It builds and prints 3'), B('It builds and prints 3.5'), N('It will not build: Half needs a double argument, not 7')],
    'A double could have a fraction an int cannot hold, so C# refuses. The cure: double h = Half(7);',
    E(['CS0266', "Cannot implicitly convert type 'double' to 'int'. An explicit conversion exists (are you missing a cast?)"])),
  c('public static double Half(int n)\n{\n    return n / 2.0;\n}', 'double h = Half(7);\nConsole.WriteLine(h);',
    [B('It builds and prints 3.5'), B('It builds and prints 3'), N('It will not build: 7 is not a double'), N('It will not build: a double method needs a double parameter')],
    'The parameter is an int, so 7 is fine. n / 2.0 is a double division: 3.5, which goes into a double.', O('3.5\n')),
  c(BAN, 'ShowBanner;',
    [N('It will not build: a call needs its round brackets, even when they are empty'), B('It builds and prints *** OLS ***'), B('It builds but prints nothing'), N('It will not build: ShowBanner needs an argument')],
    'No brackets, no call. The cure: ShowBanner();',
    E(['CS0201', 'Only assignment, call, increment, decrement, await, and new object expressions can be used as a statement'])),
  c(BAN, 'showBanner();',
    [N('It will not build: C# cares about capitals — there is no method called showBanner'), B('It builds and prints *** OLS ***'), N('It will not build: ShowBanner needs an argument'), N('It will not build: a void method cannot be called')],
    'S and s are different letters to C#. The cure: ShowBanner();',
    E(['CS0103', "The name 'showBanner' does not exist in the current context"])),
  c('public static void ShowSquare(int n)\n{\n    Console.WriteLine(n * n);\n}', 'int t = ShowSquare(4);',
    [N('It will not build: ShowSquare is void — it hands nothing back to put in t'), B('It builds and prints 16'), B('It builds, and t holds 16'), N('It will not build: 4 is not a valid argument')],
    'void means nothing comes back. A job is called on its own: ShowSquare(4);',
    E(['CS0029', "Cannot implicitly convert type 'void' to 'int'"])),
  c('public static int Cube(int n);\n{\n    return n * n * n;\n}', 'Console.WriteLine(Cube(3));',
    [N('It will not build: the semicolon after the header cuts it off from its body'), B('It builds and prints 27'), N('It will not build: n * n * n needs brackets'), B('It builds and prints 9')],
    'No semicolon after a header. The first error points at the { that has lost its header.',
    E(['CS1519', "Invalid token '{' in a member declaration"], ['CS1003', "Syntax error, ',' expected"], ['CS1002', '; expected'], ['CS1519', "Invalid token ';' in a member declaration"], ['CS1519', "Invalid token '}' in a member declaration"])),
  c('public static void Label(string item, int count)\n{\n    Console.WriteLine($"{count} x {item}");\n}', 'Label(7, "rubbers");',
    [N('It will not build: the arguments are in the wrong order for the parameters'), B('It builds and prints 7 x rubbers'), B('It builds and prints rubbers x 7'), N('It will not build: Label needs three arguments')],
    'Arguments go in by position: 7 would go into item, a string. The cure: Label("rubbers", 7);',
    E(['CS1503', "Argument 1: cannot convert from 'int' to 'string'"], ['CS1503', "Argument 2: cannot convert from 'string' to 'int'"])),
  c('public static string Sign(int n)\n{\n    if (n < 0)\n    {\n        return "negative";\n    }\n}', 'Console.WriteLine(Sign(-3));',
    [N('It will not build: when n is not below 0, Sign reaches its end without handing anything back'), B('It builds and prints negative'), N('It will not build: a string method cannot contain an if'), N('It will not build: -3 is not an int')],
    'Every path through a method that returns a value must end in a return. The cure: return "zero or positive"; before the last }.',
    E(['CS0161', "'Program.Sign(int)': not all code paths return a value"])),
  c('public static int Square(int n)\n{\n    int n = 5;\n    return n * n;\n}', 'Console.WriteLine(Square(4));',
    [N('It will not build: n already exists — the parameter is a variable'), B('It builds and prints 25'), B('It builds and prints 16'), N('It will not build: Square must return n, not n * n')],
    'A parameter is a variable that already has its value. Declaring it again inside the body is refused.',
    E(['CS0136', "A local or parameter named 'n' cannot be declared in this scope because that name is used in an enclosing local scope to define a local or parameter"])),
  c(SQ, 'Console.WriteLine(Square(Square(2)));',
    [B('It builds and prints 16'), B('It builds and prints 4'), N('It will not build: a call cannot go inside a call'), B('It builds and prints 8')],
    'The inner call runs first: Square(2) is 4. Then Square(4) is 16.', O('16\n')),
  c(SQ, 'double d = Square(3);\nConsole.WriteLine(d);',
    [B('It builds and prints 9'), N('It will not build: an int will not go into a double'), B('It builds and prints 9.0'), N('It will not build: Square hands back an int')],
    'An int fits safely into a double — nothing can be lost. Printed without :F2, the double 9 shows as 9.', O('9\n')),
  c(SQ, 'string s = Square(3);',
    [N('It will not build: an int will not go into a string'), B('It builds, and s holds "9"'), B('It builds and prints 9'), N('It will not build: 3 must be in speech marks')],
    'A number is not text. The types have to match.',
    E(['CS0029', "Cannot implicitly convert type 'int' to 'string'"])),
  c(GR, 'Greet("Ana", 17);',
    [N('It will not build: Greet has one parameter and the call gives two arguments'), B('It builds and prints Hello, Ana!'), B('It builds and prints Hello, Ana 17!'), N('It will not build: 17 must be a string')],
    'One parameter, one argument. The extra 17 has nowhere to go.',
    E(['CS1501', "No overload for method 'Greet' takes 2 arguments"])),
  c('public static int AddOne(int n)\n{\n    return n + 1;\n}', 'int x = 5;\nAddOne(x);\nConsole.WriteLine(x);',
    [B('It builds and prints 5'), B('It builds and prints 6'), N('It will not build: the value AddOne hands back must be stored'), N('It will not build: x is not a parameter')],
    'A call that returns a value can stand on its own line — the value is simply thrown away. x was never changed: 5.', O('5\n')),
  c('public static void Swap(ref int a, ref int b)\n{\n    int temp = a;\n    a = b;\n    b = temp;\n}', 'int x = 1;\nint y = 2;\nSwap(x, y);',
    [N('It will not build: ref is in the header, so the call needs ref too'), B('It builds and swaps x and y'), B('It builds but x and y do not change'), N('It will not build: Swap is void')],
    'ref goes in BOTH places. The cure: Swap(ref x, ref y);',
    E(['CS1620', "Argument 1 must be passed with the 'ref' keyword"], ['CS1620', "Argument 2 must be passed with the 'ref' keyword"])),
  c('public static void Twice(int n)\n{\n    return n * 2;\n}', 'Twice(4);',
    [N('It will not build: a void method cannot hand a value back'), B('It builds and prints 8'), B('It builds and prints nothing'), N('It will not build: Twice(4) must be stored in a variable')],
    'void promises nothing comes back. Either print it — Console.WriteLine(n * 2); — or change void to int.',
    E(['CS0127', "Since 'Program.Twice(int)' returns void, a return keyword must not be followed by an object expression"])),
  c('public static int Square(int n)\n{\n    int s = n * n;\n}', 'Console.WriteLine(Square(4));',
    [N('It will not build: Square promises an int but never returns one'), B('It builds and prints 16'), B('It builds and prints 0'), N('It will not build: s is never declared')],
    'Working out s is not handing it back. The cure: return s; at the end of the body.',
    E(['CS0161', "'Program.Square(int)': not all code paths return a value"])),
  c(SQ, 'Console.WriteLine(Square(2.5));',
    [N('It will not build: 2.5 is a double, and the parameter n is an int'), B('It builds and prints 6.25'), B('It builds and prints 4'), N('It will not build: Square must be called with a variable')],
    'A double will not go into an int parameter — C# will not drop the .5 for you.',
    E(['CS1503', "Argument 1: cannot convert from 'double' to 'int'"])),
  c('public static bool IsAdult(int age)\n{\n    return age >= 18;\n}', 'if (IsAdult(17))\n{\n    Console.WriteLine("adult");\n}\nelse\n{\n    Console.WriteLine("not yet");\n}',
    [B('It builds and prints not yet'), B('It builds and prints adult'), N('It will not build: a call cannot go inside an if'), N('It will not build: bool is not a C# type')],
    'IsAdult(17) becomes false, so the else runs. A bool method fits straight into an if.', O('not yet\n')),
  c('public static int Check(int n)\n{\n    return n;\n    Console.WriteLine("done");\n}', 'Console.WriteLine(Check(4));',
    [B('It builds and prints 4 — the line after return never runs'), B('It builds and prints 4, then done'), N('It will not build: nothing may come after return'), N('It will not build: Check has no return')],
    'return ends the method there and then. The line after it can never run, but C# still builds it.', O('4\n')),
  c('public static void Initial(char c)\n{\n    Console.WriteLine(c);\n}', 'Initial("A");',
    [N('It will not build: "A" in double quotes is a string; a char needs single quotes'), B('It builds and prints A'), N('It will not build: Initial must be called with a variable'), N('It will not build: a char method must return a char')],
    'One letter in single quotes is a char: Initial(\'A\'); Double quotes make a string, even for one letter.',
    E(['CS1503', "Argument 1: cannot convert from 'string' to 'char'"])),
  c('public static void Twice(int n)\n{\n    Console.WriteLine(n * 2);\n}', 'Console.WriteLine(Twice(4));',
    [N('It will not build: Twice is void, so there is nothing to print'), B('It builds and prints 8'), B('It builds and prints 8 twice'), N('It will not build: WriteLine cannot hold a call')],
    'Twice hands nothing back, so WriteLine has nothing to print. The message names bool because WriteLine tries its versions in turn — the real fault is void. The cure: Twice(4); on its own.',
    E(['CS1503', "Argument 1: cannot convert from 'void' to 'bool'"])),
  c('public static int Add(int a, b)\n{\n    return a + b;\n}', 'Console.WriteLine(Add(2, 3));',
    [N('It will not build: every parameter needs its own type'), B('It builds and prints 5'), N('It will not build: Add should be void'), B('It builds and prints 23')],
    'Each parameter is a type AND a name: (int a, int b).', E(['CS1001', 'Identifier expected'])),
  c(GR, 'Greet("Ana");\nConsole.WriteLine(name);',
    [N('It will not build: name only exists inside Greet'), B('It builds and prints Hello, Ana! then Ana'), B('It builds and prints Hello, Ana! then name'), N('It will not build: Greet needs ref')],
    'A parameter belongs to its method. Main cannot see it.', E(['CS0103', "The name 'name' does not exist in the current context"])),
  c('public static int Half(int n)\n{\n    return n / 2;\n}', 'Console.WriteLine(Half(7));',
    [B('It builds and prints 3'), B('It builds and prints 3.5'), N('It will not build: 7 / 2 is not a whole number'), B('It builds and prints 4')],
    'int divided by int stays an int: the .5 is dropped, not rounded. 3.', O('3\n')),
];
