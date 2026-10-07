// Zone B content — booklet sections 3 and 4, deck Activities 2, 3, 4, 5 and 10.
// Every program carries cs + expect so verify/verify_all.py can build and run it with dotnet.

export const M = {
  Greet: 'public static void Greet(string name)\n{\n    Console.WriteLine($"Hello, {name}!");\n}',
  ShowAge: 'public static void ShowAge(string name, int age)\n{\n    Console.WriteLine($"{name} is {age}");\n}',
  Square: 'public static int Square(int n)\n{\n    return n * n;\n}',
  ShowSquare: 'public static void ShowSquare(int n)\n{\n    Console.WriteLine(n * n);\n}',
  Sign: 'public static string Sign(int n)\n{\n    if (n < 0)\n    {\n        return "negative";\n    }\n    return "zero or positive";\n}',
  Label: 'public static void Label(string item, int count)\n{\n    Console.WriteLine($"{count} x {item}");\n}',
  Twice: 'public static void Twice(int n)\n{\n    Console.WriteLine(n * 2);\n}',
  HalfInt: 'public static int Half(int n)\n{\n    return n / 2;\n}',
  Line: 'public static void Line(string text, int n)\n{\n    Console.WriteLine($"{n}: {text}");\n}',
  Add: 'public static int Add(int a, int b)\n{\n    return a + b;\n}',
  HalfDouble: 'public static double Half(double x)\n{\n    return x / 2;\n}',
  AverageOf: 'public static double AverageOf(double a, double b, double c)\n{\n    return (a + b + c) / 3;\n}',
  Check: 'public static int Check(int n)\n{\n    if (n > 10)\n    {\n        return 1;\n    }\n    Console.WriteLine("small");\n    return 0;\n}',
  FindCost: 'public static double findCost(char style, int size)\n{\n    return 0;\n}',
  Items: 'public static int enter_No_Of_Items(int min, int max)\n{\n    return min;\n}',
};
const join = (...k) => k.map((x) => M[x]).join('\n\n');

/* ---------- B1: argument or parameter ---------- */
// Each item: the line, the highlighted text in it (first match), and 'a' (argument) or 'p' (parameter).
export const SPOT = [
  { line: 'public static void Greet(string name)', hl: 'name', k: 'p', why: '`name` is in the HEADER — it is the parameter that receives a value.' },
  { line: 'Greet("Aoife");', hl: '"Aoife"', k: 'a', why: '`"Aoife"` is in the CALL — it is the argument handed over.' },
  { line: 'Greet(pupil);', hl: 'pupil', k: 'a', why: 'A variable in a CALL is still an argument. Its value, "Niamh", is what is handed over.' },
  { line: 'public static void ShowAge(string name, int age)', hl: 'age', k: 'p', why: '`age` is in the header with its type, int — a parameter.' },
  { line: 'ShowAge("Niamh", years + 1);', hl: 'years + 1', k: 'a', why: 'A sum in a call is an argument. It is worked out first: 16 + 1 = 17 goes in.' },
  { line: 'public static int Square(int n)', hl: 'n', k: 'p', why: '`n` sits in the header after its type — the parameter.' },
  { line: 'int a = Square(4);', hl: '4', k: 'a', why: '`4` is the value in the call — the argument.' },
  { line: 'public static double findCost(char style, int size)', hl: 'size', k: 'p', why: '2015 Q2(b): `size` is a parameter — a type and a name, in the header.' },
  { line: 'cost = findCost(style, size);', hl: 'style', k: 'a', why: 'Same word as the parameter — but this is a CALL, so `style` here is an argument.' },
  { line: 'public static int enter_No_Of_Items(int min, int max)', hl: 'max', k: 'p', why: '2014 Q2(b): `max` is the second parameter of enter_No_Of_Items.' },
  { line: 'noOfItems = enter_No_Of_Items(min, max);', hl: 'min', k: 'a', why: 'In the call, `min` is an argument: its value, 1, is handed to the parameter min.' },
  { line: 'public static string GradeLevel(int mark)', hl: 'mark', k: 'p', why: '2022 Q1: `mark` is the parameter. "Identify the parameter" means the name in the header.' },
  { line: 'Label("pencils", n + 2);', hl: '"pencils"', k: 'a', why: 'A value in a call — an argument. It goes into the parameter item.' },
  { line: 'public static void Label(string item, int count)', hl: 'item', k: 'p', why: '`item` is in the header — a parameter.' },
  { line: 'Line("half found", Add(sum, 2));', hl: 'Add(sum, 2)', k: 'a', why: 'A call inside a call is an argument too. Add runs first; its answer, 15, goes into n.' },
  { line: 'public static double Half(double x)', hl: 'x', k: 'p', why: '`x` is in the header — the parameter.' },
  { line: 'Console.WriteLine(Half(h));', hl: 'h', k: 'a', why: '`h` is in the call to Half — an argument. Its value, 4.5, goes into x.' },
  { line: 'public static void Twice(int n)', hl: 'n', k: 'p', why: 'A name with its type, in a header — a parameter.' },
];

// "Which parameter receives it?" — matched by POSITION, never by name.
export const RECEIVE = [
  { code: [M.ShowAge, '', 'ShowAge("Aoife", 17);'], q: 'Which parameter receives `17`?', options: ['age', 'name', 'neither'], a: 0,
    why: 'Second argument, second parameter: 17 goes into age.' },
  { code: [M.Label, '', 'int n = 4;', 'Label("pencils", n + 2);'], q: 'What value does `count` receive?', options: ['6', '4', 'n + 2', '"pencils"'], a: 0,
    why: 'The argument is worked out first: n + 2 is 6. The VALUE 6 is handed over.' },
  { code: [M.ShowAge, '', 'string age = "Aoife";', 'int name = 17;', 'ShowAge(age, name);'], q: 'Which parameter receives the value of the variable `name`?', options: ['age', 'name', 'neither — it will not build'], a: 0,
    why: 'By position, never by name. `name` is the SECOND argument, so its value, 17, goes into the second parameter, age. It prints Aoife is 17.',
    cs: { methods: M.ShowAge, main: 'string age = "Aoife";\nint name = 17;\nShowAge(age, name);' }, expect: { out: 'Aoife is 17\n' } },
  { code: [M.Add, '', 'int b = 2;', 'int a = 9;', 'int s = Add(b, a);'], q: 'Which parameter receives `9`?', options: ['b', 'a', 'neither'], a: 0,
    why: '9 is in the variable a, and a is the SECOND argument — so 9 goes into the second parameter, b. Names in Main and names in the header have nothing to do with each other.',
    cs: { methods: M.Add, main: 'int b = 2;\nint a = 9;\nint s = Add(b, a);\nConsole.WriteLine(s);' }, expect: { out: '11\n' } },
  { code: ['public static double findCost(char style, int size)', '', "cost = findCost('C', 2);"], q: 'Which parameter receives `2`?', options: ['size', 'style', 'cost'], a: 0,
    why: "Second argument into the second parameter: 2 goes into size. 'C' goes into style." },
  { code: [M.Label, '', 'Label(7, "rubbers");'], q: 'Which parameter receives `7`?', options: ['neither — it will not build', 'count', 'item'], a: 0,
    why: 'By position, 7 would go into item — a string. The types do not match, so C# refuses: CS1503 "Argument 1: cannot convert from \'int\' to \'string\'". It never runs.',
    cs: { methods: M.Label, main: 'Label(7, "rubbers");' }, expect: { errors: ['CS1503'] } },
  { code: [M.Line, '', M.Add, '', 'int sum = 13;', 'Line("half found", Add(sum, 2));'], q: 'What value does `n` in Line receive?', options: ['15', '13', '2', 'Add(sum, 2)'], a: 0,
    why: 'Add runs first: 13 + 2 is 15. That value is the second argument, so 15 goes into n. It prints 15: half found.',
    cs: { methods: join('Line', 'Add'), main: 'int sum = 13;\nLine("half found", Add(sum, 2));' }, expect: { out: '15: half found\n' } },
  { code: ['public static int enter_No_Of_Items(int min, int max)', '', 'int low = 1;', 'int high = 20;', 'noOfItems = enter_No_Of_Items(low, high);'], q: 'Which parameter receives `20`?', options: ['max', 'min', 'high'], a: 0,
    why: 'high is the second argument, so its value, 20, goes into the second parameter, max. high is not a parameter — it lives in Main.' },
  { code: [M.ShowAge, '', 'int years = 16;', 'ShowAge("Niamh", years + 1);'], q: 'What does this call print?', options: ['Niamh is 17', 'Niamh is 16', 'Niamh is years + 1', 'It will not build'], a: 0,
    why: 'years + 1 is worked out first — 17 — and handed to age.',
    cs: { methods: M.ShowAge, main: 'int years = 16;\nShowAge("Niamh", years + 1);' }, expect: { out: 'Niamh is 17\n' } },
];

/* ---------- B2: header builder ---------- */
// want: [returnType, name, [paramTypes]]
export const HEADERS = [
  { d: 'PrintStars is given a whole number and prints that many stars. It hands nothing back.', want: ['void', 'PrintStars', ['int']], model: 'public static void PrintStars(int count)', src: 'Activity 3(a)' },
  { d: 'Cube is given a whole number and hands back its cube, a whole number.', want: ['int', 'Cube', ['int']], model: 'public static int Cube(int n)', src: 'Activity 3(b)' },
  { d: 'Discount is given a price (with pence) and a percentage (a whole number) and hands back the reduced price, with pence.', want: ['double', 'Discount', ['double', 'int']], model: 'public static double Discount(double price, int percent)', src: 'Activity 3(c)' },
  { d: 'AverageOf is given three numbers with pence and hands back their mean.', want: ['double', 'AverageOf', ['double', 'double', 'double']], model: 'public static double AverageOf(double a, double b, double c)', src: 'Activity 5' },
  { d: 'ShowAge is given a name and an age (a whole number) and prints them on one line. It hands nothing back.', want: ['void', 'ShowAge', ['string', 'int']], model: 'public static void ShowAge(string name, int age)', src: 'Section 3' },
  { d: 'Initial is given a pupil\'s name and hands back the first letter of it — one single letter.', want: ['char', 'Initial', ['string']], model: 'public static char Initial(string name)', src: 'new' },
];
export const EXAM_HEADERS = [
  { d: 'findCost is given the style of a shed as one letter (S, R, I or C) and the size as a whole number (1 or 2). It hands back the cost, with pence.', want: ['double', 'findCost', ['char', 'int']], model: 'public static double findCost(char style, int size)', src: '2015 Q2(b)' },
  { d: 'enter_No_Of_Items is given the smallest and the largest number of items allowed, both whole numbers. It hands back the number of items the user typed.', want: ['int', 'enter_No_Of_Items', ['int', 'int']], model: 'public static int enter_No_Of_Items(int min, int max)', src: '2014 Q2(b)' },
  { d: 'validTelephoneNo is given a phone number as text and hands back true if it is valid and false if not.', want: ['bool', 'validTelephoneNo', ['string']], model: 'public static bool validTelephoneNo(string telNo)', src: '2014 Q2(d)' },
  { d: 'GradeLevel is given a mark (a whole number) and hands back the grade as text, such as "Merit".', want: ['string', 'GradeLevel', ['int']], model: 'public static string GradeLevel(int mark)', src: '2022 Q1' },
];
// Every model header must build with a body that returns the right type.
export const HEADER_CHECK = {
  cs: {
    methods: [
      'public static void PrintStars(int count) { }',
      'public static int Cube(int n) { return n * n * n; }',
      'public static double Discount(double price, int percent) { return price - price * percent / 100; }',
      'public static double AverageOf(double a, double b, double c) { return (a + b + c) / 3; }',
      'public static void ShowAge(string name, int age) { }',
      'public static char Initial(string name) { return name[0]; }',
      'public static double findCost(char style, int size) { return 0; }',
      'public static int enter_No_Of_Items(int min, int max) { return min; }',
      'public static bool validTelephoneNo(string telNo) { return true; }',
      'public static string GradeLevel(int mark) { return "Merit"; }',
    ].join('\n'),
    main: 'Console.WriteLine(Cube(3));\nConsole.WriteLine($"{Discount(20, 10):F2}");\nConsole.WriteLine(Initial("Aoife"));',
  },
  expect: { out: '27\n18.00\nA\n' },
};
export const SEMI = { cs: { methods: 'public static int Cube(int n);\n{\n    return n * n * n;\n}', main: '' }, expect: { errors: ['CS1002', 'CS1003', 'CS1519'] } };

/* ---------- B3: predict the output ---------- */
export const PREDICT = [
  { title: 'Three greetings', src: 'Section 3', cs: { methods: M.Greet, main: 'Greet("Aoife");\nGreet("Ciarán");\nstring pupil = "Niamh";\nGreet(pupil);' },
    expect: { out: 'Hello, Aoife!\nHello, Ciarán!\nHello, Niamh!\n' },
    why: 'Each call hands a value to name. The third call hands over the VALUE of pupil, "Niamh".' },
  { title: 'Label it', src: 'Deck Activity 2', cs: { methods: M.Label, main: 'int n = 4;\nLabel("pens", 12);\nLabel("rulers", n);\nLabel("pencils", n + 2);' },
    expect: { out: '12 x pens\n4 x rulers\n6 x pencils\n' },
    why: 'The first argument goes into item and the second into count — and the method prints count first. n + 2 is worked out before the call: 6.' },
  { title: 'Square it', src: 'Section 4', cs: { methods: M.Square, main: 'int a = Square(4);\nConsole.WriteLine(a);\nConsole.WriteLine(Square(5));\nint total = Square(2) + Square(3);\nConsole.WriteLine(total);' },
    expect: { out: '16\n25\n13\n' },
    why: 'STORE it: a holds 16. PRINT it: Square(5) is 25. USE it in a sum: 4 + 9 is 13.' },
  { title: 'Twice and Half', src: 'Deck Activity 4', cs: { methods: join('Twice', 'HalfInt'), main: 'Twice(6);\nint h = Half(9);\nConsole.WriteLine(h);\nTwice(Half(10));\nConsole.WriteLine(Half(7) + Half(8));' },
    expect: { out: '12\n4\n10\n7\n' },
    why: 'Twice is a job — it prints. Half is a value — int division drops the .5, so Half(9) is 4 and Half(7) is 3. Twice(Half(10)) prints 10; 3 + 4 is 7.' },
  { title: 'Return ends it', src: 'Section 4', cs: { methods: M.Check, main: 'Console.WriteLine(Check(20));\nConsole.WriteLine(Check(5));' },
    expect: { out: '1\nsmall\n0\n' },
    why: 'Check(20) reaches return 1 and stops at once — "small" never prints. Check(5) skips the if, prints small INSIDE the method, then returns 0, which Main prints.' },
  { title: 'Job or value?', src: 'Section 4', cs: { methods: join('ShowSquare', 'Square'), main: 'ShowSquare(3);\nint s = Square(3);\nConsole.WriteLine(s + 1);\nShowSquare(Square(2));' },
    expect: { out: '9\n10\n16\n' },
    why: 'ShowSquare prints 9 itself. Square(3) is 9, so s + 1 is 10. Square(2) is 4, and ShowSquare(4) prints 16.' },
  { title: 'Seven calls', src: 'Deck Activity 10', cs: { methods: join('Line', 'Add', 'HalfDouble'), main: 'Line("start", 1);\nint sum = Add(4, 9);\nLine("sum found", sum);\ndouble h = Half(9.0);\nLine("half found", Add(sum, 2));\nConsole.WriteLine(Half(h));' },
    expect: { out: '1: start\n13: sum found\n15: half found\n2.25\n' },
    why: 'Line prints n first, then the text. sum is 13; Add(sum, 2) is 15. Half(9.0) is 4.5 and is stored, never printed; Half(4.5) is 2.25.' },
  { title: 'The mean', src: 'Deck Activity 5', cs: { methods: M.AverageOf, main: 'double mean = AverageOf(12, 15, 21);\nConsole.WriteLine($"{mean:F2}");\nConsole.WriteLine(mean);' },
    expect: { out: '16.00\n16\n' },
    why: '(12 + 15 + 21) / 3 is 16. With :F2 it shows two decimal places: 16.00. Printed on its own, a double leaves off the .0: 16.' },
];

/* ---------- B4: calls become values ---------- */
// steps: { call, val } — val null means the method is void. prints: what it prints when it runs.
// final: the question once the line has no calls left.
export const COLLAPSE = [
  { methods: ['Square'], pre: [], line: 'int total = Square(2) + Square(3);',
    steps: [{ call: 'Square(2)', val: '4' }, { call: 'Square(3)', val: '9' }],
    final: { q: 'What is stored in total?', a: '13' },
    cs: { methods: M.Square, main: 'int total = Square(2) + Square(3);\nConsole.WriteLine(total);' }, expect: { out: '13\n' } },
  { methods: ['Twice', 'HalfInt'], pre: [], line: 'Twice(Half(10));',
    steps: [{ call: 'Half(10)', val: '5' }, { call: 'Twice(5)', val: null, prints: '10' }],
    final: null,
    cs: { methods: join('Twice', 'HalfInt'), main: 'Twice(Half(10));' }, expect: { out: '10\n' } },
  { methods: ['Square'], pre: [], line: 'Console.WriteLine(Square(Square(2)) + 1);',
    steps: [{ call: 'Square(2)', val: '4' }, { call: 'Square(4)', val: '16' }],
    final: { q: 'What does the line print?', a: '17' },
    cs: { methods: M.Square, main: 'Console.WriteLine(Square(Square(2)) + 1);' }, expect: { out: '17\n' } },
  { methods: ['Line', 'Add'], pre: ['int sum = 13;'], line: 'Line("half found", Add(sum, 2));',
    steps: [{ call: 'Add(sum, 2)', val: '15' }, { call: 'Line("half found", 15)', val: null, prints: '15: half found' }],
    final: null,
    cs: { methods: join('Line', 'Add'), main: 'int sum = 13;\nLine("half found", Add(sum, 2));' }, expect: { out: '15: half found\n' } },
  { methods: ['Twice', 'HalfInt'], pre: [], line: 'Console.WriteLine(Half(7) + Half(8));',
    steps: [{ call: 'Half(7)', val: '3' }, { call: 'Half(8)', val: '4' }],
    final: { q: 'What does the line print?', a: '7' },
    cs: { methods: join('Twice', 'HalfInt'), main: 'Console.WriteLine(Half(7) + Half(8));' }, expect: { out: '7\n' } },
  { methods: ['Sign', 'Add'], pre: [], line: 'string s = Sign(Add(-6, 2));',
    steps: [{ call: 'Add(-6, 2)', val: '-4' }, { call: 'Sign(-4)', val: 'negative' }],
    final: { q: 'What is stored in s?', a: 'negative' },
    cs: { methods: join('Sign', 'Add'), main: 'string s = Sign(Add(-6, 2));\nConsole.WriteLine(s);' }, expect: { out: 'negative\n' } },
  { methods: ['Add', 'Square'], pre: [], line: 'int m = Add(Square(2), Square(3));',
    steps: [{ call: 'Square(2)', val: '4' }, { call: 'Square(3)', val: '9' }, { call: 'Add(4, 9)', val: '13' }],
    final: { q: 'What is stored in m?', a: '13' },
    cs: { methods: join('Add', 'Square'), main: 'int m = Add(Square(2), Square(3));\nConsole.WriteLine(m);' }, expect: { out: '13\n' } },
  { methods: ['ShowSquare'], pre: [], line: 'int t = ShowSquare(4);', trap: true,
    steps: [{ call: 'ShowSquare(4)', val: null }],
    final: { q: 'So what happens to this line?', options: ['It will not build', 't holds 16', 't holds 4', 't holds 0'], a: 0,
      why: 'ShowSquare is void: the call has no value to store. C# refuses: CS0029 "Cannot implicitly convert type \'void\' to \'int\'". Nothing runs at all — not even the 16.' },
    cs: { methods: M.ShowSquare, main: 'int t = ShowSquare(4);' }, expect: { errors: ['CS0029'] } },
];
// The first call to run: the arguments are worked out first, left to right, then the call itself.
