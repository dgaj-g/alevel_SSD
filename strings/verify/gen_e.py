#!/usr/bin/env python3
# Writes js/data/e.js from the Topic 4 pack (ppq_topic04.json + probes_topic04.json). Every quiz answer is the real dotnet result.
import json, os, re, sys, random
sys.path.insert(0, os.path.dirname(__file__))
from probe import run
B = "/Users/damiengartland/Desktop/Claude Work/AS SSD Overhaul/00. Course Plan 26-27/Topic 04 - String Manipulation/build"
P = json.load(open(f"{B}/ppq_topic04.json"))['ppqs']; T = json.load(open(f"{B}/probes_topic04.json"))['tables']
tab = {t['ship']['n']: t for t in T if t.get('ship') and t['ship'].get('kind') == 'ppq'}
ids = {t['id']: t for t in T}
STUB = {3: ids['4.4.9']['code'], 8: ids['4.4.6']['code']}
WD = 'probe'
clean = lambda s: None if s is None else re.sub(r'\s+—\s+', ', ', s).replace('—', ',').replace('–', ' to ').replace('`try`/`catch`', '`try`').replace('catches a non-number', 'spots a non-number')
def typed(stdin):
    parts = stdin.split('\n')[:-1]
    say = [('nothing' if p == '' else f'"{p}"') for p in parts]
    return say[0] if len(say) == 1 else ', then '.join(say)
out = []
for q in P:
    n = q['n']; t = tab[n]; a = q['answer']
    m = t['code']
    if t['ship'].get('wrapHeader') and not m.lstrip().startswith('public static'): m = t['ship']['wrapHeader'] + '\n{\n' + '\n'.join('    ' + l for l in m.split('\n')) + '\n' + '}'
    if n in STUB: m = m + '\n' + STUB[n]
    blocks = []
    if q.get('lead'): blocks.append(['p', clean(q['lead'])])
    blocks += [['p', '**Scenario.** ' + clean(q['scenario'][0])]] + [['p', clean(x)] for x in q['scenario'][1:]]
    blocks.append(['p', '**Given.**'])
    for g in q['given']:
        blocks.append(['code', g['c']] if 'c' in g else ['p', clean(g['t'])])
    if q.get('hint'): blocks.append(['note', 'Hint printed on the paper: ' + clean(q['hint'])])
    blocks += [['p', '**Your task.**'], ['tasks', [clean(x) for x in q['task']]]]
    if q.get('notNeeded'): blocks.append(['note', 'Not needed: ' + clean(q['notNeeded'])])
    pts = []
    for mk, txt in a['points']:
        pts += [{'t': clean(txt)}] if mk == 1 else [{'t': f"{clean(txt)} (mark {i + 1} of {mk})"} for i in range(mk)]
    notes = [clean(x) for x in (q.get('answersNote'), q.get('changed') and q['changed'][0].upper() + q['changed'][1:]) if x]
    rule = clean(q['scenario'][0])
    pool = []
    rows = [r for r in t['rows'] if not r['call'].startswith('!') or True]
    ret = sorted({r['expected'].strip('"') for r in rows if r['expected'] not in ('void',) and not r['expected'].startswith('~')})
    musts = []
    for r in rows:
        for l in r['must']:
            if l not in musts: musts.append(l)
    for r in rows:
        call = r['call'].lstrip('!'); stdin = r['stdin'] or ''
        if 'null' in call: continue
        void = r['call'].startswith('!')
        rnd = r['expected'].startswith('~')
        if rnd:
            main = f'string u = {call};\nConsole.WriteLine(u.Substring(0, u.Length - 2));'
        else:
            main = f'{call};' if void else (f'Console.WriteLine("\\n" + {call});' if stdin else f'Console.WriteLine({call});')
        res = run(m, main, stdin, wd=WD)
        if not res['built'] or res['crashed']:
            print('BAD', n, call, res.get('errors'), res.get('stderr','')[:120]); sys.exit(1)
        o = res['out']; lines = o.rstrip('\n').split('\n') if o.strip() else []
        ctx = f' when the user types {typed(stdin)}' if stdin else ''
        if rnd:
            fore, sur = re.findall(r'"([^"]*)"', call); stem = lines[-1][:-1]
            right = f'{stem}912'; wrong = [f'{fore}{sur}912', f'{stem}412', f'{sur}{fore[0]}912']
            item = dict(q=f'Which of these can {call} return?', options=[right] + wrong, why=f'The first letter of the forename, then the surname, then a number. In this run every number under 900 counts as taken, so only 900 to 999 comes back.')
        elif void:
            right = lines[-1] if lines else ''
            opts = [right] + [x for x in musts if x != right]
            item = dict(q=f'What does {call} print?', options=opts[:4], why=f'It prints "{right}". {rule}')
        else:
            val = lines[-1] if lines else ''
            if val in ('True', 'False'):
                item = dict(q=f'What does {call} return?', options=['true', 'false'] if val == 'True' else ['false', 'true'], why=f'It returns {val.lower()}. {rule}')
            else:
                nums = [x for x in re.split(r'\n', stdin) if x and x != val and not x.isalpha()]
                wrong = [x for x in nums if x != val] + [x for x in ret if x != val]
                seen = []
                for x in wrong:
                    if x not in seen: seen.append(x)
                pad = ['0', '-1'] if val.lstrip('-').isdigit() else ['The method crashes.', 'The first thing typed.']
                item = dict(q=f'What does {call} return{ctx}?', options=[val] + (seen + pad)[:3], why=f'It returns {val}. Only a line that passes every test ends the loop.')
        if len(set(item['options'])) < 2: continue
        item['a'] = 0; item['cs'] = {'methods': m, 'main': main, 'stdin': stdin}; item['expect'] = {'out': o}
        if rnd: item['expect'] = {'out': res['out']}
        pool.append(item)
    assert len(pool) >= 2, n
    out.append(dict(n=n, method=t['method'], probe=t['id'], paper=q['ref'], also=q.get('also'), marks=q['marks'], adapted=clean(q['changed']) if q.get('changed') else None, blocks=blocks, kind='code', points=pts, notes=notes or ['Compare your answer with the model line by line.'], code=a['code'], model=[['code', a['code']]], quiz=pool))
    print(n, t['method'], len(a['code']), len(pool), [p['q'][:48] for p in pool[:1]])
src = "// Zone E: the thirteen past-paper questions (booklet section 10). Generated by verify/gen_e.py from the Topic 4 pack; do not edit by hand.\nexport const PAPERS = " + json.dumps(out, ensure_ascii=False, indent=0) + ";\n"
open(os.path.join(os.path.dirname(__file__), '..', 'js', 'data', 'e.js'), 'w').write(src)
