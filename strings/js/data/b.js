// Zone B: taking strings apart. Booklet section 3.
import { prog, val } from './_q.js';

export const SURGERY_WORDS = ['ARMAGH', 'LURGAN', 'OMAGH', 'Hi there', 'R2D2', 'Mary Kate'];
const pairs = (w) => { const out = []; for (let s = 0; s <= w.length - 2; s++) for (let c = 1; c <= Math.min(4, w.length - s); c++) out.push([s, c]); return out; };
// Proof: every Substring the surgeon can ask for, run in C#, agrees with the piece the game computes.
export const SURGERY_PROOFS = SURGERY_WORDS.map((w) => prog(
  `string word = "${w}";\n${pairs(w).map(([s, c]) => `Console.WriteLine(word.Substring(${s}, ${c}));`).join('\n')}`,
  pairs(w).map(([s, c]) => `${w.substr(s, c)}\n`).join('')));

const m = (lit, tail, answer, kind, why) => ({ ...prog(`string text = "${lit}";\nConsole.WriteLine(text${tail});`, `${answer}\n`), expr: `text${tail}`, answer: String(answer), kind, why });
const set = (lit, rows) => ({ lit, rows: rows.map(([t, a, k, why]) => m(lit, t, a, k, why)) });
export const SEARCHES = [
  set('ABC-123', [
    ['.IndexOf("-")', 3, 'num', 'The hyphen is in box 3.'],
    ['.IndexOf("Z")', -1, 'num', 'There is no Z, and IndexOf gives -1 when it finds nothing.'],
    ['.Contains("C-1")', 'True', 'bool', 'C, hyphen, 1 appear side by side in boxes 2 to 4.'],
    ['.StartsWith("AB")', 'True', 'bool', 'The string begins with AB.'],
    ['.Replace("-", " ")', 'ABC 123', 'text', 'The hyphen becomes a space.'],
    ['.ToUpper()', 'ABC-123', 'text', 'It is already in capitals, and the hyphen and digits stay as they are.'],
    ['.ToLower()', 'abc-123', 'text', 'Only the letters change.'],
    ['.Replace("-", "").Length', 6, 'num', 'With the hyphen gone, six characters are left.'],
  ]),
  set('BT28 3RT', [
    ['.IndexOf("3")', 5, 'num', 'The space is in box 4, so the 3 is in box 5.'],
    ['.IndexOf("x")', -1, 'num', 'There is no x, and IndexOf gives -1 when it finds nothing.'],
    ['.Contains("28")', 'True', 'bool', 'The 2 and the 8 sit side by side.'],
    ['.StartsWith("bt")', 'False', 'bool', 'Capitals count: BT is not bt.'],
    ['.Replace(" ", "")', 'BT283RT', 'text', 'The space is removed.'],
    ['.ToUpper()', 'BT28 3RT', 'text', 'It is already in capitals.'],
    ['.ToLower()', 'bt28 3rt', 'text', 'Only the letters change.'],
    ['.Replace(" ", "").Length', 7, 'num', 'With the space gone, seven characters are left.'],
  ]),
  set("O'Neill", [
    ['.IndexOf("N")', 2, 'num', 'O is box 0, the apostrophe is box 1, N is box 2.'],
    ['.IndexOf("n")', -1, 'num', 'Capitals count: there is no small n.'],
    ['.Contains("Ne")', 'True', 'bool', 'N and e sit side by side.'],
    ['.StartsWith("O\'")', 'True', 'bool', "The string begins with O and an apostrophe."],
    ['.Replace("l", "L")', "O'NeiLL", 'text', 'Every small l changes, not only the first.'],
    ['.ToUpper()', "O'NEILL", 'text', 'Every letter becomes a capital.'],
    ['.ToLower()', "o'neill", 'text', 'Every letter becomes small.'],
    ['.Replace("ll", "").Length', 5, 'num', "With ll gone, O'Nei is left: five characters."],
  ]),
  set('Hello', [
    ['.IndexOf("l")', 2, 'num', 'IndexOf gives the first match: box 2.'],
    ['.IndexOf("z")', -1, 'num', 'There is no z, and IndexOf gives -1 when it finds nothing.'],
    ['.Contains("ell")', 'True', 'bool', 'e, l, l sit side by side.'],
    ['.StartsWith("hello")', 'False', 'bool', 'Capitals count: Hello is not hello.'],
    ['.Replace("ll", "r")', 'Hero', 'text', 'The two letters ll become the one letter r.'],
    ['.ToUpper()', 'HELLO', 'text', 'Every letter becomes a capital.'],
    ['.ToLower()', 'hello', 'text', 'Every letter becomes small.'],
    ['.Replace("ll", "r").Length', 4, 'num', 'Hero has four characters.'],
  ]),
  set('AB-99', [
    ['.IndexOf("9")', 3, 'num', 'IndexOf gives the first match: box 3.'],
    ['.IndexOf("C")', -1, 'num', 'There is no C, and IndexOf gives -1 when it finds nothing.'],
    ['.Contains("-9")', 'True', 'bool', 'The hyphen and a 9 sit side by side.'],
    ['.StartsWith("B")', 'False', 'bool', 'The string begins with A.'],
    ['.Replace("9", "0")', 'AB-00', 'text', 'Every 9 changes, not only the first.'],
    ['.ToUpper()', 'AB-99', 'text', 'It is already in capitals.'],
    ['.ToLower()', 'ab-99', 'text', 'Only the letters change.'],
    ['.Replace("-", "").Length', 4, 'num', 'With the hyphen gone, four characters are left.'],
  ]),
];

// B3. Dotnet truth: char + string joins; char + char and char + int add the character codes.
const pr = (setup, stmt, shown, answer, kind, why) => ({ ...prog(`${setup}\n${stmt}\nConsole.WriteLine(${shown});`.replace(/\n\n/g, '\n'), `${answer}\n`), lines: [...setup.split('\n').filter(Boolean), ...(stmt ? stmt.split('\n') : []), `Console.WriteLine(${shown});`], answer: String(answer), kind, why });
const SC = 'string s = "cat";';
export const PREDICTS = [
  pr(SC, 's.ToUpper();', 's', 'cat', 'text', 'Strings never change. ToUpper made a new string and nothing stored it, so `s` is still "cat".'),
  pr(SC, 's = s.ToUpper();', 's', 'CAT', 'text', 'This time the new string is stored back in `s`.'),
  pr('string s = "CAT";\nstring t = "COT";', '', 's + " " + t', 'CAT COT', 'text', 'The `+` joins the three strings, with the space in the middle.'),
  pr(SC, '', 's.Length + 1', 4, 'num', 'The length is 3, a number, so `+ 1` adds.'),
  pr('string name = "Dan";', '', 'name[0] + name[1]', 165, 'num', 'Two `char` values added with `+` become numbers: D is 68 and a is 97, which makes 165.'),
  pr('string name = "Dan";\nstring code = "ABC123";', '', 'name.Substring(0, 1) + code', 'DABC123', 'text', '`Substring(0, 1)` gives a string, so `+` joins it to the code.'),
];
const q = (word, want, right, wrong, why) => ({ ...prog(`string word = "${word}";\nConsole.WriteLine(${right});`, `${want}\n`), word, want, a: right, options: [right, ...wrong], why });
export const REPAIRS = [
  q('BELFAST', 'BEL', 'word.Substring(0, 3)', ['word.Substring(0, 4)', 'word.Substring(1, 3)', 'word.Substring(3)'], 'Start at box 0 and take three characters.'),
  q('BELFAST', 'AST', 'word.Substring(4)', ['word.Substring(4, 7)', 'word.Substring(5)', 'word.Substring(3, 3)'], 'Start at box 4 and run to the end. The second number is how many, not where to stop.'),
  { ...prog('string word = "ABC-123";\nword = word.Replace("-", " ");\nConsole.WriteLine(word);', 'ABC 123\n'), word: 'ABC-123', want: 'ABC 123', a: 'word = word.Replace("-", " ");', options: ['word = word.Replace("-", " ");', 'word.Replace("-", " ");', 'word = word.Replace(" ", "-");', 'word = word.IndexOf("-");'], why: 'Replace makes a new string, so it has to be stored back in `word`.' },
  q('BT28 3RT', 'bt28', 'word.Substring(0, 4).ToLower()', ['word.ToLower()', 'word.Substring(0, 3).ToLower()', 'word.Substring(4).ToLower()'], 'Take the first four characters, then make them small.'),
  q('BT28 3RT', '4', 'word.IndexOf(" ")', ['word.Contains(" ")', 'word.Length', 'word.IndexOf("4")'], 'IndexOf gives the number of the box holding the space. Contains only says true or false.'),
  { ...prog('string word = "BT28 3RT";\nConsole.WriteLine(word.Contains("3R"));', 'True\n'), word: 'BT28 3RT', want: 'true', a: 'word.Contains("3R")', options: ['word.Contains("3R")', 'word.IndexOf("3R")', 'word.Substring("3R")', 'word.Contains("3r")'], why: 'Contains gives true or false, and capitals count. IndexOf gives a box number, not true or false.' },
];
