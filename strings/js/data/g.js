// Zone G: the ten definitions, word for word from the booklet. `part` is the part that teaches each term.
export const TERMS = [
  { term: 'string', part: 'A', wording: 'a row of characters in order.' },
  { term: 'character (`char`)', short: 'character', part: 'A', wording: 'one letter, digit, symbol or space, in single quotes.' },
  { term: 'index', part: 'A', wording: "the number of a character's position, counting from 0." },
  { term: 'length', part: 'A', wording: 'how many characters a string holds.' },
  { term: 'substring', part: 'B', wording: 'part of a string, given by a start index and a number of characters.' },
  { term: 'concatenation', part: 'B', wording: 'joining strings end to end with `+`.' },
  { term: 'immutable', part: 'B', wording: 'cannot be changed; a string method returns a new string, which must be stored.' },
  { term: 'parse', part: 'C', wording: 'turn text into a number.' },
  { term: 'validation', part: 'D', wording: 'checking that data follows the rules before it is used.' },
  { term: 'validation method', part: 'D', wording: 'a method that checks data against rules and returns `true` or `false`.' },
];

// G2: the word bank has ten words. Each gap sentence is new, so a play never shows the same six.
export const BANK = [
  { w: 'string', part: 'A', s: ['Text in double quotes, such as "Newry", is a ___.', 'A row of characters in order is a ___.', 'The first name a user types in is stored as a ___.'] },
  { w: 'character', part: 'A', s: ["`'7'` in single quotes is one ___.", 'Each box in a string holds one ___.', 'A space inside a string still counts as one ___.'] },
  { w: 'index', part: 'A', s: ['In `word[3]`, the number 3 is the ___.', 'The first box of a string has ___ 0.', 'To reach one box of a string, you write its ___ in square brackets.'] },
  { w: 'length', part: 'A', s: ['`word.Length` gives the ___ of the string.', 'How many characters a string holds is its ___.', 'The last box number is always one less than the ___.'] },
  { w: 'substring', part: 'B', s: ['`word.Substring(0, 3)` gives a ___.', 'A start index and a number of characters give a ___.', 'The first four characters of a postcode are a ___ of it.'] },
  { w: 'concatenation', part: 'B', s: ['`first + last` is an example of ___.', 'Building a username from a letter and a surname uses ___.', 'Putting one string on the end of another with `+` is called ___.'] },
  { w: 'immutable', part: 'B', s: ['Because strings are ___, `word.ToUpper();` on its own changes nothing.', 'You must store the result of `Replace` because strings are ___.', 'A word for "cannot be changed" is ___.'] },
  { w: '-1', part: 'B', s: ['`"ARMAGH".IndexOf("Z")` gives ___.', 'If `text.IndexOf(" ")` finds no space, it gives back ___.', 'To test whether `IndexOf` failed, you compare its answer with ___.'] },
  { w: 'parse', part: 'C', s: ['To ___ text is to turn it into a number.', '`int.TryParse` tries to ___ the text it is given.', 'Before you can add up numbers a user typed, you must ___ them.'] },
  { w: 'validation', part: 'D', s: ['Checking that data follows the rules before it is used is ___.', 'A method that tests a code against its rules carries out ___.', 'Refusing a password that has no digits is an example of ___.'] },
];

// G3: the self-quiz cards.
export const SELF_QUIZ = [
  { part: 'A', q: 'What index does the first character of a string have?', a: '0.' },
  { part: 'A', q: 'A string has a length of 6. What index does its last character have?', a: '5, because the last box is `Length - 1`.' },
  { part: 'A', q: 'Which quotes does a `char` use?', a: 'Single quotes, such as `\'A\'`.' },
  { part: 'A', q: 'What does `Char.IsUpper` test?', a: 'Whether one character is a capital letter.' },
  { part: 'B', q: 'What are the two numbers in `Substring(2, 3)`?', a: 'Where to start, then how many characters to take.' },
  { part: 'B', q: 'What does `IndexOf` give when it finds nothing?', a: '`-1`.' },
  { part: 'B', q: 'Why does `name.ToUpper();` on its own change nothing?', a: 'Strings are immutable. `ToUpper` returns a new string, and it must be stored.' },
  { part: 'C', q: 'What does `int.TryParse` return?', a: '`true` if the text is a whole number, `false` if it is not.' },
  { part: 'C', q: 'What happens when `int.Parse` is given text that is not a number?', a: 'The program crashes.' },
  { part: 'C', q: 'What are the lowest and highest numbers `random.Next(1, 7)` can give?', a: '1 and 6. The top number is never given.' },
  { part: 'D', q: 'What should a validation method test first?', a: 'The length, because reading a box that is not there crashes the program.' },
  { part: 'D', q: 'Where does a validation method put `return true;`?', a: 'At the very end, after every test has passed.' },
];
