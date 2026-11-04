"""Runs each D4 rule's real C# method over 400 codes the JavaScript judge generated and compares the verdicts. Exit 1 on any mismatch.
Usage: python3 judges.py [--control]   control: flips one verdict; must fail."""
import json, subprocess, sys, os, re
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from probe import run
probes = json.load(open('/Users/damiengartland/Desktop/Claude Work/AS SSD Overhaul/00. Course Plan 26-27/Topic 04 - String Manipulation/build/probes_topic04.json'))
tabs = {t['id']: t for t in probes['tables']}
js = """import {RULES,genCodes,judge} from '../js/rules.js';const o=[];for(const r of RULES){const cs=[];for(let i=0;i<50;i++){const p=r.plants?r.plants[i%r.plants.length]:undefined;for(const c of genCodes(r,p))cs.push({c:c.c,p,ok:judge(r,c.c,p)===null});}o.push({method:r.method,probe:r.probe,model:r.model,cs});}console.log(JSON.stringify(o));"""
open(os.path.join(HERE, '_j.mjs'), 'w').write(js)
data = json.loads(subprocess.check_output(['node', os.path.join(HERE, '_j.mjs')])); os.remove(os.path.join(HERE, '_j.mjs'))
bad = 0
esc = lambda s: s.replace('\\', '\\\\').replace('"', '\\"')
control = '--control' in sys.argv
for r in data:
    code = r.get('model') or tabs[r['probe']]['code']
    calls = [(f'"{esc(c["p"])}", ' if c.get('p') else '') + f'"{esc(c["c"])}"' for c in r['cs']]
    main = '\n'.join(f'Console.WriteLine({r["method"]}({a}));' for a in calls)
    res = run('public static ' + code.split('public static ', 1)[1], main, wd=os.path.join(HERE, 'probe'))
    if not res['built']: print('did not build', r['method'], res['errors'][:2]); bad += 1; continue
    got = res['out'].split()
    if res['crashed']: print('crash', r['method'], res.get('stderr')); bad += 1; continue
    want = ['True' if c['ok'] else 'False' for c in r['cs']]
    if control: want[0] = 'True' if want[0] == 'False' else 'False'
    d = [(c['c'], g, w) for c, g, w in zip(r['cs'], got, want) if g != w]
    print(r['method'], len(want), 'codes', 'PASS' if not d and len(got) == len(want) else f'FAIL {d[:4]}'); bad += len(d)
    if control: break
if control:
    print('Control behaved: it failed as it must.' if bad else 'GATE BROKEN'); sys.exit(0 if bad else 1)
sys.exit(1 if bad else 0)
