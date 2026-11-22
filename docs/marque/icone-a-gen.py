from cube_svg import cube, poly, Y, G, O, W, P, K
GR = '#A3AAB5'; R_, B_ = '#D62828', '#0051BA'
def faces(fn): return {(f, i, j): fn(f, i, j) for f in 'UFR' for i in range(3) for j in range(3)}
def finger(x, y, s=1.0, angle=-28, ripple=True):
    """Doigt dont le bout est en (x, y)."""
    r = (f'<circle cx="{x}" cy="{y}" r="{16*s}" fill="none" stroke="{P}" stroke-width="{5*s}"/>'
         f'<circle cx="{x}" cy="{y}" r="{27*s}" fill="none" stroke="{P}" stroke-width="{4*s}" opacity=".45"/>') if ripple else ''
    w, h = 30*s, 78*s
    return r + (f'<g transform="translate({x} {y}) rotate({angle})"><rect x="{-w/2}" y="0" width="{w}" height="{h}" rx="{w/2}" fill="#F2C29E" stroke="#111" stroke-width="{4.5*s}"/>'
                f'<rect x="{-w/2+5*s}" y="{4*s}" width="{w-10*s}" height="{16*s}" rx="{7*s}" fill="#FBE1CF"/></g>')
def flat_face(x0, y0, size, colors, gap=0.1, radius=0.16):
    """Face 3×3 vue de face (plus lisible en petit qu'un cube en perspective)."""
    c = size / 3; out = [f'<rect x="{x0-6}" y="{y0-6}" width="{size+12}" height="{size+12}" rx="{size*0.12}" fill="#111"/>']
    for k, col in enumerate(colors):
        i, j = k % 3, k // 3
        out.append(f'<rect x="{x0+i*c+c*gap/2}" y="{y0+j*c+c*gap/2}" width="{c*(1-gap)}" height="{c*(1-gap)}" rx="{c*radius}" fill="{col}"/>')
    return ''.join(out)
def icon(bg, inner):
    return f'<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="{bg}"/>{inner}</svg>'

# Cube à moitié recopié : la face avant et une partie du haut en couleurs, le reste gris.
half = faces(lambda f, i, j: {'F': G, 'U': Y, 'R': O}[f] if (f == 'F' or (f == 'U' and i + j >= 3) or (f == 'R' and j == 0)) else GR)
mixed = faces(lambda f, i, j: [[Y, R_, Y, G, Y, B_, Y, O, W], [G, R_, O, B_, G, G, W, G, Y], [O, B_, O, W, O, Y, O, G, R_]]['UFR'.index(f)][i*3+j])
mixed_gray = dict(mixed); [mixed_gray.__setitem__(k, GR) for k in [('R',1,1),('R',2,1),('R',1,2),('U',0,0),('F',0,2)]]

V = {
 'A': ('Jaune, cube à moitié recopié', icon(Y, cube(28, 92, 100, faces=half) + finger(140, 112))),
 'B': ('Noir, dessin agrandi', icon(K, cube(28, 92, 100, faces=mixed_gray) + finger(140, 114))),
 'C': ('Blanc, cube mélangé', icon('#FFFFFF', cube(28, 92, 100, faces=mixed_gray) + finger(140, 114))),
 'D': ('Jaune, une face de face', icon(Y, flat_face(28, 28, 132, [G, GR, R_, GR, W, B_, O, GR, GR]) + finger(140, 122, 1.1))),
 'E': ('Blanc, une face de face', icon('#FFFFFF', flat_face(28, 28, 132, [Y, G, R_, B_, W, O, GR, GR, GR]) + finger(140, 122, 1.1))),
 'F': ('Noir, une face, sans gris', icon(K, flat_face(30, 30, 128, [Y, G, R_, B_, W, O, G, Y, P]) + finger(136, 118, 1.1, ripple=False))),
}
for k, (_, s) in V.items(): open(f'{k}.svg', 'w').write(s)

def neighbor(c1, c2):  # icônes voisines neutres, sans marque
    return f'<div class="app"><div class="ic" style="background:linear-gradient(135deg,{c1},{c2})"></div><span>App</span></div>'
cells = ''
for k, (label, s) in V.items():
    cells += f'<div class="app"><div class="ic">{s}</div><span>Rubix Coach</span><em>{k}</em></div>'
grid = (neighbor('#FFFFFF','#E9EEF3') + neighbor('#3FA9F5','#1E7FD0') + neighbor('#0C6B4B','#0A4F38') + cells[:0])
html = f'''<!doctype html><html><head><meta charset="utf-8"><style>
body{{margin:0;width:540px;background:linear-gradient(160deg,#C97C00 0%,#B8650A 28%,#5B2AA8 62%,#3B1680 100%);font-family:system-ui,sans-serif;padding:30px 0 40px}}
.grid{{display:grid;grid-template-columns:repeat(4,1fr);row-gap:26px;padding:0 18px}}
.app{{display:flex;flex-direction:column;align-items:center;gap:7px;position:relative}}
.ic{{width:86px;height:86px;border-radius:30px;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,.25)}}
.ic svg{{width:100%;height:100%;display:block}}
span{{color:#fff;font-size:15px;text-shadow:0 1px 2px rgba(0,0,0,.4)}}
em{{position:absolute;top:-10px;right:14px;background:#111;color:#FFD500;font:700 13px system-ui;font-style:normal;border-radius:10px;padding:2px 7px}}
h3{{color:#fff;font:600 15px system-ui;margin:26px 18px 10px;text-shadow:0 1px 2px rgba(0,0,0,.4)}}
</style></head><body>
<div class="grid">{neighbor('#FFFFFF','#E9EEF3')}{neighbor('#3FA9F5','#1E7FD0')}{neighbor('#FFD500','#F2B800')}{neighbor('#0C6B4B','#0A4F38')}{cells}</div>
<h3>Les mêmes, plus grandes</h3><div class="grid" style="grid-template-columns:repeat(3,1fr)">{"".join(f'<div class="app"><div class="ic" style="width:140px;height:140px;border-radius:46px">{s}</div><span>{k} · {l}</span></div>' for k,(l,s) in V.items())}</div>
</body></html>'''
open('ecran.html', 'w').write(html)
