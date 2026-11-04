"""C# probe harness for the Methods Arcade. run(methods, main, stdin) -> dict(built, errors, out, crashed)."""
import subprocess, re, os, json, sys
HERE = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(HERE, 'probe')
TEMPLATE = """using System;
namespace Probe
{{
    class Program
    {{
{methods}
        static void Main(string[] args)
        {{
            System.Globalization.CultureInfo.CurrentCulture = new System.Globalization.CultureInfo("en-GB");
{main}
        }}
    }}
}}
"""
def run(methods='', main='', stdin='', raw=None, timeout=4, wd=None):
    P = wd or globals()['P']
    src = raw if raw is not None else TEMPLATE.format(methods=methods, main=main)
    open(os.path.join(P, 'Program.cs'), 'w').write(src)
    b = subprocess.run(['dotnet', 'build', '-nologo', '-v', 'q', '-clp:NoSummary'], cwd=P, capture_output=True, text=True)
    errs = []
    for line in (b.stdout + b.stderr).splitlines():
        m = re.search(r'error (CS\d+): (.*?)(?: \[/.*\])?$', line)
        if m and (m.group(1), m.group(2)) not in errs:
            errs.append((m.group(1), m.group(2)))
    if b.returncode != 0:
        return dict(built=False, errors=errs, out=None, crashed=False)
    try:
        r = subprocess.run(['dotnet', 'bin/Debug/net10.0/Probe.dll'], cwd=P, input=stdin, capture_output=True, text=True, timeout=timeout)
        return dict(built=True, errors=[], out=r.stdout, crashed=r.returncode != 0, stderr=r.stderr[:400])
    except subprocess.TimeoutExpired as e:
        out = e.stdout.decode() if isinstance(e.stdout, bytes) else (e.stdout or '')
        return dict(built=True, errors=[], out=out[:2000], crashed=False, timeout=True)
if __name__ == '__main__':
    print(run('', 'Console.WriteLine($"{12.5:C}");'))
