"""Generate the research-thread diagrams in img/ (threads 02-05).

Shares the visual language of img/rsi-loop.svg (hand-edited, not generated):
gradient title, centre diagram, two side panels, footer line, light/dark via
prefers-color-scheme. Edit the text here, then run:

    python3 scripts/gen_thread_figures.py img
"""
import math, random, sys
OUT = sys.argv[1]

STYLE = '''<style>
  /* Light by default, dark to match the site. Loaded as an image, so none of
     this reaches the page. Shared with rsi-loop.svg. */
  svg { --gr:#0a9e52; --cy:#0e8fa8; --mi:#0f9f6e; --am:#b37a00;
        --ink:#17171a; --mute:#5c5c66; --node:#ffffff; --panel:#faf9f6; --glow:.35; }
  @media (prefers-color-scheme: dark) {
    svg { --gr:#00FF77; --cy:#22D3EE; --mi:#7CFFB0; --am:#FFB020;
          --ink:#ecebe8; --mute:#9a9894; --node:#141413; --panel:#151514; --glow:.42; }
  }
  .ink{fill:var(--ink)} .mute{fill:var(--mute)}
  .f-gr{fill:var(--gr)} .f-cy{fill:var(--cy)} .f-mi{fill:var(--mi)} .f-am{fill:var(--am)}
  .s-gr{stroke:var(--gr)} .s-cy{stroke:var(--cy)} .s-mi{stroke:var(--mi)} .s-am{stroke:var(--am)} .s-mute{stroke:var(--mute)}
  .st-gr{stop-color:var(--gr)} .st-cy{stop-color:var(--cy)} .st-mi{stop-color:var(--mi)} .st-am{stop-color:var(--am)}
  .node{fill:var(--node)} .panel{fill:var(--panel)} .bg{opacity:var(--glow)}
</style>'''

DEFS = '''<defs>
<linearGradient id="gx" x1="0" y1="0" x2="1" y2="0"><stop offset="0" class="st-gr"/><stop offset="0.5" class="st-cy"/><stop offset="1" class="st-gr"/><animateTransform attributeName="gradientTransform" type="translate" values="-0.3 0; 0.3 0; -0.3 0" dur="7s" repeatCount="indefinite"/></linearGradient>
<linearGradient id="gxTitle" x1="0" y1="0" x2="1" y2="0"><stop offset="0" class="st-mi"/><stop offset="0.5" class="st-gr"/><stop offset="1" class="st-cy"/><animateTransform attributeName="gradientTransform" type="translate" values="-0.4 0; 0.4 0; -0.4 0" dur="9s" repeatCount="indefinite"/></linearGradient>
<radialGradient id="nodeGlow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" class="st-gr" stop-opacity="0.5"/><stop offset="1" class="st-gr" stop-opacity="0"/></radialGradient>
<radialGradient id="hubGlow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" class="st-cy" stop-opacity="0.42"/><stop offset="0.6" class="st-cy" stop-opacity="0.08"/><stop offset="1" class="st-cy" stop-opacity="0"/></radialGradient>
<radialGradient id="amGlow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" class="st-am" stop-opacity="0.35"/><stop offset="1" class="st-am" stop-opacity="0"/></radialGradient>
<radialGradient id="bgGlowG" cx="0.5" cy="0.5" r="0.5"><stop offset="0" class="st-gr" stop-opacity="0.3"/><stop offset="1" class="st-gr" stop-opacity="0"/></radialGradient>
<radialGradient id="bgGlowC" cx="0.5" cy="0.5" r="0.5"><stop offset="0" class="st-cy" stop-opacity="0.28"/><stop offset="1" class="st-cy" stop-opacity="0"/></radialGradient>
<radialGradient id="bgGlowA" cx="0.5" cy="0.5" r="0.5"><stop offset="0" class="st-am" stop-opacity="0.16"/><stop offset="1" class="st-am" stop-opacity="0"/></radialGradient>
<marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1l8 4-8 4z" class="f-cy"/></marker>
<marker id="arrA" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1l8 4-8 4z" class="f-am"/></marker>
</defs>'''

STARS = [(1140.1,563.4),(216.4,117.1),(1157.4,578.0),(40.6,208.6),(153.2,138.1),(152.4,575.0),(260.2,556.6),(83.3,562.5),(58.6,236.5),(197.2,126.5),(60.0,537.8),(397.2,579.7),(928.5,540.1),(1152.5,523.5),(326.5,115.3),(942.7,539.7),(123.6,124.8),(1017.6,129.5),(549.4,121.6),(944.3,560.5),(52.1,331.9),(278.9,533.0)]

def fade(t, body, dur=0.6):
    return f'<g opacity="0"><animate attributeName="opacity" from="0" to="1" begin="{t}s" dur="{dur}s" fill="freeze"/>\n{body}\n</g>'

def esc(s): return s.replace('&','&amp;')

def doc(title, desc, heading, sub, center, left, right, footer):
    o = [f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 640" role="img" aria-labelledby="title desc" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
<title id="title">{esc(title)}</title>
<desc id="desc">{esc(desc)}</desc>
{STYLE}
{DEFS}
<!-- atmosphere -->
<g class="bg">
<circle cx="250" cy="200" r="170" fill="url(#bgGlowG)"><animateTransform attributeName="transform" type="translate" values="0 0; 40 30; 0 0" dur="24s" repeatCount="indefinite"/></circle>
<circle cx="960" cy="470" r="175" fill="url(#bgGlowC)"><animateTransform attributeName="transform" type="translate" values="0 0; -40 -28; 0 0" dur="27s" repeatCount="indefinite"/></circle>
<circle cx="1040" cy="180" r="120" fill="url(#bgGlowA)"><animateTransform attributeName="transform" type="translate" values="0 0; -24 34; 0 0" dur="31s" repeatCount="indefinite"/></circle>''']
    for i,(x,y) in enumerate(STARS):
        o.append(f'<circle cx="{x}" cy="{y}" r="1.5" class="f-gr" opacity="0.4"><animate attributeName="opacity" values="0.1;0.45;0.1" dur="{6+i%7}s" begin="{(i%5)*0.6:.1f}s" repeatCount="indefinite"/></circle>')
    o.append('</g>')
    o.append(f'''<!-- heading -->
<text x="600" y="58" text-anchor="middle" font-size="32" font-weight="700" fill="url(#gxTitle)" letter-spacing="-0.5">{esc(heading)}</text>
<text x="600" y="90" text-anchor="middle" font-size="15.5" class="mute" font-weight="500">{esc(sub)}</text>''')
    o.append(center)
    o.append(panel(28, *left, t=0.3))
    o.append(panel(880, *right, t=0.6))
    o.append(fade(2.6, f'<text x="600" y="612" text-anchor="middle" font-size="13" font-weight="700" class="mute" letter-spacing="0.8">{esc(footer)}</text>', 0.8))
    o.append('</svg>')
    return '\n'.join(o) + '\n'

def panel(x, head, col, items, t):
    h = 48 + 38*len(items); y = round(330 - h/2)
    b = [f'<rect x="{x}" y="{y}" width="292" height="{h}" rx="14" class="panel s-{col}" stroke-opacity="0.35" stroke-width="1"/>',
         f'<text x="{x+18}" y="{y+28}" font-size="12" font-weight="700" class="f-{col}" letter-spacing="1.2">{esc(head)}</text>']
    for k,(a,c) in enumerate(items):
        yy = y + 56 + 38*k
        b.append(f'<circle cx="{x+22}" cy="{yy-4.5}" r="2.8" class="f-{col}" opacity="0.8"/>')
        b.append(f'<text x="{x+34}" y="{yy}" font-size="14" font-weight="650" class="ink">{esc(a)}</text>')
        b.append(f'<text x="{x+34}" y="{yy+16}" font-size="12" class="mute">{esc(c)}</text>')
    return fade(t, '\n'.join(b))

def ell(cx, cy, rx, ry, a): return (cx + rx*math.cos(math.radians(a)), cy + ry*math.sin(math.radians(a)))

# ---------------------------------------------------------------- 02 distributed
def distributed():
    cx, cy, rx, ry = 600, 340, 190, 145
    angs = [-90, -30, 30, 90, 150, 210]
    pts = [ell(cx, cy, rx, ry, a) for a in angs]
    bad = 2
    bars = [[16,9,4],[4,16,9],[9,4,16],[13,13,5],[5,11,16],[11,5,13]]
    c = ['<!-- gossip edges between neighbours -->']
    for i in range(6):
        a0, a1 = angs[i]+11, angs[(i+1)%6]-11
        x0,y0 = ell(cx,cy,rx,ry,a0); x1,y1 = ell(cx,cy,rx,ry,a1)
        c.append(f'<path d="M{x0:.1f},{y0:.1f} A{rx},{ry} 0 0 1 {x1:.1f},{y1:.1f}" fill="none" class="s-cy" stroke-width="1.2" stroke-opacity="0.3" stroke-dasharray="3 5"><animate attributeName="stroke-dashoffset" values="0;-32" dur="3s" repeatCount="indefinite"/></path>')
    body = []
    for i,(x,y) in enumerate(pts):
        dx,dy = cx-x, cy-y; L = math.hypot(dx,dy); ux,uy = dx/L, dy/L
        sx,sy = x+ux*34, y+uy*34; ex,ey = cx-ux*50, cy-uy*50
        isbad = i == bad; col = 'am' if isbad else 'gr'
        body.append(f'<line x1="{sx:.1f}" y1="{sy:.1f}" x2="{ex:.1f}" y2="{ey:.1f}" class="s-{"am" if isbad else "cy"}" stroke-width="1.4" stroke-opacity="{0.5 if isbad else 0.35}"{" stroke-dasharray=\"5 4\"" if isbad else ""}/>')
        path = f'M{sx:.1f},{sy:.1f} L{ex:.1f},{ey:.1f}'
        for k in range(2):
            beg = 1.2 + 0.4*i + 1.3*k
            if isbad:
                body.append(f'<circle r="4" class="f-am"><animateMotion path="{path}" dur="2.6s" begin="{beg:.1f}s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.55;0.8;1" dur="2.6s" begin="{beg:.1f}s" repeatCount="indefinite"/></circle>')
            else:
                body.append(f'<circle r="3.6" class="f-mi" opacity="0.9"><animateMotion path="{path}" dur="2.6s" begin="{beg:.1f}s" repeatCount="indefinite"/></circle>')
    nodes = []
    for i,(x,y) in enumerate(pts):
        isbad = i == bad; col = 'am' if isbad else 'gr'
        glow = 'amGlow' if isbad else 'nodeGlow'
        n = [f'<circle cx="{x:.1f}" cy="{y:.1f}" r="44" fill="url(#{glow})" opacity="0.6"/>',
             f'<circle cx="{x:.1f}" cy="{y:.1f}" r="31" class="node s-{col}" stroke-width="2"><animate attributeName="stroke-opacity" values="0.6;1;0.6" dur="3s" begin="{0.3*i:.1f}s" repeatCount="indefinite"/></circle>']
        # local data histogram: heterogeneous across learners
        for k,h in enumerate(bars[i]):
            bx = x - 13 + k*9.5
            n.append(f'<rect x="{bx:.1f}" y="{y+10-h:.1f}" width="7" height="{h}" rx="1.5" class="f-{["gr","cy","mi"][k]}" opacity="0.85"/>')
        n.append(f'<line x1="{x-15:.1f}" y1="{y+11:.1f}" x2="{x+15:.1f}" y2="{y+11:.1f}" class="s-mute" stroke-width="0.8" opacity="0.6"/>')
        lab = 'corrupted update' if isbad else f'learner {i+1}'
        ly = y + 50 if angs[i] != -90 else y - 41
        n.append(f'<text x="{x:.1f}" y="{ly:.1f}" text-anchor="middle" font-size="12.5" font-weight="650" class="{"f-am" if isbad else "mute"}">{lab}</text>')
        nodes.append(fade(0.2+0.15*i, '\n'.join(n), 0.5))
    hub = f'''<circle cx="{cx}" cy="{cy}" r="74" fill="url(#hubGlow)"/>
<circle cx="{cx}" cy="{cy}" r="48" class="node" stroke="url(#gx)" stroke-width="2.5"><animate attributeName="stroke-opacity" values="0.55;1;0.55" dur="5s" repeatCount="indefinite"/></circle>
<text x="{cx}" y="{cy-2}" text-anchor="middle" font-size="13.5" font-weight="700" class="ink">AGGREGATE</text>
<text x="{cx}" y="{cy+15}" text-anchor="middle" font-size="11.5" class="f-cy">robust median</text>'''
    bx, by = pts[bad]
    mx, my = (bx+cx)/2, (by+cy)/2
    notes = fade(2.0, f'''<text x="{mx-6:.1f}" y="{my+28:.1f}" text-anchor="end" font-size="11.5" class="f-am" font-style="italic">down-weighted</text>
<text x="{cx+122}" y="{cy-ry-6}" font-size="11.5" class="f-cy" font-style="italic">peer-to-peer gossip</text>
<text x="{cx}" y="{cy+ry+80}" text-anchor="middle" font-size="12" class="mute">each node: a different local data distribution</text>''')
    center = '\n'.join(c) + '\n' + fade(0.8, '\n'.join(body)) + '\n' + '\n'.join(nodes) + '\n' + fade(0.1, hub, 0.5) + '\n' + notes
    return doc("Many learners, one model",
        "Six learners, each holding a different local data distribution, send compressed updates to a robust aggregator and gossip with their neighbours. One learner sends a corrupted update, which the robust median down-weights. Each learner has local data, local compute, a communication budget, and a sparse set of neighbours; client drift, failures, adversarial participants, and stale information are what can go wrong.",
        "Many learners, one model.",
        "local updates · limited communication · robust aggregation · consensus",
        '\n'.join([center]),
        ("WHAT EACH LEARNER HAS", "cy", [("local data","different distributions, never shared"),("local compute","several steps between rounds"),("a link budget","few bits per round"),("its neighbours","a sparse, changing topology")]),
        ("WHAT CAN GO WRONG", "am", [("client drift","local optima pull apart"),("failures","rounds with missing updates"),("adversaries","Byzantine updates in the mix"),("stale signals","delayed or compressed information")]),
        "AGGREGATE ROBUSTLY · COMMUNICATE SPARINGLY · CONVERGE DESPITE HETEROGENEITY")

# ---------------------------------------------------------------- 03 robust
def robust():
    rnd = random.Random(7)
    ccx, ccy, sd = 560, 380, 56
    inl = [(rnd.gauss(ccx, sd), rnd.gauss(ccy, sd*0.85)) for _ in range(74)]
    inl = [(x,y) for x,y in inl if 390 < x < 730 and 250 < y < 520]
    out = [(rnd.gauss(785, 20), rnd.gauss(196, 17)) for _ in range(22)]
    allp = inl + out
    mean = (sum(p[0] for p in allp)/len(allp), sum(p[1] for p in allp)/len(allp))
    gm = (ccx, ccy)
    for _ in range(200):   # Weiszfeld
        num = [0,0]; den = 0
        for x,y in allp:
            d = math.hypot(x-gm[0], y-gm[1]) or 1e-6
            num[0] += x/d; num[1] += y/d; den += 1/d
        gm = (num[0]/den, num[1]/den)
    labeled = set(rnd.sample(range(len(inl)), 12))
    pts = []
    for i,(x,y) in enumerate(inl):
        if i in labeled:
            pts.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="3.6" class="f-gr" opacity="0.95"/>')
        else:
            pts.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="3.3" fill="none" class="s-cy" stroke-width="1.2" opacity="0.7"/>')
    outs = [f'<circle cx="{x:.1f}" cy="{y:.1f}" r="3.4" class="f-am" opacity="0.9"/>' for x,y in out]
    # faint field rings around the true centre
    rings = '\n'.join(f'<ellipse cx="{ccx}" cy="{ccy}" rx="{r}" ry="{r*0.85:.0f}" fill="none" class="s-cy" stroke-width="0.6" stroke-opacity="0.16" stroke-dasharray="2 6"/>' for r in (60, 110, 160))
    gx, gy = gm; mx, my = mean
    markers = f'''<!-- geometric median: stays with the inliers -->
<circle cx="{gx:.1f}" cy="{gy:.1f}" r="20" fill="url(#nodeGlow)"/>
<path d="M{gx:.1f},{gy-9:.1f} L{gx+9:.1f},{gy:.1f} L{gx:.1f},{gy+9:.1f} L{gx-9:.1f},{gy:.1f} Z" class="node s-gr" stroke-width="2.4"/>
<!-- mean: starts at the median, dragged off as corruption arrives -->
<g>
<animateTransform attributeName="transform" type="translate" values="{gx-mx:.1f} {gy-my:.1f}; 0 0" begin="1.2s" dur="1.6s" fill="freeze" calcMode="spline" keySplines=".3 0 .2 1"/>
<circle cx="{mx:.1f}" cy="{my:.1f}" r="20" fill="url(#amGlow)"/>
<path d="M{mx-7:.1f},{my-7:.1f} L{mx+7:.1f},{my+7:.1f} M{mx+7:.1f},{my-7:.1f} L{mx-7:.1f},{my+7:.1f}" class="s-am" stroke-width="2.6" stroke-linecap="round"/>
</g>'''
    bias = fade(2.9, f'''<line x1="{gx+11:.1f}" y1="{gy-8:.1f}" x2="{mx-9:.1f}" y2="{my+7:.1f}" class="s-am" stroke-width="1.3" stroke-dasharray="4 4" marker-end="url(#arrA)"/>''')
    labels = fade(3.1, f'''<line x1="{gx-12:.1f}" y1="{gy+10:.1f}" x2="452" y2="{gy+92:.1f}" class="s-gr" stroke-width="0.8" stroke-opacity="0.6"/>
<text x="446" y="{gy+106:.1f}" text-anchor="end" font-size="13.5" font-weight="700" class="f-gr">geometric median</text>
<text x="446" y="{gy+122:.1f}" text-anchor="end" font-size="11.5" class="mute">breakdown point 1/2</text>
<line x1="{mx+10:.1f}" y1="{my-6:.1f}" x2="{mx+62:.1f}" y2="{my-44:.1f}" class="s-am" stroke-width="0.8" stroke-opacity="0.6"/>
<text x="{mx+66:.1f}" y="{my-56:.1f}" font-size="13.5" font-weight="700" class="f-am">mean</text>
<text x="{mx+66:.1f}" y="{my-41:.1f}" font-size="11.5" class="mute">one bad point moves it</text>
<text x="785" y="160" text-anchor="middle" font-size="11.5" class="f-am" font-style="italic">adversarial tail</text>''')
    ly = 556
    legend = fade(0.6, f'''<circle cx="430" cy="{ly-4}" r="3.6" class="f-gr"/><text x="440" y="{ly}" font-size="12" class="mute">labeled positive</text>
<circle cx="565" cy="{ly-4}" r="3.3" fill="none" class="s-cy" stroke-width="1.2"/><text x="575" y="{ly}" font-size="12" class="mute">unlabeled, not negative</text>
<circle cx="730" cy="{ly-4}" r="3.4" class="f-am"/><text x="740" y="{ly}" font-size="12" class="mute">corrupted</text>''')
    center = rings + '\n' + fade(0.2, '\n'.join(pts), 0.8) + '\n' + fade(1.0, '\n'.join(outs), 1.2) + '\n' + fade(0.4, markers, 0.5) + '\n' + bias + '\n' + labels + '\n' + legend
    return doc("What survives imperfect supervision",
        "A cluster of inliers, only some of them labeled positive, with an adversarial tail of corrupted points. As the corruption arrives, the mean is dragged toward the tail while the geometric median stays with the inliers. Supervision may be corrupted, incomplete, indirect, or model-generated; robustness here means a high breakdown point, estimating only what is identifiable, never treating unlabeled data as negative, and keeping valid minority evidence.",
        "What survives imperfect supervision.",
        "corrupted · incomplete · indirect · model-generated",
        center,
        ("THE SIGNAL YOU GET", "cy", [("corrupted","a fraction is adversarial"),("incomplete","only some positives are labeled"),("indirect","proxies, not targets"),("model-generated","judges with their own errors")]),
        ("WHAT ROBUST MEANS HERE", "mi", [("breakdown point","how much corruption before it fails"),("identifiability","what the data can still pin down"),("no invented labels","unlabeled is not negative"),("minority evidence","disagreement is not always noise")]),
        "ESTIMATE WHAT IS IDENTIFIABLE · BOUND WHAT IS NOT · NEVER MANUFACTURE LABELS")

# ---------------------------------------------------------------- 04 efficiency
def bez(p0,p1,p2,p3,t):
    u=1-t
    return (u**3*p0[0]+3*u*u*t*p1[0]+3*u*t*t*p2[0]+t**3*p3[0], u**3*p0[1]+3*u*u*t*p1[1]+3*u*t*t*p2[1]+t**3*p3[1])
def y_at(curve, x):
    lo, hi = 0.0, 1.0
    for _ in range(60):
        m=(lo+hi)/2
        if bez(*curve,m)[0] < x: lo=m
        else: hi=m
    return bez(*curve,lo)[1]
def x_at(curve, y):
    lo, hi = 0.0, 1.0
    for _ in range(60):
        m=(lo+hi)/2
        if bez(*curve,m)[1] < y: lo=m
        else: hi=m
    return bez(*curve,lo)[0]
def efficiency():
    X0, X1, Y0, Y1 = 386, 846, 140, 500    # plot box: x budget, y error (down is better)
    post = ((392,160),(470,330),(610,400),(846,428))
    co   = ((392,160),(430,360),(560,448),(846,474))
    P = lambda c: f'M{c[0][0]},{c[0][1]} C{c[1][0]},{c[1][1]} {c[2][0]},{c[2][1]} {c[3][0]},{c[3][1]}'
    axes = f'''<line x1="{X0}" y1="{Y1}" x2="{X1}" y2="{Y1}" class="s-mute" stroke-width="1" opacity="0.6" marker-end="url(#arr)"/>
<line x1="{X0}" y1="{Y1}" x2="{X0}" y2="{Y0-6}" class="s-mute" stroke-width="1" opacity="0.6" marker-end="url(#arr)"/>
<text x="{X1}" y="{Y1+24}" text-anchor="end" font-size="12" class="mute">resource budget: data · bits · memory · compute</text>
<text x="{X0+10}" y="{Y0+2}" font-size="12" class="mute">error</text>'''
    grid = '\n'.join(f'<line x1="{X0}" y1="{y}" x2="{X1-10}" y2="{y}" class="s-mute" stroke-width="0.5" stroke-opacity="0.18" stroke-dasharray="2 6"/>' for y in (200,260,320,380,440))
    gap = f'<path d="{P(post)} L846,474 C560,448 430,360 392,160 Z" class="f-gr" opacity="0.08"/>'
    curves = f'''<path d="{P(post)}" fill="none" class="s-am" stroke-width="2.2" stroke-dasharray="6 5"/>
<path d="{P(co)}" fill="none" stroke="url(#gx)" stroke-width="3"/>
<circle r="5" class="f-mi"><animateMotion path="{P(co)}" dur="6s" begin="1.6s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines=".4 0 .6 1"/></circle>
<text x="{530+12}" y="{y_at(post, 530)-10:.1f}" font-size="12.5" font-weight="700" class="f-am">compress afterward</text>
<text x="852" y="{474+20}" font-size="12.5" font-weight="700" class="f-gr" text-anchor="end">budget inside the objective</text>'''
    bx = 730; ya, yb = y_at(post, bx), y_at(co, bx)
    ey = 396; xa, xb = x_at(post, ey), x_at(co, ey)
    def tag(x, y, n): return f'<circle cx="{x:.1f}" cy="{y:.1f}" r="9" class="node s-gr" stroke-width="1.4"/><text x="{x:.1f}" y="{y+4:.1f}" text-anchor="middle" font-size="11" font-weight="700" class="f-gr">{n}</text>'
    comp = f'''<line x1="{bx}" y1="{Y1}" x2="{bx}" y2="{ya-18:.1f}" class="s-cy" stroke-width="1" stroke-dasharray="3 4" opacity="0.7"/>
<circle cx="{bx}" cy="{ya:.1f}" r="4.5" class="node s-am" stroke-width="2"/><circle cx="{bx}" cy="{yb:.1f}" r="4.5" class="node s-gr" stroke-width="2"/>
<line x1="{bx+14}" y1="{ya+4:.1f}" x2="{bx+14}" y2="{yb-6:.1f}" class="s-gr" stroke-width="1.4" marker-end="url(#arr)"/>
{tag(bx+30, (ya+yb)/2, "1")}
<line x1="{X0}" y1="{ey}" x2="{xa:.1f}" y2="{ey}" class="s-cy" stroke-width="1" stroke-dasharray="3 4" opacity="0.7"/>
<circle cx="{xa:.1f}" cy="{ey}" r="4.5" class="node s-am" stroke-width="2"/><circle cx="{xb:.1f}" cy="{ey}" r="4.5" class="node s-gr" stroke-width="2"/>
<line x1="{xa-6:.1f}" y1="{ey-14}" x2="{xb+6:.1f}" y2="{ey-14}" class="s-gr" stroke-width="1.4" marker-end="url(#arr)"/>
{tag((xa+xb)/2, ey-32, "2")}
{tag(640, 196, "1")}<text x="656" y="200" font-size="12.5" font-weight="650" class="ink">same budget, lower error</text>
{tag(640, 226, "2")}<text x="656" y="230" font-size="12.5" font-weight="650" class="ink">same error, a fraction of the budget</text>'''
    center = grid + '\n' + fade(0.1, axes, 0.5) + '\n' + fade(0.5, gap + '\n' + curves, 0.9) + '\n' + fade(1.6, comp, 0.8)
    return doc("Accuracy per unit of resource",
        "Error against resource budget for two approaches: compressing a model afterward, and building the budget into the learning objective. Building it in gives lower error at the same budget, and the same error at a fraction of the budget. The budgets are data, communication, memory, and compute; the design choices are treating the budget as a constraint, selecting a representative subset, compressing representations, and allocating resources where the marginal gain is highest.",
        "Accuracy per unit of resource.",
        "data · communication · memory · compute, budgeted inside the learning problem",
        center,
        ("THE BUDGETS", "cy", [("data","which samples to keep"),("communication","bits per round"),("memory","parameters on device"),("compute","tokens, rollouts, judge calls")]),
        ("THE DESIGN CHOICES", "mi", [("in the objective","a constraint, not an afterthought"),("selection","a k-subset that tracks the full data"),("compression","low-rank, quantized, sparsified"),("allocation","spend where marginal gain is highest")]),
        "THE BUDGET IS PART OF THE LEARNING PROBLEM · NOT POST-PROCESSING")

# ---------------------------------------------------------------- 05 control
def spiral(cx, cy, r0, r1, turns, n=220, sx=1.0, sy=0.62, tilt=0.0):
    pts=[]
    for i in range(n+1):
        t=i/n; th=turns*2*math.pi*t
        r=r0*(r1/r0)**t
        x=r*math.cos(th)*sx; y=r*math.sin(th)*sy
        xr=x*math.cos(tilt)-y*math.sin(tilt); yr=x*math.sin(tilt)+y*math.cos(tilt)
        pts.append((cx+xr, cy+yr))
    return 'M' + ' L'.join(f'{x:.1f},{y:.1f}' for x,y in pts)
def control():
    # block diagram
    J = (404, 180)
    L = (452, 152, 150, 56)      # x, y, w, h
    E = (660, 152, 170, 56)
    V = (560, 244, 150, 50)
    def box(b, title, sub, col, t):
        x,y,w,h = b
        return fade(t, f'''<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="12" class="node s-{col}" stroke-width="2"><animate attributeName="stroke-opacity" values="0.6;1;0.6" dur="3.4s" repeatCount="indefinite"/></rect>
<text x="{x+w/2}" y="{y+h/2-2}" text-anchor="middle" font-size="13.5" font-weight="700" class="f-{col}" letter-spacing="0.4">{title}</text>
<text x="{x+w/2}" y="{y+h/2+15}" text-anchor="middle" font-size="11.5" class="mute">{sub}</text>''', 0.5)
    ex = E[0]+E[2]; vy = V[1]+V[3]/2
    loop = f'M{J[0]+12},{J[1]} L{L[0]},{J[1]} M{L[0]+L[2]},{J[1]} L{E[0]},{J[1]} M{ex},{J[1]} L{ex+24},{J[1]} L{ex+24},{vy} L{V[0]+V[2]},{vy} M{V[0]},{vy} L{J[0]},{vy} L{J[0]},{J[1]+12}'
    full = f'M{J[0]+12},{J[1]} L{ex+24},{J[1]} L{ex+24},{vy} L{J[0]},{vy} L{J[0]},{J[1]+12}'
    wires = f'''<line x1="346" y1="{J[1]}" x2="{J[0]-14}" y2="{J[1]}" class="s-cy" stroke-width="1.6" marker-end="url(#arr)"/>
<text x="350" y="{J[1]-12}" font-size="11.5" class="mute">objective</text>
<circle cx="{J[0]}" cy="{J[1]}" r="12" class="node s-cy" stroke-width="1.8"/>
<path d="M{J[0]-5},{J[1]} h10 M{J[0]},{J[1]-5} v10" class="s-cy" stroke-width="1.4"/>
<text x="{J[0]-14}" y="{J[1]+26}" font-size="13" class="f-cy">−</text>
<line x1="{J[0]+12}" y1="{J[1]}" x2="{L[0]-2}" y2="{J[1]}" class="s-cy" stroke-width="1.6" marker-end="url(#arr)"/>
<line x1="{L[0]+L[2]}" y1="{J[1]}" x2="{E[0]-2}" y2="{J[1]}" class="s-cy" stroke-width="1.6" marker-end="url(#arr)"/>
<text x="{(L[0]+L[2]+E[0])/2}" y="{J[1]-12}" text-anchor="middle" font-size="11.5" class="mute">policy</text>
<path d="M{ex},{J[1]} H{ex+24} V{vy} H{V[0]+V[2]+2}" fill="none" class="s-cy" stroke-width="1.6" marker-end="url(#arr)"/>
<text x="{ex+16}" y="{E[1]+E[3]+22}" text-anchor="end" font-size="11.5" class="mute">outcomes</text>
<path d="M{V[0]},{vy} H{J[0]} V{J[1]+14}" fill="none" class="s-cy" stroke-width="1.6" marker-end="url(#arr)"/>
<text x="{(V[0]+J[0])/2+8}" y="{vy-8}" text-anchor="middle" font-size="11.5" class="mute">feedback</text>
<circle r="4.2" class="f-mi"><animateMotion path="{full}" dur="5s" begin="1.4s" repeatCount="indefinite"/></circle>'''
    bd = fade(0.4, wires, 0.6) + '\n' + box(L, "LEARNER", "update θ → θ′", "gr", 0.1) + '\n' + box(E, "ENVIRONMENT", "data it will see next", "gr", 0.2) + '\n' + box(V, "EVALUATOR", "observed feedback", "cy", 0.3)
    # phase portraits
    s_ok = spiral(500, 448, 78, 4, 3.2, sy=0.66, tilt=-0.15)
    s_bad = spiral(712, 448, 6, 80, 3.0, sy=0.66, tilt=-0.15)
    ph = f'''<line x1="380" y1="330" x2="840" y2="330" class="s-mute" stroke-width="0.6" stroke-opacity="0.35" stroke-dasharray="2 5"/>
<text x="610" y="352" text-anchor="middle" font-size="11" class="mute" letter-spacing="1">REPEATED ADAPTATION, IN PARAMETER SPACE</text>
<path d="{s_ok}" fill="none" stroke="url(#gx)" stroke-width="1.8" stroke-linecap="round"/>
<circle cx="500" cy="448" r="4.5" class="f-gr"/><circle cx="500" cy="448" r="14" fill="url(#nodeGlow)"/>
<circle r="4" class="f-mi"><animateMotion path="{s_ok}" dur="5s" begin="1.8s" repeatCount="indefinite"/></circle>
<path d="{s_bad}" fill="none" class="s-am" stroke-width="1.8" stroke-dasharray="5 4" stroke-linecap="round"/>
<circle cx="712" cy="448" r="4.5" class="node s-am" stroke-width="1.6"/>
<circle r="4" class="f-am"><animateMotion path="{s_bad}" dur="5s" begin="1.8s" repeatCount="indefinite"/></circle>
<text x="500" y="548" text-anchor="middle" font-size="12.5" font-weight="700" class="f-gr">stable: settles</text>
<text x="712" y="548" text-anchor="middle" font-size="12.5" font-weight="700" class="f-am">unstable: oscillates, drifts</text>'''
    center = bd + '\n' + fade(1.0, ph, 0.8)
    return doc("Learning is a closed loop",
        "A feedback block diagram: an objective enters a summing junction, the learner updates its parameters, its policy acts on the environment, which determines the data it sees next, and an evaluator turns outcomes into feedback that returns to the junction. Below, two trajectories of repeated adaptation in parameter space: a stable spiral that settles, and an unstable one that oscillates and drifts. The loop changes its own data, evaluator, environment, and target; the guarantees wanted are stability, identification, convergence, and a robustness margin.",
        "Learning is a closed loop.",
        "every update changes the data, the evaluator, and the next update",
        center,
        ("WHAT THE LOOP CHANGES", "cy", [("its own data","updates shift what it sees next"),("its evaluator","feedback depends on the policy"),("the environment","interventions alter the system"),("the target","proxies move as it adapts")]),
        ("WHAT TO GUARANTEE", "mi", [("stability","bounded response to bounded noise"),("identification","learn the system despite feedback"),("convergence","local gains add up globally"),("robustness margin","error tolerated before it oscillates")]),
        "EVERY UPDATE IS A CONTROL INPUT · STABILITY IS A PROPERTY OF THE LOOP")

for name, fn in [("distributed", distributed), ("robust", robust), ("efficiency", efficiency), ("control", control)]:
    open(f"{OUT}/thread-{name}.svg", "w").write(fn())
print("ok")
