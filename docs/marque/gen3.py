from base import *
GR = '#8E96A3'  # case pas encore coloriée (le gris de l'app)
R_, B_ = '#D62828', '#0051BA'

def faces_partial(colored):
    """Toutes les cases grises sauf celles données."""
    f = {}
    for face in 'UFR':
        for i in range(3):
            for j in range(3):
                f[(face, i, j)] = colored.get((face, i, j), GR)
    return f

V = {}
# 1. Le pinceau : cube à moitié gris, un pinceau pose la couleur sur une case
mix = {('U',0,0):Y,('U',1,0):G,('U',0,1):R_,('U',2,2):Y,('F',0,0):G,('F',0,1):B_,('F',1,0):O,('R',0,0):O,('R',1,0):Y,('R',2,1):W,('F',2,2):O}
brush = ('<g transform="translate(150 50) rotate(40)">'
         '<rect x="-9" y="-62" width="18" height="58" rx="8" fill="#FFF"/>'
         '<rect x="-11" y="-8" width="22" height="14" rx="3" fill="#C5CDD8"/>'
         '<path d="M -10 6 Q -12 30 0 44 Q 12 30 10 6 Z" fill="%s"/></g>' % P)
V['1'] = ('Le pinceau', 'Un cube encore gris par endroits ; un pinceau y pose la couleur de ton vrai cube.',
          icon(K, cube(20, 92, 118, faces=faces_partial(mix)) + brush))
# 2. La palette : cube gris qui se remplit + les 6 couleurs dessous
mix2 = {('U',0,0):Y,('U',1,1):Y,('U',2,0):R_,('F',0,2):G,('F',1,2):B_,('F',0,1):O,('R',2,2):O,('R',1,2):W,('R',0,1):Y}
dots = ''.join(f'<circle cx="{36 + i*25.6:.1f}" cy="172" r="10" fill="{c}" {"stroke=\"#111\" stroke-width=\"2\"" if c==W else ""}/>' for i, c in enumerate([Y, O, G, W, R_, B_]))
V['2'] = ('La palette', 'Le cube se colorie case par case, avec les six couleurs dessous.',
          icon(K, cube(18, 100, 98, faces=faces_partial(mix2)) + dots))
# 3. Le doigt : on touche une case grise, elle prend sa couleur
finger = ('<circle cx="134" cy="128" r="22" fill="none" stroke="%s" stroke-width="5" opacity=".9"/>'
          '<circle cx="134" cy="128" r="34" fill="none" stroke="%s" stroke-width="4" opacity=".45"/>'
          '<g transform="translate(150 150) rotate(-28)"><rect x="-13" y="-24" width="26" height="64" rx="13" fill="#F4C9A8" stroke="#111" stroke-width="4"/>'
          '<rect x="-9" y="-20" width="18" height="14" rx="6" fill="#FBE3D2"/></g>') % (P, P)
V['3'] = ('Le doigt', 'Tu touches une case grise : elle prend la couleur de ton cube.',
          icon(K, cube(20, 88, 112, faces=faces_partial({**mix, ('R',1,1):P})) + finger))
# 4. Du vrai cube à l'app : cube réel à gauche, flèche, face 3x3 qui se remplit dans un téléphone
phone = ('<rect x="118" y="44" width="66" height="112" rx="12" fill="#262B33" stroke="#FFF" stroke-width="4"/>'
         + ''.join(f'<rect x="{128 + (i%3)*16}" y="{78 + (i//3)*16}" width="13" height="13" rx="3" fill="{c}"/>'
                   for i, c in enumerate([Y, G, R_, O, Y, GR, B_, GR, GR])))
arrow = '<path d="M 92 100 L 110 100" stroke="%s" stroke-width="7" stroke-linecap="round"/>' % P + poly([(118,100),(106,91),(106,109)], P)
V['4'] = ('Du vrai cube à l’app', 'Ton cube à gauche, tu recopies ses couleurs dans le téléphone.',
          icon(K, cube(13, 52, 112, faces={('U',0,0):Y,('U',1,2):R_,('U',2,1):G,('F',0,0):B_,('F',2,1):Y,('F',1,2):O,('R',0,0):W,('R',2,2):G,('R',1,1):R_}) + arrow + phone))
# 5. Pipette
pip = ('<g transform="translate(148 52) rotate(35)">'
       '<rect x="-12" y="-46" width="24" height="26" rx="10" fill="%s"/>'
       '<rect x="-7" y="-22" width="14" height="40" rx="4" fill="#FFF"/>'
       '<path d="M -7 16 L 0 34 L 7 16 Z" fill="#FFF"/></g>'
       '<circle cx="128" cy="92" r="7" fill="%s"/>') % (P, Y)
V['5'] = ('La pipette', 'Une pipette dépose la couleur : on « prélève » les couleurs de son cube.',
          icon(K, cube(20, 92, 120, faces=faces_partial(mix)) + pip))
# 6. Moitié-moitié : moitié du cube grise, moitié colorée, coupée en diagonale
half = {}
for face in 'UFR':
    for i in range(3):
        for j in range(3):
            colored = (face == 'F') or (face == 'U' and i + j <= 2)
            half[(face,i,j)] = {'U':Y,'F':G,'R':O}[face] if colored else GR
V['6'] = ('Moitié saisi', 'Une moitié coloriée, l’autre encore grise : « finis de recopier ton cube ».',
          icon(Y, cube(22, 100, 104, faces=half)))

cards = ''
for k, (title, text, svg) in V.items():
    cards += f'<div class="card"><div class="big">{svg}</div><div class="row"><div class="mini">{svg}</div><div class="mini-label">Rubix Coach</div></div><b>{k} · {title}</b><span>{text}</span></div>'
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
    open(f'S{k}.svg', 'w').write(svg)
