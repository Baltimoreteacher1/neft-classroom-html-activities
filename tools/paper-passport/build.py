"""Build the paper Language Passport PDFs that the My Passport page links to.

Writes access-practice-lab/paper-passport/*.pdf (committed; regenerate after editing this file or
family-guide.html). Needs Google Chrome for the HTML -> PDF step (set CHROME to override the path).

    python3 tools/paper-passport/build.py
"""
import math, os, pathlib, re, shutil, subprocess, tempfile

HERE = pathlib.Path(__file__).parent
DEST = HERE.parents[1] / "access-practice-lab" / "paper-passport"
OUT = pathlib.Path(tempfile.mkdtemp(prefix="paper-passport-"))
CHROME = os.environ.get("CHROME", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
NAVY = "#1f3a6b"

def star(cx=50, cy=52, R=48, r=28, n=5):
    pts = []
    for i in range(n * 2):
        a = -math.pi / 2 + i * math.pi / n
        rad = R if i % 2 == 0 else r
        pts.append(f"{cx + rad * math.cos(a):.1f},{cy + rad * math.sin(a):.1f}")
    return " ".join(pts)

def shape(kind, **a):
    at = " ".join(f'{k.replace("_", "-")}="{v}"' for k, v in a.items())
    if kind == "circle":
        return f'<circle cx="50" cy="50" r="46" {at}/>'
    if kind == "square":
        return f'<rect x="6" y="6" width="88" height="88" rx="18" {at}/>'
    if kind == "hex":
        return f'<polygon points="50,4 92,27 92,73 50,96 8,73 8,27" {at}/>'
    if kind == "octagon":
        return f'<polygon points="30,4 70,4 96,30 96,70 70,96 30,96 4,70 4,30" {at}/>'
    return f'<polygon points="{star()}" {at}/>'

# domain: (english, spanish, shape, color, tint, icon svg in a 40x34 box, teacher prompt en/es)
ICONS = {
    "Listening": '<path d="M6 24V18A14 14 0 0 1 34 18V24" fill="none" stroke-width="3"/><rect x="2" y="22" width="9" height="12" rx="3" stroke="none"/><rect x="29" y="22" width="9" height="12" rx="3" stroke="none"/>',
    "Speaking": '<path d="M8 4H32a5 5 0 0 1 5 5V19a5 5 0 0 1-5 5H20L11 32V24H8a5 5 0 0 1-5-5V9a5 5 0 0 1 5-5Z" fill="none" stroke-width="3" stroke-linejoin="round"/>',
    "Reading": '<path d="M20 8C14 4 7 4 2 6V28C7 26 14 26 20 30C26 26 33 26 38 28V6C33 4 26 4 20 8ZM20 8V30" fill="none" stroke-width="3" stroke-linejoin="round"/>',
    "Writing": '<path d="M5 30L8 21L28 3L35 10L15 28ZM24 7L31 14" fill="none" stroke-width="2.5" stroke-linejoin="round"/>',
}
DOMAINS = [
    ("Listening", "Escuchar", "circle", "#2b6cb0", "#e6f0fb",
     "Tell me one thing you heard.", "Cuéntame una cosa que escuchaste."),
    ("Speaking", "Hablar", "square", "#c05621", "#fdeedd",
     "Say your best sentence out loud.", "Di en voz alta tu mejor oración."),
    ("Reading", "Leer", "hex", "#2f855a", "#e5f5ec",
     "Show me where you found your answer.", "Muéstrame dónde encontraste tu respuesta."),
    ("Writing", "Escribir", "octagon", "#6b46c1", "#efe9fb",
     "Read me one sentence you wrote.", "Léeme una oración que escribiste."),
]
FAMILY = ("Family", "Familia", "star", "#b7791f", "#fdf3d6")

def read_countries():
    """COUNTRIES from access-practice-lab/src/journey.js: {skill: {level: (en, es)}}."""
    src = (HERE.parents[1] / "access-practice-lab" / "src" / "journey.js").read_text(encoding="utf-8")
    out = {}
    for skill, body in re.findall(r"(\w+): \{ (A: .*?) \},?\n", src):
        out[skill] = {lv: (en, es) for lv, en, es in re.findall(r'(\w): \["([^"]+)", "([^"]+)"\]', body)}
    assert sorted(out) == ["Listening", "Reading", "Speaking", "Writing"] and all(len(v) == 3 for v in out.values()), out
    return out

COUNTRIES = read_countries()

def icon_svg(name, color, x=30, y=14, scale=1.0):
    return f'<g transform="translate({x} {y}) scale({scale})" stroke="{color}" fill="{color}" stroke-linecap="round">{ICONS[name]}</g>'

def spot(kind, color, n):
    return (f'<svg viewBox="0 0 100 100" class="spot">'
            f'{shape(kind, fill="#fff", stroke=color, stroke_width=2.5, stroke_dasharray="5 4")}'
            f'<text x="50" y="62" text-anchor="middle" font-size="32" font-weight="700" fill="#cfd5df">{n}</text></svg>')

def sticker(d):
    en, es, kind, color, tint = d[0], d[1], d[2], d[3], d[4]
    if en == "Family":
        body = (f'<text x="50" y="55" text-anchor="middle" font-size="12" font-weight="800" fill="{color}">FAMILY</text>'
                f'<text x="50" y="67" text-anchor="middle" font-size="8" font-weight="700" fill="{color}">FAMILIA</text>')
    else:
        body = (icon_svg(en, color) +
                f'<text x="50" y="74" text-anchor="middle" font-size="10" font-weight="800" fill="{color}">{en.upper()}</text>'
                f'<text x="50" y="85" text-anchor="middle" font-size="8" font-weight="700" fill="{color}">{es.upper()}</text>')
    return (f'<svg viewBox="0 0 100 100" class="stk">{shape(kind, fill=tint, stroke=color, stroke_width=3)}{body}</svg>')

def head(en, es, kind=None, color=NAVY, name=None):
    ico = ""
    if name:
        ico = (f'<svg viewBox="0 0 100 100" class="hico">{shape(kind, fill="none", stroke=color, stroke_width=4)}'
               f'{icon_svg(name, color, y=33)}</svg>')
    return f'<div class="phead">{ico}<div><h2 style="color:{color}">{en}</h2><p class="es">{es}</p></div></div>'

# ---------- the eight booklet pages (panels) ----------
def p_cover():
    ring = "".join(f'<svg viewBox="0 0 100 100" class="cov-stamp">{shape(d[2], fill="none", stroke=d[3], stroke_width=3.5, stroke_dasharray="6 4")}{icon_svg(d[0], d[3], y=33)}</svg>' for d in DOMAINS)
    return f'''<div class="panel cover">
  <p class="kicker">ACCESS Practice Lab</p>
  <h1>Language Passport</h1><p class="es big">Pasaporte de Idiomas</p>
  <div class="ring">{ring}</div>
  <div class="portrait"><span>Draw yourself<br><em>Dibújate</em></span></div>
  <div class="field"><span>Name / Nombre</span><i></i></div>
  <div class="field"><span>Class / Clase</span><i></i></div>
  <div class="field"><span>School year / Año escolar</span><i></i></div>
</div>'''

def p_welcome():
    return f'''<div class="panel">
  <div class="phead"><div><h2>Welcome, traveler!</h2><p class="es">¡Bienvenidos, viajeros!</p></div></div>
  <ol class="steps">
    <li><b>Practice online.</b> Open <span class="site">eduwonderlab.com/access-practice-lab</span> and finish activities.<em>Practica en línea y termina actividades.</em></li>
    <li><b>Show your teacher.</b> Tell your teacher about your work. Your teacher marks a stop in a country.<em>Cuéntale a tu maestro o maestra sobre tu trabajo. Tu maestro marca una parada en un país.</em></li>
    <li><b>Family trip.</b> Once a week, practice 10 minutes with a grown-up. They check the box in the Trip Log. You add a star.<em>Una vez por semana, practica 10 minutos con un adulto. Marca el cuadro del Registro del viaje y pega una estrella.</em></li>
  </ol>
  <div class="tipbox"><b>A stop means:</b> I finished my practice. It is not a grade.<em>Una parada significa: terminé mi práctica. No es una calificación.</em></div>
  <div class="goal"><b>My goal this week / Mi meta de esta semana</b><p>I will practice <i></i> times. / Voy a practicar <i></i> veces.</p><p>I want to get better at / Quiero mejorar en: <i class="w"></i></p></div>
  <div class="spotline"><span>My teacher’s stamp goes here / Aquí va el sello de mi maestro</span>{spot("circle", NAVY, "")}</div>
</div>'''

def p_domain(d):
    en, es, kind, color, tint, pen, pes = d
    rows = ""
    for level in "ABC":
        cen, ces = COUNTRIES[en][level]
        boxes = "".join(f'<span class="stop">{n}</span>' for n in range(1, 13))
        rows += (f'<div class="route"><div class="rname"><b>{cen}</b> <span class="es">/ {ces}</span></div>'
                 f'<div class="rbody"><div class="stops">{boxes}</div>'
                 f'<div class="rsticker">{spot("circle", color, "")}<span>Country sticker<br><em>Calcomanía del país</em></span></div></div></div>')
    return f'''<div class="panel">
  {head(en, es, kind, color, en)}
  <div class="prompt" style="border-color:{color};background:{tint}"><b>Show your teacher:</b> {pen}<em>Muéstrale a tu maestro o maestra: {pes}</em></div>
  <p class="how">Your teacher marks a stop when you show finished work. Finish all 12 stops for a country sticker. / Tu maestro marca una parada cuando muestras trabajo terminado. Termina las 12 paradas para ganar la calcomanía del país.</p>
  {rows}
</div>'''

def p_family():
    fam = FAMILY
    def trip(letter):
        cells = "".join(
            f'<div class="wk"><div class="wkt"><b>Stop {n}</b><span class="box"></span></div>{spot("star", fam[3], "")}</div>'
            for n in range(1, 7))
        return (f'<div class="trip"><div class="tripname"><b>Trip {letter}</b> / Viaje {letter}: <i></i>'
                f'<span class="tstamp">Trip stamp {spot("circle", fam[3], "")}</span></div><div class="grid3 wks">{cells}</div></div>')
    return f'''<div class="panel">
  {head("Family Trip Log", "Registro del viaje en familia")}
  <p class="how big">A trip is 6 stops, one 10-minute practice with a grown-up each week. After each stop the grown-up checks the box and you add a star. Write the trip’s name on the line.<br>
  <em>Un viaje tiene 6 paradas, una práctica de 10 minutos por semana con un adulto. Después de cada parada, el adulto marca el cuadro y tú pegas una estrella. Escribe el nombre del viaje en la línea.</em></p>
  {trip("A")}{trip("B")}
</div>'''

MILESTONES = [
    ("First stamp", "Primer sello", "Get your first stop marked.", "Consigue tu primera parada marcada."),
    ("All four skills", "Las cuatro destrezas", "Get a stop marked in every skill.", "Una parada marcada en cada destreza."),
    ("Ten stamps", "Diez sellos", "Get 10 stops marked.", "Consigue 10 paradas marcadas."),
    ("Language Navigator", "Navegante del Lenguaje", "Get 15 stops marked.", "Consigue 15 paradas marcadas."),
    ("Three-week streak", "Tres semanas seguidas", "3 Family stops in a row.", "3 paradas en familia seguidas."),
    ("Thirty stamps", "Treinta sellos", "Get 30 stops marked.", "Consigue 30 paradas marcadas."),
]
def p_milestones():
    rows = "".join(
        f'<li>{spot("circle", NAVY, "")}<div><b>{a}</b> <span class="es">/ {b}</span><br>{c}<em>{d}</em></div><div class="init">Teacher<i></i></div></li>'
        for a, b, c, d in MILESTONES)
    return f'''<div class="panel">
  {head("Milestones", "Metas del viaje")}
  <p class="how">Put a bought country sticker in the circle for each milestone. / Pega una calcomanía de país comprada en el círculo de cada meta.</p>
  <ol class="mile">{rows}</ol>
  <p class="fine">Stamps show finished practice, not a score.<br>Los sellos muestran práctica terminada, no un puntaje.</p>
</div>'''

PAGES = [p_cover(), p_welcome(), *[p_domain(d) for d in DOMAINS], p_family(), p_milestones()]

CSS = f'''
* {{ box-sizing: border-box; }}
body {{ margin: 0; font: 9.5pt/1.35 "Helvetica Neue", Arial, sans-serif; color: #1c2536; }}
.panel {{ width: 5.5in; height: 8.5in; padding: .4in .42in; position: relative; overflow: hidden; }}
.panel::before {{ content: ""; position: absolute; inset: .2in; border: 2px solid {NAVY}; border-radius: 12px; pointer-events: none; }}
.panel > * {{ position: relative; }}
h1 {{ font: 700 31pt/1.05 Georgia, serif; color: {NAVY}; margin: 4px 0 0; text-align: center; }}
h2 {{ font: 700 19pt/1.1 Georgia, serif; margin: 0; color: {NAVY}; }}
.es {{ color: #4a5568; font-style: italic; margin: 1px 0 0; }}
.es.big {{ font-size: 14pt; text-align: center; margin-top: 2px; }}
em {{ display: block; color: #4a5568; font-size: 8.5pt; }}
.kicker {{ text-align: center; text-transform: uppercase; letter-spacing: .12em; font-weight: 700; font-size: 9pt; color: {NAVY}; margin: 8px 0 0; }}
.phead {{ display: flex; gap: 12px; align-items: center; margin: 6px 0 10px; }}
.hico {{ width: .85in; height: .85in; flex: none; }}
.site {{ font-weight: 700; color: {NAVY}; }}
.cover .ring {{ display: flex; justify-content: center; gap: 8px; margin: 22px 0; }}
.cov-stamp {{ width: .95in; height: .95in; }}
.portrait {{ width: 2.4in; height: 2.4in; margin: 0 auto 22px; border: 2.5px dashed {NAVY}; border-radius: 12px; display: flex; align-items: center; justify-content: center; text-align: center; color: #7a869a; }}
.field {{ margin: 18px 0; }}
.field span {{ font-weight: 700; font-size: 9pt; color: {NAVY}; }}
.field i {{ display: block; border-bottom: 1.5px solid #1c2536; height: 20px; }}
.steps {{ list-style: none; counter-reset: s; padding: 0; margin: 0 0 10px; }}
.steps li {{ counter-increment: s; position: relative; padding: 0 0 12px 38px; }}
.steps li::before {{ content: counter(s); position: absolute; left: 0; top: 0; width: 26px; height: 26px; border: 2px solid {NAVY}; border-radius: 50%; text-align: center; line-height: 22px; font-weight: 700; color: {NAVY}; }}
.tipbox {{ border: 2px solid {NAVY}; background: #f2f6fd; border-radius: 8px; padding: 9px 12px; margin: 4px 0 14px; }}
.goal {{ border: 2px dashed {NAVY}; border-radius: 8px; padding: 10px 12px; margin: 0 0 16px; color: {NAVY}; }}
.goal p {{ margin: 10px 0 0; color: #1c2536; }}
.goal i {{ display: inline-block; width: .6in; border-bottom: 1.5px solid #1c2536; height: 14px; vertical-align: baseline; }}
.goal i.w {{ width: 1.5in; }}
.spotline {{ display: flex; align-items: center; gap: 14px; font-weight: 700; color: {NAVY}; font-size: 9pt; }}
.spotline svg {{ width: 1.15in; flex: none; }}
.prompt {{ border: 2px solid; border-radius: 8px; padding: 8px 12px; margin-bottom: 7px; }}
.how {{ margin: 0 0 8px; color: #4a5568; font-size: 8.5pt; }}
.how.big {{ font-size: 9.5pt; }}
.grid3 {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px 6px; justify-items: center; }}
.spot {{ width: 1.2in; height: 1.2in; }}
.wks .spot {{ width: .85in; height: .85in; }}
.wk {{ text-align: center; }}
.wkt {{ display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 1px; }}
.box {{ width: .27in; height: .27in; border: 2px solid {NAVY}; border-radius: 4px; display: inline-block; }}
.route {{ margin: 0 0 10px; padding-bottom: 8px; border-bottom: 1px solid #d8dee9; }}
.route:last-child {{ border-bottom: 0; }}
.rname {{ font-size: 11pt; margin-bottom: 4px; }}
.rbody {{ display: flex; align-items: center; gap: 10px; }}
.stops {{ display: grid; grid-template-columns: repeat(6, .5in); gap: 5px; }}
.stop {{ width: .5in; height: .5in; border: 2px solid {NAVY}; border-radius: 6px; font-size: 8pt; color: #b8c0cd; padding: 1px 3px; }}
.rsticker {{ display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 6.5pt; color: {NAVY}; font-weight: 700; line-height: 1.15; text-align: center; }}
.rsticker svg {{ width: .8in; height: .8in; flex: none; }}
.trip {{ margin: 8px 0 0; }}
.tripname {{ display: flex; align-items: center; gap: 6px; font-size: 10pt; margin-bottom: 3px; color: {NAVY}; }}
.tripname i {{ flex: 1; border-bottom: 1.5px solid #1c2536; height: 16px; }}
.tstamp {{ display: flex; align-items: center; gap: 4px; font-size: 8pt; }}
.tstamp svg {{ width: .5in; height: .5in; }}
.mile {{ list-style: none; padding: 0; margin: 4px 0 0; }}
.mile li {{ display: flex; align-items: center; gap: 12px; padding: 7px 0; border-bottom: 1px solid #d8dee9; }}
.mile .spot {{ width: .82in; height: .82in; flex: none; }}
.mile li > div:nth-child(2) {{ flex: 1; }}
.init {{ font-size: 7.5pt; color: #4a5568; width: .85in; }}
.init i {{ display: block; border-bottom: 1.2px solid #1c2536; height: 16px; }}
.fine {{ position: absolute !important; left: .42in; right: .42in; bottom: .38in; font-size: 8pt; color: #4a5568; text-align: center; margin: 0; }}
'''

def doc(body, page_css, extra=""):
    return f'<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Language Passport</title><style>@page {{ {page_css}; margin: 0; }}{CSS}{extra}</style></head><body>{body}</body></html>'

# reading order: one panel per half-letter page
(OUT / "booklet-reading.html").write_text(doc("".join(f'<div style="page-break-after:always">{p}</div>' for p in PAGES), "size: 5.5in 8.5in"), encoding="utf-8")

# print order: 2 landscape sheets, 4 sides, flip on short edge
ORDER = [(8, 1), (2, 7), (6, 3), (4, 5)]
sides = "".join(f'<div class="side" style="display:flex;width:11in;height:8.5in;page-break-after:always">{PAGES[a-1]}{PAGES[b-1]}</div>' for a, b in ORDER)
(OUT / "booklet-print.html").write_text(doc(sides, "size: 11in 8.5in"), encoding="utf-8")

# sticker sheet: 6 x 8 = 48 pieces
cells = [sticker(d) for d in DOMAINS for _ in range(10)] + [sticker(FAMILY) for _ in range(8)]
grid = "".join(f'<div class="cell">{c}</div>' for c in cells)
sheet_css = f'''
body {{ padding: .4in .35in .3in; }}
h3 {{ font: 700 11pt Georgia, serif; color: {NAVY}; margin: 0 0 6px; }}
.sg {{ display: grid; grid-template-columns: repeat(6, 1.2in); grid-auto-rows: 1.2in; justify-content: center; }}
.cell {{ border: 1px dashed #b9c2d0; display: flex; align-items: center; justify-content: center; }}
.stk {{ width: 1.08in; height: 1.08in; }}
.note {{ font-size: 8pt; color: #4a5568; margin-top: 6px; text-align: center; }}
'''
(OUT / "stickers.html").write_text(doc(f'<h3>Language Passport stickers · Calcomanías del Pasaporte de Idiomas</h3><div class="sg">{grid}</div><p class="note">Print on sticker paper or plain paper, then cut along the dashed lines. · Imprima en papel adhesivo o papel normal y corte por las líneas punteadas.</p>', "size: Letter", sheet_css), encoding="utf-8")
LEVEL_NAMES = {"A": ("Starting", "Comenzando"), "B": ("Growing", "Creciendo"), "C": ("Expanding", "Ampliando")}
SKILL_ES = {"Listening": "Escuchar", "Speaking": "Hablar", "Reading": "Leer", "Writing": "Escribir"}
key_rows = "".join(
    f"<tr><td><b>{COUNTRIES[sk][lv][0]}</b> / {COUNTRIES[sk][lv][1]}</td><td>{sk} / {SKILL_ES[sk]}</td><td>{lv} · {LEVEL_NAMES[lv][0]} / {LEVEL_NAMES[lv][1]}</td></tr>"
    for sk in ("Listening", "Speaking", "Reading", "Writing") for lv in "ABC")
(OUT / "teacher-key.html").write_text(f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Language Passport – Teacher key</title><style>
@page {{ size: Letter; margin: .6in; }} body {{ font: 11pt/1.4 "Helvetica Neue", Arial, sans-serif; color: #1c2536; }}
h1 {{ font: 700 20pt Georgia, serif; color: {NAVY}; margin: 0 0 4px; }} p {{ margin: 6px 0; }}
table {{ border-collapse: collapse; width: 100%; margin: 14px 0; }} th, td {{ border: 1.5px solid {NAVY}; padding: 7px 10px; text-align: left; }}
th {{ background: #f2f6fd; color: {NAVY}; }} .fine {{ color: #4a5568; font-size: 9.5pt; }}
</style></head><body><h1>Language Passport · Teacher key</h1><p class="fine">Llave para el docente</p>
<p>The paper passport shows country names, not level letters, so families never see tiers. Each country is one skill at one level in the ACCESS Practice Lab; use this table to match them.</p>
<table><tr><th>Country / País</th><th>Skill / Destreza</th><th>Level in the lab / Nivel en el laboratorio</th></tr>{key_rows}</table>
<p><b>Stops.</b> Every country has 12 stops. Grades 3–5: one activity per stop. Grades 6–8: two or three activities per stop (24–28 activities per level). Mark a stop when the student shows finished work for all of its activities. The digital My Passport shows the same countries and stops.</p>
<p><b>Paradas.</b> Cada país tiene 12 paradas. Grados 3–5: una actividad por parada. Grados 6–8: dos o tres actividades por parada. Marque una parada cuando el estudiante muestre el trabajo terminado de todas sus actividades.</p>
<p class="fine">Stops show finished practice. They are not a score or a language level. / Las paradas muestran práctica terminada. No son un puntaje ni un nivel de lenguaje.</p></body></html>''', encoding="utf-8")

shutil.copy(HERE / "family-guide.html", OUT / "family-guide.html")

JOBS = {
    "booklet-print": "language-passport-booklet-print",
    "booklet-reading": "language-passport-booklet-pages",
    "stickers": "language-passport-stickers",
    "family-guide": "language-passport-family-guide",
    "teacher-key": "language-passport-teacher-key",
}
DEST.mkdir(parents=True, exist_ok=True)
for src, name in JOBS.items():
    profile = OUT / f"profile-{src}"
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
                    f"--user-data-dir={profile}", f"--print-to-pdf={DEST / (name + '.pdf')}",
                    (OUT / f"{src}.html").as_uri()], check=True, capture_output=True)
shutil.rmtree(OUT, ignore_errors=True)
print("wrote", len(JOBS), "PDFs to", DEST)
