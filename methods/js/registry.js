// Every zone and cabinet in the arcade. A zone matches a section of the Topic 3 booklet.
export const ZONES = [
  {
    key: 'A', title: 'Why methods', tag: 'Booklet section 2', colour: '#F472B6',
    points: [
      'A method is a named block of code that does one job. You run it by calling its name: `ShowBanner();`',
      'Write the lines once, inside a method, and call the method wherever they are needed.',
      'Advantages — write a phrase, not a word: **reuse of code** (written once, used wherever needed); **structured design** (a big problem broken into named jobs); **several developers** can work on different methods at once; **faster development**; **simpler testing** (each method tested on its own). "Reuse" on its own was refused.',
      'The header: `public static` (the opening) · the return type (`void` hands nothing back) · the name · the parameter list in brackets. The exam also calls it the signature.',
      'Main is `static void Main(string[] args)` — written without public.',
      'Methods go inside the class, above Main — never inside Main.',
      'A call jumps to the method, runs its body, then comes back to the line after the call.',
      'The exam is not fussy about capitals. C# is.',
    ],
    games: [
      { id: 'a1', mod: 'a1', title: 'Squash the Copies', icon: 'copy-x', blurb: 'Find every pasted line, then fold them into one method.' },
      { id: 'a2', mod: 'a2', title: 'Advantages Sort', icon: 'list-checks', blurb: 'Which answers would earn the mark — and which would not?' },
      { id: 'a3', mod: 'a3', title: 'Label the Header', icon: 'tag', blurb: 'Name every part of real method headers.' },
      { id: 'a4', mod: 'a4', title: 'Follow the Calls', icon: 'footprints', blurb: 'Click the lines in the order they actually run.' },
    ],
  },
  {
    key: 'B', title: 'In and out', tag: 'Booklet sections 3 and 4', colour: '#22D3EE',
    points: [
      'A **parameter** is the name in the header that receives a value: `Greet(string name)`. "Identify the parameter" means the name in the header.',
      'An **argument** is the value in the call: `Greet("Aoife");`',
      'Arguments are matched to parameters by position — first to first, second to second — and the types must match.',
      'Parameters are local: they exist only while the method runs.',
      'A method whose return type is not void must hand a value back with `return`. Every path through it must reach a return.',
      '`return` ends the method at once and the value goes back to the caller.',
      'The call becomes the value it returns: STORE it, PRINT it, or USE it in a sum.',
      'A void method\'s call has no value: `int t = ShowSquare(4);` will not build.',
    ],
    games: [
      { id: 'b1', mod: 'b1', title: 'Argument or Parameter?', icon: 'split', blurb: 'Speed round. Then: which parameter receives it?' },
      { id: 'b2', mod: 'b2', title: 'Header Builder', icon: 'hammer', blurb: 'Write the header from a plain description.' },
      { id: 'b3', mod: 'b3', title: 'Predict the Output', icon: 'terminal', blurb: 'Type exactly what the program prints.' },
      { id: 'b4', mod: 'b4', title: 'Calls Become Values', icon: 'zap', blurb: 'Work out what each call hands back, in the order it runs.' },
    ],
  },
  {
    key: 'C', title: 'How methods behave', tag: 'Booklet sections 5 to 7', colour: '#A78BFA',
    points: [
      '**Pass by value**: the method is given COPIES of the arguments. Changing the copies leaves the originals unchanged.',
      '`Swap(x, y)` swaps the copies `a` and `b`. When the method ends, a, b and temp are gone, and x and y are as they were.',
      'Two ways out: return the answer, or pass by reference — `ref` in the header AND in the call.',
      '**Overloading**: two or more methods with the same name but different parameter lists — a different NUMBER of parameters, or different TYPES.',
      'C# runs the version whose parameters match the arguments.',
      'The return type alone is not enough: `int Get()` and `double Get()` will not build side by side.',
      'Leave out `static` and the call from Main fails: "An object reference is required". What static means comes in Topics 8 and 9.',
    ],
    games: [
      { id: 'c1', mod: 'c1', title: 'Swap Trace', icon: 'arrow-down-up', blurb: 'Fill the trace table for the swap trap.' },
      { id: 'c2', mod: 'c2', title: 'Make the Swap Work', icon: 'wrench', blurb: 'Switch ref on and off. Hit each target.' },
      { id: 'c3', mod: 'c3', title: 'Which Version Runs?', icon: 'git-fork', blurb: 'One name, several methods. Which one does C# pick?' },
      { id: 'c4', mod: 'c4', title: 'Will It Build?', icon: 'shield-check', blurb: 'Judge the code, then name the reason.' },
    ],
  },
  {
    key: 'D', title: 'The validated-input routine', tag: 'Booklet section 8', colour: '#FB923C',
    points: [
      '`EnterNumber(prompt, min, max)` shows the prompt, reads a whole number, keeps asking until it is in range, then returns it.',
      'The range comes from the parameters — so one method checks every input in the program.',
      'Mark scheme: declaration · loop · prompt shown and read with Convert.ToInt32 · range check (a mark each side) · error message only when the check fails · return.',
      'Checking once without a loop earns the check mark, not the loop mark.',
      'A word instead of a number crashes Convert.ToInt32 with a FormatException.',
    ],
    games: [
      { id: 'd1', mod: 'd1', title: 'Build EnterNumber', icon: 'puzzle', blurb: 'Put the exam\'s favourite method together, line by line.' },
      { id: 'd2', mod: 'd2', title: 'Be the Examiner', icon: 'pencil-ruler', blurb: 'Match the mark points, then mark three answers.' },
      { id: 'd3', mod: 'd3', title: 'Be the User', icon: 'keyboard', blurb: 'Type into the running program. Then try to break it.' },
    ],
  },
  {
    key: 'E', title: 'Exam Room', tag: 'Booklet section 10', colour: '#FACC15',
    points: [
      'Eight real exam parts. Write your answer first, then open the mark scheme and tick what you earned.',
      'Two marks means two facts.',
      'For pass by value say COPY, and say the original is unchanged.',
      'In code questions, every mark point is a line or a check — the scheme is shown after you write.',
    ],
    games: [
      { id: 'e1', mod: 'exam', arg: 'e1', title: '2015 Q2(a)', icon: 'file-pen', blurb: 'Advantages of methods. 3 marks.' },
      { id: 'e2', mod: 'exam', arg: 'e2', title: '2014 Q2(a)', icon: 'file-pen', blurb: 'Explain the calls and the two headers. 5 marks.' },
      { id: 'e3', mod: 'exam', arg: 'e3', title: '2014 Q2(b)', icon: 'file-pen', blurb: 'Write the number-of-items method. 7 marks.' },
      { id: 'e4', mod: 'exam', arg: 'e4', title: '2014 Q2(d)', icon: 'file-pen', blurb: 'Parameters and arguments. 2 marks.' },
      { id: 'e5', mod: 'exam', arg: 'e5', title: 'Specimen Q2(c)', icon: 'file-pen', blurb: 'The swap that doesn\'t. 4 marks.' },
      { id: 'e6', mod: 'exam', arg: 'e6', title: '2022 Q1(a)', icon: 'file-pen', blurb: 'What return does. 2 marks.' },
      { id: 'e7', mod: 'exam', arg: 'e7', title: '2015 Q2(b)', icon: 'file-pen', blurb: 'Write findCost for the shed shop. 10 marks.' },
      { id: 'e8', mod: 'exam', arg: 'e8', title: '2015 Q2(c)', icon: 'file-pen', blurb: 'Validate the shed order. 9 marks.' },
    ],
  },
  {
    key: 'F', title: 'Practicals', tag: 'Booklet section 11', colour: '#60A5FA',
    points: [
      'Each practical is a brief, not code — the exam gives you a brief, so the practicals do too.',
      '"Print …" means Console.WriteLine. "Call X with a and b" means `X(a, b);`',
      'Build it, run it, check the transcript, then do the On your own task.',
    ],
    games: [
      { id: 'f1', mod: 'prac', arg: 'p1', title: 'P1 Notice Board', icon: 'layers-2', blurb: 'Brief to code: ShowBanner and friends.' },
      { id: 'f2', mod: 'prac', arg: 'p2', title: 'P2 Quote Machine', icon: 'braces', blurb: 'Brief to code: methods that return a value.' },
      { id: 'f3', mod: 'prac', arg: 'p3', title: 'P3 Swap and Twins', icon: 'arrow-right-left', blurb: 'Brief to code: ref and overloading.' },
      { id: 'f4', mod: 'prac', arg: 'p4', title: 'P4 Order Desk', icon: 'route', blurb: 'Brief to code: EnterNumber at work.' },
      { id: 'f5', mod: 'f5', title: 'Bug Clinic', icon: 'bug', blurb: 'Find the faulty line. Prescribe the fix.' },
    ],
  },
  {
    key: 'G', title: 'Definitions', tag: 'Booklet section 12', colour: '#FB7185',
    points: [
      'Learn the wording that earns the mark — every definition here is the booklet\'s.',
      'Two marks means two facts.',
    ],
    games: [
      { id: 'g1', mod: 'g1', title: 'Definition Match', icon: 'book-open', blurb: 'Drag each term onto its definition.' },
      { id: 'g2', mod: 'g2', title: 'Missing Words', icon: 'scan-line', blurb: 'Complete the definitions from the word bank.' },
      { id: 'g3', mod: 'g3', title: 'Quick-Fire Cards', icon: 'repeat-2', blurb: 'Say it, flip it, be honest.' },
    ],
  },
  {
    key: 'H', title: 'Final Challenge', tag: 'Everything in Topic 3', colour: '#F5F0FF',
    points: [
      'A mixed run across the whole topic. Three lives. How far can you get?',
    ],
    games: [
      { id: 'h1', mod: 'h1', title: 'Final Challenge', icon: 'crown', blurb: 'Thirty questions. Three lives. The whole topic.' },
    ],
  },
];

export const GAMES = [];
for (const z of ZONES) for (const g of z.games) GAMES.push({ ...g, zone: z });
export function findGame(id) { return GAMES.find((g) => g.id === id) || null; }
export function nextGame(id) { const i = GAMES.findIndex((g) => g.id === id); return i >= 0 && i < GAMES.length - 1 ? GAMES[i + 1] : null; }
