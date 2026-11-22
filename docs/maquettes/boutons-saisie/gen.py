from cube_svg import cube, Y, G, O, W
GR = '#9A9A9A'
mini = lambda s, ox, oy, faces=None: cube(s, ox, oy, faces=faces)
def svg(inner, w, h, vb='0 0 200 200'):
    return f'<svg width="{w}" height="{h}" viewBox="{vb}" xmlns="http://www.w3.org/2000/svg">{inner}</svg>'
CUBE = svg(mini(30, 100, 100), 26, 26)
TRASH = '''<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M9 7V4.5h6V7"/><path d="M6.5 7l1 12.5h9l1-12.5"/><path d="M10 11v5.5M14 11v5.5"/></svg>'''
INTER = "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=block"
GRAY = {(f,i,j): GR for f in 'UFR' for i in range(3) for j in range(3)}
GRAY[('U',1,1)] = Y; GRAY[('F',1,1)] = G; GRAY[('R',1,1)] = O
BIG = svg(mini(30, 100, 100, GRAY), 250, 250)
CSS = '''*{box-sizing:border-box;margin:0}body{width:375px;height:560px;background:#E3E8EE;font-family:Inter;color:#111;overflow:hidden;position:relative}
.tag{position:absolute;top:8px;left:16px;font:600 11px Inter;color:#B0126B;letter-spacing:.6px;text-transform:uppercase}
.head{padding:30px 16px 0}
h1{font-weight:800;font-size:21px;letter-spacing:-.3px}.sub{font-size:15px;color:#465061;margin-top:2px}
.row{display:flex;align-items:center;justify-content:space-between;gap:8px}
.eyebrow{font-weight:600;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:#6B7586;margin:14px 16px 8px}
.chips{display:flex;gap:8px;padding-left:16px}.chip{border:1px solid #C5CDD8;background:#F7F9FB;border-radius:12px;padding:9px 12px;font-weight:600;font-size:15px;white-space:nowrap}
.chip b{display:inline-block;width:22px;height:22px;border:1px solid #C5CDD8;border-radius:6px;text-align:center;font-size:12px;line-height:20px;margin-right:6px;color:#6B7586}
.stage{display:flex;justify-content:center;margin-top:6px}
.icon{width:40px;height:40px;border-radius:20px;display:flex;align-items:center;justify-content:center;flex:none}
.icon.light{background:#fff;border:1px solid #C5CDD8;color:#465061}
.icon.label{flex-direction:column;width:auto;height:auto;border-radius:12px;padding:6px 8px;gap:2px;font-size:10px;font-weight:600}
.pill{display:flex;align-items:center;gap:8px;background:#111;color:#fff;border-radius:22px;padding:6px 14px 6px 8px;font-weight:600;font-size:14px}
.pill.light{background:#fff;color:#111;border:1px solid #C5CDD8}
.seg{display:flex;background:#D3DAE3;border-radius:14px;padding:4px;margin:0 16px}
.seg div{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:8px 0;border-radius:10px;font-weight:600;font-size:14px;color:#465061}
.seg .on{background:#111;color:#fff}
.card{margin:10px 16px 0;display:flex;align-items:center;gap:10px;background:#111;color:#fff;border-radius:16px;padding:8px 12px}
.card .t{font-weight:600;font-size:14px}.card .s{font-size:12px;color:#9AA4B2}
.arrow{margin-left:auto;font-size:20px;color:#FFD500}
'''
def page(tag, body):
    return f'<!doctype html><html><head><meta charset="utf-8"><link href="{INTER}" rel="stylesheet"><style>{CSS}</style></head><body><div class="tag">{tag}</div>{body}</body></html>'
CHIPS = '<div class="eyebrow">Étapes déjà terminées</div><div class="chips"><div class="chip"><b>1</b>Croix blanche</div><div class="chip"><b>2</b>Premier étage</div><div class="chip"><b>3</b>Deuxième</div></div>'

# A : deux pastilles dans l'en-tête
A = page('A · Pastilles en haut', f'''<div class="head"><div class="row" style="margin-bottom:12px">
<div class="pill">{CUBE}Apprendre</div><div class="icon light" title="Tout effacer">{TRASH}</div></div>
<h1>Montrez-moi votre cube</h1><div class="sub">Jaune en haut, vert face à vous.</div></div>{CHIPS}<div class="stage">{BIG}</div>''')

# B : onglets Mon cube / Apprendre + corbeille avec mini-étiquette
B = page('B · Onglets', f'''<div style="height:32px"></div><div class="seg"><div class="on">{svg(mini(30,100,100,GRAY),20,20)}Mon cube</div><div>{svg(mini(30,100,100),20,20)}Apprendre</div></div>
<div class="head" style="padding-top:14px"><div class="row"><div><h1>Montrez-moi votre cube</h1><div class="sub">Jaune en haut, vert face à vous.</div></div>
<div class="icon light label">{TRASH}<span>Effacer</span></div></div></div>{CHIPS}<div class="stage">{svg(mini(30,100,100,GRAY),230,230)}</div>''')

# C : carte « Apprendre » + corbeille sur le cube
C = page('C · Carte Apprendre', f'''<div class="head"><h1>Montrez-moi votre cube</h1><div class="sub">Jaune en haut, vert face à vous.</div></div>
<div class="card">{svg(mini(30,100,100),34,34)}<div><div class="t">Apprendre sur un cube mélangé</div><div class="s">Résolvez-le vous-même, avec de l’aide</div></div><div class="arrow">›</div></div>
{CHIPS}<div class="stage" style="position:relative">{svg(mini(30,100,100,GRAY),230,230)}
<div class="icon light" style="position:absolute;left:16px;top:6px">{TRASH}</div><div class="icon light" style="position:absolute;right:16px;top:6px;font-size:20px">⟲</div></div>''')
for n, h in [('A', A), ('B', B), ('C', C)]:
    open(f'{n}.html', 'w').write(h)
