"""Builds and runs every program in programs.json with dotnet; compares output or error codes. Exit 1 on any mismatch."""
import json, os, sys, subprocess
from concurrent.futures import ThreadPoolExecutor
from queue import Queue
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from probe import run
subprocess.run(['node', os.path.join(HERE, 'extract.mjs')], check=True)
progs = json.load(open(os.path.join(HERE, 'programs.json')))
only = sys.argv[1] if len(sys.argv) > 1 else ''
progs = [p for p in progs if p['id'].startswith(only)]
dirs = Queue()
for d in ['probe1', 'probe2', 'probe3', 'probe4']: dirs.put(os.path.join(HERE, d))
def one(p):
    d = dirs.get()
    try:
        cs = p['cs']
        r = run(cs.get('methods', ''), cs.get('main', ''), cs.get('stdin', ''), wd=d)
    finally:
        dirs.put(d)
    e = p['expect']
    if 'errors' in e:
        got = sorted(set(c for c, _ in r['errors']))
        ok = (not r['built']) and got == sorted(set(e['errors']))
        if ok and 'msgs' in e:
            ok = sorted(map(tuple, e['msgs'])) == sorted(r['errors'])
        return p['id'], ok, f"want errors {e['errors']} got built={r['built']} {r['errors']}"
    if not r['built']:
        return p['id'], False, f"did not build: {r['errors']}"
    if e.get('loops'):
        ok = bool(r.get('timeout')) and (r['out'] or '').startswith(e['out'])
        return p['id'], ok, f"want a loop starting {e['out']!r} got timeout={r.get('timeout')} {(r['out'] or '')[:200]!r}"
    ok = r['out'] == e['out'] and (e.get('crash', False) == r['crashed'])
    if ok and 'err' in e:
        ok = (r.get('stderr') or '').split('\n')[0].strip() == e['err']
    return p['id'], ok, f"want {e['out']!r} got {r['out']!r} crashed={r['crashed']} {r.get('stderr','')[:200]}"
bad = 0
with ThreadPoolExecutor(4) as ex:
    for pid, ok, msg in ex.map(one, progs):
        if not ok:
            bad += 1; print('FAIL', pid, msg)
print(f"{len(progs) - bad}/{len(progs)} programs match")
sys.exit(1 if bad else 0)
