// C2 Digit or Code?: a digit character is a number only after it is parsed.
import { shuffle } from '../../../arcade/engine/ui.js';
import { runRounds } from '../../../arcade/engine/kit.js';
import { answersRound } from './_t4.js';
import { DIGIT_VALUES, DIGIT_CHOICE } from '../data/c.js';

export default {
  mount(stage, api) {
    runRounds(stage, api, [
      answersRound({ title: 'What does each line give?', intro: 'The character and the number are different things. Type the number each line gives.',
        items: () => DIGIT_VALUES.map((d) => ({ lines: d.lines, answer: d.answer, kind: 'num', why: d.why })) }),
      answersRound({ title: 'Which line is the safe one?', intro: 'Pick the one line that does what the question asks.',
        items: () => DIGIT_CHOICE.map((d) => ({ q: d.q, options: d.options, a: d.a, shuffled: shuffle(d.options), mono: true, why: d.why })) }),
    ]);
  },
};
