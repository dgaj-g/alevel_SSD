// Writes as/server/theory-games.json from each arcade's registry. The server's finish check, the Theory page and the staff grid
// all read this one list, and gate G5 checks it against the registry.
//   node as/tools/theory-games.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DEFAULT_CAP = 200; // games work out their maximum as they run, so the cap is a plausibility ceiling; a registry entry may set its own
async function topic(rel) {
  const { ZONES, GAMES } = await import(pathToFileURL(path.join(ROOT, rel)).href);
  return {
    parts: ZONES.filter((z) => !z.opens).map((z) => z.key).join(''),
    zones: ZONES.map((z) => ({ key: z.key, title: z.title, ...(z.opens ? { opens: z.opens } : {}) })),
    games: GAMES.map((g) => ({ id: g.id, zone: g.zone.key, title: g.title, cap: g.cap || DEFAULT_CAP, ...(g.part ? { part: g.part } : {}) })),
  };
}
const out = { methods: await topic('methods/js/registry.js'), strings: { parts: '', zones: [], games: [] } };
fs.writeFileSync(path.join(ROOT, 'as', 'server', 'theory-games.json'), JSON.stringify(out, null, 1) + '\n');
console.log('theory-games.json: methods ' + out.methods.games.length + ' games, parts ' + out.methods.parts);
