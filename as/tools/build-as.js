#!/usr/bin/env node
/* as/tools/build-as.js — the AS SSD platform, built from the A2 platform (AS DESIGN_SPEC §14: a repeat of A2; the colour
 * is the only change). A2 and AS share one set of page files: this script reads them from the A2 worktree and changes only
 *   1. the two :root token lines in style.css (as/src/tokens-as.css: deep teal, amber, AS tints) and the print line's name,
 *   2. the strings (as/src/strings-as.json), the content (no SQL papers; the AS coursework guide) and the content address,
 *   3. the home page (the coursework tile only: AS has no SQL past papers), the staff tabs (no Papers or Live) and
 *      the chapter count (00 to 18) and the one-off "guide has changed" message (its own id and time),
 *   4. the guide renderer: as/src/cw.js and cw.css, the newer copy the AS guide was designed with (same tokens).
 * Writes  as/server/Index.html            PUBLIC (committed)
 *         <AS_PRIVATE>/deploy/Code.gs     the Apps Script server (never committed), plus appsscript.json and BUILD.txt
 *         as/platform/style.css, cw.css   the AS stylesheets as served, so G9 can compare them with A2's
 * The staff passcode: the built-in hash is of a random secret that is thrown away, so the only passcode is the Script
 * Property "staffPasscode", which Damien sets himself. Class owners and heads of department get in by their email.
 * Run: AS_A2=~/Sites/ols-wt-a2/a2-ssd node as/tools/build-as.js */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const AS = path.join(__dirname, '..');
const A2 = process.env.AS_A2 || path.join(process.env.HOME, 'Sites/ols-wt-a2/a2-ssd');
const PRIVATE = process.env.AS_PRIVATE || '/Users/damiengartland/Desktop/Claude Work/AS SSD Overhaul/AS Coursework Guide/_platform';
const DEPLOY = path.join(PRIVATE, 'deploy');
const OWNER_EMAIL = 'dgartland021@c2ken.net';
const GH = 'https://dgaj-g.github.io/ols-digital-skills/a2-ssd/platform/vendor/';
const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/';
const CW = 'https://dgaj-g.github.io/alevel_SSD/as/content/coursework/';

const need = (p) => { if (!fs.existsSync(p)) { console.error('missing: ' + p); process.exit(1); } return fs.readFileSync(p, 'utf8'); };
function swap(name, text, from, to) {
  const n = text.split(from).length - 1;
  if (n !== 1) { console.error(name + ': expected the A2 text once, found ' + n + ' times: ' + from.slice(0, 70)); process.exit(1); }
  return text.replace(from, () => to);
}

// ---- ASCII helpers (as A2's build-server.js)
const asciiJs = (s) => s.replace(/[\u0080-￿]/g, (c) => '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4));
const asciiHtml = (s) => s.replace(/[\u0080-\u{10ffff}]/gu, (c) => '&#' + c.codePointAt(0) + ';');
const asciiCss = (s) => s.replace(/[\u0080-￿]/g, (c) => '\\' + c.charCodeAt(0).toString(16) + ' ');
const jsBlock = (s) => asciiJs(s).replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');
function guardAscii(name, text) {
  const m = text.match(/[^\x00-\x7f]/);
  if (m) { console.error(name + ': non-ASCII U+' + m[0].charCodeAt(0).toString(16)); process.exit(1); }
}
function guardScriptlets(name, text) {
  const clean = text.replace(/<\?= classCode \?>/g, '').replace(/<\?= baseUrl \?>/g, '');
  const n = (clean.match(/<\?/g) || []).length + (clean.match(/\?>/g) || []).length;
  if (n) { console.error(name + ': ' + n + ' stray <? or ?>'); process.exit(1); }
}

// ---- 1. the stylesheets
let style = need(path.join(A2, 'platform', 'style.css'));
const lines = style.split('\n'), roots = lines.map((l, i) => (l.startsWith(':root{') ? i : -1)).filter((i) => i >= 0);
// the token lines are the first two :root lines, side by side (A2 v12 added a later :root line for the message's dark backdrop, kept as is)
if (roots.length < 2 || roots[1] !== roots[0] + 1) { console.error('A2 style.css: expected the two :root token lines (is A2 tokenised?)'); process.exit(1); }
const tokens = need(path.join(AS, 'src', 'tokens-as.css')).trim().split('\n');
if (tokens.length !== 2 || !tokens.every((l) => /^:root\{[^}]*\}$/.test(l))) { console.error('tokens-as.css: expected two :root lines'); process.exit(1); }
lines.splice(roots[0], 2, tokens[0], tokens[1]);
style = swap('style.css', lines.join('\n'), 'read on the A2 SSD platform', 'read on the AS SSD platform');
const cwcss = need(path.join(AS, 'src', 'cw.css'));
fs.mkdirSync(path.join(AS, 'platform'), { recursive: true });
fs.writeFileSync(path.join(AS, 'platform', 'style.css'), style);
fs.writeFileSync(path.join(AS, 'platform', 'cw.css'), cwcss);

// ---- 2. strings and content
const strings = JSON.parse(need(path.join(A2, 'platform', 'strings.json')));
const over = JSON.parse(need(path.join(AS, 'src', 'strings-as.json')));
Object.keys(over).filter((k) => k[0] !== '_').forEach((k) => {
  if (!(k in strings)) { console.error('strings-as.json: ' + k + ' is not an A2 string'); process.exit(1); }
  strings[k] = over[k];
});
const overT = JSON.parse(need(path.join(AS, 'src', 'strings-theory.json')));
Object.keys(overT).filter((k) => k[0] !== '_').forEach((k) => { strings[k] = overT[k]; });
const CWIX = JSON.parse(need(path.join(AS, 'content', 'coursework', 'index.json')));
const CONTENT = { papers: [], twins: {}, sets: {}, lessons: {}, clusters: { clusters: {}, lessonFor: {}, order: [] }, seeds: {}, strings, BUILD: 'as-' + new Date().toISOString().slice(0, 10) };
const contentJs = 'window.A2CONTENT = ' + JSON.stringify(CONTENT) + ';\n';
const CWMETA = {};
// each built chapter's tick ids, in the order cw.js's tickIds() walks them (steps, then check rows)
function tickIds(node) {
  const ids = [];
  (function walk(n) {
    if (Array.isArray(n)) n.forEach(walk);
    else if (n && typeof n === 'object') {
      if (n.steps) n.steps.forEach((s) => ids.push(s.id));
      if (n.check) n.check.forEach((r) => ids.push(r.id));
      Object.keys(n).forEach((k) => { if (k !== 'steps' && k !== 'check') walk(n[k]); });
    }
  })(node);
  return ids;
}
CWIX.chapters.filter((c) => c.built).forEach((c) => {
  const ids = tickIds(JSON.parse(need(path.join(AS, 'content', 'coursework', 'ch' + c.id + '.json'))).stages);
  if (!ids.length || new Set(ids).size !== ids.length) { console.error('ch' + c.id + ': no steps, or a step id twice'); process.exit(1); }
  // the published index carries steps and stages for each built chapter, as A2's does (staff.js reads them)
  const chj = JSON.parse(need(path.join(AS, 'content', 'coursework', 'ch' + c.id + '.json')));
  c.steps = ids;
  c.stages = chj.stages.map((st, i) => [String(i + 1), st.title, st.screens.length]);
});
fs.writeFileSync(path.join(AS, 'content', 'coursework', 'index.json'), JSON.stringify(CWIX, null, 1) + '\n');
// A pupil's ticks are a bitmap over as/server/cw-slots.json, which only ever grows (as A2's does): a retired row keeps its slot
// as null, so no old tick lands on a new row; a new row goes at the END of its chapter. Made 18 Oct 2026 by the guide
// folder's _build/rewrite-18oct/make_slots.py when the write-up was taken out (chapters 19 and 20 are retired, all null).
const SLOTS = JSON.parse(need(path.join(AS, 'server', 'cw-slots.json')));
const BUILT = CWIX.chapters.filter((c) => c.built);
BUILT.forEach((c) => {
  const miss = c.steps.filter((id) => !(SLOTS[c.id] || []).includes(id));
  if (miss.length) { console.error('as/server/cw-slots.json: chapter ' + c.id + ' has no slot for ' + miss.length + ' row(s), first ' + miss[0] + '. Add them at the END of that chapter, never in the middle.'); process.exit(1); }
  const live = new Set(c.steps);
  CWMETA[c.id] = SLOTS[c.id].map((id) => (live.has(id) ? id : null));
});
CWMETA.files = CWIX.files.map((f) => f.name);

// ---- 3. the page scripts
let app = need(path.join(A2, 'platform', 'app.js'));
const sqlTile = app.slice(app.indexOf("'<button class=\"tile live\" data-go=\"#sql\">"), app.indexOf("'<button class=\"tile live\" data-go=\"#cw\">"));
app = swap('app.js', app, sqlTile, '');
const soon = app.slice(app.indexOf("'<div class=\"tile soon\""), app.indexOf("</div></div>');", app.indexOf("'<div class=\"tile soon\"")));
app = swap('app.js', app, soon, "Theory.tile() + '");
app = swap('app.js', app, "{ name: REC.n || ME.name })) + '</h1><div class=\"tiles\">' +", "{ name: REC.n || ME.name })) + '</h1><p class=\"th-lead\">' + h(T('home.lead')) + '</p><div class=\"tiles\">' +");
app = swap('app.js', app, "const bits = (location.hash || '#home').slice(1).split('/'), k = bits[0];\n    if (k === 'sql') vSql();", "const bits = (location.hash || '#home').slice(1).split('/'), k = bits[0];\n    if (k === 'theory') { Theory.route(bits); return; }\n    Theory.leftPage();\n    if (k === 'sql') vSql();");
app = swap('app.js', app, "    flushOutbox();\n    route();\n    notice(r.cw);", "    flushOutbox();\n    Theory.init({ T, h, go, call, frame, paintSys, app: () => app, me: () => ({ email: ME.email, cls: ME.cls, shown: () => REC.n || ME.name }) }, r.theory);\n    Theory.outerHash((x) => { if (x) location.hash = x; route(); notice(r.cw); });");
app = swap('app.js', app, 'for (let i = 0; i <= 12; i++) {', 'for (let i = 0; i <= 18; i++) {');
// the "guide has changed" message: AS's own id and time (18 Oct 2026 13:00 Irish time, in server minutes); its words are in strings-as.json
app = swap('app.js', app, "const NOTICE = { id: 'guide-2026-10', at: 417240, secs: 30 };", "const NOTICE = { id: 'as-guide-2026-10', at: 418320, secs: 30 };");
// staff: AS has no SQL papers, so no Papers or Live tab; the Coursework tab opens first
let staff = need(path.join(A2, 'platform', 'staff.js'));
staff = swap('staff.js', staff, "['papers', 'staff.tabPapers'], ['live', 'staff.tabLive'], ", '');
staff = swap('staff.js', staff, "TAB = 'live', CLS", "TAB = 'coursework', CLS");
// AS tick ids are <stage>-<screen>.<step> (A2's are <chapter>.<stage>.<step>): group the drawer's squares by stage
staff = swap('staff.js', staff, "const s = id.split('.')[1];", "const s = id.split('-')[0];");
staff = swap('staff.js', staff, "TAB = sel('tab') || 'live';", "TAB = sel('tab') || 'coursework'; if (TAB === 'papers' || TAB === 'live') TAB = 'coursework';");
staff = swap('staff.js', staff, "['coursework', 'staff.tabCoursework'], ['export', 'staff.tabExport']", "['theory', 'staff.tabTheory'], ['coursework', 'staff.tabCoursework'], ['export', 'staff.tabExport']");
staff = swap('staff.js', staff, "coursework: vCoursework, export: vExport })[TAB]();", "coursework: vCoursework, export: vExport, theory: vTheory })[TAB]();");
staff = swap('staff.js', staff, "  function vExport() {\n", `  function download(req) {
    return call(req).then((r) => {
      const url = URL.createObjectURL(new Blob(['\\ufeff' + r.csv], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a'); a.href = url; a.download = r.file; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }, fail);
  }
  function vTheory() {
    const when = (m, comma) => { const d = at(m); return T('staff.day', { day: T('staff.days').split(',')[d.getDay()], date: d.getDate(), month: T('staff.months').split(',')[d.getMonth()] }) + (comma ? ', ' : ' ') + hm(m); };
    const load = window.TheoryStaff.view({ T, h, pane, app: () => app, cls: () => CLS, call, fail, download, when, sel, keep });
    if (load) timer = setInterval(() => { if (!document.hidden && TAB === 'theory' && !app.querySelector('.drawer')) load(); }, 60000);
  }
  function vExport() {
`);
staff = swap('staff.js', staff, "<button class=\"btn\" data-csv>' + h(T('staff.csv')) + '</button></div>';", "<button class=\"btn\" data-csv>' + h(T('staff.csv')) + '</button> <button class=\"btn ghost\" data-csvth>' + h(T('staff.theory.csvAll')) + '</button></div>';\n    const bt = pane().querySelector('[data-csvth]');\n    bt.addEventListener('click', () => { bt.disabled = true; download({ op: 'theoryCsv', name: CLS, topic: 'all' }).then(() => { bt.disabled = false; }); });");
const scripts = [
  ['content.js', contentJs],
  ['lessonview.js', need(path.join(A2, 'platform', 'lessonview.js'))],
  ['tsql2sqlite.js', need(path.join(A2, 'tools', 'tsql2sqlite.js'))],
  ['editor.js', need(path.join(A2, 'platform', 'editor.js'))],
  ['lesson.js', need(path.join(A2, 'platform', 'lesson.js'))],
  ['cw.js', need(path.join(AS, 'src', 'cw.js'))],
  ['theory-games.js', 'window.THEORY_GAMES = ' + JSON.stringify(JSON.parse(need(path.join(AS, 'server', 'theory-games.json')))) + ';'],
  ['theory.js', need(path.join(AS, 'src', 'theory.js'))],
  ['theory-staff.js', need(path.join(AS, 'src', 'theory-staff.js'))],
  ['app.js', app],
  ['staff.js', staff],
];

// ---- the server
const APIS = ['apiBoot', 'apiName', 'apiState', 'apiMark', 'apiAnswer', 'apiTwin', 'apiTwinMark', 'apiFlag', 'apiEval', 'apiPing', 'apiKv', 'apiCw', 'apiStaff', 'apiTheory'];
const shim = `window.OLS_TRANSPORT = {
  call: function (fn, req) {
    return new Promise(function (resolve, reject) {
      if (${JSON.stringify(APIS)}.indexOf(fn) === -1) { reject(new Error('unknown call ' + fn)); return; }
      google.script.run.withSuccessHandler(resolve).withFailureHandler(reject)[fn](req || {});
    });
  }
};`;
const hashOf = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 10);
const index = need(path.join(A2, 'platform', 'index.html'));
const css = style + '\n/* ---- cw.css: the coursework guide ---- */\n' + cwcss + '\n' + need(path.join(AS, 'src', 'theory.css'));
let tpl = need(path.join(A2, 'server', 'Code.gs.template'));
tpl = swap('Code.gs.template', tpl, "SpreadsheetApp.create('A2 SSD - Archive')", "SpreadsheetApp.create('AS SSD - Archive')");
tpl = tpl.replace(/OLS A2 SSD Platform/g, 'OLS AS SSD Platform');
tpl = tpl.replace(/"A2 SSD - Archive"/g, '"AS SSD - Archive"');
// the Theory side: scores come with the boot, staff ops go through apiStaff's gate, and deleting a class takes its theory records with it
const THEORY = JSON.parse(need(path.join(AS, 'server', 'theory-games.json')));
const theoryGs = need(path.join(AS, 'src', 'theory.gs'));
tpl = swap('Code.gs.template', tpl, "rec: pupilView_(rec), cfg: classView_(readClass_(cls)), cw:", "rec: pupilView_(rec), cfg: classView_(readClass_(cls)), theory: thView_(cls, rec), cw:");
tpl = swap('Code.gs.template', tpl, "  if (!realClass_(name)) return err_('unknown-class');\n  if (op === 'delete')", "  if (!realClass_(name)) return err_('unknown-class');\n  if (op.indexOf('theory') === 0) return thStaff_(op, name, req, email);\n  if (op === 'delete')");
tpl = swap('Code.gs.template', tpl, "'s:' + name + ':', 'w:' + name + ':'];", "'s:' + name + ':', 'w:' + name + ':', 't:' + name + ':'];");
tpl = swap('Code.gs.template', tpl, "      store.deleteProperty('cls:' + name);", "      store.deleteProperty('cls:' + name);\n      store.deleteProperty('now:' + name);");
tpl += '\n\n' + theoryGs;
const BUILD = CONTENT.BUILD + '-' + hashOf(css + index + scripts.map((s) => s[1]).join('\n') + tpl + JSON.stringify(CWMETA)).slice(0, 8);
const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto.createHash('sha256').update(salt + crypto.randomBytes(32).toString('hex'), 'utf8').digest('hex');
const filled = tpl.replace("'@@OWNER_EMAIL@@'", JSON.stringify(OWNER_EMAIL)).replace("'@@STAFF_SALT@@'", JSON.stringify(salt))
  .replace("'@@STAFF_HASH@@'", JSON.stringify(hash)).replace("'@@BUILD@@'", JSON.stringify(BUILD)).replace("'@@TITLE@@'", JSON.stringify(strings['app.title']));
if (/@@[A-Z_]+@@/.test(filled)) { console.error('Code.gs.template: unfilled placeholder ' + filled.match(/@@[A-Z_]+@@/)[0]); process.exit(1); }
const META = { papers: {}, order: [], twinOrder: {}, clusterTwins: {} };
const code = asciiJs(['/* OLS AS SSD Platform - Code.gs - build ' + BUILD + ' - built by as/tools/build-as.js from the A2 template. Never commit. */',
  '/* AS has no SQL past papers: no answers, no judge. */\nvar A2PRIVATE = { answers: {}, worked: {}, expected: {} };',
  'var A2META = ' + JSON.stringify(META) + ';', 'var CWMETA = ' + JSON.stringify(CWMETA) + ';', 'var THEORY = ' + JSON.stringify(THEORY) + ';', filled].join('\n\n'));
guardAscii('Code.gs', code);
fs.mkdirSync(DEPLOY, { recursive: true, mode: 0o700 });
fs.writeFileSync(path.join(DEPLOY, 'Code.gs'), code, { mode: 0o600 });
fs.copyFileSync(path.join(A2, 'server', 'appsscript.json'), path.join(DEPLOY, 'appsscript.json'));

// ---- assemble Index.html (as A2's build-server.js)
const bodyOpen = (index.match(/<body[^>]*>/) || [])[0];
let body = index.slice(index.indexOf(bodyOpen) + bodyOpen.length);
body = body.slice(0, body.lastIndexOf('</body>') > -1 ? body.lastIndexOf('</body>') : body.length).replace(/<script[\s\S]*?<\/script>/gi, '');
const boot = '<script>window.OLS_BOOT = { classCode: "<?= classCode ?>", baseUrl: "<?= baseUrl ?>" };\n' +
  'window.A2_VENDOR = ' + JSON.stringify([CDN, GH]) + ';\nwindow.A2_DEPLOY = ' + JSON.stringify('a2ssd-' + BUILD) + ';\nwindow.A2_CW = ' + JSON.stringify(CW) + ';</script>';
const frags = [boot, '<script>\n' + jsBlock(shim) + '\n</script>']
  .concat(scripts.map(([n, s]) => { const b = jsBlock(s); if (/<\/script/i.test(b)) { console.error(n + ': </script left'); process.exit(1); } return '<script>\n' + b + '\n</script>'; }))
  .concat(["<script>window.addEventListener('DOMContentLoaded', function () { App.boot(); });</script>"]);
const out = `<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<base target="_top">
<title>${asciiHtml(strings['app.title'])}</title>
<style>
${asciiCss(css)}
</style>
</head>
${bodyOpen}
${frags[0]}
${asciiHtml(body.trim())}
${frags.slice(1).join('\n')}
</body>
</html>
`;
guardScriptlets('Index.html', out);
guardAscii('Index.html', out);
const closes = (out.match(/<\/script>/gi) || []).length;
if (closes !== frags.length) { console.error('Index.html: ' + closes + ' </script> for ' + frags.length + ' blocks'); process.exit(1); }
fs.writeFileSync(path.join(AS, 'server', 'Index.html'), out);
fs.writeFileSync(path.join(DEPLOY, 'BUILD.txt'), BUILD + '\n');
console.log('Code.gs    ' + (code.length / 1024).toFixed(1) + ' KB -> ' + path.join(DEPLOY, 'Code.gs'));
console.log('Index.html ' + (out.length / 1024).toFixed(1) + ' KB, ' + closes + ' script blocks -> as/server/Index.html');
console.log('build ' + BUILD);
