// Progress. Standalone: on this device only, under the arcade's key. Every access is wrapped: a private window or blocked
// storage just means nothing is remembered. In embed mode the school account holds the scores, so nothing is written here:
// no bleed between pupils on a shared machine, and any local stars from the standalone site are left alone.
let KEY = 'ssd-methods-arcade-v1';
let memoryOnly = false;

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    const v = raw ? JSON.parse(raw) : null;
    if (v && typeof v === 'object' && v.best) return v;
  } catch (e) { /* storage blocked */ }
  return { best: {}, sound: false, seen: {} };
}
let state = read();
if (!state.seen) state.seen = {};

function readSound() { try { return localStorage.getItem('arcade-sound') === '1'; } catch (e) { return false; } }

function write() {
  if (memoryOnly) return;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage blocked */ }
}

export function starsFor(score, max) {
  if (!max) return 0;
  const p = score / max;
  if (p >= 0.9) return 3;
  if (p >= 0.7) return 2;
  if (p >= 0.5) return 1;
  return 0;
}

export const store = {
  // Which arcade this page is. Called once by the shell before anything is drawn.
  use(key) { KEY = key; state = read(); if (!state.seen) state.seen = {}; },
  // Embed mode: the school account's scores replace whatever is held; nothing touches this machine's storage.
  useMemory() { memoryOnly = true; state = { best: {}, sound: readSound(), seen: {} }; },
  useLocal() { memoryOnly = false; state = read(); if (!state.seen) state.seen = {}; },
  replace(rows) {
    const best = {}, seen = {};
    for (const [id, r] of Object.entries(rows || {})) {
      if (!r || !r.max) continue;
      best[id] = { score: r.best, max: r.max, stars: starsFor(r.best, r.max), first: r.first, n: r.n };
      seen[id] = true;
    }
    state.best = best; state.seen = seen;
  },
  put(id, row) { if (row) state.best[id] = row; else delete state.best[id]; },
  best(id) { return state.best[id] || null; },
  // Keeps the best stars; a tie on stars keeps the higher score.
  record(id, score, max) {
    const stars = starsFor(score, max);
    const old = state.best[id];
    let improved = false;
    if (!old || stars > old.stars || (stars === old.stars && score / max > old.score / old.max)) {
      state.best[id] = { score, max, stars };
      improved = true;
    }
    state.seen[id] = true;
    write();
    return { stars, improved, best: state.best[id] };
  },
  totalStars() { return Object.values(state.best).reduce((a, b) => a + (b.stars || 0), 0); },
  played(id) { return !!state.seen[id]; },
  get sound() { return !!state.sound; },
  set sound(v) { state.sound = !!v; if (memoryOnly) { try { localStorage.setItem('arcade-sound', v ? '1' : '0'); } catch (e) { /* storage blocked */ } } write(); },
  reset() { state = { best: {}, sound: state.sound, seen: {} }; write(); },
};
