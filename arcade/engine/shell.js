// Router, hub, game shell and results screen, shared by every arcade. Takes a registry and its wording.
import { store, starsFor } from './store.js';
import { h, icon, clear, rich, btn, sfx, confettiBurst, para } from './ui.js';
import { bridge } from './bridge.js';
import { zoneOpen, gameOpen, carryOn } from './locks.js';
import { S } from './strings.js';

let cfg, ZONES, GAMES, findGame, nextGame, MAX;
let app, current = null, lastPlayed = null, who = null, pos = null, resultsLine = null, lockNote = null;

const embedded = () => bridge.embed;
const isOpen = (g) => !embedded() || gameOpen(g, g.zone, bridge.open);

function go(hash) {
  if (bridge.framed) { history.replaceState(null, '', hash); route(); } else location.hash = hash;
}

function starRow(n, cls = 'stars') {
  return h('span', { class: cls, 'aria-label': `${n} of 3 stars` }, [0, 1, 2].map((i) => {
    const s = icon('star'); if (i < n) s.classList.add('on'); return s;
  }));
}

function soundButton() {
  const b = h('button', { class: 'iconbtn', type: 'button' });
  const paint = () => {
    clear(b).appendChild(icon(store.sound ? 'volume-2' : 'volume-x'));
    b.setAttribute('aria-label', store.sound ? 'Sound is on. Switch it off' : 'Sound is off. Switch it on');
    b.title = store.sound ? 'Sound on' : 'Sound off';
  };
  b.addEventListener('click', () => { store.sound = !store.sound; paint(); if (store.sound) sfx.good(); });
  paint();
  return b;
}

/* ---------- hub ---------- */
function bestRows() {
  const out = {};
  for (const g of GAMES) { const b = store.best(g.id); if (b) out[g.id] = { n: b.n === undefined ? 1 : b.n }; }
  return out;
}

function renderHub() {
  teardown();
  document.title = cfg.docTitle;
  const pending = bridge.pending;
  const inEmbed = embedded();
  const total = store.totalStars();
  const hub = h('main', { class: 'hub' + (pending ? ' pending' : '') });

  if (bridge.mode === 'standalone') {
    hub.appendChild(h('div', { class: 'embed-banner', role: 'note' }, S.banner + ' ', h('a', { href: S.bannerUrl }, S.bannerUrl)));
  }

  hub.appendChild(h('header', { class: 'marquee' },
    h('div', null,
      h('h1', null, cfg.titleA, h('span', null, cfg.titleB)),
      h('p', { class: 'sub' }, inEmbed && who ? S.hello(who) : pending ? S.loading : cfg.subtitle)),
    h('div', { class: 'scorebox' },
      h('div', null,
        h('div', { class: 'big' }, icon('star'), `${total}`, h('span', { style: { fontSize: '18px', color: 'var(--muted)', fontWeight: 700 } }, ` / ${MAX}`)),
        h('div', { class: 'meter' }, h('i', { style: { width: `${Math.round((total / MAX) * 100)}%` } }))),
      inEmbed ? carryButton() : h('small', null, `${GAMES.length} games on the`, h('br'), cfg.booklet))));

  const sb = soundButton();
  const tools = [h('span', { class: 'row', style: { gap: '8px', color: 'var(--muted)', fontSize: '15px' } }, sb, 'Sound')];
  if (!inEmbed && !pending) {
    const resetBtn = btn('Reset progress', null, 'ghost small', 'rotate-ccw');
    let armed = false;
    resetBtn.addEventListener('click', () => {
      if (!armed) {
        armed = true;
        resetBtn.lastChild.textContent = 'Tap again to wipe every star';
        setTimeout(() => { armed = false; if (resetBtn.isConnected) resetBtn.lastChild.textContent = 'Reset progress'; }, 4000);
        return;
      }
      store.reset(); renderHub();
    });
    tools.push(resetBtn);
  }
  hub.appendChild(h('div', { class: 'hub-tools' }, tools));

  for (const z of ZONES) {
    const got = z.games.reduce((a, g) => a + ((store.best(g.id) || {}).stars || 0), 0);
    const locked = inEmbed && !zoneOpen(z, bridge.open) && !z.games.some((g) => isOpen({ ...g, zone: z }));
    const sec = h('section', { class: 'zone' + (locked ? ' locked' : ''), style: { '--zone': z.colour }, 'aria-labelledby': 'zone-' + z.key });
    const kp = btn('Key points', () => openPoints(z), 'ghost small', 'lightbulb');
    sec.appendChild(h('div', { class: 'zone-head' },
      h('div', { class: 'zone-letter', 'aria-hidden': 'true', style: z.key === 'H' && !z.flatLetter ? { background: 'linear-gradient(135deg,#F472B6,#FBBF24,#22D3EE,#A78BFA)' } : null }, locked ? icon('lock') : z.key),
      h('div', null, h('h2', { id: 'zone-' + z.key }, z.title), h('div', { class: 'tag' }, locked ? S.locked : z.tag)),
      h('div', { class: 'grow' }),
      h('span', { class: 'zone-stars' }, icon('star'), `${got} / ${z.games.length * 3}`),
      locked ? null : kp));
    const note = h('p', { class: 'zone-note', role: 'status', hidden: true }, S.locked);
    const grid = h('div', { class: 'cabinets' });
    for (const g of z.games) {
      const best = store.best(g.id);
      const shut = inEmbed && !gameOpen(g, z, bridge.open);
      const card = h('button', { class: 'cab' + (shut ? ' shut' : ''), type: 'button', dataset: { id: g.id },
        'aria-label': `${g.title}. ${g.blurb} ${best ? best.stars + ' of 3 stars.' : 'Not played yet.'}${shut ? ' ' + S.locked : ''}` },
        h('div', { class: 'screen' }, icon(shut ? 'lock' : g.icon), h('span', { class: 'code' }, g.id.toUpperCase())),
        h('div', { class: 'body' },
          h('h3', null, g.title),
          h('p', null, g.blurb),
          h('div', { class: 'foot' }, starRow(best ? best.stars : 0), h('span', null, best ? `Best ${best.score}/${best.max}` : 'Not played'))));
      card.addEventListener('click', () => {
        if (bridge.pending) return;
        if (shut) { note.hidden = false; note.scrollIntoView({ block: 'nearest' }); return; }
        go('#/play/' + g.id);
      });
      grid.appendChild(card);
    }
    sec.appendChild(note);
    sec.appendChild(grid);
    hub.appendChild(sec);
  }

  hub.appendChild(h('footer', { class: 'hub-foot' },
    para(cfg.footer),
    inEmbed || pending ? para(S.saved) : para('Stars are saved on this device only.')));

  clear(app).appendChild(hub);
  if (lockNote) {
    const c = hub.querySelector(`.cab[data-id="${lockNote}"]`);
    if (c) { const n = c.closest('.zone').querySelector('.zone-note'); n.hidden = false; c.scrollIntoView({ block: 'center' }); }
    lockNote = null;
  } else if (lastPlayed) {
    const c = hub.querySelector(`.cab[data-id="${lastPlayed}"]`);
    if (c) { c.scrollIntoView({ block: 'center' }); c.focus({ preventScroll: true }); }
  } else window.scrollTo(0, 0);
}

function carryButton() {
  const id = carryOn(ZONES, bridge.open, bestRows(), pos);
  if (!id) return h('small', { class: 'carry-none' }, S.anyAgain);
  const g = findGame(id);
  const b = btn(`${S.carry}: ${g.title}`, () => go('#/play/' + id), 'primary small carry', 'chevron-right');
  b.dataset.carry = id;
  return b;
}

function openPoints(z) {
  const d = h('dialog', { class: 'drawer', style: { '--zone': z.colour } },
    h('header', null,
      h('div', { class: 'zone-letter', style: { width: '38px', height: '38px', fontSize: '21px', background: z.colour } }, z.key),
      h('h3', null, `${z.title} — key points`),
      h('button', { class: 'iconbtn', type: 'button', 'aria-label': 'Close', onclick: () => d.close() }, icon('x'))),
    h('div', { class: 'inner' }, h('p', { class: 'muted' }, z.tag), h('ul', null, z.points.map((p) => h('li', null, rich(p))))));
  d.addEventListener('close', () => d.remove());
  d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
  document.body.appendChild(d);
  d.showModal();
}

/* ---------- game shell ---------- */
async function playGame(id) {
  const game = findGame(id);
  if (!game) { go('#/'); return; }
  if (!isOpen(game)) { lockNote = id; history.replaceState(null, '', '#/'); renderHub(); return; }
  teardown();
  lastPlayed = id;
  pos = id;
  document.title = `${game.title} · ${cfg.shortTitle}`;
  const bar = h('i');
  const progText = h('span', null, '');
  const back = bridge.framed ? S.allGames : 'Back to the arcade';
  const shell = h('div', { class: 'game', style: { '--zone': game.zone.colour } },
    h('div', { class: 'topbar' },
      h('button', { class: 'iconbtn', type: 'button', 'aria-label': back, title: back, onclick: () => go('#/') }, icon('arrow-left')),
      h('div', { class: 'title' }, h('small', null, `${game.zone.key} · ${game.zone.title}`), h('b', null, game.title)),
      h('div', { class: 'prog' }, progText, h('div', { class: 'bar' }, bar)),
      soundButton()));
  const stage = h('main', { class: 'stage' });
  shell.appendChild(stage);
  clear(app).appendChild(shell);
  window.scrollTo(0, 0);

  const token = {};
  current = { game, token, cleanups: [], round: 1, rounds: 0, finished: false };
  const here = current;
  bridge.start(id);
  const api = {
    progress(i, n) {
      bar.style.width = `${Math.round((i / n) * 100)}%`; progText.textContent = n ? `${Math.min(i + 1, n)} of ${n}` : '';
      here.round = Math.min(i + 1, n || 1); here.rounds = n;
    },
    progressText(t) { progText.textContent = t; },
    finish(res) { if (current && current.token === token) { here.finished = true; showResults(game, res); } },
    onCleanup(fn) { current && current.token === token && current.cleanups.push(fn); },
    wide() { stage.classList.add('wide'); },
    restart() { playGame(id); },
    get alive() { return current && current.token === token; },
  };
  try {
    const mod = await cfg.loadGame(game.mod);
    if (!current || current.token !== token) return;
    mod.default.mount(stage, api, game.arg);
  } catch (err) {
    console.error(err);
    stage.appendChild(h('div', { class: 'fb bad' }, icon('x'), h('div', null, para('This game could not load. Go back to the arcade and try again.'))));
  }
}

function teardown() {
  if (current) {
    if (!current.finished) bridge.leave(current.game.id, current.round, current.rounds);
    current.cleanups.forEach((f) => { try { f(); } catch (e) { /* ignore */ } });
  }
  current = null;
  resultsLine = null;
  document.querySelectorAll('.overlay, dialog.drawer').forEach((n) => n.remove());
}

/* ---------- results ---------- */
function showResults(game, { score, max, detail, title }) {
  score = Math.max(0, Math.min(score, max));
  const prev = store.best(game.id);
  const { stars, improved } = store.record(game.id, score, max);
  const best = store.best(game.id);
  if (bridge.framed) best.n = (prev && prev.n ? prev.n : 0) + 1;
  bridge.finish(game.id, score, max, title || game.title);
  let next = nextGame(game.id);
  while (next && !isOpen(next)) next = nextGame(next.id);
  const starEls = [0, 1, 2].map(() => icon('star'));
  const msg = stars === 3 ? 'Top marks' : stars === 2 ? 'Strong run' : stars === 1 ? 'Getting there' : 'Have another go';
  resultsLine = h('p', { class: 'saveline', role: 'status' }, bridge.embed ? S.saving : '');
  resultsLine.prevRow = prev;
  resultsLine.game = game.id;
  const buttons = [
    btn('Play again', () => playGame(game.id), '', 'rotate-ccw'),
    next ? btn('Next game', () => go('#/play/' + next.id), 'primary', 'chevron-right') : null,
    btn(bridge.framed ? S.allGames : 'Arcade', () => go('#/'), 'ghost', 'house'),
  ].filter(Boolean);
  const box = h('div', { class: 'results', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Results' },
    h('h2', null, title || msg),
    h('div', { class: 'bigstars', 'aria-label': `${stars} of 3 stars` }, starEls),
    h('p', { class: 'score' }, `${score} / ${max}`),
    h('p', { class: 'best' }, improved && prev ? 'New best for this game' : `Best: ${best.score} / ${best.max}`),
    bridge.embed ? resultsLine : null,
    detail ? h('div', { class: 'detail' }, detail) : null,
    h('p', { class: 'muted', style: { fontSize: '14px', margin: '0 0 14px' } }, '3 stars for 90%, 2 for 70%, 1 for 50%.'),
    h('div', { class: 'btns' }, buttons));
  // A fast tap cannot skip the score: the buttons wake after 600 ms.
  buttons.forEach((b) => { b.disabled = true; });
  const ov = h('div', { class: 'overlay' }, box);
  document.body.appendChild(ov);
  setTimeout(() => {
    buttons.forEach((b) => { b.disabled = false; });
    const first = box.querySelector('.btn.primary') || box.querySelector('.btn');
    if (first) first.focus();
  }, 600);
  starEls.forEach((s, i) => setTimeout(() => { if (i < stars) { s.classList.add('on'); sfx.star(i); } }, 350 + i * 320));
  if (stars === 3) setTimeout(() => { sfx.win(); confettiBurst(); }, 350 + 3 * 320);
}

/* ---------- bridge events ---------- */
function repaintIfHub() { if (!current) renderHub(); }
const handlers = {
  state(m) {
    who = m.name || null; pos = m.pos || null;
    store.useMemory(); store.replace(m.best);
    route();
  },
  locked() { repaintIfHub(); },
  saved(m) {
    store.put(m.game, { score: m.best, max: m.max, stars: starsFor(m.best, m.max), first: m.first, n: m.n });
    if (resultsLine && resultsLine.game === m.game) {
      resultsLine.textContent = m.n <= 1 ? S.savedFirst : S.savedAgain(m.first, m.best, m.max);
    }
  },
  failed(m) { if (resultsLine && resultsLine.game === m.game) resultsLine.textContent = S.failed; },
  refused(m) {
    // The server said no, so the score does not count. Put the card back as it was.
    if (resultsLine && resultsLine.game === m.game) {
      store.put(m.game, resultsLine.prevRow);
      resultsLine.textContent = m.code === 'locked' ? S.lockedRun : S.tooFast;
    }
  },
  standalone() { store.useLocal(); route(); },
};

/* ---------- router ---------- */
function route() {
  if (bridge.pending) { renderHub(); return; } // a hash waits until the state says what is open
  const m = location.hash.match(/^#\/play\/([a-z0-9]+)/);
  if (m) playGame(m[1]); else renderHub();
}

export function start(config) {
  cfg = config;
  ({ ZONES, GAMES, findGame, nextGame } = config.registry);
  MAX = GAMES.length * 3;
  app = document.getElementById('app');
  store.use(config.storeKey);
  if (bridge.framed) store.useMemory();
  window.addEventListener('hashchange', route);
  bridge.connect(config.arcade, GAMES.map((g) => ({ id: g.id, title: g.title, zone: g.zone.key, max: 0 })), handlers);
  route();
}
