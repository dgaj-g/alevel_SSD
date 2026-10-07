// Round-based game flow shared by most cabinets.
import { h, clear, icon, btn, instr, para, scrollIntoViewSoft } from './ui.js';

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
