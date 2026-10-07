// Drag-and-drop board: chips move between zones (a tray, one-chip slots, unlimited buckets).
// Drag with mouse or finger, OR tap a chip then tap where it goes, OR use the keyboard (Enter to pick up, Enter on a zone to drop).
import { h, sfx } from './ui.js';

export function createBoard(opts = {}) {
  const zones = new Set();
  let selected = null;
  let locked = false;
  let uid = 0;

  function zoneOf(chip) { return chip.parentElement && chip.parentElement.__zone ? chip.parentElement : null; }
  function cap(z) { return z.__zone.cap; }

  function select(chip) {
    if (selected) selected.classList.remove('selected');
    selected = chip;
    zones.forEach((z) => z.classList.remove('target'));
    if (chip) {
      chip.classList.add('selected');
      zones.forEach((z) => { if (z !== zoneOf(chip)) z.classList.add('target'); });
    }
  }

  function place(chip, zone, silent) {
    if (locked || !zone) return;
    const from = zoneOf(chip);
    if (from === zone) { select(null); return; }
    if (cap(zone) === 1) {
      const there = zone.querySelector('.chip');
      if (there && there !== chip) (from || trayZone()).appendChild(there);
    }
    zone.appendChild(chip);
    refresh();
    select(null);
    if (!silent) sfx.place();
    opts.onChange && opts.onChange();
  }

  function trayZone() { for (const z of zones) if (z.__zone.tray) return z; return null; }

  function refresh() {
    zones.forEach((z) => {
      if (z.__zone.cap === 1) z.classList.toggle('filled', !!z.querySelector('.chip'));
    });
  }

  function addZone(el, cfg) {
    el.__zone = cfg;
    zones.add(el);
    if (!el.hasAttribute('tabindex')) el.tabIndex = 0;
    el.addEventListener('click', (e) => {
      if (locked) return;
      if (e.target.closest('.chip') && el.contains(e.target.closest('.chip'))) return;
      if (selected) place(selected, el);
    });
    el.addEventListener('keydown', (e) => {
      if (locked) return;
      if ((e.key === 'Enter' || e.key === ' ') && e.target === el && selected) { e.preventDefault(); place(selected, el); el.focus(); }
    });
    return el;
  }

  const board = {
    tray(el) { el.classList.add('tray'); if (!el.dataset.empty) el.dataset.empty = 'All placed'; return addZone(el, { cap: Infinity, tray: true }); },
    slot(el) { el.classList.add('slot'); return addZone(el, { cap: 1 }); },
    bucket(el) { el.classList.add('bucket'); return addZone(el, { cap: Infinity }); },
    chip(content, data = {}, cls = '') {
      const c = h('div', { class: 'chip ' + cls, tabindex: '0', role: 'button', dataset: { cid: String(++uid) } }, content);
      c.__data = data;
      bindChip(c);
      return c;
    },
    place(chip, zone) { place(chip, zone, true); },
    zoneOf,
    data(chip) { return chip.__data; },
    contents(zone) { return [...zone.querySelectorAll(':scope > .chip')]; },
    lock() { locked = true; select(null); zones.forEach((z) => { z.classList.remove('target', 'over'); if (z.__zone.tray) z.classList.add('static'); }); zoneChips().forEach((c) => c.classList.add('locked')); },
    unlock() { locked = false; zones.forEach((z) => z.__zone.tray && z.classList.remove('static')); zoneChips().forEach((c) => c.classList.remove('locked')); },
    get locked() { return locked; },
    refresh,
  };
  function zoneChips() { const a = []; zones.forEach((z) => a.push(...z.querySelectorAll('.chip'))); return a; }

  function bindChip(chip) {
    let start = null, ghost = null, over = null, dx = 0, dy = 0, raf = 0, lastXY = null;

    chip.addEventListener('keydown', (e) => {
      if (locked) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const z = zoneOf(chip);
        if (selected && selected !== chip && z && cap(z) === 1) { place(selected, z); return; }
        select(selected === chip ? null : chip);
      } else if (e.key === 'Escape') select(null);
    });

    chip.addEventListener('pointerdown', (e) => {
      if (locked || e.button > 0) return;
      start = { x: e.clientX, y: e.clientY, id: e.pointerId };
      try { chip.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    });

    chip.addEventListener('pointermove', (e) => {
      if (!start || e.pointerId !== start.id) return;
      if (!ghost) {
        if (Math.hypot(e.clientX - start.x, e.clientY - start.y) < 6) return;
        const r = chip.getBoundingClientRect();
        dx = start.x - r.left; dy = start.y - r.top;
        ghost = chip.cloneNode(true);
        ghost.classList.remove('selected');
        ghost.classList.add('ghost');
        ghost.style.width = r.width + 'px';
        document.body.appendChild(ghost);
        chip.classList.add('dragging-src');
        select(null);
      }
      lastXY = [e.clientX, e.clientY];
      if (!raf) raf = requestAnimationFrame(frame);
    });

    function frame() {
      raf = 0;
      if (!ghost || !lastXY) return;
      const [x, y] = lastXY;
      ghost.style.transform = `translate(${x - dx}px, ${y - dy}px)`;
      const under = document.elementFromPoint(x, y);
      const z = under && findZone(under);
      if (z !== over) {
        if (over) over.classList.remove('over');
        over = z;
        if (over) over.classList.add('over');
      }
      // edge auto-scroll while dragging
      const m = 70;
      if (y < m) window.scrollBy(0, -12);
      else if (y > window.innerHeight - m) window.scrollBy(0, 12);
    }

    function end(e, cancelled) {
      if (!start) return;
      const wasDrag = !!ghost;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (ghost) {
        if (lastXY) frame();
        ghost.remove(); ghost = null;
        chip.classList.remove('dragging-src');
        if (over) { over.classList.remove('over'); if (!cancelled) place(chip, over); }
        over = null;
      }
      start = null; lastXY = null;
      if (!wasDrag && !cancelled) tap();
    }
    chip.addEventListener('pointerup', (e) => end(e, false));
    chip.addEventListener('pointercancel', (e) => end(e, true));
    chip.addEventListener('lostpointercapture', (e) => { if (start) end(e, !ghost); });

    function tap() {
      if (locked) return;
      const z = zoneOf(chip);
      if (selected && selected !== chip && z && cap(z) === 1) { place(selected, z); return; }
      select(selected === chip ? null : chip);
    }
  }

  function findZone(el) {
    let n = el;
    while (n && n !== document.body) { if (n.__zone && zones.has(n)) return n; n = n.parentElement; }
    return null;
  }

  return board;
}
