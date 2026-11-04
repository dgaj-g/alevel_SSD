// B3 Strings Never Change: predict six programs, including results nobody stored and characters that add up.
import { runRounds } from '../../../arcade/engine/kit.js';
import { answersRound } from './_t4.js';
import { PREDICTS } from '../data/b.js';

export default {
  mount(stage, api) {
    runRounds(stage, api, [answersRound({
      title: 'What does each program print?',
      intro: 'Read each short program and type exactly what it prints.',
      items: () => PREDICTS.map((p) => ({ lines: p.lines, answer: p.answer, kind: p.kind, why: p.why })),
    })]);
  },
};
