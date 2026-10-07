// Zone A content — booklet section 2 and deck Activities 1 and 4. Every program here is compiled and run by verify/.
const B1 = 'Console.WriteLine("=== OUR LADY\'S NOTICE BOARD ===");';
const B2 = 'Console.WriteLine("===============================");';
const B3 = 'Console.WriteLine();';
export const BANNER = [B1, B2, B3];
export const NOTICES = [
  'Console.WriteLine("Open 8.30 am to 4.00 pm");',
  'Console.WriteLine("Closed at weekends");',
  'Console.WriteLine("Phones away in class");',
];
export const PASTE = [...BANNER, NOTICES[0], ...BANNER, NOTICES[1], ...BANNER, NOTICES[2], ...BANNER];
export const BOARD_OUT = `=== OUR LADY'S NOTICE BOARD ===
===============================

Open 8.30 am to 4.00 pm
=== OUR LADY'S NOTICE BOARD ===
===============================

Closed at weekends
=== OUR LADY'S NOTICE BOARD ===
===============================

Phones away in class
=== OUR LADY'S NOTICE BOARD ===
===============================

`;
export const SHOWBANNER = `public static void ShowBanner()
{
    ${B1}
    ${B2}
    ${B3}
}`;

// Programs for "Follow the Calls". steps: the order lines run (0-based line index in programLines),
// with the output each step prints. auto: control coming back to finish a line — played for the pupil.
export const FLOWS = [
  {
    name: 'The banner call',
    cs: {
      methods: `public static void ShowBanner()
{
    Console.WriteLine("=== BOARD ===");
    Console.WriteLine("=============");
}`,
      main: `Console.WriteLine("Start");
ShowBanner();
Console.WriteLine("End");`,
    },
    expect: { out: 'Start\n=== BOARD ===\n=============\nEnd\n' },
    steps: [[8, 'Start'], [9], [2, '=== BOARD ==='], [3, '============='], [10, 'End']],
    why: 'Main prints Start. The call jumps into ShowBanner\'s body, which runs. Control comes back to the line after the call: End. None of the jumping shows in the output.',
  },
  {
    name: 'Quiz Night (Activity 1)',
    cs: {
      methods: `public static void ShowTitle()
{
    Console.WriteLine("== QUIZ NIGHT ==");
}
public static void ShowRules()
{
    Console.WriteLine("No phones");
    Console.WriteLine("No shouting");
}
public static void ShowPrize()
{
    Console.WriteLine("Prize: a cake");
}`,
      main: `ShowTitle();
ShowRules();
Console.WriteLine("Round 1");
ShowTitle();`,
    },
    expect: { out: '== QUIZ NIGHT ==\nNo phones\nNo shouting\nRound 1\n== QUIZ NIGHT ==\n' },
    steps: [[16], [2, '== QUIZ NIGHT =='], [17], [6, 'No phones'], [7, 'No shouting'], [18, 'Round 1'], [19], [2, '== QUIZ NIGHT ==']],
    never: { q: 'One method never ran. Which one?', options: ['ShowPrize', 'ShowTitle', 'ShowRules', 'None — they all ran'], answer: 0,
      why: 'ShowPrize is written, but nothing calls it — so it never prints. ShowTitle is called twice, so its line prints twice.' },
    why: 'Main runs from the top. Each call jumps into that method\'s body and comes back to the next line.',
  },
  {
    name: 'Jobs and values (Activity 4)',
    cs: {
      methods: `public static void Twice(int n)
{
    Console.WriteLine(n * 2);
}
public static int Half(int n)
{
    return n / 2;
}`,
      main: `Twice(6);
int h = Half(9);
Console.WriteLine(h);
Twice(Half(10));
Console.WriteLine(Half(7) + Half(8));`,
    },
    expect: { out: '12\n4\n10\n7\n' },
    steps: [[11], [2, '12'], [12], [6], [13, '4'], [14], [6], [2, '10'], [15], [6], [6], [15, '7', true]],
    why: 'Twice(6) is a job — Twice prints 12 itself. Half(9) is a value: it IS 4, stored, then printed. In Twice(Half(10)) the value goes inside the job: Half(10) is 5, so Twice(5) prints 10. Half(7) + Half(8) is 3 + 4 — whole-number division drops the .5 — so 7.',
  },
];

// Advantages Sort — booklet section 2 and the 2015 Q2(a) mark scheme.
export const ADVANTAGES = [
  { t: 'The same code is reused wherever it is needed', ok: true },
  { t: 'Lines are written once and used wherever they are needed', ok: true },
  { t: 'Structured design: a big problem is broken into named jobs', ok: true },
  { t: 'Several developers can work on different methods at once', ok: true },
  { t: 'Faster development', ok: true },
  { t: 'Simpler testing: each method can be tested on its own', ok: true },
  { t: 'Reuse', ok: false, why: '"Reuse" on its own has been refused. Write a phrase: the same code is reused wherever it is needed.' },
  { t: 'The program runs faster', ok: false, why: 'Methods do not make the program run faster. The mark is for faster DEVELOPMENT.' },
  { t: 'It uses less memory', ok: false, why: 'Not on the mark scheme. Stick to the five phrases.' },
  { t: 'It makes the code better', ok: false, why: 'Too vague — better how? Name the advantage.' },
  { t: 'Testing', ok: false, why: 'A word, not a phrase. Say what is simpler: each method can be tested on its own.' },
  { t: 'Methods look neater on the screen', ok: false, why: 'Not an advantage the scheme gives. Structured design is about breaking the problem into named jobs.' },
];
export const UPGRADES = [
  { weak: 'Reuse.', options: ['The same code is reused wherever it is needed.', 'Reuse is good.', 'Methods reuse.'] },
  { weak: 'Testing.', options: ['Each method can be tested on its own.', 'Testing is done.', 'Testing is better with methods.'] },
  { weak: 'Faster.', options: ['Development is faster.', 'The program runs faster.', 'It is faster to run.'] },
  { weak: 'Easier to understand.', options: ['A big problem is broken into named jobs.', 'It is easy.', 'Methods are understandable.'] },
];

// Headers for Label the Header / Read the Header.
export const LABELS = ['the opening', 'return type', 'name', 'parameter list'];
export const LABEL_HEADERS = [
  { parts: ['public static', 'void', 'ShowBanner', '()'] },
  { parts: ['static', 'void', 'Main', '(string[] args)'], note: 'Main has no public — its opening is just static. Leave Main\'s line exactly as it is.' },
];
export const READ_HEADERS = [
  { h: 'public static int Cube(int n)', q: 'What does Cube hand back?', options: ['a whole number (int)', 'nothing (void)', 'a number with a decimal point (double)', 'n'], a: 0 },
  { h: 'public static void PrintStars(int n)', q: 'What does PrintStars hand back?', options: ['nothing — it is void', 'an int', 'the stars', 'n'], a: 0 },
  { h: 'public static double Discount(double price, int percent)', q: 'How many parameters does Discount have?', options: ['2', '1', '3', '4'], a: 0 },
  { h: 'public static double Discount(double price, int percent)', q: 'What type is the second parameter?', options: ['int', 'double', 'percent', 'void'], a: 0 },
  { h: 'public static int EnterNumber(string prompt, int min, int max)', q: 'Which of these is a parameter of EnterNumber?', options: ['min', 'int', 'EnterNumber', 'public'], a: 0 },
  { h: 'public static void ShowBanner()', q: 'What does the empty () tell you?', options: ['ShowBanner is given nothing', 'ShowBanner hands back nothing', 'ShowBanner has no body', 'ShowBanner cannot be called'], a: 0 },
  { h: 'static void Main(string[] args)', q: 'Which word does Main\'s header leave out?', options: ['public', 'static', 'void', 'args'], a: 0 },
  { h: 'public static double AverageOf(int a, int b, int c)', q: 'What is the return type?', options: ['double', 'int', 'AverageOf', 'public static'], a: 0 },
  { h: 'public static bool validTelephoneNo(string number)', q: 'What is the method\'s name?', options: ['validTelephoneNo', 'bool', 'number', 'string'], a: 0 },
  { h: 'public static void Greet(string name)', q: 'What is "the opening"?', options: ['public static', 'void', 'Greet', 'string name'], a: 0 },
];
