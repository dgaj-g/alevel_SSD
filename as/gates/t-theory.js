(function () {
// G2 Server rules for the Theory side, against the real Code.gs in the dev harness.
//   node as/gates/t-theory.js [--control]    (AS_BASE, default http://localhost:8851)
// --control runs a server copy whose best never rises, at AS_BASE too: test 5 must fail on it.
if (process.argv.includes('--control')) {
  // the control: a server copy whose best never rises must fail test 5b
  const fs = require('fs'), os = require('os'), path = require('path'), { spawn, spawnSync } = require('child_process');
  const dir = fs.mkdtempSync(path.join(os.homedir(), 'Sites', '.g2-control-'));
  fs.mkdirSync(path.join(dir, 'deploy'));
  const src = path.join(process.env.AS_PRIVATE || '/Users/damiengartland/Desktop/Claude Work/AS SSD Overhaul/AS Coursework Guide/_platform', 'deploy', 'Code.gs');
  const code = fs.readFileSync(src, 'utf8');
  if (!code.includes('row[1] = score; row[2] = max;')) { console.error('control: the line to break is not there'); process.exit(2); }
  fs.writeFileSync(path.join(dir, 'deploy', 'Code.gs'), code.replace('row[1] = score; row[2] = max;', ''));
  const srv = spawn('node', [path.join(__dirname, '..', 'tools', 'dev-server.js'), '8854'], { env: { ...process.env, AS_PRIVATE: dir, AS_STORE: path.join(dir, 'store.json') }, stdio: 'ignore' });
  setTimeout(() => {
    const run = spawnSync('node', [__filename], { env: { ...process.env, AS_BASE: 'http://localhost:8854' }, encoding: 'utf8' });
    srv.kill(); fs.rmSync(dir, { recursive: true, force: true });
    const caught = /FAIL 5b/.test(run.stdout) && run.status === 1;
    console.log((caught ? 'CONTROL FAILS AS IT MUST' : 'CONTROL DID NOT FAIL') + ': ' + (run.stdout.split('\n').find((l) => /FAIL 5b/.test(l)) || run.stdout.slice(-200)));
    process.exit(caught ? 0 : 1);
  }, 1500);
  return;
}
const BASE = process.env.AS_BASE || 'http://localhost:8851';
const OWNER = 'dgartland021@c2ken.net', P1 = 'pupil1@c2ken.net', P2 = 'pupil2@c2ken.net', CLS = 'TH-TEST', NOT = 'TH-OLD';
let fails = 0, n = 0;
const ok = (id, what, pass, detail) => { n++; if (!pass) fails++; console.log((pass ? 'PASS ' : 'FAIL ') + id + ' ' + what + (pass ? '' : '  got ' + JSON.stringify(detail))); };
async function post(p, body, who) {
  const r = await fetch(BASE + p, { method: 'POST', headers: { 'content-type': 'application/json', 'x-dev-user': who || P1 }, body: JSON.stringify(body || {}) });
  return r.json();
}
const clock = (at) => post('/__clock', { at });
const th = (body, who) => post('/api/apiTheory', { cls: CLS, ...body }, who);
const staff = (body) => post('/api/apiStaff', { name: CLS, ...body }, OWNER);
const G = { topic: 'methods', game: 'a1' };

(async () => {
  await post('/__reset'); await clock(1000);
  await post('/api/apiStaff', { op: 'check', pass: process.env.AS_PASS || 'dev' }, OWNER).catch(() => {});
  let s = await post('/__store');
  const store = () => post('/__store');
  const made = await staff({ op: 'create' }); ok('0', 'class made', made.ok, made);
  await post('/api/apiBoot', { cls: CLS }, P1);

  let r = await th({ op: 'finish', ...G, score: 5, max: 10, startedAt: 'x1' });
  ok('1', 'finish without a start is refused', r.error === 'no-start', r);
  r = await th({ op: 'start', ...G }); ok('1b', 'start accepted', r.ok, r);
  await clock(1001);
  r = await th({ op: 'finish', ...G, score: 11, max: 10, startedAt: 'x2' });
  ok('2', 'score above max is refused', r.error === 'bad-score', r);
  r = await th({ op: 'finish', ...G, score: 5, max: 201, startedAt: 'x3' });
  ok('3', 'max above the game cap is refused', r.error === 'bad-score', r);
  r = await th({ op: 'start', ...G }); await clock(1001 + 5 / 60);
  r = await th({ op: 'finish', ...G, score: 5, max: 10, startedAt: 'x4' });
  ok('4', 'a finish under ten seconds is refused', r.error === 'too-fast', r);

  await clock(1002);
  r = await th({ op: 'finish', ...G, score: 6, max: 12, startedAt: 's1' });
  ok('5a', 'first score stored', r.ok && r.row[0] === 6 && r.row[1] === 6 && r.row[3] === 1, r);
  await th({ op: 'start', ...G }); await clock(1003);
  r = await th({ op: 'finish', ...G, score: 10, max: 12, startedAt: 's2' });
  ok('5b', 'best rises, first stays, tries count', r.ok && r.row[0] === 6 && r.row[1] === 10 && r.row[3] === 2, r);
  await th({ op: 'start', ...G }); await clock(1004);
  r = await th({ op: 'finish', ...G, score: 8, max: 12, startedAt: 's3' });
  ok('5c', 'a lower score leaves best alone', r.ok && r.row[0] === 6 && r.row[1] === 10 && r.row[3] === 3, r);

  const again = await th({ op: 'finish', ...G, score: 8, max: 12, startedAt: 's3' });
  ok('6', 'a resend counts once', again.ok && again.dup === true && again.row[3] === 3, again);

  r = await staff({ op: 'theoryOpen', topic: 'methods', letters: 'BCDEFGH' });
  ok('7a', 'staff lock writes letters', r.ok && r.open === 'BCDEFGH', r);
  r = await th({ op: 'start', ...G }); ok('7b', 'a start in a locked part is refused', r.error === 'locked', r);
  r = await th({ op: 'finish', ...G, score: 9, max: 12, startedAt: 's4' });
  ok('7c', 'a finish in a locked part is refused', r.error === 'locked', r);
  r = await th({ op: 'state' });
  ok('7d', 'locking keeps what she earned', r.ok && r.T.methods.a1[1] === 10 && r.open.methods === 'BCDEFGH', r);
  await staff({ op: 'theoryOpen', topic: 'methods', letters: 'ABCDEFGH' });

  s = await store(); const c = JSON.parse(s.script['cls:' + CLS]); delete c.T;
  await post('/__set', { script: { ['cls:' + NOT]: JSON.stringify(c), classes: JSON.stringify([CLS, NOT]) } });
  r = await post('/api/apiBoot', { cls: NOT }, P2);
  ok('8', 'a class with no T reads Methods all open, Strings none', r.ok && r.theory.open.methods === 'ABCDEFGH' && r.theory.open.strings === '', r.theory);

  // the log trims to 300 rows
  const key = 't:' + CLS + ':' + P1 + ':methods', full = [];
  for (let i = 0; i < 300; i++) full.push(['a2', i, 1, 2, 11]);
  await post('/__set', { script: { [key]: JSON.stringify(full) } });
  await th({ op: 'start', ...G }); await clock(1006);
  await th({ op: 'finish', ...G, score: 7, max: 12, startedAt: 's5' });
  s = await store(); const log = JSON.parse(s.script[key]);
  ok('9', 'the log trims to 300 rows, newest last', log.length <= 300 && log[log.length - 1][2] === 7 && log[log.length - 1][0] === 'a1', log.length);

  // CSV
  await post('/api/apiName', { cls: CLS, name: 'Aoife Ní Bhriain' }, P1);
  r = await staff({ op: 'theoryCsv', topic: 'methods' });
  const lines = r.csv.split('\r\n');
  ok('10a', 'CSV columns exact', lines[0] === 'Surname,First name,Email,Game,Title,Part,First,Best,Max,Stars,Tries,Last played', lines[0]);
  ok('10b', 'CSV file name', /^AS-SSD-theory-TH-TEST-methods-\d{4}-\d\d-\d\d\.csv$/.test(r.file), r.file);
  ok('10c', 'one row per game plus TOTAL', lines.filter((l) => l.includes(P1)).length === 33, lines.length);
  ok('10d', 'names intact, TOTAL row present', lines.some((l) => l.startsWith('Bhriain,Aoife Ní,' + P1 + ',TOTAL')), lines[33]);

  // leave, now, staff grid
  await th({ op: 'start', topic: 'methods', game: 'b3' });
  r = await th({ op: 'leave', topic: 'methods', game: 'b3', round: 2, rounds: 6 }); ok('11a', 'leave accepted', r.ok, r);
  r = await staff({ op: 'theory', topic: 'methods' });
  const me = r.pupils.find((p) => p.email === P1);
  ok('11b', 'grid shows left, no first, and the Now line', me && me.left.b3 === 1 && !me.T.b3 && me.now[0] === 'b3' && me.now[2] === 2 && me.now[3] === 6, me);

  // refused without the staff gate
  r = await post('/api/apiStaff', { name: CLS, op: 'theory', topic: 'methods' }, P1);
  ok('12a', 'a pupil is refused the staff grid', r.error === 'not-staff', r);
  r = await post('/api/apiStaff', { name: CLS, op: 'theoryOpen', topic: 'methods', letters: '' }, P1);
  ok('12b', 'a pupil is refused the part switch', r.error === 'not-staff', r);

  // a queued finish after the connection returned
  await th({ op: 'start', topic: 'methods', game: 'a3' });
  r = await th({ op: 'finish', topic: 'methods', game: 'a3', score: 3, max: 4, startedAt: 'q1', resend: true, seconds: 40 });
  ok('13a', 'a queued finish uses the measured seconds', r.ok && r.row[1] === 3, r);
  await th({ op: 'start', topic: 'methods', game: 'a3' });
  r = await th({ op: 'finish', topic: 'methods', game: 'a3', score: 3, max: 4, startedAt: 'q2', resend: true, seconds: 2 });
  ok('13b', 'a queued finish under ten seconds is still refused', r.error === 'too-fast', r);

  await clock(null);
  console.log((fails ? 'FAIL' : 'PASS') + ' G2 ' + (n - fails) + '/' + n);
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
})();
