// A1 Count the Boxes: length, the character in a box, the last box and the box past the end.
import { sample, shuffle, randInt } from '../../../arcade/engine/ui.js';
import { runRounds } from '../../../arcade/engine/kit.js';
import { boxRow, answersRound } from './_t4.js';
import { WORDS, PAST_END } from '../data/a.js';

const setup = (w) => `string word = "${w}";`;
const nonEmpty = WORDS.filter(Boolean);
const shownCh = (c) => (c === ' ' ? 'a space' : `'${c}'`);
export default {
  mount(stage, api) {
    runRounds(stage, api, [
      answersRound({
        title: 'How long is each string?',
        intro: 'A string is a row of characters, numbered from 0. Type what `word.Length` gives for each word.',
        items: () => [...sample(nonEmpty, 3), ''].map((w) => ({
          head: () => boxRow(w).el, lines: [setup(w), 'word.Length'], answer: String(w.length), kind: 'num',
          why: w ? `The boxes go from 0 to ${w.length - 1}, so there are ${w.length} of them.` : 'There are no boxes, so the length is 0.',
        })),
      }),
      answersRound({
        title: 'Which character is in the box?',
        intro: 'Type the character each line gives. Quotes are optional, but capitals count.',
        items: () => sample(nonEmpty, 4).map((w) => { let i; do { i = randInt(0, w.length - 1); } while (w[i] === ' '); return {
          head: () => boxRow(w).el, lines: [setup(w), `word[${i}]`], answer: w[i], kind: 'text', why: `Box ${i} holds ${shownCh(w[i])}.`,
        }; }),
      }),
      answersRound({
        title: 'The last box',
        intro: 'The last box is always one less than the length. Type the character each line gives, then say what the last line does.',
        items: () => [...sample(nonEmpty.filter((w) => w[w.length - 1] !== ' '), 3).map((w) => ({
          head: () => boxRow(w).el, lines: [setup(w), 'word[word.Length - 1]'], answer: w[w.length - 1], kind: 'text',
          why: `The length is ${w.length}, so the last box is box ${w.length - 1}: ${shownCh(w[w.length - 1])}.`,
        })), { ...PAST_END, shuffled: shuffle(PAST_END.options), cs: undefined, expect: undefined }],
      }),
    ]);
  },
};
