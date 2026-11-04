/* ---------- the Theory side: arcade scores, per class part locks, the staff Theory tab (AS Theory Side spec section 7) ----------
   A pupil's scores live on her own record (T), so they travel with her. The served page never touches a Sheet. */
function thParts_(topic) { return THEORY[topic] ? THEORY[topic].parts : ''; }
function thOpenOf_(c, topic) {
  var T = (c && c.T) || {};
  if (typeof T[topic] === 'string') return T[topic];
  return topic === 'methods' ? thParts_('methods') : ''; // a class from before the Theory side: Methods open, later topics shut
}
function thOpen_(c) { var o = {}; Object.keys(THEORY).forEach(function (k) { o[k] = thOpenOf_(c, k); }); return o; }
function thGame_(topic, id) {
  var list = THEORY[topic] ? THEORY[topic].games : [];
  for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return null;
}
function thGameOpen_(topic, g, open) {
  if (g.part) return open.indexOf(g.part) !== -1;
  var z = THEORY[topic].zones.filter(function (x) { return x.key === g.zone; })[0] || {};
  if (z.opens === 'any') return open.length > 0;
  if (z.opens) return z.opens.split('').every(function (l) { return open.indexOf(l) !== -1; });
  return open.indexOf(g.zone) !== -1;
}
function thStars_(score, max) {
  if (!max) return 0;
  var p = score / max;
  return p >= 0.9 ? 3 : p >= 0.7 ? 2 : p >= 0.5 ? 1 : 0;
}
function thView_(cls, rec) { return { open: thOpen_(readClass_(cls)), T: (rec && rec.T) || {} }; }
function thLogKey_(cls, email, topic) { return 't:' + cls + ':' + email + ':' + topic; }
function thLog_(cls, email, topic, row) {
  // the score is already safe on her record when this runs, so a full store never loses it
  try {
    var key = thLogKey_(cls, email, topic), log = jget_(sp_(), key, []);
    log.push(row);
    while (log.length > 300 || (log.length > 1 && JSON.stringify(log).length > 8800)) log.shift();
    jset_(sp_(), key, log);
  } catch (e) { /* the log is a record of attempts, not the score */ }
}
function thNow_(cls, email, row) {
  var key = 'now:' + cls, map = jget_(sp_(), key, {});
  if (row) map[email] = row; else delete map[email];
  jset_(sp_(), key, map);
}

function apiTheory(req) {
  req = req || {};
  var w = who_(req); if (w.error) return err_(w.error);
  var op = str_(req.op), cls = w.cls, email = w.email;
  if (op === 'state') return ok_(thView_(cls, readPupil_(cls, email)));
  var topic = str_(req.topic);
  if (!THEORY[topic]) return err_('topic');
  var g = thGame_(topic, str_(req.game));
  if (!g) return err_('game');
  var markKey = 'ts:' + topic + ':' + g.id, doneKey = 'tf:' + topic + ':' + g.id;
  var open = thOpenOf_(readClass_(cls), topic);

  if (op === 'pos' || op === 'start') {
    if (!thGameOpen_(topic, g, open)) return err_('locked');
    if (op === 'start') up_().setProperty(markKey, String(Date.now()));
    return withLock_(function () {
      var rec = readPupil_(cls, email) || freshPupil_();
      rec.T = rec.T || {}; rec.T[topic] = rec.T[topic] || {};
      rec.T[topic]._pos = g.id;
      writePupil_(cls, email, rec);
      if (op === 'start') thNow_(cls, email, [g.id, tmin_(), 0, 0]);
      return ok_({});
    });
  }

  if (op === 'leave') {
    var round = Math.max(0, Math.floor(num_(req.round))), rounds = Math.max(0, Math.floor(num_(req.rounds)));
    up_().deleteProperty(markKey);
    return withLock_(function () {
      thLog_(cls, email, topic, [g.id, tmin_(), 'left', round, rounds]);
      thNow_(cls, email, [g.id, tmin_(), round, rounds]);
      return ok_({});
    });
  }

  if (op === 'finish') {
    var score = Number(req.score), max = Number(req.max), startedAt = str_(req.startedAt);
    if (!isFinite(score) || !isFinite(max) || score < 0 || max <= 0 || score > max || max > g.cap || Math.floor(score) !== score || Math.floor(max) !== max) return err_('bad-score');
    var user = up_();
    if (startedAt && user.getProperty(doneKey) === startedAt) {
      var had = readPupil_(cls, email);
      return ok_({ dup: true, row: had && had.T && had.T[topic] ? had.T[topic][g.id] || null : null });
    }
    if (!thGameOpen_(topic, g, open)) return err_('locked');
    var mark = Number(user.getProperty(markKey));
    if (!mark) return err_('no-start');
    // a queued finish was played while the connection was down: the start mark was only just resent, so the seconds the page measured count
    var seconds = req.resend ? Math.floor(num_(req.seconds)) : Math.floor((Date.now() - mark) / 1000);
    if (seconds < 10) return err_('too-fast');
    return withLock_(function () {
      var rec = readPupil_(cls, email) || freshPupil_();
      rec.T = rec.T || {}; rec.T[topic] = rec.T[topic] || {};
      var t = rec.T[topic], row = t[g.id], now = tmin_();
      if (!row) row = [score, score, max, 1, now];
      else {
        // the better result stands; the stars she has earned never go down (a tie on stars keeps the higher share)
        var sNew = thStars_(score, max), sOld = thStars_(row[1], row[2]);
        if (sNew > sOld || (sNew === sOld && score / max > row[1] / row[2])) {
          if (row[2] !== max) row[0] = Math.min(max, Math.round(row[0] / row[2] * max)); // first is shown out of the same maximum
          row[1] = score; row[2] = max;
        }
        row[3] = row[3] + 1; row[4] = now;
      }
      t[g.id] = row;
      t._pos = g.id;
      writePupil_(cls, email, rec);
      thNow_(cls, email, null);
      thLog_(cls, email, topic, [g.id, now, score, max, seconds]);
      user.deleteProperty(markKey);
      if (startedAt) user.setProperty(doneKey, startedAt);
      return ok_({ row: row });
    });
  }
  return err_('bad-op');
}

/* ---------- staff, inside apiStaff's passcode gate ---------- */
function thPupils_(props, cls) {
  var pre = 'p:' + cls + ':', out = [];
  Object.keys(props).forEach(function (k) {
    if (k.indexOf(pre) !== 0) return;
    var rec; try { rec = JSON.parse(props[k]); } catch (e) { return; }
    var name = str_(rec.n).trim(), bits = name ? name.split(/\s+/) : [];
    out.push({ email: k.slice(pre.length), n: name, sur: bits.length > 1 ? bits[bits.length - 1] : '', first: bits.length > 1 ? bits.slice(0, -1).join(' ') : name, T: rec.T || {} });
  });
  out.sort(function (a, b) { return (a.sur || a.first).toLowerCase() < (b.sur || b.first).toLowerCase() ? -1 : (a.sur || a.first).toLowerCase() > (b.sur || b.first).toLowerCase() ? 1 : a.email < b.email ? -1 : 1; });
  return out;
}
function thWhen_(min) { return Utilities.formatDate(new Date(1767225600000 + min * 60000), 'Europe/London', 'yyyy-MM-dd HH:mm'); }
function thCsv_(props, name, topics, me) {
  var head = ['Surname', 'First name', 'Email', 'Game', 'Title', 'Part', 'First', 'Best', 'Max', 'Stars', 'Tries', 'Last played'];
  var lines = [head.join(',')];
  thPupils_(props, name).forEach(function (pu) {
    if (pu.email === me) return; // the teacher's own test record stays out of the CSV, as the class CSV does
    var stars = 0, tries = 0, last = 0;
    topics.forEach(function (topic) {
      var t = pu.T[topic] || {};
      THEORY[topic].games.forEach(function (g) {
        var r = t[g.id];
        if (r) { stars += thStars_(r[1], r[2]); tries += r[3]; if (r[4] > last) last = r[4]; }
        lines.push([pu.sur, pu.first, pu.email, g.id, g.title, g.part || g.zone, r ? r[0] : '', r ? r[1] : '', r ? r[2] : '', r ? thStars_(r[1], r[2]) : '', r ? r[3] : '', r ? thWhen_(r[4]) : ''].map(csvCell_).join(','));
      });
    });
    lines.push([pu.sur, pu.first, pu.email, 'TOTAL', '', '', '', '', '', stars, tries, last ? thWhen_(last) : ''].map(csvCell_).join(','));
  });
  return lines.join('\r\n');
}
function thStaff_(op, name, req, email) {
  var topic = str_(req.topic), props;
  if (op === 'theoryCsv' && topic === 'all') {
    var withGames = Object.keys(THEORY).filter(function (k) { return THEORY[k].games.length; });
    return ok_({ csv: thCsv_(allProps_(), name, withGames, email), file: 'AS-SSD-theory-' + name + '-all-' + todayIso_() + '.csv' });
  }
  if (!THEORY[topic]) return err_('topic');
  if (op === 'theory') {
    props = allProps_();
    var pre = 't:' + name + ':', post = ':' + topic, nowMap = {};
    try { nowMap = JSON.parse(props['now:' + name] || '{}'); } catch (e) { nowMap = {}; }
    var pupils = thPupils_(props, name).map(function (pu) {
      var left = {};
      var key = thLogKey_(name, pu.email, topic);
      if (props[key]) { try { JSON.parse(props[key]).forEach(function (r) { if (r[2] === 'left') left[r[0]] = 1; }); } catch (e) { /* no log */ } }
      return { email: pu.email, n: pu.n, sur: pu.sur, first: pu.first, T: pu.T[topic] || {}, left: left, now: nowMap[pu.email] || null };
    });
    return ok_({ open: thOpenOf_(readClass_(name), topic), pupils: pupils, at: tmin_() });
  }
  if (op === 'theoryOpen') {
    var want = str_(req.letters), parts = thParts_(topic);
    var letters = parts.split('').filter(function (l) { return want.indexOf(l) !== -1; }).join('');
    return withLock_(function () {
      var c = readClass_(name);
      c.T = c.T || {}; c.T[topic] = letters;
      jset_(sp_(), 'cls:' + name, c);
      return ok_({ open: letters });
    });
  }
  if (op === 'theoryPupil') {
    var who = str_(req.email).toLowerCase();
    return ok_({ log: jget_(sp_(), thLogKey_(name, who, topic), []) });
  }
  if (op === 'theoryCsv') {
    return ok_({ csv: thCsv_(allProps_(), name, [topic], email), file: 'AS-SSD-theory-' + name + '-' + topic + '-' + todayIso_() + '.csv' });
  }
  return err_('bad-op');
}
