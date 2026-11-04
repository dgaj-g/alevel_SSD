// The staff Theory tab: the stars grid, part open/lock per class, one pupil's attempts, CSV.
window.TheoryStaff = (function () {
  const TG = window.THEORY_GAMES;
  const stars = (s, m) => { if (!m) return 0; const p = s / m; return p >= 0.9 ? 3 : p >= 0.7 ? 2 : p >= 0.5 ? 1 : 0; };
  const topics = () => Object.keys(TG).filter((k) => TG[k].games.length);
  let topic = '';
  function view(X) {
    const T = X.T, h = X.h, pane = X.pane();
    if (!X.cls()) { pane.innerHTML = '<div class="card"><p>' + h(T('staff.theory.noClass')) + '</p></div>'; return null; }
    const list = topics();
    if (!list.includes(topic)) topic = X.sel('thTopic') && list.includes(X.sel('thTopic')) ? X.sel('thTopic') : list[0];
    const name = (k) => T('theory.topic.' + k), cfg = TG[topic];
    pane.innerHTML = '<div class="th-tools"><label for="thTopic">' + h(T('staff.theory.topic')) + '</label><select id="thTopic">' +
      list.map((k) => '<option value="' + h(k) + '"' + (k === topic ? ' selected' : '') + '>' + h(name(k)) + '</option>').join('') + '</select>' +
      '<button class="btn ghost th-csv" data-csv>' + h(T('staff.theory.csv')) + '</button></div><div id="thBody"></div>';
    pane.querySelector('#thTopic').addEventListener('change', (e) => { topic = e.target.value; X.keep('thTopic', topic); view(X); });
    const csvBtn = pane.querySelector('[data-csv]');
    csvBtn.addEventListener('click', () => { csvBtn.disabled = true; X.download({ op: 'theoryCsv', name: X.cls(), topic }).then(() => { csvBtn.disabled = false; }); });
    const body = pane.querySelector('#thBody');
    let DATA = null;
    const lettersOf = () => cfg.parts.split('').filter((l) => DATA.open.includes(l)).join('');
    const zoneOf = (key) => cfg.zones.find((z) => z.key === key) || { key, title: key };
    function partsBar() {
      const open = DATA.open;
      return '<div class="th-parts"><span class="lbl">' + h(T('staff.theory.partsLabel')) + '</span>' + cfg.parts.split('').map((l) => {
        const on = open.includes(l);
        return '<button class="th-part' + (on ? ' open' : '') + '" data-part="' + l + '" aria-pressed="' + on + '" aria-label="' + h(l + ' · ' + zoneOf(l).title) + '">' + h(l + ' · ' + zoneOf(l).title + ' · ') + h(T(on ? 'staff.theory.open' : 'staff.theory.locked')) + '</button>';
      }).join('') + '<button class="btn ghost" data-all="1">' + h(T('staff.theory.openAll')) + '</button><button class="btn ghost" data-all="0">' + h(T('staff.theory.lockAll')) + '</button></div>' +
      '<p class="th-hint">' + h(open.length ? T('staff.theory.hint', { open: open.length, parts: cfg.parts.length, cls: X.cls() }) : T('staff.theory.hintNone', { topic: name(topic), cls: X.cls() })) + '</p>';
    }
    function cell(pu, g, locked) {
      const r = pu.T[g.id], nowHere = pu.now && pu.now[0] === g.id && DATA.at - pu.now[1] <= 3;
      const cls = 'cell' + (locked ? ' lk' : '') + (nowHere ? ' now' : '');
      if (!r) {
        const left = pu.left && pu.left[g.id];
        return '<td class="' + cls + (left ? ' left' : '') + '" data-pu="' + h(pu.email) + '">' + (left ? h(T('staff.theory.left')) : '–') + '</td>';
      }
      const st = stars(r[1], r[2]);
      const title = T(r[3] === 1 ? 'staff.theory.cellOne' : 'staff.theory.cell', { first: r[0], best: r[1], max: r[2], n: r[3], when: X.when(r[4]) });
      return '<td class="' + cls + '" data-pu="' + h(pu.email) + '" title="' + h(title) + '"><span class="st">' + '★'.repeat(st) + '<span class="o">' + '★'.repeat(3 - st) + '</span></span><span class="sc">' + r[1] + '/' + r[2] + '</span></td>';
    }
    function grid() {
      const zones = [];
      cfg.games.forEach((g) => { let z = zones[zones.length - 1]; if (!z || z.key !== g.zone) { z = { key: g.zone, games: [] }; zones.push(z); } z.games.push(g); });
      const gOpen = (g) => window.Theory.gameOpen(topic, g, DATA.open);
      const head1 = '<tr class="grp"><th class="pupil" rowspan="2">' + h(T('staff.theory.pupil')) + '</th>' + zones.map((z) => {
        const on = gOpen(z.games[0]);
        return '<th colspan="' + z.games.length + '"' + (on ? '' : ' class="lk"') + '>' + h(z.key + ' · ' + zoneOf(z.key).title + ' · ' + T(on ? 'staff.theory.open' : 'staff.theory.locked')) + '</th>';
      }).join('') + '<th rowspan="2">' + h(T('staff.theory.stars')) + '</th><th rowspan="2">' + h(T('staff.theory.last')) + '</th><th rowspan="2">' + h(T('staff.theory.now')) + '</th></tr>';
      const head2 = '<tr>' + zones.map((z) => z.games.map((g) => '<th class="' + (gOpen(g) ? '' : 'lk') + '" title="' + h(g.title) + '">' + h(g.id.toUpperCase()) + '</th>').join('')).join('') + '</tr>';
      const rows = DATA.pupils.map((pu) => {
        let total = 0, last = 0;
        cfg.games.forEach((g) => { const r = pu.T[g.id]; if (r) { total += stars(r[1], r[2]); if (r[4] > last) last = r[4]; } });
        const live = pu.now && DATA.at - pu.now[1] <= 3;
        const g = live && cfg.games.find((x) => x.id === pu.now[0]);
        const nowLine = !g ? '' : pu.now[3] ? T('staff.theory.nowLine', { game: g.id.toUpperCase(), round: pu.now[2], rounds: pu.now[3] }) : g.id.toUpperCase();
        return '<tr><td class="pupil"><button data-pu="' + h(pu.email) + '">' + h(((pu.first || pu.n || '') + ' ' + (pu.sur || '')).trim() || pu.email) + '</button></td>' + zones.map((z) => z.games.map((x) => cell(pu, x, !gOpen(x))).join('')).join('') +
          '<td class="tot">' + h(T('staff.theory.starsOf', { stars: total, max: cfg.games.length * 3 })) + '</td><td>' + h(last ? X.when(last, true) : '–') + '</td><td>' + h(nowLine) + '</td></tr>';
      }).join('');
      if (!DATA.pupils.length) return '<div class="card"><p>' + h(T('staff.theory.empty', { topic: name(topic) })) + '</p></div>';
      const played = DATA.pupils.filter((pu) => Object.keys(pu.T).some((k) => k[0] !== '_')).length;
      return '<div class="th-panel"><table class="th-grid"><thead>' + head1 + head2 + '</thead><tbody>' + rows + '</tbody></table></div>' +
        '<p class="th-hint th-foot">' + h(T('staff.theory.foot', { played, n: DATA.pupils.length, topic: name(topic) })) + '</p>';
    }
    function paint() {
      const box = body.querySelector('.th-panel'), sx = box ? box.scrollLeft : 0, sy = box ? box.scrollTop : 0;
      body.innerHTML = partsBar() + grid();
      const nb = body.querySelector('.th-panel'); if (nb) { nb.scrollLeft = sx; nb.scrollTop = sy; }
    }
    function setOpen(letters, btn) {
      if (btn) { btn.disabled = true; btn.textContent = T('staff.theory.saving'); }
      X.call({ op: 'theoryOpen', name: X.cls(), topic, letters }).then((r) => { DATA.open = r.open; paint(); }, (e) => { paint(); X.fail(e); });
    }
    function drawer(email) {
      const pu = DATA.pupils.find((x) => x.email === email); if (!pu) return;
      const old = X.app().querySelector('.drawer'); if (old) old.remove();
      const title = T('staff.theory.drawerTitle', { name: ((pu.first || pu.n || '') + ' ' + (pu.sur || '')).trim() || pu.email, topic: name(topic) });
      X.app().insertAdjacentHTML('beforeend', '<aside class="drawer th-drawer" role="dialog" aria-label="' + h(title) + '"><div class="row" style="justify-content:space-between"><h3>' + h(title) + '</h3><button class="btn ghost" data-close>' + h(T('staff.theory.close')) + '</button></div><ul class="th-att"></ul></aside>');
      const dr = X.app().querySelector('.drawer');
      dr.querySelector('[data-close]').addEventListener('click', () => dr.remove());
      X.call({ op: 'theoryPupil', name: X.cls(), topic, email }).then((r) => {
        const log = (r.log || []).slice().reverse();
        dr.querySelector('.th-att').innerHTML = log.length ? log.map((a) => {
          const g = cfg.games.find((x) => x.id === a[0]), game = (g ? g.id.toUpperCase() + ' ' + g.title : a[0]), when = X.when(a[1]);
          if (a[2] === 'left') return '<li class="left">' + h(a[4] ? T('staff.theory.attemptLeft', { when, game, round: a[3], rounds: a[4] }) : T('staff.theory.attemptLeftEarly', { when, game })) + '</li>';
          const st = stars(a[2], a[3]);
          return '<li>' + h(T('staff.theory.attempt', { when, game, score: a[2], max: a[3], stars: st ? '★'.repeat(st) : T('staff.theory.noStars'), mins: Math.max(1, Math.round((a[4] || 0) / 60)) })) + '</li>';
        }).join('') : '<li>' + h(T('staff.theory.noAttempts')) + '</li>';
      }, X.fail);
    }
    body.addEventListener('click', (e) => {
      const p = e.target.closest('[data-part]');
      if (p) { const l = p.dataset.part, cur = lettersOf(); setOpen(cur.includes(l) ? cur.replace(l, '') : cur + l, p); return; }
      const a = e.target.closest('[data-all]');
      if (a) { setOpen(a.dataset.all === '1' ? cfg.parts : '', a); return; }
      const u = e.target.closest('[data-pu]');
      if (u) drawer(u.dataset.pu);
    });
    const load = () => X.call({ op: 'theory', name: X.cls(), topic }).then((r) => { DATA = r; paint(); }, X.fail);
    load();
    return load;
  }
  return { view };
})();
