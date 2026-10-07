// B4 Calls Become Values — booklet section 4: a call that returns a value BECOMES that value.
// Click the call that runs first, say what it hands back, watch the line collapse.
import { h, icon, codeSpan, codeBlock, consolePanel, fb, shuffle, choiceSet, sfx, para, btn, sameAnswer, wait, scrollIntoViewSoft } from '../ui.js';
import { runRounds, checkButton, explain } from '../kit.js';
import { COLLAPSE, M } from '../data/b.js';

const NAMES = ['Square', 'ShowSquare', 'Add', 'Half', 'Twice', 'Sign', 'Line'];
const TITLES = ['Two calls in a sum', 'A value inside a job', 'A call inside a call', 'Worked out, then handed over', 'Int division', 'Text comes back', 'Three calls, one line', 'The void trap'];
const S = '\u0001', E = '\u0002'; // marks a value that replaced a call
const plain = (s) => s.replace(/[\u0001\u0002]/g, '');

// Finds the ')' that closes the '(' at i, skipping string and char literals.
function closeOf(s, i) {
  let d = 0, q = null;
  for (let j = i; j < s.length; j++) {
    const c = s[j];
    if (q) { if (c === '\\') j++; else if (c === q) q = null; continue; }
    if (c === '"' || c === "'") q = c;
    else if (c === '(') d++;
    else if (c === ')') { d--; if (!d) return j; }
  }
  return -1;
}
// Renders code text with every known call as a clickable span (nested calls nest) and replaced values highlighted.
function render(s, onCall) {
  const out = [];
  let i = 0, buf = '';
  const flush = () => { if (buf) { pushText(buf); buf = ''; } };
  const pushText = (t) => {
    const parts = t.split(new RegExp(`(${S}[^${E}]*${E})`));
    parts.forEach((p) => {
      if (!p) return;
      if (p[0] === S) out.push(h('span', { class: 'val' }, codeSpan(p.slice(1, -1))));
      else out.push(codeSpan(p));
    });
  };
  while (i < s.length) {
    const m = /^[A-Za-z_]\w*/.exec(s.slice(i));
    const prev = i ? s[i - 1] : ' ';
    if (m && !/[\w.]/.test(prev) && NAMES.includes(m[0]) && s[i + m[0].length] === '(') {
      const open = i + m[0].length, close = closeOf(s, open);
      if (close > 0) {
        flush();
        const text = s.slice(i, close + 1);
        const span = h('span', { class: 'call', tabindex: '0', role: 'button', 'aria-label': `the call ${plain(text)}` },
          codeSpan(m[0] + '('), render(s.slice(open + 1, close), onCall), codeSpan(')'));
        const fire = (e) => { e.stopPropagation(); onCall(plain(text), span); };
        span.addEventListener('click', fire);
        span.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(e); } });
        out.push(span);
        i = close + 1;
        continue;
      }
    }
    if (m) { buf += m[0]; i += m[0].length; } else { buf += s[i]; i++; }
  }
  flush();
  return out;
}
const hasCall = (t) => NAMES.some((n) => new RegExp(`(^|[^\\w.])${n}\\(`).test(t.slice(t.indexOf('(') + 1)));

function collapseRound(it, k, api) {
  return {
    title: TITLES[k] || 'Collapse the line',
    intro: 'A call that returns a value BECOMES that value. Click the call that runs FIRST — then say what it hands back.',
    intro2: 'Arguments are worked out before the call they belong to. Otherwise C# goes left to right.',
    async run(box, ctx) {
      let cur = it.line;
      let pts = 0;
      const max = it.steps.length * 2 + (it.final ? 1 : 0);
      const lineEl = h('div', { class: 'callline' });
      const status = h('p', { class: 'bigq', style: { margin: '12px 0 0' } });
      const valrow = h('div');
      const con = consolePanel();
      con.print('(nothing printed yet)', 'sys');
      let printed = false;
      const methods = it.methods.map((n) => M[n]).join('\n\n').split('\n');
      box.append(
        h('div', { class: 'card' },
          h('p', { class: 'note', style: { margin: '0 0 8px' } }, 'In Main:'),
          it.pre.length ? h('div', { class: 'callline', style: { borderBottom: 0, borderRadius: '14px 14px 0 0', paddingBottom: 0, lineHeight: 1.6 } }, it.pre.map((l) => h('div', null, codeSpan(l)))) : null,
          lineEl, status, valrow),
        h('div', { class: 'split mt' }, codeBlock(methods, { title: 'The methods' }).el, con.el));

      for (let si = 0; si < it.steps.length; si++) {
        if (!api.alive) return null;
        const st = it.steps[si];
        let misses = 0;
        status.textContent = si === 0 ? 'Click the call that runs first.' : 'Which call runs next?';
        valrow.replaceChildren();
        lineEl.classList.remove('locked');
        ctx.setFoot(h('span', { class: 'note' }, 'Click a call in the line.'));
        // 1. pick the call
        const picked = await new Promise((resolve) => {
          lineEl.replaceChildren(...render(cur, (text, span) => {
            if (lineEl.classList.contains('locked')) return;
            if (text.replace(/\s+/g, '') === st.call.replace(/\s+/g, '')) {
              lineEl.classList.add('locked');
              span.classList.add('now');
              if (!misses) { pts++; sfx.good(); } else sfx.tick();
              resolve(span);
            } else {
              misses++;
              sfx.bad();
              span.classList.remove('nope'); void span.offsetWidth; span.classList.add('nope');
              status.textContent = hasCall(text)
                ? `Not yet — ${text.slice(0, text.indexOf('('))} cannot start until its arguments have values. What is inside it runs first.`
                : 'Not that one — C# works left to right. Try again.';
            }
          }));
        });
        // 2. what does it hand back?
        status.textContent = it.trap ? `What would ${st.call} hand back?` : `${st.call} runs. What does it hand back?`;
        const inp = h('input', { class: 'field mono', type: 'text', placeholder: 'its value', autocomplete: 'off', spellcheck: 'false', 'aria-label': `What ${st.call} hands back` });
        const answered = new Promise((resolve) => {
          const go = (v) => { if (v !== null && !String(v).trim()) { inp.focus(); return; } resolve(v); };
          inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); go(inp.value); } });
          valrow.replaceChildren(h('div', { class: 'valrow' }, inp,
            btn('Check', () => go(inp.value), 'primary', 'check'),
            btn('Nothing — it is void', () => go(null), 'ghost')));
          ctx.setFoot(h('span', { class: 'note' }, 'Type the value, or say it hands nothing back.'));
          setTimeout(() => inp.focus({ preventScroll: true }), 60);
        });
        const v = await answered;
        valrow.querySelectorAll('button, input').forEach((x) => { x.disabled = true; });
        const ok = st.val === null ? v === null : (v !== null && sameAnswer(v, st.val));
        if (ok) { pts++; sfx.good(); } else sfx.bad();
        let msg;
        if (st.val === null) msg = `${st.call} is void — it hands nothing back.${st.prints ? ` It prints ${st.prints} itself.` : ''}`;
        else msg = `${st.call} hands back ${st.val}.`;
        if (!ok && st.val !== null && v === null) msg += ' It is not void: its header has a return type, so the call has a value.';
        const f = fb(ok ? 'good' : 'bad', msg);
        valrow.append(f);
        if (st.prints && !it.trap) {
          if (!printed) { con.clear(); printed = true; }
          con.print(st.prints);
        }
        if (ok) await wait(700); else await ctx.next('Carry on');
        // 3. collapse
        if (st.val !== null) {
          const lit = /^-?\d+(\.\d+)?$/.test(st.val) ? st.val : `"${st.val}"`;
          const base = plain(cur);
          const idx = base.indexOf(st.call);
          if (idx >= 0) cur = base.slice(0, idx) + S + lit + E + base.slice(idx + st.call.length);
        } else {
          picked.style.textDecoration = 'line-through';
        }
        lineEl.classList.remove('locked');
        lineEl.replaceChildren(...render(cur, () => {}));
        lineEl.classList.add('locked');
      }

      // 4. the final question
      status.textContent = '';
      if (it.final) valrow.replaceChildren();
      let finalOk = false;
      if (it.final && it.final.options) {
        const opts = shuffle(it.final.options);
        const cs = choiceSet(opts);
        valrow.append(para(it.final.q, 'bigq'), cs.el);
        await checkButton(ctx, () => {
          if (cs.value() < 0) return false;
          const right = opts.indexOf(it.final.options[it.final.a]);
          cs.lock(right);
          finalOk = cs.value() === right;
          (finalOk ? sfx.good : sfx.bad)();
          valrow.append(fb(finalOk ? 'good' : 'bad', it.final.why));
        }, 'Check', 'Pick one.');
      } else if (it.final) {
        const inp = h('input', { class: 'field mono', type: 'text', autocomplete: 'off', spellcheck: 'false', 'aria-label': it.final.q, style: { maxWidth: '260px' } });
        valrow.append(para(it.final.q, 'bigq'), inp);
        setTimeout(() => inp.focus({ preventScroll: true }), 60);
        await checkButton(ctx, () => {
          if (!inp.value.trim()) { inp.focus(); return false; }
          inp.disabled = true;
          finalOk = sameAnswer(inp.value, it.final.a);
          inp.classList.add(finalOk ? 'good' : 'bad');
          (finalOk ? sfx.good : sfx.bad)();
          valrow.append(fb(finalOk ? 'good' : 'bad', finalOk ? `Yes — ${it.final.a}.` : `It is ${it.final.a}.`));
        }, 'Check', 'Type your answer.');
      } else {
        valrow.append(fb('info', 'The line has finished: every call has run, and the void call did its job by printing.'));
      }
      if (finalOk) pts++;
      const f = fb(pts === max ? 'good' : 'bad', `${pts} of ${max} for this line.`);
      box.append(f);
      scrollIntoViewSoft(f);
      await ctx.next();
      return { score: pts, max };
    },
  };
}

export default {
  mount(stage, api) {
    runRounds(stage, api, COLLAPSE.map((it, k) => collapseRound(it, k, api)));
  },
};
