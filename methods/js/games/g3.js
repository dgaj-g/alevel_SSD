// G3 Quick-Fire Cards — say it, flip it, be honest. Cards you have not got yet come back until you have.
import { h, icon, btn, fb, shuffle, sfx, para, scrollIntoViewSoft } from '../ui.js';
import { runRounds } from '../kit.js';
import { TERMS, SELF_QUIZ } from '../data/g.js';

function deckRound({ title, intro, intro2, cards, frontLabel, backLabel }) {
  return {
    title, intro, intro2,
    async run(box, ctx) {
      const deck = shuffle(cards).map((c) => ({ ...c, tries: 0 }));
      const n = deck.length;
      let first = 0, streak = 0, best = 0, done = 0;
      const missed = [];
      const stats = h('div', { class: 'deckstats' });
      const slot = h('div');
      box.append(stats, slot);
      const drawStats = () => stats.replaceChildren(
        h('span', { class: 'pill' }, `${n - done} card${n - done === 1 ? '' : 's'} left`),
        h('span', { class: 'pill' }, `${first} got first time`),
        h('span', { class: 'pill streak' + (streak >= 3 ? ' hot' : '') }, icon('flame'), `Streak ${streak}`));
      while (deck.length) {
        if (!ctx.alive) return null;
        const c = deck.shift();
        c.tries++;
        drawStats();
        const card = h('div', { class: 'flipcard', tabindex: '0', role: 'button', 'aria-label': 'Card. Press to flip.' },
          h('div', { class: 'inner' },
            h('div', { class: 'face front' }, h('div', { class: 'lbl' }, c.tries > 1 ? `${frontLabel} · again` : frontLabel), para(c.front, 'q')),
            h('div', { class: 'face back' }, h('div', { class: 'lbl' }, backLabel), para(c.back, 'a'))));
        slot.replaceChildren(card);
        // 1 — flip
        await new Promise((resolve) => {
          const flip = () => {
            if (card.classList.contains('flipped')) return;
            card.classList.add('flipped');
            card.setAttribute('aria-label', 'Card, answer side.');
            sfx.place();
            resolve();
          };
          card.addEventListener('click', flip);
          card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
          const b = btn('Flip the card', flip, 'primary', 'repeat-2');
          ctx.setFoot(h('span', { class: 'note' }, 'Say the answer first — out loud or in your head.'), b);
          setTimeout(() => b.focus({ preventScroll: true }), 60);
        });
        if (!ctx.alive) return null;
        // 2 — be honest
        const got = await new Promise((resolve) => {
          const no = btn('Not yet', () => resolve(false), 'ghost', 'rotate-ccw');
          const yes = btn('Got it', () => resolve(true), 'primary', 'check');
          ctx.setFoot(h('span', { class: 'note' }, 'Did you say all of it?'), no, yes);
          setTimeout(() => yes.focus({ preventScroll: true }), 60);
        });
        if (got) {
          done++;
          if (c.tries === 1) first++;
          streak++; best = Math.max(best, streak);
          sfx.good();
        } else {
          streak = 0;
          if (c.tries === 1) missed.push(c);
          deck.splice(Math.min(2, deck.length), 0, c);
          sfx.bad();
        }
      }
      drawStats();
      const full = first === n;
      slot.replaceChildren(
        fb(full ? 'good' : 'info', `${first} of ${n} got first time. Longest streak: ${best}.`,
          missed.length ? 'Learn these — they came back:' : 'Every card first time. Come back tomorrow and do it again.'),
        missed.length ? h('div', { class: 'card revisit' }, missed.map((c) => h('div', { class: 'rv' }, para(c.front, 'rvq'), para(c.back, 'rva')))) : null);
      if (full) sfx.win();
      scrollIntoViewSoft(slot);
      await ctx.next();
      return { score: first, max: n, label: `${first} / ${n} first time` };
    },
  };
}

export default {
  mount(stage, api) {
    runRounds(stage, api, [
      deckRound({
        title: 'Say the definition',
        intro: 'Each card shows a term. Say its definition — the booklet\'s wording — then flip the card and check yourself.',
        intro2: 'Be honest. A card you have not got comes back a little later. You score for the cards you get first time.',
        cards: TERMS.map((t) => ({ front: `**${t.term}**`, back: t.wording })),
        frontLabel: 'Define', backLabel: 'The wording that earns the mark',
      }),
      deckRound({
        title: 'The self-quiz',
        intro: 'Activity 12 from the booklet. Answer each question, then flip the card and check yourself.',
        intro2: 'A card you have not got comes back a little later.',
        cards: SELF_QUIZ.map((s) => ({ front: s.q, back: s.a })),
        frontLabel: 'Question', backLabel: 'Answer',
      }),
    ]);
  },
};
