// Shared building blocks for every game: elements, icons, code panels, console panels, sounds, marking helpers.
import { ICONS } from './icons.js';
import { store } from './store.js';

/* ---------- elements ---------- */
export function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else el.setAttribute(k, v === true ? '' : v);
    }
  }
  append(el, kids);
  return el;
}
function append(el, kids) {
  for (const k of kids) {
    if (k === null || k === undefined || k === false) continue;
    if (Array.isArray(k)) append(el, k);
    else if (k instanceof Node) el.appendChild(k);
    else el.appendChild(document.createTextNode(String(k)));
  }
}
export function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }

export function icon(name, cls) {
  const svg = ICONS[name] || ICONS['circle-help'];
  const t = document.createElement('template');
  t.innerHTML = svg.replace(/class="[^"]*"/, `class="ic${cls ? ' ' + cls : ''}" aria-hidden="true"`);
  return t.content.firstChild;
}

// Inline rich text: `code` → code chip, **bold** → bold.
export function rich(text) {
  const frag = document.createDocumentFragment();
  const parts = String(text).split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  for (const p of parts) {
    if (!p) continue;
    if (p.startsWith('`') && p.endsWith('`')) frag.appendChild(h('code', { class: 'inl' }, p.slice(1, -1)));
    else if (p.startsWith('**') && p.endsWith('**')) frag.appendChild(h('b', null, p.slice(2, -2)));
    else frag.appendChild(document.createTextNode(p));
  }
  return frag;
}
export function para(text, cls) { return h('p', cls ? { class: cls } : null, rich(text)); }

/* ---------- random ---------- */
export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
// Shuffle, but never leave the list in its original order (when it has 2+ distinct items).
export function shuffleNot(arr, same = (a, b) => a === b) {
  if (arr.length < 2) return arr.slice();
  for (let t = 0; t < 20; t++) {
    const s = shuffle(arr);
    if (!s.every((x, i) => same(x, arr[i]))) return s;
  }
  return arr.slice(1).concat(arr[0]);
}
export function sample(arr, n) { return shuffle(arr).slice(0, n); }
export function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
export function randInt(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }

/* ---------- lenient marking ---------- */
// Punctuation, capitals, accents and spacing never cost a mark. Digits, decimal points, minus signs and £ are kept.
export function normalise(s) {
  return String(s ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[‘’“”]/g, "'")
    .replace(/(\d)\.(?=\d)/g, '$1\u0001')
    .replace(/(^|[\s(])-(?=\d)/g, '$1\u0002')
    .replace(/[^a-z0-9£\u0001\u0002 ]+/g, ' ')
    .replace(/\u0001/g, '.').replace(/\u0002/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}
export function sameAnswer(a, b) { return normalise(a) === normalise(b); }
// Code comparison: spacing and capitals never matter; brackets and symbols do (they carry meaning in code).
export function squashCode(s) { return String(s ?? '').replace(/\s+/g, '').replace(/;+$/, '').toLowerCase(); }

/* ---------- C# highlighter (Visual Studio dark colours) ---------- */
const KW = new Set(['public', 'private', 'static', 'void', 'int', 'double', 'string', 'char', 'bool', 'return', 'ref', 'out',
  'new', 'true', 'false', 'class', 'namespace', 'using', 'var', 'null', 'float', 'decimal', 'long', 'const']);
const CTL = new Set(['if', 'else', 'while', 'do', 'for', 'foreach', 'switch', 'case', 'default', 'break', 'continue', 'in']);
const TY = new Set(['Console', 'Convert', 'Math', 'String', 'Program', 'FormatException']);
export function highlight(line) {
  const out = [];
  const re = /(\/\/.*$)|(\$?"(?:[^"\\]|\\.)*"?)|('(?:[^'\\]|\\.)*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)|(\s+)|(.)/g;
  let m;
  while ((m = re.exec(line))) {
    const [tok, com, str, chr, num, id, ws] = m;
    if (com) out.push(span('co', com));
    else if (str) out.push(...interp(str));
    else if (chr) out.push(span('st', chr));
    else if (num) out.push(span('nu', num));
    else if (id) {
      const rest = line.slice(re.lastIndex);
      if (KW.has(id)) out.push(span('kw', id));
      else if (CTL.has(id)) out.push(span('ctl', id));
      else if (TY.has(id)) out.push(span('ty', id));
      else if (/^\s*\(/.test(rest)) out.push(span('me', id));
      else out.push(span('va', id));
    } else if (ws) out.push(document.createTextNode(ws));
    else out.push(span('pu', tok));
  }
  return out;
}
function span(c, t) { const s = document.createElement('span'); s.className = 'tk-' + c; s.textContent = t; return s; }
function interp(str) {
  if (!str.startsWith('$')) return [span('st', str)];
  // $"... {expr} ..." — braces' contents coloured as code
  const parts = [];
  let i = 0, buf = '';
  while (i < str.length) {
    const c = str[i];
    if (c === '{' && str[i + 1] !== '{') {
      if (buf) parts.push(span('st', buf));
      buf = '';
      const j = str.indexOf('}', i);
      const inner = str.slice(i + 1, j < 0 ? str.length : j);
      parts.push(span('pu', '{'));
      const colon = inner.indexOf(':');
      const expr = colon >= 0 ? inner.slice(0, colon) : inner;
      parts.push(...highlight(expr));
      if (colon >= 0) parts.push(span('st', inner.slice(colon)));
      parts.push(span('pu', '}'));
      i = j < 0 ? str.length : j + 1;
    } else { buf += c; i++; }
  }
  if (buf) parts.push(span('st', buf));
  return parts;
}

// A Visual Studio style code panel. lines: array of strings. Returns {el, lines:[lineEls]}.
export function codeBlock(lines, opts = {}) {
  const pre = h('pre');
  const lineEls = lines.map((t, i) => {
    const ln = h('div', { class: 'ln', dataset: { i } },
      h('span', { class: 'n' }, String((opts.start || 1) + i)),
      h('span', { class: 't' }, highlight(t)));
    if (opts.onLine) {
      ln.classList.add('clickable');
      ln.tabIndex = 0;
      ln.setAttribute('role', 'button');
      ln.addEventListener('click', () => opts.onLine(i, ln));
      ln.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); opts.onLine(i, ln); } });
    }
    pre.appendChild(ln);
    return ln;
  });
  const el = h('div', { class: 'code' + (opts.cls ? ' ' + opts.cls : '') },
    opts.tab === false ? null : h('div', { class: 'tab' }, h('span', { class: 'dot' }), opts.title || 'Program.cs'),
    pre);
  return { el, lines: lineEls };
}
export function codeInline(text) { return h('code', { class: 'inl' }, text); }
export function codeSpan(text) { const s = h('span', { style: { fontFamily: 'var(--mono)' } }); highlight(text).forEach((n) => s.appendChild(n)); return s; }

/* ---------- console panel ---------- */
// print(text, cls) adds a line; input() returns a Promise of what the user types (Enter to send).
export function consolePanel(opts = {}) {
  const out = h('div', { class: 'out', 'aria-live': 'polite' });
  const el = h('div', { class: 'console' },
    h('div', { class: 'bar' }, icon('terminal'), opts.title || 'Microsoft Visual Studio Debug Console'),
    out);
  let cur = null;
  function line() { if (!cur) { cur = h('div'); out.appendChild(cur); } return cur; }
  const api = {
    el,
    write(text, cls) { const l = line(); l.appendChild(cls ? h('span', { class: cls }, text) : document.createTextNode(text)); scroll(); },
    print(text = '', cls) {
      const l = line();
      if (text) l.appendChild(cls ? h('span', { class: cls }, text) : document.createTextNode(text));
      if (!l.textContent) l.appendChild(document.createTextNode(' '));
      cur = null; scroll();
    },
    clear() { clear(out); cur = null; },
    input() {
      return new Promise((resolve) => {
        const l = line();
        const inp = h('input', { class: 'cin', type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': 'Type here, then press Enter' });
        l.appendChild(inp);
        setTimeout(() => inp.focus({ preventScroll: true }), 30);
        inp.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const v = inp.value;
            inp.replaceWith(h('span', { class: 'in' }, v));
            cur = null;
            resolve(v);
          }
        });
        api.cancel = () => { inp.disabled = true; resolve(null); };
        scroll();
      });
    },
    cancel() {},
  };
  function scroll() { out.scrollTop = out.scrollHeight; }
  return api;
}

// The Visual Studio "Error List" for programs that will not build.
export function errorList(errors) {
  return h('div', { class: 'errlist' },
    h('div', { class: 'bar' }, icon('x'), `Error List — ${errors.length} error${errors.length === 1 ? '' : 's'} · the program did not build`),
    errors.map(([code, msg]) => h('div', { class: 'e' }, icon('x'), h('span', { class: 'cs' }, code), h('span', null, msg))));
}

/* ---------- feedback ---------- */
export function fb(kind, ...lines) {
  const ic = kind === 'good' ? 'check' : kind === 'bad' ? 'x' : 'info';
  return h('div', { class: 'fb ' + kind, role: kind === 'info' ? null : 'status' }, icon(ic),
    h('div', null, lines.filter(Boolean).map((t) => (t instanceof Node ? t : para(t)))));
}
export function markTag(ok, text) {
  return h('span', { class: 'mark ' + (ok ? 'good' : 'bad') }, icon(ok ? 'check' : 'x'), text || (ok ? 'Correct' : 'Not right'));
}
export function setMark(el, ok) {
  el.classList.remove('right', 'wrong');
  el.classList.add(ok ? 'right' : 'wrong');
  let mk = el.querySelector(':scope > .mk');
  if (!mk) { mk = h('span', { class: 'mk' }); el.appendChild(mk); }
  clear(mk).appendChild(icon(ok ? 'check' : 'x'));
  mk.setAttribute('aria-label', ok ? 'correct' : 'wrong');
}

let toastBox = null;
export function toast(text, kind = 'good', ms = 1600) {
  if (!toastBox) { toastBox = h('div', { class: 'toasts', 'aria-live': 'polite' }); document.body.appendChild(toastBox); }
  const t = h('div', { class: 'toast ' + kind }, icon(kind === 'good' ? 'check' : kind === 'bad' ? 'x' : 'info'), text);
  toastBox.appendChild(t);
  setTimeout(() => t.remove(), ms);
}

export function btn(label, onclick, cls = '', ic) {
  return h('button', { class: 'btn ' + cls, type: 'button', onclick }, ic ? icon(ic) : null, label);
}

/* ---------- choices ---------- */
// Single-answer choice set. Returns {el, value(), lock(correctIndex)}.
export function choiceSet(options, opts = {}) {
  let picked = -1;
  const wrap = h('div', { class: 'choices' + (opts.cols === 1 ? ' one' : ''), role: 'radiogroup', style: opts.cols === 1 ? { gridTemplateColumns: '1fr' } : null });
  const btns = options.map((o, i) => {
    const b = h('button', { class: 'choice' + (opts.mono ? ' mono' : ''), type: 'button', role: 'radio', 'aria-checked': 'false' },
      o instanceof Node ? o : (opts.mono ? codeSpan(o) : rich(o)));
    b.addEventListener('click', () => {
      if (wrap.dataset.locked) return;
      picked = i;
      btns.forEach((x, j) => { x.classList.toggle('picked', j === i); x.setAttribute('aria-checked', j === i ? 'true' : 'false'); });
      opts.onPick && opts.onPick(i);
    });
    wrap.appendChild(b);
    return b;
  });
  return {
    el: wrap,
    btns,
    value: () => picked,
    lock(correct) {
      wrap.dataset.locked = '1';
      btns.forEach((b, j) => {
        b.disabled = true;
        if (j === correct) setMark(b, true);
        else if (j === picked) setMark(b, false);
      });
    },
  };
}

/* ---------- sound (off until switched on) ---------- */
let actx = null;
function tone(freq, dur, type = 'sine', vol = 0.08, when = 0) {
  if (!store.sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const t0 = actx.currentTime + when;
    const o = actx.createOscillator();
    const g = actx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(actx.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
  } catch (e) { /* no audio */ }
}
export const sfx = {
  good() { tone(660, 0.09, 'triangle'); tone(990, 0.14, 'triangle', 0.07, 0.08); },
  bad() { tone(180, 0.18, 'sawtooth', 0.05); },
  tick() { tone(1200, 0.03, 'square', 0.03); },
  place() { tone(520, 0.05, 'triangle', 0.05); },
  star(i = 0) { tone(880 + i * 220, 0.18, 'triangle', 0.08); },
  win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.07, i * 0.1)); },
};

export function confettiBurst() {
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (typeof window.confetti === 'function') {
      window.confetti({ particleCount: 140, spread: 80, origin: { y: 0.35 }, colors: ['#F472B6', '#22D3EE', '#FBBF24', '#A3E635', '#A78BFA'] });
    }
  } catch (e) { /* no confetti */ }
}

export function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

// Fills a stage with the common top-of-game instruction block.
export function instr(text, more) {
  return h('div', { class: 'instr' }, icon('info'), h('div', null, para(text), more ? para(more) : null));
}

// Sticky footer with action buttons and an optional note on the left.
export function actions(...kids) { return h('div', { class: 'actions' }, kids); }

export function scrollIntoViewSoft(el) {
  try { el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) { /* old browser */ }
}
