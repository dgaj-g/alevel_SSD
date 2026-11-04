// Collects every {cs, expect} program from the arcade's data modules into programs.json.
import { readdirSync, writeFileSync } from 'fs';
import { pathToFileURL } from 'url';
const DATA = new URL('../js/data', import.meta.url).pathname;
const found = [];
function walk(v, path) {
  if (!v || typeof v !== 'object') return;
  if (v.cs && v.expect) found.push({ id: path, cs: v.cs.seed ? { ...v.cs, main: v.cs.main.replaceAll('new Random()', `new Random(${v.cs.seed})`) } : v.cs, expect: v.expect });
  for (const [k, x] of Object.entries(v)) if (k !== 'cs' && k !== 'expect') walk(x, path + '.' + k);
}
for (const f of readdirSync(DATA).filter((f) => f.endsWith('.js')).sort()) {
  const mod = await import(pathToFileURL(DATA + '/' + f).href);
  for (const [k, v] of Object.entries(mod)) walk(v, f.replace('.js', '') + '.' + k);
}
writeFileSync(new URL('./programs.json', import.meta.url), JSON.stringify(found, null, 1));
console.log(found.length + ' programs');
