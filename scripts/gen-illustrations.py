"""Génère les illustrations dorées (SVG) utilisées par les produits exemples.
Usage : python3 scripts/gen-illustrations.py"""
import os

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "images", "produits")
TONES = [("#3a3226", "#121110"), ("#262c33", "#0f1113"), ("#3a2626", "#130f0f")]

S = 'fill="none" stroke="url(#g)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"'
DRAW = {
    "veste": f'''<path {S} d="M220 230 L270 205 L300 260 L330 205 L380 230 L430 300 L410 560 L190 560 L170 300 Z"/>
      <path {S} d="M270 205 L300 330 L330 205"/><path {S} d="M300 330 L300 560"/>
      <circle cx="300" cy="390" r="6" fill="url(#g)"/><circle cx="300" cy="450" r="6" fill="url(#g)"/>
      <path {S} d="M230 420 L270 420"/><path {S} d="M170 300 L130 520 M430 300 L470 520"/>''',
    "chemise": f'''<path {S} d="M230 220 L280 200 Q300 225 320 200 L370 220 L450 290 L410 340 L380 315 L380 570 L220 570 L220 315 L190 340 L150 290 Z"/>
      <path {S} d="M280 200 L300 250 L320 200"/><path {S} d="M300 250 L300 570"/>
      <circle cx="300" cy="320" r="5" fill="url(#g)"/><circle cx="300" cy="400" r="5" fill="url(#g)"/><circle cx="300" cy="480" r="5" fill="url(#g)"/>''',
    "robe": f'''<path {S} d="M265 190 L280 260 Q300 280 320 260 L335 190"/>
      <path {S} d="M265 190 Q245 230 255 300 L270 330 Q300 345 330 330 L345 300 Q355 230 335 190"/>
      <path {S} d="M270 330 Q220 450 170 600 Q300 630 430 600 Q380 450 330 330"/>
      <path {S} d="M255 300 L345 300" stroke-width="3"/>''',
    "chaussure": f'''<path {S} d="M130 470 Q140 420 190 420 L300 410 Q360 330 420 360 L470 430 Q480 470 450 480 L150 490 Q130 488 130 470 Z"/>
      <path {S} d="M140 500 L460 492"/><path {S} d="M300 410 Q320 440 360 440"/><path {S} d="M330 380 L350 400 M350 365 L372 386"/>''',
    "escarpin": f'''<path {S} d="M150 470 Q200 470 260 440 Q330 400 380 330 Q420 300 450 330 Q460 360 440 380 L430 420"/>
      <path {S} d="M150 470 Q140 490 170 492 L300 470 Q360 450 400 420"/>
      <path {S} d="M430 380 L420 520 L408 520 L410 420"/>''',
    "montre": f'''<path {S} d="M260 170 L270 250 M340 170 L330 250 M260 630 L270 550 M340 630 L330 550"/>
      <circle cx="300" cy="400" r="135" {S}/><circle cx="300" cy="400" r="112" {S} stroke-width="3"/>
      <path {S} d="M300 400 L300 320 M300 400 L355 430"/><circle cx="300" cy="400" r="7" fill="url(#g)"/>
      <path {S} d="M300 298 L300 310 M402 400 L390 400 M300 502 L300 490 M198 400 L210 400" stroke-width="4"/>
      <rect x="432" y="388" width="18" height="24" rx="4" {S} stroke-width="3"/>''',
    "sac": f'''<path {S} d="M170 330 L430 330 L455 590 L145 590 Z"/>
      <path {S} d="M230 330 Q230 220 300 220 Q370 220 370 330"/>
      <path {S} d="M170 330 L300 420 L430 330"/><rect x="280" y="405" width="40" height="34" rx="6" {S} stroke-width="4"/>''',
    "lunettes": f'''<path {S} d="M120 380 Q120 470 200 470 Q270 470 275 400 L275 370 L120 370 Z"/>
      <path {S} d="M480 380 Q480 470 400 470 Q330 470 325 400 L325 370 L480 370 Z"/>
      <path {S} d="M275 380 Q300 360 325 380"/><path {S} d="M120 372 L90 340 M480 372 L510 340"/>''',
    "parfum": f'''<rect x="275" y="200" width="50" height="40" rx="6" {S}/><rect x="250" y="160" width="100" height="45" rx="10" {S}/>
      <path {S} d="M290 240 L290 270 M310 240 L310 270"/>
      <path {S} d="M200 300 Q200 270 230 270 L370 270 Q400 270 400 300 L410 560 Q410 600 370 600 L230 600 Q190 600 190 560 Z"/>
      <path {S} d="M240 380 L360 380 L360 480 L240 480 Z" stroke-width="3"/>''',
    "bijou": f'''<circle cx="300" cy="450" r="110" {S}/><circle cx="300" cy="450" r="92" {S} stroke-width="3"/>
      <path {S} d="M260 340 L240 300 L270 270 L330 270 L360 300 L340 340 Z"/>
      <path {S} d="M240 300 L360 300 M270 270 L300 340 L330 270" stroke-width="3"/>''',
    "ceinture": f'''<path {S} d="M110 360 Q300 330 490 360 L490 420 Q300 390 110 420 Z"/>
      <rect x="250" y="330" width="100" height="100" rx="10" {S}/><path {S} d="M290 380 L360 380"/>
      <circle cx="420" cy="378" r="5" fill="url(#g)"/><circle cx="450" cy="382" r="5" fill="url(#g)"/>''',
}

import re

def fix(body):
    # une valeur stroke-width explicite remplace celle par défaut (pas d'attribut en double)
    return re.sub(r'stroke-width="5"([^>]*?) stroke-width="(\d+)"', r'stroke-width="\2"\1', body)

for kind, body in DRAW.items():
    body = f'<g transform="translate(300 400) scale(1.22) translate(-300 -400)">{fix(body)}</g>'
    for i, (c1, c2) in enumerate(TONES, 1):
        svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="600" height="800">
  <defs>
    <radialGradient id="bg" cx="50%" cy="42%" r="75%"><stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></radialGradient>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9C7C3F"/><stop offset=".45" stop-color="#F1DFB4"/><stop offset=".7" stop-color="#C6A15B"/><stop offset="1" stop-color="#8A6A32"/></linearGradient>
  </defs>
  <rect width="600" height="800" fill="url(#bg)"/>
  <rect x="24" y="24" width="552" height="752" fill="none" stroke="#C6A15B" stroke-opacity=".28" stroke-width="1.5"/>
  {body}
  <text x="300" y="720" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="22" letter-spacing="9" fill="#C6A15B" fill-opacity=".75">GOUNASS LUXURY</text>
</svg>'''
        with open(os.path.join(OUT, f"{kind}-{i}.svg"), "w") as f:
            f.write(svg)
print(len(os.listdir(OUT)), "illustrations")
