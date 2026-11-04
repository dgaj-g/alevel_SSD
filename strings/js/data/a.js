// Zone A: a string is a row of characters. Booklet section 2.
import { prog, crash, noBuild, val } from './_q.js';

export const WORDS = ['ARMAGH', 'LURGAN', 'OMAGH', 'BT34 1AB', "O'Neill", 'Hi there', 'R2D2', 'Mary Kate', ''];
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
// Proof: the JavaScript the game uses to read a word agrees with C# for every box of every word.
export const WORD_PROOFS = WORDS.map((w) => prog(
  `string word = "${esc(w)}";\nConsole.WriteLine(word.Length);\n${[...w].map((_, i) => `Console.WriteLine(word[${i}]);`).join('\n')}`,
  `${w.length}\n${[...w].map((c) => `${c}\n`).join('')}`));
export const PAST_END = { ...crash('string word = "OMAGH";\nConsole.WriteLine(word[word.Length]);', '', 'Unhandled exception. System.IndexOutOfRangeException: Index was outside the bounds of the array.'),
  q: 'What does `word[word.Length]` do?', a: 'It crashes: there is no box with that number',
  options: ['It crashes: there is no box with that number', 'It gives the last character', 'It gives a space', 'It gives nothing'],
  why: 'The boxes stop at `word.Length - 1`, so `word[word.Length]` asks for a box that is not there.' };

const typeOf = (v, name, why) => ({ v, type: name, why, ...prog(`Console.WriteLine((${v}).GetType().Name);`, `${name === 'char' ? 'Char' : 'String'}\n`) });
export const QUOTES = [
  typeOf("'B'", 'char', 'Single quotes round one character make a `char`.'),
  typeOf('"B"', 'string', 'Double quotes make a `string`, even with only one character inside.'),
  typeOf('""', 'string', 'Double quotes with nothing inside are the empty string: its length is 0.'),
  typeOf("'7'", 'char', 'A digit in single quotes is a `char`, not a number.'),
  typeOf('"7"', 'string', 'A digit in double quotes is a `string`, not a number.'),
  { v: "'AB'", type: 'none', why: 'Single quotes hold exactly one character, so two will not compile.', ...noBuild("char c = 'AB';", 'CS1012', 'Too many characters in character literal') },
  { v: "''", type: 'none', why: 'Single quotes must hold one character, so empty ones will not compile.', ...noBuild("char c = '';", 'CS1011', 'Empty character literal') },
  typeOf('"Hi there"', 'string', 'Several characters in double quotes make a `string`. The space is one of them.'),
  typeOf("' '", 'char', 'A space is a character, so one space in single quotes is a `char`.'),
  typeOf('"\'"', 'string', 'Double quotes make a `string`. The single quote inside it is one character.'),
];

const row = (lit, d, l, u, w) => ({ lit, d, l, u, w, ...prog(`char c = ${lit};\nConsole.WriteLine(Char.IsDigit(c));\nConsole.WriteLine(Char.IsLetter(c));\nConsole.WriteLine(Char.IsUpper(c));\nConsole.WriteLine(Char.IsWhiteSpace(c));`, [d, l, u, w].map((x) => (x ? 'True' : 'False')).join('\n') + '\n') });
export const TESTS = [{ k: 'd', name: 'Char.IsDigit' }, { k: 'l', name: 'Char.IsLetter' }, { k: 'u', name: 'Char.IsUpper' }, { k: 'w', name: 'Char.IsWhiteSpace' }];
export const CHARS = [row("'7'", 1, 0, 0, 0), row("'b'", 0, 1, 0, 0), row("'B'", 0, 1, 1, 0), row("' '", 0, 0, 0, 1), row("'-'", 0, 0, 0, 0), row("'0'", 1, 0, 0, 0), row("'z'", 0, 1, 0, 0), row("'#'", 0, 0, 0, 0)];

const COUNT_DIGITS = 'public static int CountDigits(string word)\n{\n    int count = 0;\n    for (int i = 0; i < word.Length; i++)\n    {\n        if (Char.IsDigit(word[i]))\n        {\n            count++;\n        }\n    }\n    return count;\n}';
const COUNT_CAPS = COUNT_DIGITS.replace('CountDigits', 'CountCapitals').replace('IsDigit', 'IsUpper');
const COUNT_SPACES = COUNT_DIGITS.replace('CountDigits', 'CountSpaces').replace('IsDigit', 'IsWhiteSpace');
const ALL_LETTERS = 'public static bool AllLetters(string word)\n{\n    for (int i = 0; i < word.Length; i++)\n    {\n        if (!Char.IsLetter(word[i]))\n        {\n            return false;\n        }\n    }\n    return true;\n}';
const BAD_LOOP = COUNT_DIGITS.replace('i < word.Length', 'i <= word.Length');
const q = (methods, call, answer, why, kind = 'num') => ({ ...prog(`Console.WriteLine(${call});`, `${answer}\n`, methods), code: methods.split('\n'), call, answer: String(answer), kind, why });
export const COUNTS = [
  q(COUNT_DIGITS, 'CountDigits("R2D2")', 2, 'The 2 in box 1 and the 2 in box 3 are digits.'),
  q(COUNT_CAPS, 'CountCapitals("Mary Kate")', 2, 'The M and the K are the only capital letters.'),
  q(ALL_LETTERS, 'AllLetters("Mary Kate")', 'False', 'The space in box 4 is not a letter, so the loop returns false as soon as it reaches it.', 'bool'),
  q(COUNT_SPACES, 'CountSpaces("Hi there you")', 2, 'There are two spaces: after Hi and after there.'),
  { ...crash('Console.WriteLine(CountDigits("R2D2"));', '', 'Unhandled exception. System.IndexOutOfRangeException: Index was outside the bounds of the array.', BAD_LOOP),
    code: BAD_LOOP.split('\n'), call: 'CountDigits("R2D2")', q: 'What happens?', a: 'It crashes on the box that is not there',
    options: ['It crashes on the box that is not there', 'It returns 2', 'It returns 3', 'It will not compile'],
    why: 'With `<=` the loop reaches `word[4]`, and "R2D2" only has boxes 0 to 3.' },
  q(COUNT_DIGITS, 'CountDigits("")', 0, 'The empty string has no boxes, so the loop never runs and the count stays 0.'),
];
export { val };
