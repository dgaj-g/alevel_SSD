"""G10 demo privacy (AS DESIGN_SPEC 17): the finished demo is never pupil-downloadable.

Fails on any .sln, .csproj, .exe, .dll or .pdb file, any zip other than the one
pupil zip, any "Demo Solution" path, or the staff zip's name, anywhere in the
repo (tracked or not) or the guide's Site/ folder. The one pupil zip,
summit-ready-files.zip (chapter 2), is allowed only once opened: it must hold
just Data/, Images/, Sounds/ and credits.txt, with no code inside.

python3 -I g10_demo_privacy.py <folder> [<folder> ...]
python3 -I g10_demo_privacy.py --control <folder>   plants SummitReady.exe: must FAIL
"""
import sys, zipfile, tempfile, shutil
from pathlib import Path

BANNED = {'.sln', '.csproj', '.exe', '.dll', '.pdb', '.cs', '.resx'}
PUPIL_ZIP = 'summit-ready-files.zip'
TEXT = {'.html', '.js', '.json', '.css', '.md', '.txt', '.gs', '.py', '.sh'}
WORDS = ['Demo Solution', 'staff only).zip', 'SummitReady.sln']
SKIP = {'.git', 'node_modules'}


def zip_problems(path):
    out = []
    with zipfile.ZipFile(path) as z:
        for name in z.namelist():
            top = name.split('/')[0]
            if top not in ('Data', 'Images', 'Sounds', 'credits.txt'):
                out.append('%s holds %s' % (path, name))
            if Path(name).suffix.lower() in BANNED | {'.zip', '.config'}:
                out.append('%s holds code: %s' % (path, name))
    return out


def scan(root, me):
    problems = []
    for f in sorted(root.rglob('*')):
        if any(p in SKIP for p in f.relative_to(root).parts) or not f.is_file():
            continue
        suf = f.suffix.lower()
        if suf in BANNED:
            problems.append('demo file: %s' % f)
        elif suf == '.zip':
            if f.name == PUPIL_ZIP:
                problems += zip_problems(f)
            else:
                problems.append('zip: %s' % f)
        elif suf in TEXT and f.name != me.name:   # this gate names the words it bans
            text = f.read_text(errors='replace')
            for w in WORDS:
                if w in text:
                    problems.append('"%s" named in %s' % (w, f))
    return problems


def main():
    args = sys.argv[1:]
    control = '--control' in args
    roots = [Path(a) for a in args if a != '--control']
    me = Path(__file__).resolve()
    if control:
        tmp = Path(tempfile.mkdtemp())   # outside the folder being copied
        shutil.copytree(roots[0], tmp / 'copy', ignore=shutil.ignore_patterns('.git', 'node_modules'))
        (tmp / 'copy' / 'SummitReady.exe').write_bytes(b'MZ planted')
        roots = [tmp / 'copy']
    problems = []
    for r in roots:
        problems += scan(r, me)
    if control:
        shutil.rmtree(tmp)
    for p in problems[:40]:
        print('  ' + p)
    print('G10 demo privacy: %s (%d problems)%s' % ('FAIL' if problems else 'PASS', len(problems), ' [control]' if control else ''))
    sys.exit(1 if problems else 0)


main()
