// The Theory side's pupil pages: the Home tile, the Theory page, and the topic page that holds an arcade in a frame.
// The parent page owns every server call (spec 7.5): the arcade only posts what happened; a call that cannot reach the server
// waits in a queue on this machine and goes, in order, before anything new.
window.Theory = (function () {
  const TG = window.THEORY_GAMES;
  const DEV = location.hostname === 'localhost';
  const ORIGIN = DEV ? 'http://localhost:8852' : 'https://dgaj-g.github.io';
  const ROOT = DEV ? ORIGIN : ORIGIN + '/alevel_SSD';
  const ARCADE = { methods: 'methods', strings: 'strings' };
  const LATER = ['t1', 't2'];
  let X = null, TH = { open: {}, T: {} }, cur = null, queue = [], busy = false, hadFail = false, retry = null, refresh = null;
  const T = (k, v) => X.T(k, v), h = (s) => X.h(s);
  const topics = () => Object.keys(TG).filter((k) => TG[k].games.length);
  const qKey = () => 'theory:queue:' + X.me().email;
  function loadQueue() { try { queue = JSON.parse(localStorage.getItem(qKey()) || '[]'); } catch (e) { queue = []; } hadFail = queue.length > 0; }
  function saveQueue() { try { if (queue.length) localStorage.setItem(qKey(), JSON.stringify(queue)); else localStorage.removeItem(qKey()); } catch (e) { /* blocked storage: the queue lasts as long as the page */ } }

  // ---------- what the record says ----------
  function starsOf(score, max) { if (!max) return 0; const p = score / max; return p >= 0.9 ? 3 : p >= 0.7 ? 2 : p >= 0.5 ? 1 : 0; }
  const recOf = (topic) => (TH.T && TH.T[topic]) || {};
  const openOf = (topic) => (TH.open && TH.open[topic]) || '';
  function gameOpen(topic, g, open) {
    if (g.part) return open.includes(g.part);
    const z = TG[topic].zones.find((x) => x.key === g.zone) || {};
    if (z.opens === 'any') return open.length > 0;
    if (z.opens) return [...z.opens].every((l) => open.includes(l));
    return open.includes(g.zone);
  }
  function sums(topic) {
    const rec = recOf(topic), games = TG[topic].games;
    let stars = 0, played = 0;
    games.forEach((g) => { const r = rec[g.id]; if (r) { stars += starsOf(r[1], r[2]); played++; } });
    return { stars, played, max: games.length * 3 };
  }
  function carryOn(topic) {
    const rec = recOf(topic), open = openOf(topic), ids = TG[topic].games.filter((g) => gameOpen(topic, g, open));
    const pos = rec._pos;
    if (pos && ids.some((g) => g.id === pos) && !rec[pos]) return TG[topic].games.find((g) => g.id === pos);
    return ids.find((g) => !rec[g.id]) || null;
  }
  const gameName = (g) => g.id.toUpperCase() + ' ' + g.title;
  const topicName = (k) => T('theory.topic.' + k);

  // ---------- Home ----------
  function tile() {
    const on = topics().filter((k) => openOf(k).length);
    if (!on.length) return '<div class="tile soon" aria-disabled="true"><h2>' + h(T('home.theory')) + '</h2><p>' + h(T('home.theorySub')) + '</p><span class="state">' + h(T('home.theoryClosed')) + '</span></div>';
    const k = on.find((x) => sums(x).played) || on[0], s = sums(k);
    const line = s.played ? T('home.theoryStars', { stars: s.stars, max: s.max, topic: topicName(k) }) : T('home.theoryNone', { topic: topicName(k) });
    return '<button class="tile live" data-go="#theory"><h2>' + h(T('home.theory')) + '</h2><p>' + h(T('home.theorySub')) + '</p><span class="state">' + h(line) + '</span></button>';
  }

  // ---------- the Theory page ----------
  function card(k) {
    const t = TG[k], parts = t.zones.length, games = t.games.length, open = openOf(k), s = sums(k);
    if (!open.length) return '<div class="th-card closed"><h2>' + h(topicName(k)) + '</h2><span class="line">' + h(T('theory.countShut', { games, parts })) + '</span><span class="stars">' + h(T('theory.stars', { stars: s.stars, max: s.max })) + '</span><span class="lock">' + h(T('theory.closed')) + '</span></div>';
    const next = carryOn(k);
    const label = !next ? T('theory.again') : s.played ? T('theory.carry', { game: gameName(next) }) : T('theory.start', { game: gameName(next) });
    const go = next ? '#theory/' + k + '/' + next.id : '#theory/' + k;
    return '<div class="th-card open"><h2>' + h(topicName(k)) + '</h2><span class="line">' + h(open.length === 1 ? T('theory.countOne', { games, parts }) : T('theory.count', { games, parts, open: open.length })) + '</span>' +
      '<span class="stars">' + h(T('theory.stars', { stars: s.stars, max: s.max })) + '</span>' +
      '<a class="btn" data-go="' + h(go) + '" href="' + h(go) + '">' + h(label) + '</a>' +
      (next && s.played ? '<a class="line or" data-go="#theory/' + k + '" href="#theory/' + k + '">' + h(T('theory.orOpen')) + '</a>' : '') + '</div>';
  }
  function later(k) { return '<div class="th-card later"><h2>' + h(topicName(k)) + '</h2><span class="lock">' + h(T('theory.later')) + '</span></div>'; }
  function vTheory() {
    const live = topics(), open = live.filter((k) => openOf(k).length), closed = live.filter((k) => !openOf(k).length);
    X.frame([{ t: T('theory.crumb'), go: '#home' }, { t: T('theory.title') }],
      '<h1>' + h(T('theory.title')) + '</h1><p class="th-lead">' + h(T('theory.lead')) + '</p><div class="th-cards">' +
      open.map(card).join('') + closed.map(card).join('') + LATER.map(later).join('') + '</div>');
  }

  // ---------- the topic page ----------
  function rowsFor(topic) {
    const rec = recOf(topic), out = {};
    Object.keys(rec).forEach((id) => { if (id[0] !== '_') out[id] = { first: rec[id][0], best: rec[id][1], max: rec[id][2], n: rec[id][3] }; });
    return out;
  }
  const post = (kind, body) => { if (cur && cur.el && cur.el.contentWindow) cur.el.contentWindow.postMessage(Object.assign({ t: 'platform', v: 1, kind }, body || {}), ORIGIN); };
  function sendState() { post('state', { name: X.me().shown(), open: openOf(cur.topic), best: rowsFor(cur.topic), pos: recOf(cur.topic)._pos || null }); }
  function paintSaving() { const el = document.querySelector('.th-saving'); if (el) el.textContent = queue.length ? T('sys.saving') : ''; }
  function closeTopic() {
    if (!cur) return;
    clearInterval(refresh); refresh = null; clearTimeout(cur.failT);
    // she went off the page in the middle of a game: the frame is about to go, so the parent says so for it
    if (cur.playing) enqueue({ op: 'leave', topic: cur.topic, game: cur.playing, round: 0, rounds: 0 });
    cur = null;
  }
  function vTopic(k, gameId) {
    if (!TG[k] || !TG[k].games.length || !openOf(k).length) { X.go('#theory'); return; }
    if (cur && cur.topic === k) return; // the frame is already up; it keeps its own place
    closeTopic();
    const B = window.OLS_BOOT || {}, full = String(B.baseUrl || '') + '?class=' + encodeURIComponent(X.me().cls) + '#theory/' + k;
    const src = ROOT + '/' + ARCADE[k] + '/?embed=1' + (gameId ? '#/play/' + encodeURIComponent(gameId) : '');
    X.frame(null, '');
    X.app().innerHTML = '<div class="th-bar"><a class="th-home" data-go="#home" href="#home">' + h(T('theory.crumb')) + '</a><span class="th-sep th-home">›</span>' +
      '<a data-go="#theory" href="#theory">' + h(T('theory.title')) + '</a><span class="th-sep">›</span><span class="th-here">' + h(topicName(k)) + '</span>' +
      '<span class="th-saving" aria-live="polite"></span><a class="th-full" href="' + h(full) + '" target="_top">' + h(T('theory.fullWindow')) + '</a></div><div id="sys"></div>' +
      '<div class="th-frame"><iframe title="' + h(topicName(k)) + '" allow="fullscreen" src="' + h(src) + '"></iframe>' +
      '<div class="th-loading">' + h(T('theory.loading')) + '</div>' +
      '<div class="th-fail" hidden><span>' + h(T('theory.loadFail')) + '</span><button class="btn" data-sys="reload">' + h(T('theory.reload')) + '</button></div></div>';
    X.paintSys();
    const el = X.app().querySelector('iframe');
    cur = { topic: k, el, started: {}, playing: null, ready: false };
    cur.failT = setTimeout(() => { if (cur && !cur.ready) { X.app().querySelector('.th-loading').hidden = true; X.app().querySelector('.th-fail').hidden = false; } }, 8000);
    refresh = setInterval(() => { if (!document.hidden && cur) refreshState(); }, 60000);
    paintSaving();
  }
  function refreshState() {
    return X.call('apiTheory', { op: 'state' }).then((r) => {
      const before = cur ? openOf(cur.topic) : null;
      TH = { open: r.open, T: r.T };
      if (cur && before !== openOf(cur.topic)) post('locked', { open: openOf(cur.topic) });
    }, () => {});
  }

  // ---------- the arcade's messages ----------
  function onMessage(e) {
    if (!cur || e.source !== cur.el.contentWindow || e.origin !== ORIGIN) return;
    const m = e.data;
    if (!m || m.t !== 'arcade' || m.v !== 1) return;
    if (m.kind === 'ready') {
      cur.ready = true; clearTimeout(cur.failT);
      const l = X.app().querySelector('.th-loading'); if (l) l.hidden = true;
      sendState(); refreshState();
    } else if (m.kind === 'start') {
      cur.started[m.game] = Date.now(); cur.playing = m.game;
      enqueue({ op: 'start', topic: cur.topic, game: m.game });
    } else if (m.kind === 'finish') {
      const at = cur.started[m.game];
      cur.playing = null;
      enqueue({ op: 'finish', topic: cur.topic, game: m.game, score: m.score, max: m.max, startedAt: String(at || Date.now()), seconds: at ? Math.floor((Date.now() - at) / 1000) : 0 });
    } else if (m.kind === 'leave') {
      cur.playing = null;
      enqueue({ op: 'leave', topic: cur.topic, game: m.game, round: m.round, rounds: m.rounds });
    }
  }

  // ---------- the queue: one call at a time, in order; nothing lost when the connection drops ----------
  function enqueue(item) { queue.push(item); saveQueue(); paintSaving(); pump(); }
  function pump() {
    if (busy) return;
    if (!queue.length) { hadFail = false; paintSaving(); return; }
    busy = true;
    const it = queue[0], req = Object.assign({}, it);
    delete req.told;
    if (it.op === 'finish' && hadFail) req.resend = true;
    X.call('apiTheory', req).then((r) => {
      busy = false; queue.shift(); saveQueue();
      if (it.op === 'finish' && r.row) {
        TH.T = TH.T || {}; TH.T[it.topic] = TH.T[it.topic] || {}; TH.T[it.topic][it.game] = r.row; TH.T[it.topic]._pos = it.game;
        if (cur && cur.topic === it.topic) post('saved', { game: it.game, first: r.row[0], best: r.row[1], max: r.row[2], n: r.row[3] });
      } else if (it.op === 'start') { TH.T = TH.T || {}; TH.T[it.topic] = TH.T[it.topic] || {}; TH.T[it.topic]._pos = it.game; }
      pump();
    }, (err) => {
      busy = false;
      if (err.code === 'offline' || err.code === 'not-signed-in') {
        hadFail = true;
        if (it.op === 'finish' && !it.told) { it.told = true; saveQueue(); if (cur && cur.topic === it.topic) post('failed', { game: it.game }); }
        // a finish behind this call has been played as well: tell the arcade it waits too
        queue.forEach((q) => { if (q.op === 'finish' && !q.told) { q.told = true; if (cur && cur.topic === q.topic) post('failed', { game: q.game }); } });
        saveQueue(); paintSaving();
        clearTimeout(retry); retry = setTimeout(pump, 15000);
        return;
      }
      queue.shift(); saveQueue();
      if (it.op === 'finish' && cur && cur.topic === it.topic) post('refused', { game: it.game, code: err.code });
      if (err.code === 'locked') refreshState();
      pump();
    });
  }

  // ---------- from app.js ----------
  function init(ctx, theory) {
    X = ctx; TH = theory || TH;
    window.addEventListener('message', onMessage);
    window.addEventListener('online', pump);
    loadQueue();
    pump();
  }
  // Google's outer page holds the address: a link opened in a new window carries its place in the outer hash.
  function outerHash(cb) {
    try { if (!location.hash && window.google && google.script && google.script.url) { google.script.url.getLocation((l) => cb(l && l.hash ? '#' + l.hash : '')); return; } } catch (e) { /* not there */ }
    cb('');
  }
  function route(bits) {
    if (bits[1]) { vTopic(bits[1], bits[2]); return; }
    closeTopic(); vTheory();
    X.call('apiTheory', { op: 'state' }).then((r) => { const was = JSON.stringify(TH.open); TH = { open: r.open, T: r.T }; if (was !== JSON.stringify(r.open) && location.hash === '#theory') vTheory(); }, () => {});
  }
  return { init, tile, route, leftPage: closeTopic, outerHash, gameOpen };
})();
