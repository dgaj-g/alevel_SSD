"""G9 tokens (AS DESIGN_SPEC 17): the AS look differs from A2 by colour tokens only.

1. Every colour in the AS and A2 stylesheets is a var(--token), except on the :root token lines.
2. A2 style.css against AS style.css: only the :root lines and the print line's platform name differ.
   (cw.css is the newer renderer the AS guide was designed with; check 1 and 4 cover it.)
3. Every var() used is defined on a :root line.
4. Contrast: every rule that sets both color and background from tokens reaches 4.5:1 (3:1 for
   text at 18px+ or bold 14px+ is not assumed: 4.5 throughout) with the AS values, wherever the
   same rule reaches it with A2's values.
python3 -I g9_tokens.py <A2 platform dir> <AS platform dir>
python3 -I g9_tokens.py --control ...   plants a literal #123456 and a low-contrast navy: must FAIL
"""
import re, sys
from pathlib import Path

COLOUR = re.compile(r'#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)')
ROOT = re.compile(r'^:root\{[^}]*\}$')


def tokens(css):
    t = {}
    for line in css.split('\n'):
        if ROOT.match(line):
            for name, val in re.findall(r'--([\w-]+):([^;}]+)', line):
                t[name] = val.strip()
    return t


def literals(name, css):
    out = []
    for i, line in enumerate(css.split('\n'), 1):
        if ROOT.match(line):
            continue
        body = re.sub(r'/\*.*?\*/', '', line)
        body = re.sub(r'url\([^)]*\)', '', body)
        for m in COLOUR.finditer(body):
            out.append('%s:%d literal colour %s' % (name, i, m.group(0)))
    return out


def rgb(v, t, depth=0):
    v = v.strip()
    m = re.fullmatch(r'var\(--([\w-]+)\)', v)
    if m:
        return rgb(t.get(m.group(1), ''), t, depth + 1) if depth < 5 else None
    m = re.fullmatch(r'#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})', v)
    if m:
        h = m.group(1)
        if len(h) == 3:
            h = ''.join(c * 2 for c in h)
        return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + (1.0,)
    m = re.fullmatch(r'rgba?\(([^)]*)\)', v)
    if m:
        p = [x.strip() for x in m.group(1).split(',')]
        return tuple(float(x) for x in p[:3]) + ((float(p[3]) if len(p) > 3 else 1.0),)
    if v in ('#fff', 'white'):
        return (255, 255, 255, 1.0)
    return None


def lum(c):
    def ch(x):
        x = x / 255
        return x / 12.92 if x <= 0.03928 else ((x + 0.055) / 1.055) ** 2.4
    return 0.2126 * ch(c[0]) + 0.7152 * ch(c[1]) + 0.0722 * ch(c[2])


def ratio(fg, bg):
    if fg[3] < 1:   # blend the text onto its background
        fg = tuple(fg[i] * fg[3] + bg[i] * (1 - fg[3]) for i in range(3)) + (1.0,)
    a, b = sorted([lum(fg), lum(bg)], reverse=True)
    return (a + 0.05) / (b + 0.05)


def pairs(css):
    out = []
    for sel, body in re.findall(r'([^{}]+)\{([^{}]*)\}', css):
        if sel.strip().startswith(':root'):
            continue
        fg = re.search(r'(?:^|;)\s*color:\s*(var\(--[\w-]+\))', body)
        bg = re.search(r'background(?:-color)?:\s*(var\(--[\w-]+\))\s*(?:;|$|!)', body)
        if fg and bg:
            out.append((sel.strip()[:60], fg.group(1), bg.group(1)))
    return out


def main():
    args = [a for a in sys.argv[1:] if a != '--control']
    control = '--control' in sys.argv
    a2, as_ = Path(args[0]), Path(args[1])
    css = {(w, f): (d / f).read_text() for w, d in (('A2', a2), ('AS', as_)) for f in ('style.css', 'cw.css')}
    if control:
        css[('AS', 'cw.css')] += '\n.planted{border-color:#123456}\n.planted2{color:var(--white);background:var(--gold)}\n'
        css[('AS', 'style.css')] = css[('AS', 'style.css')].replace('--navy:#0f5257', '--navy:#8fc9c4', 1)
    problems = []
    for (w, f), text in css.items():
        problems += literals(w + ' ' + f, text)
    ta = tokens(css[('A2', 'style.css')]); ts = tokens(css[('AS', 'style.css')])
    for w, t in (('A2', ta), ('AS', ts)):
        for f in ('style.css', 'cw.css'):
            colour_props = re.findall(r'(?:color|background[\w-]*|border[\w-]*|outline[\w-]*|fill|stroke|box-shadow|text-shadow|text-decoration[\w-]*)\s*:([^;}]*)', css[(w, f)])
            for name in set(re.findall(r'var\(--([\w-]+)\)', ' '.join(colour_props))):
                if name not in t:
                    problems.append('%s %s uses --%s, which no :root line defines' % (w, f, name))
    la = css[('A2', 'style.css')].split('\n'); ls = css[('AS', 'style.css')].split('\n')
    if len(la) != len(ls):
        problems.append('style.css: A2 has %d lines, AS %d' % (len(la), len(ls)))
    else:
        for i, (x, y) in enumerate(zip(la, ls), 1):
            if x != y and not (ROOT.match(x) and ROOT.match(y)) and x.replace('A2 SSD platform', 'AS SSD platform') != y:
                problems.append('style.css line %d differs beyond tokens and the name' % i)
    checked = 0
    for f in ('style.css', 'cw.css'):
        for sel, fg, bg in pairs(css[('AS', f)]):
            ca = [rgb(fg, ta), rgb(bg, ta)]; cs = [rgb(fg, ts), rgb(bg, ts)]
            if None in cs or cs[1][3] < 1:
                continue
            checked += 1
            r_as = ratio(cs[0], cs[1])
            r_a2 = ratio(ca[0], ca[1]) if None not in ca and ca[1][3] == 1 else 0
            if r_as < 4.5 and r_a2 >= 4.5:
                problems.append('contrast %s: %.2f:1 on AS (A2 %.2f:1) in %s' % (sel, r_as, r_a2, f))
            elif r_as < 4.5:
                print('  note: %s %.2f:1 on AS, %.2f:1 on A2 (not made worse)' % (sel, r_as, r_a2))
    for p in problems[:30]:
        print('  ' + p)
    print('G9 tokens: %s (%d problems, %d colour pairs checked)%s' % ('FAIL' if problems else 'PASS', len(problems), checked, ' [control]' if control else ''))
    sys.exit(1 if problems else 0)


main()
