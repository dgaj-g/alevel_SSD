// The conversation with the AS platform page that holds this arcade in a frame. Spec section 7.4.
// Modes: 'standalone' (bare URL, or no state within two seconds), 'pending' (framed, waiting), 'embed' (framed, state arrived).
const FRAMED = new URLSearchParams(location.search).get('embed') === '1' && window.parent !== window;
let mode = FRAMED ? 'pending' : 'standalone';
let open = null; let handlers = {};
const post = (kind, body) => { if (FRAMED) window.parent.postMessage({ t: 'arcade', v: 1, kind, ...body }, '*'); };

function onMessage(e) {
  if (e.source !== window.parent) return;
  const m = e.data;
  if (!m || m.t !== 'platform' || m.v !== 1) return;
  if (m.kind === 'state') { open = m.open || ''; mode = 'embed'; handlers.state && handlers.state(m); }
  else if (m.kind === 'locked') { open = m.open || ''; handlers.locked && handlers.locked(m); }
  else if (m.kind === 'saved') handlers.saved && handlers.saved(m);
  else if (m.kind === 'failed') handlers.failed && handlers.failed(m);
  else if (m.kind === 'refused') handlers.refused && handlers.refused(m);
}

export const bridge = {
  get framed() { return FRAMED; },
  get mode() { return mode; },
  get embed() { return mode === 'embed'; },
  get pending() { return mode === 'pending'; },
  get open() { return open; },
  connect(arcade, games, on) {
    handlers = on;
    if (!FRAMED) return;
    window.addEventListener('message', onMessage);
    post('ready', { arcade, games });
    // No state in two seconds: behave as the live site does. A late state still switches over.
    setTimeout(() => { if (mode === 'pending') { mode = 'standalone'; handlers.standalone && handlers.standalone(); } }, 2000);
  },
  start(game) { post('start', { game }); },
  finish(game, score, max, title) { post('finish', { game, score, max, title }); },
  leave(game, round, rounds) { post('leave', { game, round, rounds }); },
};
