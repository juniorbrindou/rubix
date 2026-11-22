import re
from base import *
GR = '#8E96A3'; R_, B_ = '#D62828', '#0051BA'
mix = {('U',0,0):Y,('U',1,0):G,('U',0,1):R_,('U',2,2):Y,('F',0,0):G,('F',0,1):B_,('F',1,0):O,('R',0,0):O,('R',1,0):Y,('R',2,1):W,('F',2,2):O,('R',1,1):P}
faces = {}
for face in 'UFR':
    for i in range(3):
        for j in range(3):
            faces[(face,i,j)] = mix.get((face,i,j), GR)
finger = ('<circle cx="134" cy="128" r="22" fill="none" stroke="%s" stroke-width="5" opacity=".9"/>'
          '<circle cx="134" cy="128" r="34" fill="none" stroke="%s" stroke-width="4" opacity=".45"/>'
          '<g transform="translate(150 150) rotate(-28)"><rect x="-13" y="-24" width="26" height="64" rx="13" fill="#F4C9A8" stroke="#111111" stroke-width="4"/>'
          '<rect x="-9" y="-20" width="18" height="14" rx="6" fill="#FBE3D2"/></g>') % (P, P)
content = cube(20, 88, 112, faces=faces) + finger
svg = lambda inner, bg='': f'<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">{bg}{inner}</svg>'
# Icône pleine (Android ancien format, iOS, web) : fond noir à bords francs, le système arrondit.
open('icon-full.svg','w').write(svg(content, '<rect width="200" height="200" fill="#111111"/>'))
# Avant-plan de l'icône adaptative : le dessin tient dans la zone sûre (66 % centrés).
safe = f'<g transform="translate(100 100) scale(0.62) translate(-106 -110)">{content}</g>'
open('icon-fg.svg','w').write(svg(safe))
# Monochrome (icônes à thème d'Android 13+) : seule la forme compte ; corps du cube transparent, le reste blanc.
mono = re.sub(r'(fill|stroke)="#111111"', r'\1="none"', safe)
mono = re.sub(r'(fill|stroke)="#(?!111111)[0-9A-Fa-f]{6}"', r'\1="#FFFFFF"', mono)
open('icon-mono.svg','w').write(svg(mono))
