/* AS T1–T6 (AS DESIGN_SPEC 16, AT-PLATFORM): A2's apiCw test (A2 SSD Platform/gates/t-apicw.js) run on the AS build, chapter 12.
 *   AS_BASE=http://127.0.0.1:8851 node as/gates/t-apicw.js   → as/gates/T_REPORT.txt */
const fs = require('fs'), path = require('path');
const BASE = process.env.AS_BASE || 'http://127.0.0.1:8851', CLS = 'L6-CW-T' + (Date.now() % 100000), P = 'pupil7@c2ken.net', OWNER = 'dgartland021@c2ken.net';
const IX = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'content', 'coursework', 'index.json'), 'utf8'));
const CODE = fs.readFileSync(path.join(process.env.AS_PRIVATE || '/Users/damiengartland/Desktop/Claude Work/AS SSD Overhaul/AS Coursework Guide/_platform', 'deploy', 'Code.gs'), 'utf8');
const S7 = JSON.parse(CODE.match(/var CWMETA = (.*);/)[1])['12'];   // the tick ids build-as.js gave the server
const rows = []; let fails = 0;
const ok = (id, name, pass, d) => { rows.push((pass ? 'PASS ' : 'FAIL ') + id + ' ' + name + (d ? ' — ' + d : '')); if (!pass) fails++; };
const post = async (p, body, who) => (await fetch(BASE + p, { method: 'POST', headers: { 'content-type': 'application/json', 'x-dev-user': who || '' }, body: JSON.stringify(body || {}) })).json();
const cw = (req) => post('/api/apiCw', Object.assign({ cls: CLS }, req), P);
const raw = async () => { const s = (await post('/__store')).script; return s['w:' + CLS + ':' + P] || ''; };
const W = async () => JSON.parse((await raw()) || '{}');
const seen = async () => ((await post('/api/apiStaff', { cls: CLS, op: 'coursework', name: CLS }, OWNER)).pupils || []).find((p) => p.email === P);
(async () => {
  await post('/api/apiStaff', { cls: CLS, op: 'create', name: CLS }, OWNER);
  await post('/api/apiBoot', { cls: CLS }, P);
  await post('/__clock', { at: 500000 });
  await cw({ op: 'open', ch: '12' }); let w = (await W())['12'];
  ok('T1', 'open creates w: with o=1, f, l', w && w.o === 1 && w.f === 500000 && w.l === 500000 && 'a' in w, JSON.stringify(w));
  await post('/__clock', { at: 500003 });
  await cw({ op: 'screen', ch: '12', key: '6-9' }); w = (await W())['12'];
  ok('T1', 'screen sets a', w.a === '6-9', w.a);
  const before = JSON.stringify(Object.assign({}, w, { k: null }));
  await cw({ op: 'tick', ch: '12', id: S7[0], on: true }); await cw({ op: 'tick', ch: '12', id: S7[3], on: true }); w = (await W())['12'];
  const k1 = w.k;
  ok('T2', 'tick on sets bits, nothing else moves', k1 && JSON.stringify(Object.assign({}, w, { k: null })) === before, 'k=' + k1);
  await cw({ op: 'tick', ch: '12', id: S7[3], on: false }); w = (await W())['12'];
  ok('T2', 'tick off clears that bit only', w.k !== k1 && (await post('/api/apiCw', { cls: CLS, op: 'state' }, P)).W['12'].k.join(',') === S7[0], JSON.stringify((await post('/api/apiCw', { cls: CLS, op: 'state' }, P)).W['12'].k));
  await cw({ op: 'copy', ch: '12' }); await cw({ op: 'copy', ch: '12' }); await cw({ op: 'reveal', ch: '12' }); w = (await W())['12'];
  ok('T3', 'copy and reveal count up', w.c === 2 && w.r === 1, 'c=' + w.c + ' r=' + w.r);
  await post('/__clock', { at: 500005 });
  await cw({ op: 'done', ch: '12', on: true }); w = (await W())['12'];
  ok('T4', 'done sets d to the minute', w.d === 500005, 'd=' + w.d);
  const f = IX.files[0].name;
  await cw({ op: 'download', file: f }); await cw({ op: 'download', file: f });
  ok('T5', 'download counts D[file]', (await W()).D[f] === 2, JSON.stringify((await W()).D));
  const len = (await raw()).length;
  const bad = [await cw({ op: 'open', ch: '21' }), await cw({ op: 'open', ch: '13' }), await cw({ op: 'open', ch: 'xx' }), await cw({ op: 'tick', ch: '12', id: '99.99.99', on: true }),
    await cw({ op: 'tick', ch: '12', id: 'x'.repeat(20000), on: true }), await cw({ op: 'download', file: 'Code.gs' }), await cw({ op: 'screen', ch: '12', key: 'y'.repeat(5000) })];
  ok('T6', 'unknown or unbuilt chapter, bad step, oversize payload, unknown file refused with bad-key', bad.every((r) => r.ok === false && r.error === 'bad-key'), bad.map((r) => r.error).join(','));
  ok('T6', 'stored value length unchanged after the refusals', (await raw()).length === len, len + ' → ' + (await raw()).length);
  await post('/__clock', { at: 500020 }); await cw({ op: 'copy', ch: '12' });
  const s = await seen();
  ok('T*', 'each op touches the activity session (Last seen moves)', s && s.seen === 500020, JSON.stringify(s && { seen: s.seen, last: s.last }));
  await post('/__clock', {});
  const out = 'T ' + (fails ? 'FAIL' : 'PASS') + ' — ' + rows.length + ' checks, ' + fails + ' failures\n' + rows.join('\n') + '\n';
  fs.writeFileSync(path.join(__dirname, 'T_REPORT.txt'), out); console.log(out); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
