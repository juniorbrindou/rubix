import math
from base import cube, proj, poly, Y, G, O, W, P, K
GR = '#C5CDD8'; R_, B_ = '#D62828', '#0051BA'
NM = '/var/www/rubix/node_modules/@expo-google-fonts'
FONTS = f'''
@font-face{{font-family:Unb;src:url(file://{NM}/unbounded/700Bold/Unbounded_700Bold.ttf);font-weight:700}}
@font-face{{font-family:Unb;src:url(file://{NM}/unbounded/500Medium/Unbounded_500Medium.ttf);font-weight:500}}
@font-face{{font-family:Atk;src:url(file://{NM}/atkinson-hyperlegible-next/400Regular/AtkinsonHyperlegibleNext_400Regular.ttf);font-weight:400}}
@font-face{{font-family:Atk;src:url(file://{NM}/atkinson-hyperlegible-next/700Bold/AtkinsonHyperlegibleNext_700Bold.ttf);font-weight:700}}'''

def faces(fn):
    f = {}
    for face in 'UFR':
        for i in range(3):
            for j in range(3):
                f[(face, i, j)] = fn(face, i, j)
    return f

def svg(inner, w=200, h=200):
    return f'<svg viewBox="0 0 {w} {h}" width="{w}" height="{h}" xmlns="http://www.w3.org/2000/svg">{inner}</svg>'

# Fiche « Premier étage » : seule la rangée du bas compte ; la case visée (coin DFR) en rose, le coin blanc attend au-dessus.
def first_layer(face, i, j):
    if face == 'U': return W if (i, j) == (2, 2) else GR
    if face == 'F': return (P if i == 2 else G) if j == 0 else GR
    if face == 'R': return (P if i == 0 else O) if j == 0 else GR
d1 = cube(30, 100, 100, faces=faces(first_layer))

# Fiche « Arêtes jaunes » : tout est fait sauf trois arêtes du haut, qui tournent en cercle.
def last(face, i, j):
    if face == 'U': return Y
    if face == 'F': return O if (i, j) == (1, 2) else G
    if face == 'R': return G if (i, j) == (1, 2) else O
P2 = lambda x, z: proj(x, 3, z, 30, 100, 100)
def curve(a, b, bend):
    (x1, y1), (x2, y2) = P2(*a), P2(*b)
    mx, my = (x1 + x2) / 2, (y1 + y2) / 2
    nx, ny = -(y2 - y1), x2 - x1
    L = math.hypot(nx, ny); cx, cy = mx + nx / L * bend, my + ny / L * bend
    ang = math.atan2(y2 - cy, x2 - cx)
    head = poly([(x2 + math.cos(ang) * 9, y2 + math.sin(ang) * 9), (x2 + math.cos(ang + 2.4) * 12, y2 + math.sin(ang + 2.4) * 12), (x2 + math.cos(ang - 2.4) * 12, y2 + math.sin(ang - 2.4) * 12)], P)
    return f'<path d="M {x1:.1f} {y1:.1f} Q {cx:.1f} {cy:.1f} {x2:.1f} {y2:.1f}" fill="none" stroke="{P}" stroke-width="6" stroke-linecap="round"/>' + head
arrows = curve((1.5, 2.5), (0.5, 1.5), 12) + curve((0.5, 1.4), (2.5, 1.4), -16) + curve((2.5, 1.5), (1.6, 2.4), 12)
d2 = cube(30, 100, 100, faces=faces(last)) + arrows

CSS = FONTS + '''
*{box-sizing:border-box;margin:0}
body{width:375px;height:812px;background:#E3E8EE;font-family:Atk;color:#111;overflow:hidden;position:relative}
.status{height:34px}
.top{display:flex;justify-content:space-between;align-items:center;padding:6px 16px}
.quiet{font-family:Atk;font-weight:700;font-size:14px;color:#465061;text-decoration:underline}
.counter{font-family:Unb;font-weight:700;font-size:16px}.counter small{color:#6B7586;font-size:12px}
.eyebrow{font-family:Unb;font-weight:500;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:#6B7586}
.head{padding:6px 16px 0}
.titleRow{display:flex;align-items:center;gap:10px;margin-top:2px}
h1{font-family:Unb;font-weight:700;font-size:20px;letter-spacing:-.4px}
.info{width:28px;height:28px;border-radius:14px;border:2px solid #465061;display:flex;align-items:center;justify-content:center;font-family:Unb;font-weight:700;font-size:13px;color:#465061}
.info.pulse{box-shadow:0 0 0 6px rgba(255,45,149,.18);border-color:#FF2D95;color:#FF2D95}
.sub{font-size:15px;color:#465061;margin-top:2px}
.segs{display:flex;gap:6px;padding:12px 16px 0}.segs i{flex:1;height:6px;border-radius:3px;background:#111}.segs i.cur{background:#FFD500;outline:2px solid #111}.segs i.todo{background:#C5CDD8}
.bar{margin:12px 16px 0;background:#111;border-radius:16px;padding:12px 14px;display:flex;gap:18px;font-family:Unb;font-weight:700;font-size:18px;color:#fff}
.bar b{background:#FFD500;color:#111;border-radius:8px;padding:0 8px}
.stage{display:flex;justify-content:center;padding-top:14px}
.instr{display:flex;gap:12px;align-items:center;padding:6px 16px}
.tile{width:64px;height:64px;border-radius:16px;background:#FFD500;border:3px solid #111;display:flex;align-items:center;justify-content:center;font-family:Unb;font-weight:700;font-size:24px}
.instr p{font-size:15px;line-height:20px}
.dock{position:absolute;left:0;right:0;bottom:0;background:#111;border-radius:22px 22px 0 0;padding:12px 12px 22px;display:flex;gap:8px}
.btn{flex:1;height:52px;border-radius:16px;background:#262B33;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px}
.btn.go{flex:1.3;background:#FFD500;color:#111;border:2px solid #111}
.scrim{position:absolute;inset:0;background:rgba(17,17,17,.45)}
.sheet{position:absolute;left:0;right:0;bottom:0;top:118px;background:#F7F9FB;border-radius:22px 22px 0 0;padding:10px 18px 24px;overflow:hidden}
.grab{width:44px;height:5px;border-radius:3px;background:#C5CDD8;margin:0 auto 10px}
.shead{display:flex;justify-content:space-between;align-items:flex-start}
.close{width:32px;height:32px;border-radius:16px;background:#E3E8EE;display:flex;align-items:center;justify-content:center;font-size:18px;color:#465061}
.sheet h2{font-family:Unb;font-weight:700;font-size:22px;letter-spacing:-.4px;margin-top:2px}
.lede{font-size:16px;line-height:22px;margin-top:8px}
.where{display:flex;gap:4px;margin-top:12px}.where span{flex:1;font-size:10px;font-family:Unb;font-weight:500;text-align:center;padding:5px 0;border-radius:6px;background:#E3E8EE;color:#6B7586}
.where span.done{background:#111;color:#fff}.where span.cur{background:#FFD500;color:#111;outline:2px solid #111}
.block{margin-top:16px}
.block h3{font-family:Unb;font-weight:500;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:#6B7586;margin-bottom:6px}
.hold{display:flex;gap:8px;align-items:center;background:#fff;border:1px solid #E3E8EE;border-radius:16px;padding:8px 12px 8px 4px}.hold svg{flex:none}
.hold ul{list-style:none;padding:0;font-size:14px;line-height:19px}.hold li{margin:3px 0}
.dot{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px;vertical-align:-1px}
.moves{display:grid;grid-template-columns:auto 1fr;gap:6px 10px;align-items:center}
.mv{font-family:Unb;font-weight:700;font-size:15px;background:#111;color:#fff;border-radius:8px;padding:5px 0;width:44px;text-align:center}
.moves p{font-size:14px;line-height:18px}
.formula{display:flex;flex-wrap:wrap;gap:5px}.formula span{font-family:Unb;font-weight:700;font-size:14px;background:#111;color:#fff;border-radius:7px;padding:5px 8px}
.check{font-size:14px;line-height:19px;padding-left:0;list-style:none}.check li{margin:4px 0;padding-left:22px;position:relative}
.check li:before{content:"";position:absolute;left:0;top:3px;width:13px;height:13px;border-radius:4px;background:#0B7A3E}
.warn{margin-top:10px;font-size:14px;line-height:19px;background:#FFF1F7;border-left:4px solid #FF2D95;border-radius:8px;padding:8px 10px}
.fade{position:absolute;left:0;right:0;bottom:0;height:60px;background:linear-gradient(transparent,#F7F9FB)}
.note{font-size:13px;color:#6B7586;margin-top:6px}
'''
SEG = lambda cur: ''.join(f'<i class="{"cur" if k==cur else "todo" if k>cur else ""}"></i>' for k in range(7))
WHERE = lambda cur: ''.join(f'<span class="{"done" if k<cur else "cur" if k==cur else ""}">{k+1}</span>' for k in range(7))

def solution_screen(stage_no, title, label, moves, current, tile, text, pulse=False):
    bar = ''.join(f'<b>{m}</b>' if k == current else f'<span>{m}</span>' for k, m in enumerate(moves))
    big = cube(30, 140, 130, faces=faces(lambda f,i,j: {'U':Y,'F':G,'R':O}[f]))
    return f'''<div class="status"></div>
<div class="top"><span class="quiet">‹ Modifier mon cube</span><span class="counter">9<small>/124</small></span></div>
<div class="head"><div class="eyebrow">Étape {stage_no} sur 7</div>
<div class="titleRow"><h1>{title}</h1><div class="info{' pulse' if pulse else ''}">i</div></div>
<div class="sub">{label}</div></div>
<div class="segs">{SEG(stage_no-1)}</div>
<div class="bar">{bar}</div>
<div class="stage">{svg(big, 280, 280)}</div>
<div class="instr"><div class="tile">{tile}</div><p>{text}</p></div>
<div class="dock"><div class="btn">Précédent</div><div class="btn go">Lecture</div><div class="btn">Suivant</div></div>'''

frame1 = solution_screen(2, 'Premier étage', 'Coin du premier étage', ['U', 'R', 'U', "R'", "U'"], 1, 'R',
                         'Tourne la face droite d’un quart de tour, dans le sens des aiguilles d’une montre.', pulse=False)

sheet1 = f'''<div class="scrim"></div><div class="sheet">
<div class="grab"></div>
<div class="shead"><div><div class="eyebrow">Étape 2 sur 7</div><h2>Premier étage</h2></div><div class="close">✕</div></div>
<div class="where">{WHERE(1)}</div>
<p class="lede">Placer les quatre coins blancs pour achever la face blanche.</p>
<div class="block"><h3>Tenez le cube de cette façon</h3>
<div class="hold">{svg(d1, 140, 140).replace('viewBox="0 0 140 140"','viewBox="0 0 200 200"')}
<ul><li><span class="dot" style="background:#FFD500"></span>Jaune en haut, vert face à vous.</li>
<li><span class="dot" style="background:#FF2D95"></span>Le coin blanc se place au-dessus de la case rose.</li></ul></div></div>
<div class="block"><h3>La formule</h3>
<div class="moves">
<span class="mv">R</span><p>Monter la colonne de droite.</p>
<span class="mv">U</span><p>Tourner le haut vers la gauche.</p>
<span class="mv">R'</span><p>Redescendre la colonne de droite.</p>
<span class="mv">U'</span><p>Ramener le haut vers la droite.</p></div>
<p class="note">À répéter jusqu’à ce que le coin soit en place.</p></div>
<div class="block"><h3>Objectif atteint</h3>
<ul class="check"><li>Face du bas entièrement blanche.</li><li>Rangée du bas unie sur chaque côté.</li></ul></div>
<div class="fade"></div></div>'''

frame3 = f'''<div class="status"></div><div class="scrim" style="background:rgba(17,17,17,.0)"></div><div class="sheet" style="top:34px">
<div class="grab"></div>
<div class="shead"><div><div class="eyebrow">Étape 7 sur 7</div><h2>Arêtes jaunes</h2></div><div class="close">✕</div></div>
<div class="where">{WHERE(6)}</div>
<p class="lede">Faire tourner les trois dernières arêtes jusqu’à leur place.</p>
<div class="block"><h3>Tenez le cube de cette façon</h3>
<div class="hold">{svg(d2, 140, 140).replace('viewBox="0 0 140 140"','viewBox="0 0 200 200"')}
<ul><li><span class="dot" style="background:#FFD500"></span>Jaune en haut, vert face à vous.</li>
<li><span class="dot" style="background:#FF2D95"></span>Les flèches indiquent les arêtes à déplacer.</li></ul></div></div>
<div class="block"><h3>La formule</h3>
<div class="formula"><span>R</span><span>U'</span><span>R</span><span>U</span><span>R</span><span>U</span><span>R</span><span>U'</span><span>R'</span><span>U'</span><span>R2</span></div>
<p class="note" style="font-size:14px;color:#465061">À retenir d’un bloc. Le cube se défait en cours de route, puis se reforme.</p></div>
<div class="block"><h3>Objectif atteint</h3>
<ul class="check"><li>Cube résolu.</li></ul>
<div class="warn"><b>Une arête reste mal placée ?</b> Répétez la formule une seconde fois.</div></div>
</div>'''

for name, body in [('1-bouton', frame1), ('2-fiche-premier-etage', frame1 + sheet1), ('3-fiche-aretes-jaunes', frame3)]:
    open(f'{name}.html', 'w').write(f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>{body}</body></html>')
