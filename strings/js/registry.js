// The 38 games of Topic 4, zone by zone. Parts follow the booklet; E and F games carry the part that teaches them.
const exam = (n, title, part, blurb) => ({ id: `e${n}`, mod: 'exam', arg: `e${n}`, title, icon: 'file-pen', part, blurb });
const prac = (n, title, part, blurb) => ({ id: `f${n}`, mod: 'prac', arg: `p${n}`, title, icon: 'hammer', part, blurb });

export const ZONES = [
  { key: 'A', title: 'A string is a row of characters', tag: 'Booklet section 2', colour: '#60A5FA',
    points: ['A string is a row of characters, numbered from 0.', 'The last box is always `word[word.Length - 1]`.', 'A `char` goes in single quotes and a `string` goes in double quotes.'],
    games: [
      { id: 'a1', mod: 'a1', title: 'Count the Boxes', icon: 'brackets', blurb: 'Read the length of a word and the character in any box.' },
      { id: 'a2', mod: 'a2', title: 'char or string?', icon: 'tag', blurb: 'Sort each value by its quotes, including those that will not compile.' },
      { id: 'a3', mod: 'a3', title: 'Which test passes?', icon: 'list-checks', blurb: 'Say which Char tests each character passes.' },
      { id: 'a4', mod: 'a4', title: 'Count It', icon: 'repeat-2', blurb: 'Trace a loop that counts the characters passing a test.' },
    ] },
  { key: 'B', title: 'Cut, search and rebuild', tag: 'Booklet sections 3 and 4', colour: '#34D399',
    points: ['`Substring(start, length)` starts at a box and takes that many boxes.', '`IndexOf` gives `-1` when the text is not there.', 'A string never changes, so store the result.'],
    games: [
      { id: 'b1', mod: 'b1', title: 'Substring Surgeon', icon: 'split', blurb: 'Tap the boxes a Substring call takes, then write the call yourself.' },
      { id: 'b2', mod: 'b2', title: 'Find and Change', icon: 'crosshair', blurb: 'Work out IndexOf, Contains, StartsWith and Replace on one string.' },
      { id: 'b3', mod: 'b3', title: 'Store the Result', icon: 'terminal', blurb: 'Predict what each line prints, stored or not.' },
      { id: 'b4', mod: 'b4', title: 'Make It Say', icon: 'sparkles', blurb: 'Pick the expression that gives the value wanted.' },
    ] },
  { key: 'C', title: 'Text into numbers, and random numbers', tag: 'Booklet sections 5 and 6', colour: '#FBBF24',
    points: ['`int.TryParse` tells you whether the text is a whole number, so nothing crashes.', 'One digit character becomes its number through `ToString()`.', '`random.Next(low, high)` never reaches `high`.'],
    games: [
      { id: 'c1', mod: 'c1', title: 'TryParse Table', icon: 'list-ordered', blurb: 'Fill in what isNumber and number hold for seven texts.' },
      { id: 'c2', mod: 'c2', title: 'Digit or Code?', icon: 'arrow-right-left', blurb: 'Tell a digit from the code behind its character.' },
      { id: 'c3', mod: 'c3', title: 'Random Range', icon: 'shuffle', blurb: 'Sort the numbers a random call can and cannot give.' },
      { id: 'c4', mod: 'c4', title: 'Build the Shape', icon: 'puzzle', blurb: 'Put the TryParse lines in order, and leave out the wrong ones.' },
    ] },
  { key: 'D', title: 'The validation method', tag: 'Booklet sections 7 and 8', colour: '#FB7185',
    points: ['Check the length first.', 'Check each position against its rule, and return false the moment one breaks.', 'Return true at the end.'],
    games: [
      { id: 'd1', mod: 'd1', title: 'Position Map', icon: 'route', blurb: 'Put each rule on its box, then pick the line that tests it.' },
      { id: 'd2', mod: 'd2', title: 'Validator Builder', icon: 'code-xml', blurb: 'Build a whole validator, and leave out the wrong lines.' },
      { id: 'd3', mod: 'd3', title: 'Bug Doctors', icon: 'wrench', blurb: 'Find the faulty line in five validators and say what it does.' },
      { id: 'd4', mod: 'd4', title: 'Accept or Refuse?', icon: 'shield-check', blurb: 'You are the validator: sort eight codes, then say why each is refused.' },
    ] },
  { key: 'E', title: 'Exam room', tag: 'Booklet section 10', colour: '#A78BFA', opens: 'any',
    points: ['Thirteen past-paper questions, each with its model answer.', 'You tick your own marks for the written answer.', 'Each question then has two scored rounds.'],
    games: [
      exam(1, '2019 Q5(b)', 'A', 'Check a book code: 4 marks.'),
      exam(2, '2018 Q3(b)', 'A', 'Check a password: 11 marks.'),
      exam(3, '2024 Q4(e)', 'B', 'Check a postcode: 6 marks.'),
      exam(4, '2016 Q2(b)', 'B', 'Change the articles in a sentence: 11 marks.'),
      exam(5, '2022 Q2', 'C', 'Check a code with a number inside: 13 marks.'),
      exam(6, '2024 Q2', 'C', 'Check a plant code: 8 marks.'),
      exam(7, '2019 Q5(c)', 'C', 'Add up a book code: 8 marks.'),
      exam(8, '2023 Q4(a)', 'C', 'Generate a username: 11 marks.'),
      exam(9, 'Specimen Q4(a)', 'C', 'Read a quantity of stock: 9 marks.'),
      exam(10, '2014 Q2(b)', 'C', 'Read a number of items: 8 marks.'),
      exam(11, '2025 Q2(a)(i)', 'D', 'Check a licence plate: 9 marks.'),
      exam(12, '2021 Q3(a)(ii)', 'D', 'Check a pizza order: 8 marks.'),
      exam(13, 'Specimen Q4(b)', 'D', 'Read a stock code: 8 marks.'),
    ] },
  { key: 'F', title: 'Practicals', tag: 'Booklet section 11', colour: '#22D3EE', opens: 'any',
    points: ['Build each practical step by step, and see what each wrong line does.', 'Then write its extension on your own.', 'The Bug Clinic uses the parts your teacher has opened.'],
    games: [
      prac(1, 'The Name Reader', 'A', 'Practical 1: read a name and test its characters.'),
      prac(2, 'String Surgery', 'B', 'Practical 2: cut a full name into words and initials.'),
      prac(3, 'Username Maker', 'C', 'Practical 3: read a safe number and build a username.'),
      prac(4, 'The Fake ID Lab', 'D', 'Practical 4: check IDs and name the reason for each fake.'),
      { id: 'f5', mod: 'f5', title: 'Bug Clinic', icon: 'bug', blurb: 'Eight slips from the practicals: name each one and fix it.' },
    ] },
  { key: 'G', title: 'Definitions', tag: 'Booklet section 12', colour: '#F472B6', opens: 'any',
    points: ['Ten definitions, in the wording that earns the mark.', 'New terms arrive as your teacher opens parts.'],
    games: [
      { id: 'g1', mod: 'g1', title: 'Definition Match', icon: 'git-fork', blurb: 'Drag each term to its definition.' },
      { id: 'g2', mod: 'g2', title: 'Missing Words', icon: 'pencil-ruler', blurb: 'Put the right word in each gap.' },
      { id: 'g3', mod: 'g3', title: 'Self-Quiz Cards', icon: 'layers-2', blurb: 'Say each definition, then turn the card over.' },
    ] },
  { key: 'H', title: 'Final challenge', tag: 'Twenty mixed rounds', colour: '#F5F0FF', opens: 'ABCD',
    points: ['Twenty mixed rounds from parts A to D.', 'You have three lives.'],
    games: [
      { id: 'h1', mod: 'h1', title: 'Final Challenge', icon: 'trophy', blurb: 'Twenty mixed rounds and three lives.' },
    ] },
];

export const GAMES = [];
for (const z of ZONES) for (const g of z.games) GAMES.push({ ...g, zone: z });
export function findGame(id) { return GAMES.find((g) => g.id === id) || null; }
export function nextGame(id) { const i = GAMES.findIndex((g) => g.id === id); return i >= 0 && i < GAMES.length - 1 ? GAMES[i + 1] : null; }
