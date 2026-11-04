// Which games are open, given a class's open part letters. No DOM: the gates and the build tool import this too.
// A zone with `opens: 'any'` is open when any part letter is open (Topic 4's definitions); with `opens: 'ABCD'` when all of
// those letters are open (Topic 4's final challenge); otherwise when its own letter is open. A game with `part` follows that part.
export function zoneOpen(zone, open) {
  const o = open || '';
  if (zone.opens === 'any') return o.length > 0;
  if (zone.opens) return [...zone.opens].every((l) => o.includes(l));
  return o.includes(zone.key);
}
export function gameOpen(game, zone, open) {
  if (game.part) return (open || '').includes(game.part);
  return zoneOpen(zone, open);
}
export function openGames(zones, open) {
  const out = [];
  for (const z of zones) for (const g of z.games) if (gameOpen(g, z, open)) out.push(g.id);
  return out;
}
// Terms of a definitions pool that belong to open parts.
export function openTerms(terms, open) { return terms.filter((t) => (open || '').includes(t.part)); }
// Section 5.4: her last game if unfinished and open; else the first open game with no first score; else nothing.
export function carryOn(zones, open, best, pos) {
  const has = (id) => !!(best && best[id] && best[id].n);
  const ids = openGames(zones, open);
  if (pos && ids.includes(pos) && !has(pos)) return pos;
  return ids.find((id) => !has(id)) || null;
}
// A registry the gates can trust: every game in exactly one zone, ids unique, zones lettered.
export function checkRegistry(zones, games) {
  const errs = []; const seen = new Set();
  for (const z of zones) {
    if (!/^[A-Z]$/.test(z.key)) errs.push(`zone ${z.key} has no letter`);
    for (const g of z.games) { if (seen.has(g.id)) errs.push(`game ${g.id} is in two zones`); seen.add(g.id); }
  }
  for (const g of games) if (!seen.has(g.id)) errs.push(`game ${g.id} is in no zone`);
  return errs;
}
