// Zone D: validators. Booklet section 7. Lines and methods are run under dotnet.
import { prog, crash } from './_q.js';

const body = (sig, pre, lines) => `public static bool ${sig}\n{\n${pre.map((l) => `    ${l}`).join('\n')}${pre.length ? '\n' : ''}${lines.map((l) => `    ${l}`).join('\n')}\n    return true;\n}`;
const mapProof = (m) => {
  const method = body(m.sig, m.pre || [], [m.lenLine, ...m.slots.map((s) => s.line)]);
  const calls = [...m.pass.map((c) => [c, 'True']), ...m.fail.map((c) => [c, 'False'])];
  return prog(calls.map(([c]) => `Console.WriteLine(${m.call(c)});`).join('\n'), calls.map(([, r]) => `${r}\n`).join(''), method);
};
const MAPS = [
  { key: 'validcode', name: "ValidCode from Summer 2022: 'O' or 'M', a hyphen, a whole number 10 to 55, then 'N', 'S' or 'W'.", ex: 'O-48S', len: 5, sig: 'ValidCode(string code)', pre: ['int number;'], call: (c) => `ValidCode("${c}")`,
    pass: ['O-48S', 'M-10N', 'O-55W'], fail: ['X-48S', 'O+48S', 'O-9XS', 'O-56S', 'O-48E', 'O-48'],
    lenChip: 'Length must be 5', lenLine: 'if (code.Length != 5) return false;',
    slots: [{ at: 0, w: 1, chip: "'O' or 'M'", line: "if (code[0] != 'O' && code[0] != 'M') return false;" }, { at: 1, w: 1, chip: "'-'", line: "if (code[1] != '-') return false;" }, { at: 2, w: 2, chip: 'a whole number 10 to 55', line: 'if (!int.TryParse(code.Substring(2, 2), out number) || number < 10 || number > 55) return false;' }, { at: 4, w: 1, chip: "'N', 'S' or 'W'", line: "if (code[4] != 'N' && code[4] != 'S' && code[4] != 'W') return false;" }],
    decoys: ['a capital letter', "'#'", 'Length must be 6'] },
  { key: 'validid', name: 'ValidId from Practical 4: two capital letters, a hyphen, then a whole number 1000 to 4999.', ex: 'AO-1234', len: 7, sig: 'ValidId(string id)', pre: ['int number;'], call: (c) => `ValidId("${c}")`,
    pass: ['AO-1234', 'ZZ-1000', 'BT-4999'], fail: ['aO-1234', 'A1-1234', 'AO+1234', 'AO-12X4', 'AO-5000', 'AO-123'],
    lenChip: 'Length must be 7', lenLine: 'if (id.Length != 7) return false;',
    slots: [{ at: 0, w: 1, chip: 'a capital letter', line: 'if (!Char.IsUpper(id[0])) return false;' }, { at: 1, w: 1, chip: 'a capital letter', line: 'if (!Char.IsUpper(id[1])) return false;' }, { at: 2, w: 1, chip: "'-'", line: "if (id[2] != '-') return false;" }, { at: 3, w: 4, chip: 'a whole number 1000 to 4999', line: 'if (!int.TryParse(id.Substring(3), out number) || number < 1000 || number > 4999) return false;' }],
    decoys: ['a digit', "'#'", 'Length must be 6'] },
  { key: 'plate', name: 'validLicencePlate from Summer 2025: three different letters, a hyphen, then three digits.', ex: 'ABC-123', len: 7, sig: 'validLicencePlate(string p)', call: (c) => `validLicencePlate("${c}")`,
    pass: ['ABC-123', 'xyz-000'], fail: ['AAC-123', 'A1C-123', 'ABC+123', 'ABC-1X3', 'ABC-12'],
    lenChip: 'Length must be 7', lenLine: 'if (p.Length != 7) return false;',
    slots: [{ at: 0, w: 3, chip: 'three different letters', line: 'if (!Char.IsLetter(p[0]) || !Char.IsLetter(p[1]) || !Char.IsLetter(p[2]) || p[0] == p[1] || p[0] == p[2] || p[1] == p[2]) return false;' }, { at: 3, w: 1, chip: "'-'", line: "if (p[3] != '-') return false;" }, { at: 4, w: 1, chip: 'a digit', line: 'if (!Char.IsDigit(p[4])) return false;' }, { at: 5, w: 1, chip: 'a digit', line: 'if (!Char.IsDigit(p[5])) return false;' }, { at: 6, w: 1, chip: 'a digit', line: 'if (!Char.IsDigit(p[6])) return false;' }],
    decoys: ['a whole number 10 to 55', 'a capital letter', 'Length must be 8'] },
  { key: 'plant', name: 'PlantCode from Summer 2024, for the plant "Rose": a hash, the first three letters of the plant name, then a whole number 11 to 99.', ex: '#Ros25', len: 6, sig: 'PlantCode(string name, string code)', pre: ['int number;'], call: (c) => `PlantCode("Rose", "${c}")`,
    pass: ['#Ros25', '#Ros11', '#Ros99'], fail: ['-Ros25', '#Tul25', '#Ros10', '#RosXY', '#Ros2'],
    lenChip: 'Length must be 6', lenLine: 'if (code.Length != 6) return false;',
    slots: [{ at: 0, w: 1, chip: "'#'", line: "if (code[0] != '#') return false;" }, { at: 1, w: 3, chip: 'the first three letters of the plant name', line: 'if (code.Substring(1, 3) != name.Substring(0, 3)) return false;' }, { at: 4, w: 2, chip: 'a whole number 11 to 99', line: 'if (!int.TryParse(code.Substring(4, 2), out number) || number < 11 || number > 99) return false;' }],
    decoys: ['a capital letter', "'-'", 'a digit', 'Length must be 5'] },
];
export const POSITION_MAPS = MAPS.map((m) => ({ ...m, call: undefined, proof: mapProof(m) }));

// D2: the booklet's model validators with their traps.
const VCODE = `public static bool ValidCode(string itemCode)
{
    if (itemCode.Length != 5)
    {
        return false;
    }
    if (itemCode[0] != 'O' && itemCode[0] != 'M')
    {
        return false;
    }
    if (itemCode[1] != '-')
    {
        return false;
    }
    if (itemCode[4] != 'N' && itemCode[4] != 'S' && itemCode[4] != 'W')
    {
        return false;
    }
    int number;
    bool isNumber = int.TryParse(itemCode.Substring(2, 2), out number);
    if (!isNumber)
    {
        return false;
    }
    if (number < 10 || number > 55)
    {
        return false;
    }
    return true;
}`;
const VID = `public static bool ValidId(string id)
{
    if (id.Length != 7)
    {
        return false;
    }
    if (!Char.IsUpper(id[0]) || !Char.IsUpper(id[1]))
    {
        return false;
    }
    if (id[2] != '-')
    {
        return false;
    }
    int number;
    bool isNumber = int.TryParse(id.Substring(3), out number);
    if (!isNumber)
    {
        return false;
    }
    if (number < 1000 || number > 4999)
    {
        return false;
    }
    return true;
}`;
const VPLANT = `public static bool PlantCode(string plantName, string plantCode)
{
    if (plantCode.Length != 6)
    {
        return false;
    }
    if (plantCode[0] != '#')
    {
        return false;
    }
    if (plantCode.Substring(1, 3) != plantName.Substring(0, 3))
    {
        return false;
    }
    int number;
    bool isNumber = int.TryParse(plantCode.Substring(4, 2), out number);
    if (!isNumber)
    {
        return false;
    }
    if (number < 11 || number > 99)
    {
        return false;
    }
    return true;
}`;
const LOOPT = (n) => `for (int i = 0; i <= ${n}.Length; i++)`;
const FMT = (setup, expr, bad) => crash(`${setup}\nint number = int.Parse(${expr});\nConsole.WriteLine(number);`, '', `Unhandled exception. System.FormatException: The input string '${bad}' was not in a correct format.`);
const trapLoop = (n, s) => ({ t: LOOPT(n), why: 'With `<=` the loop reaches a box that is not there, so the program crashes.', ...crash(`string ${n} = "${s}";\n${LOOPT(n)}\n{\n    Console.Write(${n}[i]);\n}`, s, 'Unhandled exception. System.IndexOutOfRangeException: Index was outside the bounds of the array.') });
export const BUILDS = [
  { method: 'ValidCode', rule: "'O' or 'M', a hyphen, a whole number 10 to 55, then 'N', 'S' or 'W'", code: VCODE,
    proof: prog('Console.WriteLine(ValidCode("O-48S"));\nConsole.WriteLine(ValidCode("X-48S"));\nConsole.WriteLine(ValidCode("O-XXS"));', 'True\nFalse\nFalse\n', VCODE),
    calls: [['ValidCode("O-48S")', 'True'], ['ValidCode("X-48S")', 'False'], ['ValidCode("O-XXS")', 'False']],
    traps: [
      { t: "if (itemCode[0] != 'O' || itemCode[0] != 'M')", why: 'Every character is either not O or not M, so with `||` this refuses every code. "O-48S" comes back false.', ...prog(`string itemCode = "O-48S";\nConsole.WriteLine(itemCode[0] != 'O' || itemCode[0] != 'M');`, 'True\n') },
      { ...trapLoop('itemCode', 'O-48S') },
      { t: 'int number = int.Parse(itemCode.Substring(2, 2));', why: 'int.Parse crashes when the two characters are not a number, and a validator must return false instead.', ...FMT('string itemCode = "O-XXS";', 'itemCode.Substring(2, 2)', 'XX') },
    ] },
  { method: 'ValidId', rule: 'two capital letters, a hyphen, then a whole number 1000 to 4999', code: VID,
    proof: prog('Console.WriteLine(ValidId("AO-1234"));\nConsole.WriteLine(ValidId("aO-1234"));\nConsole.WriteLine(ValidId("AO-12X4"));', 'True\nFalse\nFalse\n', VID),
    calls: [['ValidId("AO-1234")', 'True'], ['ValidId("aO-1234")', 'False'], ['ValidId("AO-12X4")', 'False']],
    traps: [
      { t: 'if (number < 1000 && number > 4999)', why: 'No number is below 1000 and above 4999 at once, so with `&&` this never refuses. 5000 would be accepted.', ...prog('int number = 5000;\nConsole.WriteLine(number < 1000 && number > 4999);', 'False\n') },
      { ...trapLoop('id', 'AO-1234') },
      { t: 'int number = int.Parse(id.Substring(3));', why: 'int.Parse crashes when the last four characters are not a number, and a validator must return false instead.', ...FMT('string id = "AO-12X4";', 'id.Substring(3)', '12X4') },
    ] },
  { method: 'PlantCode', rule: 'a hash, the first three letters of the plant name, then a whole number 11 to 99', code: VPLANT,
    proof: prog('Console.WriteLine(PlantCode("Rose", "#Ros25"));\nConsole.WriteLine(PlantCode("Rose", "#Tul25"));\nConsole.WriteLine(PlantCode("Rose", "#RosXY"));', 'True\nFalse\nFalse\n', VPLANT),
    calls: [['PlantCode("Rose", "#Ros25")', 'True'], ['PlantCode("Rose", "#Tul25")', 'False'], ['PlantCode("Rose", "#RosXY")', 'False']],
    traps: [
      { t: 'if (number < 11 && number > 99)', why: 'No number is below 11 and above 99 at once, so with `&&` this never refuses. 5 would be accepted.', ...prog('int number = 5;\nConsole.WriteLine(number < 11 && number > 99);', 'False\n') },
      { ...trapLoop('plantCode', '#Ros25') },
      { t: 'int number = int.Parse(plantCode.Substring(4, 2));', why: 'int.Parse crashes when the two characters are not a number, and a validator must return false instead.', ...FMT('string plantCode = "#RosXY";', 'plantCode.Substring(4, 2)', 'XY') },
    ] },
];

// D3: five broken validators. `at` is the index of the faulty line.
const F = { or: 'It uses `||` where `&&` belongs', late: 'It looks in a box before checking the length', parse: 'It uses `int.Parse` where `int.TryParse` belongs', past: 'The loop goes one box too far', store: 'It never stores the new string' };
const FAULTS = Object.values(F);
const bug = (code, at, fault, call, result, why, cs) => ({ code: code.split('\n'), at, fault, call, result, why, options: FAULTS, ...cs });
const K1 = `public static bool ValidStart(string code)\n{\n    if (code[0] != 'O' || code[0] != 'M')\n    {\n        return false;\n    }\n    return true;\n}`;
const K2 = `public static bool ValidKey(string code)\n{\n    if (!Char.IsUpper(code[0]))\n    {\n        return false;\n    }\n    if (code.Length != 4)\n    {\n        return false;\n    }\n    return true;\n}`;
const K3 = `public static bool ValidTicket(string ticket)\n{\n    if (ticket.Length != 7)\n    {\n        return false;\n    }\n    int number = int.Parse(ticket.Substring(3));\n    if (number < 1000 || number > 4999)\n    {\n        return false;\n    }\n    return true;\n}`;
const K4 = `public static bool AllDigits(string code)\n{\n    for (int i = 0; i <= code.Length; i++)\n    {\n        if (!Char.IsDigit(code[i]))\n        {\n            return false;\n        }\n    }\n    return true;\n}`;
const K5 = `public static bool ValidPostcode(string postcode)\n{\n    postcode.Replace(" ", "");\n    if (postcode.Length != 7)\n    {\n        return false;\n    }\n    return true;\n}`;
const IDX = 'Unhandled exception. System.IndexOutOfRangeException: Index was outside the bounds of the array.';
export const BUGGY = [
  bug(K1, 2, F.or, 'ValidStart("O-48S")', 'false', 'Every character is either not O or not M, so with `||` every code is refused. It should be `&&`.', prog('Console.WriteLine(ValidStart("O-48S"));', 'False\n', K1)),
  bug(K2, 2, F.late, 'ValidKey("")', 'crashes', 'The empty string has no box 0, so the first test crashes. The length test must come first.', crash('Console.WriteLine(ValidKey(""));', '', IDX, K2)),
  bug(K3, 6, F.parse, 'ValidTicket("AO-12X4")', 'crashes', '"12X4" is not a number, so int.Parse crashes. A validator must return false, so it needs `int.TryParse`.', crash('Console.WriteLine(ValidTicket("AO-12X4"));', '', "Unhandled exception. System.FormatException: The input string '12X4' was not in a correct format.", K3)),
  bug(K4, 2, F.past, 'AllDigits("123")', 'crashes', 'Boxes 0 to 2 are digits, but then `<=` asks for box 3, which is not there. It should be `<`.', crash('Console.WriteLine(AllDigits("123"));', '', IDX, K4)),
  bug(K5, 2, F.store, 'ValidPostcode("BT28 3RT")', 'false', 'Replace makes a new string, and nothing stores it. The space is still there, so the length is 8. It should be `postcode = postcode.Replace(" ", "");`.', prog('Console.WriteLine(ValidPostcode("BT28 3RT"));', 'False\n', K5)),
];
export const RESULTS = ['true', 'false', 'crashes'];
