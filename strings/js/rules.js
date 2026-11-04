// The six rules of "Accept or Refuse?" with their judges. Every rule carries its probe table id, or `hand` rows where the
// booklet's rule has no table; gates/g6_rules.mjs runs every judge over those rows and verify/judges.py over dotnet.
const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const shuffle = (a) => { const o = [...a]; for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; } return o; };
const CAPS = 'ABCDEFGHJKLMNPRSTUVWXYZ'.split('');
const L = () => pick(CAPS);
const D = () => String(rand(0, 9));
const shortOrLong = (c, x) => (Math.random() < 0.5 ? c.slice(0, c.length - 1) : c + x);
const threeDifferent = () => { const s = new Set(); while (s.size < 3) s.add(L()); return [...s].join(''); };

export const RULES = [
  { key: 'pa1', method: 'OneCapitalThreeDigits', hand: { pass: ['A123', 'B456', 'C789', 'D012'], fail: ['AB12', 'A12', '1ABC', 'A12B', ''] },
    model: 'public static bool OneCapitalThreeDigits(string code)\n{\n    if (code.Length != 4) { return false; }\n    if (!Char.IsUpper(code[0])) { return false; }\n    for (int i = 1; i < 4; i++)\n    {\n        if (!Char.IsDigit(code[i])) { return false; }\n    }\n    return true;\n}',
    name: 'Practical Activity 1: one capital letter then three digits.', ex: 'A123',
    gen: () => L() + D() + D() + D(),
    checks: [
      { n: 'Length must be 4', ok: (c) => c.length === 4, brk: (c) => shortOrLong(c, '7') },
      { n: 'Box 0 must be a capital letter', ok: (c) => /^[A-Z]/.test(c), brk: (c) => pick(['a', '3', '-']) + c.slice(1) },
      { n: 'Boxes 1 to 3 must be digits', ok: (c) => /^\d{3}$/.test(c.slice(1)), brk: (c) => c.slice(0, 2) + pick(['X', '-', 'x']) + c.slice(3) },
    ] },
  { key: 'validid', method: 'ValidId', probe: '4.4.32',
    name: 'ValidId from Practical 4: two capital letters, a hyphen, then a whole number 1000 to 4999.', ex: 'AO-1234',
    gen: () => `${L()}${L()}-${rand(1000, 4999)}`,
    checks: [
      { n: 'Length must be 7', ok: (c) => c.length === 7, brk: (c) => shortOrLong(c, '5') },
      { n: 'Boxes 0 and 1 must be capital letters', ok: (c) => /^[A-Z]{2}/.test(c), brk: (c) => pick([c[0].toLowerCase() + c[1], `7${c[1]}`, `${c[0]}-`]) + c.slice(2) },
      { n: "Box 2 must be '-'", ok: (c) => c[2] === '-', brk: (c) => c.slice(0, 2) + pick(['_', '0', '+']) + c.slice(3) },
      { n: 'Boxes 3 to 6 must be a whole number 1000 to 4999', ok: (c) => /^\d{4}$/.test(c.slice(3)) && +c.slice(3) >= 1000 && +c.slice(3) <= 4999, brk: (c) => c.slice(0, 3) + pick(['0999', '5000', '9999', '0042', '12A4', 'abcd']) },
    ] },
  { key: 'validcode', method: 'ValidCode', probe: '4.4.5',
    name: "ValidCode from Summer 2022: 'O' or 'M', a hyphen, a whole number 10 to 55, then 'N', 'S' or 'W'.", ex: 'O-48S',
    gen: () => `${pick(['O', 'M'])}-${rand(10, 55)}${pick(['N', 'S', 'W'])}`,
    checks: [
      { n: 'Length must be 5', ok: (c) => c.length === 5, brk: (c) => shortOrLong(c, 'S') },
      { n: "Box 0 must be 'O' or 'M'", ok: (c) => 'OM'.includes(c[0]), brk: (c) => pick(['P', 'o', '0']) + c.slice(1) },
      { n: "Box 1 must be '-'", ok: (c) => c[1] === '-', brk: (c) => c[0] + pick(['_', '+', '4']) + c.slice(2) },
      { n: 'Boxes 2 and 3 must be a whole number 10 to 55', ok: (c) => /^\d\d$/.test(c.slice(2, 4)) && +c.slice(2, 4) >= 10 && +c.slice(2, 4) <= 55, brk: (c) => c.slice(0, 2) + pick(['09', '56', '99', '00', '4A', 'x7']) + c.slice(4) },
      { n: "Box 4 must be 'N', 'S' or 'W'", ok: (c) => 'NSW'.includes(c[4]), brk: (c) => c.slice(0, 4) + pick(['E', 'n', 's', '5']) },
    ] },
  { key: 'plate', method: 'validLicencePlate', probe: '4.4.11',
    name: 'validLicencePlate from Summer 2025: three different letters, a hyphen, then three digits.', ex: 'ABC-123',
    gen: () => `${threeDifferent()}-${D()}${D()}${D()}`,
    checks: [
      { n: 'Length must be 7', ok: (c) => c.length === 7, brk: (c) => shortOrLong(c, '9') },
      { n: 'Boxes 0 to 2 must be letters', ok: (c) => /^[A-Za-z]{3}/.test(c), brk: (c) => pick(['1', '7', '-']) + c.slice(1) },
      { n: 'The three letters must all be different', ok: (c) => c[0] !== c[1] && c[0] !== c[2] && c[1] !== c[2], brk: (c) => pick([c[0] + c[0] + c[2], c[0] + c[1] + c[0], c[1] + c[1] + c[2]]) + c.slice(3) },
      { n: "Box 3 must be '-'", ok: (c) => c[3] === '-', brk: (c) => c.slice(0, 3) + pick(['_', ' ', '0']) + c.slice(4) },
      { n: 'Boxes 4 to 6 must be digits', ok: (c) => /^\d{3}$/.test(c.slice(4)), brk: (c) => c.slice(0, 5) + pick(['A', '-', 'x']) + c[6] },
    ] },
  { key: 'plant', method: 'PlantCode', probe: '4.4.8', plants: ['Rose', 'Tulip', 'Daisy', 'Lily', 'Fern'],
    name: 'PlantCode from Summer 2024, for the plant "{plant}": a hash, the first three letters of the plant name, then a whole number 11 to 99.', ex: '#Ros25',
    gen: (p) => `#${p.slice(0, 3)}${rand(11, 99)}`,
    checks: [
      { n: 'Length must be 6', ok: (c) => c.length === 6, brk: (c) => shortOrLong(c, '3') },
      { n: "Box 0 must be '#'", ok: (c) => c[0] === '#', brk: (c) => pick(['*', 'R', '-']) + c.slice(1) },
      { n: 'Boxes 1 to 3 must be the first three letters of the plant name', ok: (c, p) => c.slice(1, 4) === p.slice(0, 3), brk: (c, p) => `#${p.slice(0, 3).toUpperCase()}${c.slice(4)}` },
      { n: 'Boxes 4 and 5 must be a whole number 11 to 99', ok: (c) => /^\d\d$/.test(c.slice(4)) && +c.slice(4) >= 11 && +c.slice(4) <= 99, brk: (c) => c.slice(0, 4) + pick(['10', '05', '00', 'AB', '4x']) },
    ] },
  { key: 'book', method: 'ValidBookCode', hand: { pass: ['AB42', 'ZZ00', 'QR19'], fail: ['ab42', 'A142', 'AB4X', 'AB423', 'AB4', ''] },
    model: 'public static bool ValidBookCode(string code)\n{\n    if (code.Length != 4) { return false; }\n    if (!Char.IsUpper(code[0]) || !Char.IsUpper(code[1])) { return false; }\n    if (!Char.IsDigit(code[2]) || !Char.IsDigit(code[3])) { return false; }\n    return true;\n}',
    name: 'ValidBookCode from Activity 10: two capital letters then two digits.', ex: 'AB42',
    gen: () => L() + L() + D() + D(),
    checks: [
      { n: 'Length must be 4', ok: (c) => c.length === 4, brk: (c) => shortOrLong(c, '1') },
      { n: 'Boxes 0 and 1 must be capital letters', ok: (c) => /^[A-Z]{2}/.test(c), brk: (c) => pick([c[0].toLowerCase() + c[1], `3${c[1]}`, `${c[0]}-`]) + c.slice(2) },
      { n: 'Boxes 2 and 3 must be digits', ok: (c) => /^\d{2}$/.test(c.slice(2)), brk: (c) => c.slice(0, 3) + pick(['X', 'x', '-']) },
    ] },
];

export const nameOf = (rule, plant) => rule.name.replace('{plant}', plant || '');
export const exampleOf = (rule, plant) => (plant ? rule.gen(plant) : rule.ex);
export function judge(rule, c, plant) { for (const k of rule.checks) if (!k.ok(c, plant)) return k.n; return null; }

// Eight codes: four that pass and four that each break exactly the named rule (the first the validator would meet).
export function genCodes(rule, plant) {
  const codes = []; const seen = new Set();
  while (codes.length < 4) { const c = rule.gen(plant); if (seen.has(c)) continue; seen.add(c); codes.push({ c, why: null }); }
  let ks = []; while (ks.length < 4) ks = ks.concat(shuffle(rule.checks));
  for (const k of ks.slice(0, 4)) {
    for (let t = 0; t < 60; t++) {
      const c = k.brk(rule.gen(plant), plant);
      if (judge(rule, c, plant) === k.n && !seen.has(c)) { seen.add(c); codes.push({ c, why: k.n }); break; }
    }
  }
  while (codes.length < 8) { const c = rule.checks[0].brk(rule.gen(plant), plant); const w = judge(rule, c, plant); if (w && !seen.has(c)) { seen.add(c); codes.push({ c, why: w }); } }
  return shuffle(codes);
}
