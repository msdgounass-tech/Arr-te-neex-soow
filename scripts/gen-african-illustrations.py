"""Illustrations dorées « tenues africaines » (grand boubou, kaftan brodé, robe wax) et visuel Wouro Maama.
Usage : python3 scripts/gen-african-illustrations.py"""
import os

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "images", "produits")
TONES = [("#55402e", "#24180f"), ("#4a3a30", "#1f1712"), ("#5a3c2c", "#26170f")]
G = 'stroke="url(#g)" fill="none" stroke-linecap="round" stroke-linejoin="round"'

DEFS = '''<defs>
  <radialGradient id="bg" cx="50%" cy="42%" r="75%"><stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></radialGradient>
  <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9C7C3F"/><stop offset=".45" stop-color="#F1DFB4"/><stop offset=".7" stop-color="#C6A15B"/><stop offset="1" stop-color="#8A6A32"/></linearGradient>
  <pattern id="wax" width="44" height="44" patternUnits="userSpaceOnUse">
    <circle cx="22" cy="22" r="9" fill="none" stroke="#C6A15B" stroke-opacity=".55" stroke-width="1.6"/>
    <circle cx="22" cy="22" r="3" fill="#C6A15B" fill-opacity=".55"/>
    <path d="M0 0 L8 0 L0 8 Z M44 44 L36 44 L44 36 Z M44 0 L44 8 L36 0 Z M0 44 L0 36 L8 44 Z" fill="#C6A15B" fill-opacity=".45"/>
  </pattern>
  <pattern id="waxbg" width="60" height="60" patternUnits="userSpaceOnUse">
    <path d="M30 6 L54 30 L30 54 L6 30 Z" fill="none" stroke="#C6A15B" stroke-opacity=".10" stroke-width="1.2"/>
    <circle cx="30" cy="30" r="4" fill="#C6A15B" fill-opacity=".08"/>
  </pattern>
</defs>'''

# Grand boubou : ample, manches en ailes, plastron brodé
BOUBOU = f'''
<path {G} stroke-width="5" d="M300 190 Q270 190 255 205 L120 300 Q95 318 110 345 L165 470 L205 455 L215 610 Q300 630 385 610 L395 455 L435 470 L490 345 Q505 318 480 300 L345 205 Q330 190 300 190 Z"/>
<path {G} stroke-width="4" d="M262 204 Q300 262 338 204"/>
<path {G} stroke-width="3" d="M268 214 Q300 300 300 420 Q300 300 332 214"/>
<path {G} stroke-width="2.5" d="M258 232 Q300 360 342 232 M250 252 Q300 410 350 252"/>
<g fill="url(#g)"><circle cx="300" cy="330" r="5"/><circle cx="286" cy="300" r="3.5"/><circle cx="314" cy="300" r="3.5"/><circle cx="300" cy="380" r="3.5"/><circle cx="276" cy="270" r="3"/><circle cx="324" cy="270" r="3"/></g>
<path {G} stroke-width="2.5" d="M150 330 Q170 360 165 400 M450 330 Q430 360 435 400"/>
<path {G} stroke-width="3" d="M215 590 Q300 606 385 590"/>
'''

# Kaftan brodé : long, manches évasées, encolure et bordure brodées
KAFTAN = f'''
<path {G} stroke-width="5" d="M300 185 Q276 185 262 198 L165 280 Q140 300 156 326 L215 420 L240 405 L222 620 Q300 640 378 620 L360 405 L385 420 L444 326 Q460 300 435 280 L338 198 Q324 185 300 185 Z"/>
<path {G} stroke-width="4" d="M270 196 Q300 250 330 196"/>
<path {G} stroke-width="3" d="M300 248 L300 520"/>
<g fill="url(#g)">{''.join(f'<circle cx="300" cy="{y}" r="3.5"/>' for y in range(270, 520, 26))}</g>
<path {G} stroke-width="2.5" d="M284 262 Q260 330 270 420 M316 262 Q340 330 330 420"/>
<path {G} stroke-width="3" d="M226 598 Q300 616 374 598 M229 576 Q300 594 371 576"/>
<path {G} stroke-width="2.5" d="M170 300 L222 392 M430 300 L378 392"/>
'''

# Robe wax : buste ajusté, jupe évasée remplie de motifs wax
WAX = f'''
<path fill="url(#wax)" d="M248 330 Q215 470 165 610 Q300 640 435 610 Q385 470 352 330 Z"/>
<path {G} stroke-width="5" d="M262 182 L276 250 Q300 268 324 250 L338 182"/>
<path {G} stroke-width="5" d="M262 182 Q238 225 248 300 L248 330 Q300 348 352 330 L352 300 Q362 225 338 182"/>
<path {G} stroke-width="5" d="M248 330 Q215 470 165 610 Q300 640 435 610 Q385 470 352 330"/>
<path {G} stroke-width="4" d="M244 336 Q300 356 356 336"/>
<path {G} stroke-width="3" d="M250 345 Q232 352 226 372 M350 345 Q368 352 374 372"/>
'''

def card(body, c1, c2):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="600" height="800">
{DEFS.format(c1=c1, c2=c2)}
<rect width="600" height="800" fill="url(#bg)"/>
<rect width="600" height="800" fill="url(#waxbg)"/>
<rect x="24" y="24" width="552" height="752" fill="none" stroke="#C6A15B" stroke-opacity=".28" stroke-width="1.5"/>
<g transform="translate(300 410) scale(1.08) translate(-300 -410)">{body}</g>
<text x="300" y="720" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="22" letter-spacing="9" fill="#C6A15B" fill-opacity=".75">GOUNASS LUXURY</text>
</svg>'''

for name, body in (("boubou", BOUBOU), ("kaftan", KAFTAN), ("wax", WAX)):
    for i, (c1, c2) in enumerate(TONES, 1):
        open(os.path.join(OUT, f"{name}-{i}.svg"), "w").write(card(body, c1, c2))

# Visuel « Wouro Maama » (collection vedette) : boubou + robe wax sur fond de motifs
banner = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900">
{DEFS.format(c1="#5a4130", c2="#1f140e")}
<rect width="1600" height="900" fill="url(#bg)"/>
<rect width="1600" height="900" fill="url(#waxbg)"/>
<g transform="translate(240 20) scale(0.95)">{BOUBOU}</g>
<g transform="translate(790 20) scale(0.95)">{WAX}</g>
<path d="M60 840 L1540 840" stroke="#C6A15B" stroke-opacity=".35" stroke-width="1.5"/>
</svg>'''
open(os.path.join(os.path.dirname(__file__), "..", "public", "images", "collection-wouro-maama.svg"), "w").write(banner)
print("ok")
