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

