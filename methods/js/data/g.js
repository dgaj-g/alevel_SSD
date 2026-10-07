// Zone G content — booklet section 12 (Definitions), Activities 11 and 12.
// The wording is the booklet's, word for word. Gaps and slips mark the words that carry the mark.

// [x] marks a gap (G2 missing words). {wrong|right} marks the slip (G2 spot the slip).
export const TERMS = [
  { term: 'method', wording: 'a named block of code that does one job and runs when it is called',
    cloze: 'a named block of code that does [one job] and runs when it is [called]',
    slip: 'a named block of code that does {every|one} job and runs when it is called' },
  { term: 'header', wording: 'the first line of a method: public static, then its return type, name and parameter list',
    cloze: 'the [first] line of a method: public static, then its [return type], name and parameter list',
    slip: 'the {last|first} line of a method: public static, then its return type, name and parameter list' },
  { term: 'parameter', wording: 'a variable in the header that receives a value when the method is called',
    cloze: 'a variable in the [header] that [receives] a value when the method is called',
    slip: 'a variable in the {call|header} that receives a value when the method is called' },
  { term: 'argument', wording: 'the value in the call that is handed over to a parameter',
    cloze: 'the [value] in the [call] that is handed over to a parameter',
    slip: 'the value in the {header|call} that is handed over to a parameter' },
  { term: 'return type', wording: 'the type of the value a method hands back, or void for none',
    cloze: 'the type of the value a method [hands back], or [void] for none',
    slip: 'the type of the value a method {receives|hands back}, or void for none' },
  { term: 'return', wording: 'the statement that hands a value back and ends the method at once',
    cloze: 'the statement that hands a value back and [ends] the method [at once]',
    slip: 'the statement that hands a value back and ends the {program|method} at once' },
  { term: 'call', wording: 'the line that runs a method, giving one argument per parameter',
    cloze: 'the line that [runs] a method, giving one [argument] per parameter',
    slip: 'the line that runs a method, giving one argument per {method|parameter}' },
  { term: 'pass by value', wording: 'the parameter receives a copy of the argument, so the original is unchanged',
    cloze: 'the parameter receives a [copy] of the argument, so the original is [unchanged]',
    slip: 'the parameter receives a copy of the argument, so the original is {changed|unchanged}' },
  { term: 'overloading', wording: 'two or more methods with the same name and different parameter lists; the compiler picks by the arguments',
    cloze: 'two or more methods with the [same name] and different [parameter lists]; the compiler picks by the arguments',
    slip: 'two or more methods with the same name and different {return types|parameter lists}; the compiler picks by the arguments' },
  { term: 'validation routine', wording: 'a method that asks again until the entry is acceptable and then returns it',
    cloze: 'a method that [asks again] until the entry is acceptable and then [returns] it',
    slip: 'a method that asks again until the entry is acceptable and then {prints|returns} it' },
];
export const TERM = Object.fromEntries(TERMS.map((t) => [t.term, t]));

// G2: the two cloze sets. Every spare word is wrong in every gap.
export const CLOZE_SETS = [
  { terms: ['method', 'header', 'parameter', 'argument', 'return type'], extra: ['last', 'body', 'every job', 'prints'] },
  { terms: ['return', 'call', 'pass by value', 'overloading', 'validation routine'], extra: ['changed', 'return types', 'reference', 'prints'] },
];

// G1 round 2: spot it in the code. mark: [line index, text to light up] — whole: true lights the whole line.
const CUBE = ['public static int Cube(int n)', '{', '    return n * n * n;', '}'];
const GREET = ['public static void Greet(string name)', '{', '    Console.WriteLine($"Hello, {name}!");', '}'];
export const SPOT = [
  { lines: CUBE, marks: [[0, 'int n']], a: 'parameter', not: ['argument', 'return type', 'call'] },
  { lines: ['int big = Cube(3);'], marks: [[0, '3']], a: 'argument', not: ['parameter', 'return type', 'header'] },
  { lines: CUBE, marks: [[0, 'int', 14]], a: 'return type', not: ['parameter', 'return', 'header'] },
  { lines: CUBE, marks: [[0]], a: 'header', not: ['call', 'method', 'parameter'] },
  { lines: CUBE, marks: [[2]], a: 'return', not: ['return type', 'call', 'argument'] },
  { lines: ['string pupil = "Niamh";', 'Greet(pupil);'], marks: [[1]], a: 'call', not: ['header', 'argument', 'return'] },
  { lines: ['string pupil = "Niamh";', 'Greet(pupil);'], marks: [[1, 'pupil']], a: 'argument', not: ['parameter', 'call', 'return type'] },
  { lines: GREET, marks: [[0, 'void']], a: 'return type', not: ['return', 'parameter', 'header'] },
  { lines: GREET, marks: [[0], [1], [2], [3]], a: 'method', not: ['header', 'call', 'validation routine'] },
  { lines: ['public static void Show(int n)', '{', '    Console.WriteLine("the int version");', '}', 'public static void Show(double d)', '{', '    Console.WriteLine("the double version");', '}'],
    marks: [[0], [4]], q: 'Two methods, one name, different parameter lists. What is this called?', a: 'overloading', not: ['pass by value', 'validation routine', 'return type'] },
  { lines: ['public static void Swap(int a, int b)', '{', '    int temp = a;', '    a = b;', '    b = temp;', '}'], marks: [[0, 'int a, int b']],
    q: 'Main calls Swap(x, y). a and b receive copies of x and y, so x and y are unchanged. What is this called?', a: 'pass by value', not: ['overloading', 'return', 'validation routine'] },
  { lines: ['public static int EnterNumber(string prompt, int min, int max)', '{', '    int number = 0;', '    do', '    {', '        Console.Write(prompt);', '        number = Convert.ToInt32(Console.ReadLine());', '    } while (number < min || number > max);', '    return number;', '}'],
    marks: [[0], [1], [2], [3], [4], [5], [6], [7], [8], [9]], q: 'It asks again until the entry is in range, then hands it back. What kind of method is this?', a: 'validation routine', not: ['overloading', 'header', 'call'] },
];

// G1 round 3: two marks means two facts. facts = how many of the term's two facts the answer gives.
export const FACTS = [
  { term: 'method', said: 'A method is a block of code.', facts: 1,
    why: 'One fact. The booklet\'s own example: "a block of code" is one fact; "that performs a specific task and can be called by name" is the second.' },
  { term: 'method', said: 'A method is a block of code that performs a specific task and can be called by name.', facts: 2,
    why: 'Two facts: a block of code, AND it does one task and is called by name.' },
  { term: 'parameter', said: 'A parameter is a variable in the header that receives a value when the method is called.', facts: 2,
    why: 'Two facts: a variable in the header, AND it receives a value when the method is called.' },
  { term: 'parameter', said: 'A parameter is a variable in the header.', facts: 1,
    why: 'One fact. Missing: it receives a value when the method is called.' },
  { term: 'argument', said: 'An argument is a variable in the header that receives a value.', facts: 0,
    why: 'No facts — that describes a parameter. An argument is the value in the CALL that is handed over to a parameter.' },
  { term: 'argument', said: 'An argument is the value in the call that is handed over to a parameter.', facts: 2,
    why: 'Two facts: the value in the call, AND it is handed over to a parameter.' },
  { term: 'pass by value', said: 'The value is passed to the method.', facts: 0,
    why: 'No facts — it repeats the name. Say COPY, and say the original is unchanged.' },
  { term: 'pass by value', said: 'The method gets a copy of the argument.', facts: 1,
    why: 'One fact: a copy. Missing: so the original is unchanged.' },
  { term: 'pass by value', said: 'The parameter receives a copy of the argument, so the original variable is unchanged.', facts: 2,
    why: 'Two facts: a COPY, and the original is UNCHANGED — the two words the examiner looks for.' },
  { term: 'return', said: 'return hands a value back to the call.', facts: 1,
    why: 'One fact. Missing: it ends the method at once.' },
  { term: 'return', said: 'return ends the program.', facts: 0,
    why: 'No facts — return ends the METHOD, not the program, and the answer never says it hands a value back.' },
  { term: 'overloading', said: 'Two methods with the same name and different return types.', facts: 1,
    why: 'One fact: the same name. Different return types is wrong — overloads must differ in their parameter lists.' },
  { term: 'overloading', said: 'Two or more methods with the same name but different parameter lists.', facts: 2,
    why: 'Two facts: the same name, AND different parameter lists.' },
  { term: 'return type', said: 'The type of the value a method hands back, or void if it hands back nothing.', facts: 2,
    why: 'Two facts: the type of the value handed back, AND void when there is none.' },
];

// G3: Activity 12, the self-quiz — the booklet's questions and answers.
export const SELF_QUIZ = [
  { q: 'Name the parts of `public static int Cube(int n)` that come after public static, in order.', a: 'return type (int) · name (Cube) · parameter list (int n)' },
  { q: 'Give three advantages of using methods.', a: 'any three of: reuse of code · structured design that simplifies the solution · several developers at once · faster development · simpler testing' },
  { q: 'In `Greet(pupil);` and `Greet(string name)`, which is the argument and which the parameter?', a: 'pupil is the argument (in the call); name is the parameter (in the header)' },
  { q: 'What two things does return do?', a: 'hands the value back to the call, and ends the method at once' },
  { q: '`Swap(x, y)` swaps its two parameters. What are x and y afterwards, and why?', a: 'unchanged — the method received copies (pass by value)' },
  { q: 'Why can `int Get()` and `double Get()` not both exist?', a: 'overloads must differ in parameter count or types, never in return type alone' },
  { q: 'Why will `public static Cube(int n)` not build?', a: 'it has no return type — every method says what it hands back (int here, or void for nothing)' },
  { q: 'What does `EnterNumber("Age: ", 11, 19)` hand back?', a: 'an int between 11 and 19, asking again until it gets one' },
];
