// Round-based game flow shared by most cabinets.
import { h, clear, icon, btn, instr, para, scrollIntoViewSoft, shuffle, choiceSet, fb, sfx, consolePanel, errorList } from './ui.js';

// Lines of a program as the pupil sees it: the methods, then Main with its body.
export function programLines(cs) {
  const m = (cs.methods || '').replace(/\s+$/, '');
  const lines = m ? m.split('\n') : [];
  if (cs.mainOnly) return (cs.main || '').split('\n');
  if (lines.length) lines.push('');
  lines.push('static void Main(string[] args)', '{');
  for (const l of (cs.main || '').split('\n')) lines.push(l ? '    ' + l : '');
  lines.push('}');
  return lines;
}
export function outLines(out) { return out.replace(/\n$/, '').split('\n'); }

// Runs a list of rounds. Each round: { title, intro?, run(box, ctx) → Promise<{score, max, note?}> }.
// ctx.next(label) shows a button in the footer and resolves when it is pressed.
export async function runRounds(stage, api, rounds, opts = {}) {
  let score = 0, max = 0;
  const notes = [];
  for (let i = 0; i < rounds.length; i++) {
    if (!api.alive) return;
    const r = rounds[i];
    api.progress(i, rounds.length);
    clear(stage);
    window.scrollTo(0, 0);
    const box = h('div');
    const foot = h('div', { class: 'actions' });
    stage.append(
      h('h2', { class: 'round-title' }, r.title, rounds.length > 1 ? h('span', { class: 'pill' }, `Round ${i + 1} of ${rounds.length}`) : null),
      r.intro ? instr(r.intro, r.intro2) : null,
      box, foot);
    const ctx = {
      foot,
      get alive() { return api.alive; },
      next(label = i === rounds.length - 1 ? 'See my score' : 'Next round', extra) {
        return new Promise((resolve) => {
          clear(foot);
          if (extra) foot.appendChild(extra);
          const b = btn(label, () => resolve(), 'primary', 'chevron-right');
          foot.appendChild(b);
          setTimeout(() => { b.focus({ preventScroll: true }); scrollIntoViewSoft(b); }, 60);
        });
      },
      setFoot(...kids) { clear(foot); kids.forEach((k) => k && foot.appendChild(k)); },
    };
    const res = await r.run(box, ctx);
    if (!res) return;
    score += res.score; max += res.max;
    notes.push({ title: r.title, score: res.score, max: res.max });
  }
  api.progress(rounds.length, rounds.length);
  const detail = notes.length > 1 ? h('table', { class: 'grid' },
    h('tbody', null, notes.map((n) => h('tr', null, h('td', null, n.title), h('td', { class: 'c' }, `${n.score} / ${n.max}`))))) : null;
  api.finish({ score, max, detail: opts.detail || detail });
}

// A "Check" button that runs fn once, then is replaced by the round's Next button by the caller.
export function checkButton(ctx, fn, label = 'Check', note) {
  return new Promise((resolve) => {
    const n = note ? (note instanceof Node ? note : h('span', { class: 'note' }, note)) : null;
    const b = btn(label, async () => {
      const ok = await fn();
      if (ok === false) return; // not ready (e.g. empty slots) — keep the button
      resolve();
    }, 'primary', 'check');
    ctx.setFoot(n, b);
  });
}

export function explain(lines) {
  return h('div', { class: 'fb info' }, icon('lightbulb'), h('div', null, lines.map((t) => para(t))));
}

// One question at a time: show(item) draws the code, then a shuffled choice set; after(item, ok, picked) adds anything extra.
// item: {q, options:[string], a: index of the right option}. scoreOf(item, pickedIndex) → [pts, max] overrides 1-or-0.
export function quizRound({ title, intro, intro2, items, show, after, mono = false, cols, scoreOf, why = (it) => it.why }) {
  return {
    title, intro, intro2,
    async run(box, ctx) {
      let pts = 0, max = 0;
      for (let k = 0; k < items.length; k++) {
        if (!ctx.alive) return null;
        const it = items[k];
        box.replaceChildren();
        const order = shuffle(it.options.map((_, i) => i));
        const cs = choiceSet(order.map((i) => it.options[i]), { mono, cols });
        const card = h('div', { class: 'card' },
          h('p', { class: 'note', style: { margin: '0 0 8px' } }, `Question ${k + 1} of ${items.length}${it.title ? ' · ' + it.title : ''}`),
          show ? show(it) : null, h('div', { class: 'mt' }), it.q ? para(it.q, 'bigq') : null, cs.el);
        box.append(card);
        window.scrollTo(0, 0);
        await checkButton(ctx, () => {
          if (cs.value() < 0) return false;
          const picked = order[cs.value()];
          cs.lock(order.indexOf(it.a));
          const [p, m] = scoreOf ? scoreOf(it, picked) : [picked === it.a ? 1 : 0, 1];
          pts += p; max += m;
          const ok = p === m;
          (ok ? sfx.good : sfx.bad)();
          const f = fb(ok ? 'good' : p ? 'info' : 'bad', why(it, picked, p, m));
          card.append(f);
          const extra = after ? after(it, ok, picked) : null;
          if (extra) card.append(extra);
          scrollIntoViewSoft(f);
        }, 'Check', 'Pick one.');
        await ctx.next(k === items.length - 1 ? 'Finish the round' : 'Next question');
      }
      return { score: pts, max };
    },
  };
}

// What the real program did: a Debug Console with its output, or the Error List.
export function realResult(expect) {
  if (expect.msgs) return errorList(expect.msgs);
  const con = consolePanel();
  outLines(expect.out).forEach((l) => con.print(l));
  return con.el;
}

// A console that replays a run: ['out', text] · ['in', what was typed] · ['crash', exception, message].
export function transcript(ev, opts = {}) {
  const con = consolePanel(opts);
  playEvents(con, ev);
  return con;
}
export function playEvents(con, ev) {
  for (const e of ev) {
    if (e[0] === 'in') { con.write(e[1] || '', 'in'); con.print(); continue; }
    if (e[0] === 'crash') {
      con.print(`Unhandled exception. System.${e[1]}: ${e[2]}`, 'err');
      con.print('(the program stops here)', 'sys');
      continue;
    }
    const parts = e[1].split('\n');
    parts.forEach((p, i) => { if (i < parts.length - 1) con.print(p); else if (p) con.write(p); });
  }
}
