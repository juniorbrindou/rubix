"""Génère les images des fiches d'étape : un cube vu jaune en haut, vert devant, où seules les pièces utiles à
l'étape sont en couleur (le reste en gris, comme dans la saisie) et la case visée en rose.
Usage : python3 scripts/fiches/generer.py && node scripts/fiches/render.cjs"""
import math, os
from cube_svg import cube, proj, poly, Y, G, O, W, P

GR = '#C5CDD8'
SIDE = {'F': G, 'R': O}
OUT = os.path.join(os.path.dirname(__file__), 'svg')
os.makedirs(OUT, exist_ok=True)

def faces(fn):
    return {(f, i, j): fn(f, i, j) for f in 'UFR' for i in range(3) for j in range(3)}

def solved_rows(rows):
    """Faces latérales unies sur les rangées données (0 = bas)."""
    return lambda f, i, j: SIDE[f] if f != 'U' and j in rows else None

def stage(fn_list):
    def fn(f, i, j):
        for g in fn_list:
            c = g(f, i, j)
            if c: return c
        return GR
    return fn

# Rappel des indices : face U (i, j) = (x, z), (2, 2) = coin avant droit ; faces F et R (i, j) = (colonne, rangée),
# rangée 0 en bas ; sur F, i = 2 est la colonne de droite ; sur R, i = 0 est la colonne collée à F.
pink = lambda cells: (lambda f, i, j: P if (f, i, j) in cells else None)
U_ = lambda cells, c: (lambda f, i, j: c if f == 'U' and (i, j) in cells else None)
CENTER, EDGES, CORNERS = [(1, 1)], [(1, 0), (0, 1), (2, 1), (1, 2)], [(0, 0), (2, 0), (0, 2), (2, 2)]

STAGES = {
    1: stage([pink({('F', 1, 0)}), lambda f, i, j: SIDE[f] if f != 'U' and j == 0 and ((f == 'F' and i == 1) or (f == 'R' and i == 1)) else None,
              lambda f, i, j: SIDE[f] if f != 'U' and (i, j) == (1, 1) else None]),
    2: stage([pink({('F', 2, 0), ('R', 0, 0)}), U_([(2, 2)], W), solved_rows([0]), lambda f, i, j: SIDE[f] if f != 'U' and (i, j) == (1, 1) else None]),
    3: stage([pink({('F', 2, 1), ('R', 0, 1)}), U_([(1, 2)], O), lambda f, i, j: G if (f, i, j) == ('F', 1, 2) else None,
              solved_rows([0]), lambda f, i, j: SIDE[f] if f != 'U' and (i, j) == (1, 1) else None]),
    4: stage([U_(CENTER, Y), U_(EDGES, P), solved_rows([0, 1])]),
    5: stage([U_(CENTER + EDGES, Y), U_(CORNERS, P), solved_rows([0, 1])]),
    6: stage([U_(CENTER + EDGES + CORNERS, Y), pink({('F', 0, 2), ('F', 2, 2), ('R', 0, 2), ('R', 2, 2)}), solved_rows([0, 1])]),
    7: stage([U_(CENTER + EDGES + CORNERS, Y), lambda f, i, j: (O if f == 'F' else G) if f != 'U' and (i, j) == (1, 2) else None, solved_rows([0, 1, 2])]),
}

S, OX, OY = 30, 100, 100
P2 = lambda x, z: proj(x, 3, z, S, OX, OY)

def curve(a, b, bend):
    (x1, y1), (x2, y2) = P2(*a), P2(*b)
    mx, my = (x1 + x2) / 2, (y1 + y2) / 2
    nx, ny = -(y2 - y1), x2 - x1
    L = math.hypot(nx, ny); cx, cy = mx + nx / L * bend, my + ny / L * bend
    ang = math.atan2(y2 - cy, x2 - cx)
    head = poly([(x2 + math.cos(ang) * 9, y2 + math.sin(ang) * 9), (x2 + math.cos(ang + 2.4) * 12, y2 + math.sin(ang + 2.4) * 12),
                 (x2 + math.cos(ang - 2.4) * 12, y2 + math.sin(ang - 2.4) * 12)], P)
    return f'<path d="M {x1:.1f} {y1:.1f} Q {cx:.1f} {cy:.1f} {x2:.1f} {y2:.1f}" fill="none" stroke="{P}" stroke-width="6" stroke-linecap="round"/>' + head

EXTRA = {7: curve((1.5, 2.5), (0.5, 1.5), 12) + curve((0.5, 1.4), (2.5, 1.4), -16) + curve((2.5, 1.5), (1.6, 2.4), 12)}

for n, fn in STAGES.items():
    body = cube(S, OX, OY, faces=faces(fn)) + EXTRA.get(n, '')
    open(os.path.join(OUT, f'etape-{n}.svg'), 'w').write(f'<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">{body}</svg>')
print('7 SVG écrits dans', OUT)
