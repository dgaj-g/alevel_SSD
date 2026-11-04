// Zone C: numbers hiding in strings. Booklet section 5 and 6.
import { prog, crash } from './_q.js';

const tp = (text, isNum, value, why) => ({ ...prog(`string text = "${text}";\nint number;\nbool ok = int.TryParse(text, out number);\nConsole.WriteLine(ok);\nConsole.WriteLine(number);`, `${isNum ? 'True' : 'False'}\n${value}\n`), text, isNum, value, why });
export const PARSES = [
  tp('42', true, 42, 'Two digits make a whole number.'),
  tp('abc', false, 0, 'Letters are not a number, so TryParse returns false and the number is 0.'),
  tp('', false, 0, 'An empty string holds no number.'),
  tp('4.5', false, 0, 'int.TryParse only takes whole numbers, so the point makes it false.'),
  tp('-3', true, -3, 'A minus sign in front is allowed.'),
  tp(' 7', true, 7, 'Spaces around the number are allowed.'),
  tp('007', true, 7, 'Zeros in front are allowed, and the number is 7.'),
];
const ty = (main, answer, why) => ({ ...prog(`Console.WriteLine(${main});`, `${answer}\n`), lines: [main], answer: String(answer), kind: 'num', why });
export const DIGIT_VALUES = [
  ty("Convert.ToInt32('7')", 55, "Convert.ToInt32 on a `char` gives its character code. The character '7' has code 55."),
  ty('int.Parse("7")', 7, 'int.Parse reads the digit in the string as the number 7.'),
  ty("int.Parse('7'.ToString()) + 1", 8, 'ToString makes the string "7", int.Parse makes it 7, and then 1 is added.'),
  ty("'7' + 1", 56, "A `char` with `+ 1` uses its code: 55 + 1 is 56."),
];
const SAFE = "int value = int.Parse(code[i].ToString());";
export const DIGIT_CHOICE = [
  { ...prog(`string code = "47";\nint i = 0;\n${SAFE}\nConsole.WriteLine(value);`, '4\n'), q: 'Which line turns one digit character into its number safely?', a: SAFE, options: [SAFE, 'int value = Convert.ToInt32(code[i]);', 'int value = code[i];', 'int value = int.Parse(code[i]);'], why: 'Turn the `char` into a string first, then parse it. The others give the code 52 or will not compile.' },
  { ...prog('string code = "47";\nint total = 0;\nfor (int i = 0; i < code.Length; i++)\n{\n    total = total + int.Parse(code[i].ToString());\n}\nConsole.WriteLine(total);', '11\n'), q: 'Which line adds the digit in box i to the total?', a: 'total = total + int.Parse(code[i].ToString());', options: ['total = total + int.Parse(code[i].ToString());', 'total = total + code[i];', 'total = total + Convert.ToInt32(code[i]);', 'total = code[i].ToString() + total;'], why: 'Only the first adds the digit itself. The second and third add its code, and the last will not compile.' },
  { ...prog("char d = '9';\nConsole.WriteLine(Char.IsDigit(d));", 'True\n'), q: 'Which test says whether one character is a digit?', a: 'Char.IsDigit(d)', options: ['Char.IsDigit(d)', 'int.TryParse(d)', 'd.IsDigit()', 'Char.IsNumber(d, 0)'], why: '`Char.IsDigit` takes one character and returns true or false.' },
];
export const NEXT_CHIPS = [99, 100, 101, 500, 999, 1000];
export const NEXT_ROUNDS = [
  { call: 'random.Next(100, 1000)', lo: 100, hi: 999, why: 'The first number can come out. The second number never does, so the largest is 999.' },
  { call: 'random.Next(100, 999)', lo: 100, hi: 998, why: 'The second number never comes out, so this call can never give 999. The largest is 998.' },
];
// Proof: Random.Next's range, run in C# across many draws.
export const NEXT_PROOFS = [
  prog('Random random = new Random();\nint low = 5000;\nint high = 0;\nfor (int i = 0; i < 200000; i++)\n{\n    int n = random.Next(100, 999);\n    if (n < low)\n    {\n        low = n;\n    }\n    if (n > high)\n    {\n        high = n;\n    }\n}\nConsole.WriteLine(low);\nConsole.WriteLine(high);', '100\n998\n'),
  prog('Random random = new Random();\nint low = 5000;\nint high = 0;\nfor (int i = 0; i < 200000; i++)\n{\n    int n = random.Next(1, 7);\n    if (n < low)\n    {\n        low = n;\n    }\n    if (n > high)\n    {\n        high = n;\n    }\n}\nConsole.WriteLine(low);\nConsole.WriteLine(high);', '1\n6\n'),
];
const READ_NUM = (text) => `string text = "${text}";\nint number;\nbool isNumber = int.TryParse(text, out number);\nif (!isNumber)\n{\n    Console.WriteLine("Error: enter a whole number");\n}\nelse if (number >= 10 && number <= 55)\n{\n    Console.WriteLine("Valid");\n}\nelse\n{\n    Console.WriteLine("Invalid");\n}`;
export const CHECK_RUNS = [prog(READ_NUM('abc'), 'Error: enter a whole number\n'), prog(READ_NUM('40'), 'Valid\n'), prog(READ_NUM('60'), 'Invalid\n'), prog(READ_NUM('10'), 'Valid\n'), prog(READ_NUM('55'), 'Valid\n')];
export const CHECK_ROWS = [
  { t: 'string text = Console.ReadLine();', d: 0, slot: true },
  { t: 'int number;', d: 0, slot: true },
  { t: 'bool isNumber = int.TryParse(text, out number);', d: 0, slot: true },
  { t: 'if (!isNumber)', d: 0, slot: true },
  { t: '{', d: 0 },
  { t: 'Console.WriteLine("Error: enter a whole number");', d: 1, slot: true },
  { t: '}', d: 0 },
  { t: 'else if (number >= 10 && number <= 55)', d: 0, slot: true },
  { t: '{', d: 0 },
  { t: 'Console.WriteLine("Valid");', d: 1, slot: true },
  { t: '}', d: 0 },
  { t: 'else', d: 0, slot: true },
  { t: '{', d: 0 },
  { t: 'Console.WriteLine("Invalid");', d: 1, slot: true },
  { t: '}', d: 0 },
];
const CHECK_END = 'if (isNumber = false)\n{\n    Console.WriteLine("Error: enter a whole number");\n}\nelse if (number >= 10 && number <= 55)\n{\n    Console.WriteLine("Valid");\n}\nelse\n{\n    Console.WriteLine("Invalid");\n}';
export const CHECK_TRAPS = [
  { t: 'int number = int.Parse(text);', why: 'int.Parse crashes when the text is not a number, so on "abc" the program stops before it can print the error line.', ...crash('string text = "abc";\nint number = int.Parse(text);\nConsole.WriteLine(number);', '', "Unhandled exception. System.FormatException: The input string 'abc' was not in a correct format.") },
  { t: 'bool isNumber = int.TryParse(text, number);', why: 'This will not compile. The number has to be passed with the word out.', cs: { methods: '', main: 'string text = "abc";\nint number = 0;\nbool isNumber = int.TryParse(text, number);', stdin: '' }, expect: { errors: ['CS1503', 'CS1620'], msgs: [['CS1503', "Argument 1: cannot convert from 'string' to 'System.ReadOnlySpan<byte>'"], ['CS1620', "Argument 2 must be passed with the 'out' keyword"]] }, shown: [['CS1620', "Argument 2 must be passed with the 'out' keyword"]] },
  { t: 'if (isNumber = false)', why: 'One `=` stores false in `isNumber` instead of testing it, so the error line never prints. On "abc" this program says Invalid. To test, write `if (!isNumber)`.', ...prog(`string text = "abc";\nint number;\nbool isNumber = int.TryParse(text, out number);\n${CHECK_END}`, 'Invalid\n') },
];
