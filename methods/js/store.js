// Progress on this device only. Every access is wrapped: a private window or blocked storage just means nothing is remembered.
const KEY = 'ssd-methods-arcade-v1';

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

function write() {
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
  set sound(v) { state.sound = !!v; write(); },
  reset() { state = { best: {}, sound: state.sound, seen: {} }; write(); },
};
