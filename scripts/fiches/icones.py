"""Icônes des onglets : un cube en couleurs (Apprendre) et un cube gris à colorier (Mon cube).
Usage : python3 scripts/fiches/icones.py && node scripts/fiches/render-icones.cjs"""
import os
from cube_svg import cube
GR = '#9A9A9A'
OUT = os.path.join(os.path.dirname(__file__), 'svg')
os.makedirs(OUT, exist_ok=True)
gray = {(f, i, j): GR for f in 'UFR' for i in range(3) for j in range(3)}
gray[('U', 1, 1)] = '#FFD500'; gray[('F', 1, 1)] = '#00A651'; gray[('R', 1, 1)] = '#FF6A00'
for name, faces in [('cube-couleurs', None), ('cube-gris', gray)]:
    open(os.path.join(OUT, f'{name}.svg'), 'w').write(f'<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">{cube(30, 100, 100, faces=faces)}</svg>')
