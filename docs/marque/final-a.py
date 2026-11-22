"""Icône retenue le 2026-11-22 : « A », cube à moitié recopié sur fond jaune, le doigt qui colorie.
Produit icon-a-full.svg (icône pleine), icon-a-fg.svg (avant-plan Android, zone sûre), icon-a-mono.svg (thèmes)."""
import re
from cube_svg import cube, Y, G, O, P, K
GR = '#A3AAB5'
def faces(fn): return {(f, i, j): fn(f, i, j) for f in 'UFR' for i in range(3) for j in range(3)}
half = faces(lambda f, i, j: {'F': G, 'U': Y, 'R': O}[f] if (f == 'F' or (f == 'U' and i + j >= 3) or (f == 'R' and j == 0)) else GR)
def finger(x, y, s=1.0, angle=-28):
    w, h = 30*s, 78*s
    return (f'<circle cx="{x}" cy="{y}" r="{16*s}" fill="none" stroke="{P}" stroke-width="{5*s}"/>'
            f'<circle cx="{x}" cy="{y}" r="{27*s}" fill="none" stroke="{P}" stroke-width="{4*s}" opacity=".45"/>'
            f'<g transform="translate({x} {y}) rotate({angle})"><rect x="{-w/2}" y="0" width="{w}" height="{h}" rx="{w/2}" fill="#F2C29E" stroke="#111111" stroke-width="{4.5*s}"/>'
            f'<rect x="{-w/2+5*s}" y="{4*s}" width="{w-10*s}" height="{16*s}" rx="{7*s}" fill="#FBE1CF"/></g>')
content = cube(28, 92, 100, faces=half) + finger(140, 112)
svg = lambda inner: f'<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">{inner}</svg>'
open('icon-a-full.svg', 'w').write(svg(f'<rect width="200" height="200" fill="{Y}"/>{content}'))
# Android n'affiche que les 2/3 centraux de l'avant-plan (zone visible de 72 dp sur 108) : on y ramène le dessin.
safe = f'<g transform="translate(100 100) scale(0.667) translate(-100 -100)">{content}</g>'
open('icon-a-fg.svg', 'w').write(svg(safe))
mono = re.sub(r'(fill|stroke)="#111111"', r'\1="none"', safe)
mono = re.sub(r'(fill|stroke)="#(?!111111)[0-9A-Fa-f]{6}"', r'\1="#FFFFFF"', mono)
open('icon-a-mono.svg', 'w').write(svg(mono))
