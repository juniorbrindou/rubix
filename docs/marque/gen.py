import math
C30, S30 = math.cos(math.pi/6), 0.5
Y, G, O, W, P, K = '#FFD500', '#00A651', '#FF6A00', '#FFFFFF', '#FF2D95', '#111111'

def proj(x, y, z, s, ox, oy):
    return (ox + (x - z) * C30 * s, oy + (x + z) * S30 * s - y * s)

def poly(pts, fill, extra=''):
    return f'<polygon points="{" ".join(f"{a:.1f},{b:.1f}" for a, b in pts)}" fill="{fill}" {extra}/>'

def cube(s, ox, oy, top=Y, front=G, right=O, body=K, gap=0.09, lift=0.0, faces=None):
    """Cube 3x3 isométrique ; lift soulève la couche du haut (en unités de case)."""
    out = []
    def P(x, y, z): return proj(x, y, z, s, ox, oy)
    # corps : trois faces noires
    def body_faces(y0, y1, l):
        return [
            poly([P(0, y1 + l, 0), P(3, y1 + l, 0), P(3, y1 + l, 3), P(0, y1 + l, 3)], body, 'stroke="%s" stroke-width="%.1f" stroke-linejoin="round"' % (body, s * 0.18)),
            poly([P(0, y1 + l, 3), P(3, y1 + l, 3), P(3, y0 + l, 3), P(0, y0 + l, 3)], body, 'stroke="%s" stroke-width="%.1f" stroke-linejoin="round"' % (body, s * 0.18)),
            poly([P(3, y1 + l, 3), P(3, y1 + l, 0), P(3, y0 + l, 0), P(3, y0 + l, 3)], body, 'stroke="%s" stroke-width="%.1f" stroke-linejoin="round"' % (body, s * 0.18)),
        ]
    layers = [(0, 2, 0.0), (2, 3, lift)] if lift else [(0, 3, 0.0)]
    for y0, y1, l in layers:
        out += body_faces(y0, y1, l)
        for i in range(3):
            for j in range(3):
                if y1 == 3:
                    out.append(poly([P(i + gap, 3 + l, j + gap), P(i + 1 - gap, 3 + l, j + gap), P(i + 1 - gap, 3 + l, j + 1 - gap), P(i + gap, 3 + l, j + 1 - gap)],
                                    (faces or {}).get(('U', i, j), top), 'stroke-linejoin="round"'))
        for i in range(3):
            for k in range(y0, y1):
                out.append(poly([P(i + gap, k + 1 - gap + l, 3), P(i + 1 - gap, k + 1 - gap + l, 3), P(i + 1 - gap, k + gap + l, 3), P(i + gap, k + gap + l, 3)],
                                (faces or {}).get(('F', i, k), front)))
                out.append(poly([P(3, k + 1 - gap + l, 3 - i - gap), P(3, k + 1 - gap + l, 3 - i - 1 + gap), P(3, k + gap + l, 3 - i - 1 + gap), P(3, k + gap + l, 3 - i - gap)],
                                (faces or {}).get(('R', i, k), right)))
    return '\n'.join(out)

def arc_arrow(cx, cy, rx, ry, a0, a1, color, width, head=14):
    """Arc d'ellipse de a0 à a1 (degrés, sens horaire à l'écran) avec une pointe au bout."""
    pts = []
    n = 40
    for t in range(n + 1):
        a = math.radians(a0 + (a1 - a0) * t / n)
        pts.append((cx + rx * math.cos(a), cy + ry * math.sin(a)))
    d = 'M ' + ' L '.join(f'{x:.1f} {y:.1f}' for x, y in pts[:-2])
    (x1, y1), (x2, y2) = pts[-3], pts[-1]
    ang = math.atan2(y2 - y1, x2 - x1)
    tip = (x2 + math.cos(ang) * head * 0.6, y2 + math.sin(ang) * head * 0.6)
    l = (x2 + math.cos(ang + 2.5) * head, y2 + math.sin(ang + 2.5) * head)
    r = (x2 + math.cos(ang - 2.5) * head, y2 + math.sin(ang - 2.5) * head)
    return (f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{width}" stroke-linecap="round"/>'
            + poly([tip, l, r], color, 'stroke="%s" stroke-width="3" stroke-linejoin="round"' % color))

def icon(bg, content, border=None):
    b = f'stroke="{border}" stroke-width="6"' if border else ''
    x = 3 if border else 0
    return f'<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect x="{x}" y="{x}" width="{200-2*x}" height="{200-2*x}" rx="44" fill="{bg}" {b}/>{content}</svg>'

V = {}
# 1. Classique affiné : arc rose au-dessus, de gauche à droite
V['1'] = ('Classique', 'Le cube noir et la flèche rose de l’Aide, plus nets.',
          icon(K, cube(21, 100, 112) + arc_arrow(100, 78, 70, 42, 195, 330, P, 10)))
# 2. Fond jaune
V['2'] = ('Sur fond jaune', 'Même dessin, posé sur le jaune de l’app : ressort sur l’écran d’accueil.',
          icon(Y, cube(21, 100, 112, top=W) + arc_arrow(100, 78, 70, 42, 195, 330, P, 10)))
# 3. La couche qui tourne : couche du haut soulevée et flèche qui l’entoure
V['3'] = ('La couche qui tourne', 'La couche du haut décollée, en plein quart de tour.',
          icon(K, cube(21, 100, 120, lift=0.35) + arc_arrow(100, 62, 78, 40, 160, 380, P, 9)))
# 4. Le coach : bulle qui annonce le mouvement
bubble = ('<rect x="104" y="22" width="76" height="56" rx="16" fill="%s"/>' % P
          + poly([(122, 76), (140, 76), (118, 94)], P)
          + '<text x="142" y="64" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="38" fill="#FFF">R</text>')
V['4'] = ('Le coach', 'Le cube et une bulle qui annonce le prochain mouvement, comme un coach.',
          icon(K, cube(19, 82, 126) + bubble))
# 5. Une case montrée : cube clair, une case rose sur la face avant
V['5'] = ('La case montrée', 'Cube sur fond clair, la case à bouger en rose et sa flèche.',
          icon('#E3E8EE', cube(21, 100, 112, faces={('F', 2, 2): P}) + arc_arrow(100, 78, 70, 42, 195, 330, P, 10), border=K))
# 6. Cube seul
V['6'] = ('Cube seul', 'Sans flèche : le plus simple, le plus lisible en petit.',
          icon(K, cube(24, 100, 100)))

cards = ''
for k, (title, text, svg) in V.items():
    cards += f'<div class="card"><div class="big">{svg}</div><div class="row"><div class="mini">{svg}</div><div class="mini-label">Rubix Coach</div></div><b>A{k} · {title}</b><span>{text}</span></div>'
html = f'''<!doctype html><html><head><meta charset="utf-8"><style>
body{{margin:0;background:#E3E8EE;font-family:system-ui,sans-serif;color:#111}}
.grid{{display:grid;grid-template-columns:1fr 1fr;gap:26px;padding:26px;width:600px}}
.card{{display:flex;flex-direction:column;align-items:center;gap:8px}}
.big svg{{width:190px;height:190px}} .mini svg{{width:48px;height:48px}}
.row{{display:flex;align-items:center;gap:8px;background:#1d2733;padding:6px 10px;border-radius:12px}}
.mini-label{{color:#fff;font-size:12px}}
b{{font-size:20px}} span{{font-size:13px;color:#465061;text-align:center}}
</style></head><body><div class="grid">{cards}</div></body></html>'''
open('board.html', 'w').write(html)
for k, (_, _, svg) in V.items():
    open(f'A{k}.svg', 'w').write(svg)
