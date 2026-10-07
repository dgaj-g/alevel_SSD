// Router, arcade hub, game shell and results screen.
import { ZONES, GAMES, findGame, nextGame } from './registry.js';
import { store, starsFor } from './store.js';
import { h, icon, clear, rich, btn, sfx, confettiBurst, para } from './ui.js';

const app = document.getElementById('app');
const MAX = GAMES.length * 3;
let current = null; // { game, cleanup }
let lastPlayed = null;

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
function renderHub() {
  teardown();
  document.title = 'Methods Arcade · AS Software Systems Development';
  const total = store.totalStars();
  const hub = h('main', { class: 'hub' });

  hub.appendChild(h('header', { class: 'marquee' },
    h('div', null,
      h('h1', null, 'METHODS', h('span', null, 'ARCADE')),
      h('p', { class: 'sub' }, 'AS Software Systems Development · Topic 3 · Methods')),
    h('div', { class: 'scorebox' },
      h('div', null,
        h('div', { class: 'big' }, icon('star'), `${total}`, h('span', { style: { fontSize: '18px', color: 'var(--muted)', fontWeight: 700 } }, ` / ${MAX}`)),
        h('div', { class: 'meter' }, h('i', { style: { width: `${Math.round((total / MAX) * 100)}%` } }))),
      h('small', null, `${GAMES.length} games on the`, h('br'), 'Topic 3 booklet'))));

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
  const sb = soundButton();
  hub.appendChild(h('div', { class: 'hub-tools' },
    h('span', { class: 'row', style: { gap: '8px', color: 'var(--muted)', fontSize: '15px' } }, sb, 'Sound'),
    resetBtn));

  for (const z of ZONES) {
    const got = z.games.reduce((a, g) => a + ((store.best(g.id) || {}).stars || 0), 0);
    const sec = h('section', { class: 'zone', style: { '--zone': z.colour }, 'aria-labelledby': 'zone-' + z.key });
    const kp = btn('Key points', () => openPoints(z), 'ghost small', 'lightbulb');
    sec.appendChild(h('div', { class: 'zone-head' },
      h('div', { class: 'zone-letter', 'aria-hidden': 'true', style: z.key === 'H' ? { background: 'linear-gradient(135deg,#F472B6,#FBBF24,#22D3EE,#A78BFA)' } : null }, z.key),
      h('div', null, h('h2', { id: 'zone-' + z.key }, z.title), h('div', { class: 'tag' }, z.tag)),
      h('div', { class: 'grow' }),
      h('span', { class: 'zone-stars' }, icon('star'), `${got} / ${z.games.length * 3}`),
      kp));
    const grid = h('div', { class: 'cabinets' });
    for (const g of z.games) {
      const best = store.best(g.id);
      const card = h('button', { class: 'cab' + (store.played(g.id) ? '' : ''), type: 'button', dataset: { id: g.id },
        'aria-label': `${g.title}. ${g.blurb} ${best ? best.stars + ' of 3 stars.' : 'Not played yet.'}` },
        h('div', { class: 'screen' }, icon(g.icon), h('span', { class: 'code' }, g.id.toUpperCase())),
        h('div', { class: 'body' },
          h('h3', null, g.title),
          h('p', null, g.blurb),
          h('div', { class: 'foot' }, starRow(best ? best.stars : 0), h('span', null, best ? `Best ${best.score}/${best.max}` : 'Not played'))));
      card.addEventListener('click', () => { location.hash = '#/play/' + g.id; });
      grid.appendChild(card);
    }
    sec.appendChild(grid);
    hub.appendChild(sec);
  }

  hub.appendChild(h('footer', { class: 'hub-foot' },
    para('Our Lady\'s Grammar School, Newry · CCEA AS Software Systems Development, Unit 1 · Topic 3 Methods. Every game is built on the Topic 3 booklet; every C# output and error message shown was checked with the real compiler.'),
    para('Stars are saved on this device only.')));

  clear(app).appendChild(hub);
  if (lastPlayed) {
    const c = hub.querySelector(`.cab[data-id="${lastPlayed}"]`);
    if (c) { c.scrollIntoView({ block: 'center' }); c.focus({ preventScroll: true }); }
  } else window.scrollTo(0, 0);
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
  if (!game) { location.hash = '#/'; return; }
  teardown();
  lastPlayed = id;
  document.title = `${game.title} · Methods Arcade`;
  const bar = h('i');
  const progText = h('span', null, '');
  const shell = h('div', { class: 'game', style: { '--zone': game.zone.colour } },
    h('div', { class: 'topbar' },
      h('button', { class: 'iconbtn', type: 'button', 'aria-label': 'Back to the arcade', title: 'Back to the arcade', onclick: () => { location.hash = '#/'; } }, icon('arrow-left')),
      h('div', { class: 'title' }, h('small', null, `${game.zone.key} · ${game.zone.title}`), h('b', null, game.title)),
      h('div', { class: 'prog' }, progText, h('div', { class: 'bar' }, bar)),
      soundButton()));
  const stage = h('main', { class: 'stage' });
  shell.appendChild(stage);
  clear(app).appendChild(shell);
  window.scrollTo(0, 0);

  const token = {};
  current = { game, token, cleanups: [] };
  const api = {
    progress(i, n) { bar.style.width = `${Math.round((i / n) * 100)}%`; progText.textContent = n ? `${Math.min(i + 1, n)} of ${n}` : ''; },
    progressText(t) { progText.textContent = t; },
    finish(res) { if (current && current.token === token) showResults(game, res); },
    onCleanup(fn) { current && current.token === token && current.cleanups.push(fn); },
    wide() { stage.classList.add('wide'); },
    restart() { playGame(id); },
    get alive() { return current && current.token === token; },
  };
  try {
    const mod = await import(`./games/${game.mod}.js`);
    if (!current || current.token !== token) return;
    mod.default.mount(stage, api, game.arg);
  } catch (err) {
    console.error(err);
    stage.appendChild(h('div', { class: 'fb bad' }, icon('x'), h('div', null, para('This game could not load. Go back to the arcade and try again.'))));
  }
}

function teardown() {
  if (current) { current.cleanups.forEach((f) => { try { f(); } catch (e) { /* ignore */ } }); }
  current = null;
  document.querySelectorAll('.overlay, dialog.drawer').forEach((n) => n.remove());
}

/* ---------- results ---------- */
function showResults(game, { score, max, detail, title }) {
  score = Math.max(0, Math.min(score, max));
  const prev = store.best(game.id);
  const { stars, improved } = store.record(game.id, score, max);
  const best = store.best(game.id);
  const next = nextGame(game.id);
  const starEls = [0, 1, 2].map(() => icon('star'));
  const msg = stars === 3 ? 'Top marks' : stars === 2 ? 'Strong run' : stars === 1 ? 'Getting there' : 'Have another go';
  const box = h('div', { class: 'results', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Results' },
    h('h2', null, title || msg),
    h('div', { class: 'bigstars', 'aria-label': `${stars} of 3 stars` }, starEls),
    h('p', { class: 'score' }, `${score} / ${max}`),
    h('p', { class: 'best' }, improved && prev ? 'New best for this game' : `Best: ${best.score} / ${best.max}`),
    detail ? h('div', { class: 'detail' }, detail) : null,
    h('p', { class: 'muted', style: { fontSize: '14px', margin: '0 0 14px' } }, '3 stars for 90%, 2 for 70%, 1 for 50%.'),
    h('div', { class: 'btns' },
      btn('Play again', () => playGame(game.id), '', 'rotate-ccw'),
      next ? btn('Next game', () => { location.hash = '#/play/' + next.id; }, 'primary', 'chevron-right') : null,
      btn('Arcade', () => { location.hash = '#/'; }, 'ghost', 'house')));
  const ov = h('div', { class: 'overlay' }, box);
  document.body.appendChild(ov);
  const first = box.querySelector('.btn.primary') || box.querySelector('.btn');
  setTimeout(() => first && first.focus(), 50);
  starEls.forEach((s, i) => setTimeout(() => { if (i < stars) { s.classList.add('on'); sfx.star(i); } }, 350 + i * 320));
  if (stars === 3) setTimeout(() => { sfx.win(); confettiBurst(); }, 350 + 3 * 320);
}

/* ---------- router ---------- */
function route() {
  const m = location.hash.match(/^#\/play\/([a-z0-9]+)/);
  if (m) playGame(m[1]); else renderHub();
}
window.addEventListener('hashchange', route);
route();
