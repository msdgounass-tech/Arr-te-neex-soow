import sys, math, random
from PIL import Image, ImageDraw, ImageFont
OUT = sys.argv[1]
F = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
def font(s): return ImageFont.truetype(F, s)
def base(bg1, bg2, size=1000):
    im = Image.new("RGB", (size, size), bg1); d = ImageDraw.Draw(im)
    for y in range(size):
        t = y / size; c = tuple(int(bg1[i] * (1 - t) + bg2[i] * t) for i in range(3)); d.line([(0, y), (size, y)], fill=c)
    return im, d
def tag(d):
    d.rounded_rectangle([40, 40, 230, 110], 30, fill=(28, 34, 48)); d.text((70, 52), "DÉMO", font=font(40), fill=(255, 255, 255))
def wax(d, box, c1, c2, seed):
    random.seed(seed); x0, y0, x1, y1 = box
    for i in range(14):
        cx, cy, r = random.randint(x0, x1), random.randint(y0, y1), random.randint(25, 70)
        d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=c2, width=10)
        d.ellipse([cx - r // 3, cy - r // 3, cx + r // 3, cy + r // 3], fill=c1)
def garment(kind, c1, c2, seed, alt):
    im, d = base((255, 241, 232), (252, 226, 208)); tag(d)
    d.line([(500, 150), (500, 200)], fill=(90, 90, 90), width=8); d.arc([440, 120, 560, 210], 200, 340, fill=(90, 90, 90), width=8)
    if kind == "dress": poly = [(420, 220), (580, 220), (620, 380), (720, 860), (280, 860), (380, 380)]
    elif kind == "boubou": poly = [(330, 230), (670, 230), (860, 520), (760, 560), (700, 860), (300, 860), (240, 560), (140, 520)]
    elif kind == "suit": poly = [(360, 220), (640, 220), (720, 520), (660, 540), (650, 860), (350, 860), (340, 540), (280, 520)]
    else: poly = [(220, 300), (780, 300), (780, 800), (220, 800)]
    if alt: poly = [((x - 500) * 1.25 + 500, (y - 540) * 1.25 + 540) for x, y in poly]
    d.polygon(poly, fill=c1); mask = Image.new("L", im.size, 0); ImageDraw.Draw(mask).polygon(poly, fill=255)
    pat = im.copy(); wax(ImageDraw.Draw(pat), (150, 200, 850, 880), c2, (255, 255, 255), seed); im.paste(pat, (0, 0), mask)
    return im
def device(kind, c1, alt):
    im, d = base((236, 240, 247), (214, 222, 236)); tag(d)
    if kind == "phone":
        d.rounded_rectangle([340, 170, 660, 830], 60, fill=(30, 34, 44)); d.rounded_rectangle([362, 200, 638, 800], 40, fill=c1)
        if alt: d.ellipse([560, 220, 620, 280], fill=(30, 34, 44))
    elif kind == "earbuds":
        for x in (380, 620):
            d.ellipse([x - 90, 330, x + 90, 510], fill=(250, 250, 252), outline=(180, 186, 200), width=6); d.rounded_rectangle([x - 28, 480, x + 28, 700], 24, fill=(250, 250, 252), outline=(180, 186, 200), width=6)
        d.rounded_rectangle([340, 720, 660, 840], 50, fill=c1)
    elif kind == "charger":
        d.rounded_rectangle([380, 300, 620, 560], 40, fill=(250, 250, 252), outline=(180, 186, 200), width=6)
        for x in (450, 550): d.rectangle([x - 14, 220, x + 14, 300], fill=(160, 166, 176))
        d.line([(500, 560), (500, 650), (640, 760), (760, 760)], fill=c1, width=26, joint="curve")
    else:
        d.rounded_rectangle([230, 260, 770, 640], 30, fill=(40, 44, 56)); d.rounded_rectangle([255, 285, 745, 615], 18, fill=c1)
        d.polygon([(160, 660), (840, 660), (900, 740), (100, 740)], fill=(170, 176, 188))
    return im
def jar(kind, c1, c2, alt):
    im, d = base((241, 248, 240), (222, 238, 220)); tag(d)
    if kind == "jar":
        d.rounded_rectangle([330, 380, 670, 830], 70, fill=c1); d.rounded_rectangle([350, 300, 650, 390], 24, fill=c2)
        d.rounded_rectangle([390, 520, 610, 680], 20, fill=(255, 255, 255))
    elif kind == "soap":
        d.rounded_rectangle([250, 420, 750, 720], 110, fill=c1)
        for i in range(6): d.ellipse([300 + i * 70, 330 - (i % 2) * 40, 360 + i * 70, 390 - (i % 2) * 40], outline=(255, 255, 255), width=6)
    elif kind == "bottle":
        d.rounded_rectangle([380, 380, 620, 840], 60, fill=c1); d.rectangle([450, 250, 550, 390], fill=c1); d.rounded_rectangle([430, 190, 570, 260], 20, fill=c2)
        d.rounded_rectangle([410, 560, 590, 700], 16, fill=(255, 255, 255))
    else:
        d.pieslice([260, 480, 740, 900], 180, 360, fill=c1); d.rectangle([260, 680, 740, 700], fill=c2)
        for i in range(3): d.arc([420 + i * 50, 200 + i * 40, 560 + i * 50, 500], 200, 340, fill=(140, 140, 150), width=8)
    return im
def food(kind, c1, c2, alt, seed):
    im, d = base((255, 248, 232), (250, 236, 204)); tag(d); random.seed(seed)
    d.ellipse([180, 520, 820, 880], fill=(186, 120, 70)); d.ellipse([200, 520, 800, 760], fill=(214, 150, 96))
    for i in range(45 if not alt else 70):
        x, y = random.randint(260, 740), random.randint(450, 690)
        if kind == "peanut": d.ellipse([x - 26, y - 16, x + 26, y + 16], fill=c1, outline=c2, width=3)
        elif kind == "flower": d.ellipse([x - 22, y - 22, x + 22, y + 22], fill=c1)
        elif kind == "honey": pass
        else: d.ellipse([x - 9, y - 9, x + 9, y + 9], fill=c1)
    if kind == "honey":
        d.rounded_rectangle([360, 260, 640, 720], 60, fill=c1); d.rounded_rectangle([380, 200, 620, 270], 20, fill=c2)
    return im
P = {
 "robe-wax": lambda a: garment("dress", (201, 72, 11), (21, 128, 61), 1, a),
 "boubou": lambda a: garment("boubou", (37, 99, 235), (250, 204, 21), 2, a),
 "tailleur": lambda a: garment("suit", (124, 58, 237), (242, 107, 29), 3, a),
 "tissu": lambda a: garment("fabric", (21, 128, 61), (242, 107, 29), 4, a),
 "smartphone": lambda a: device("phone", (37, 99, 235), a),
 "ecouteurs": lambda a: device("earbuds", (242, 107, 29), a),
 "chargeur": lambda a: device("charger", (28, 34, 48), a),
 "ordinateur": lambda a: device("laptop", (14, 116, 144), a),
 "karite": lambda a: jar("jar", (245, 222, 179), (161, 98, 7), a),
 "savon": lambda a: jar("soap", (60, 50, 44), (0, 0, 0), a),
 "baobab": lambda a: jar("bottle", (217, 119, 6), (120, 53, 15), a),
 "encens": lambda a: jar("bowl", (120, 53, 15), (80, 30, 10), a),
 "arachides": lambda a: food("peanut", (214, 168, 108), (150, 100, 50), a, 5),
 "bissap": lambda a: food("flower", (157, 23, 77), (100, 10, 40), a, 6),
 "miel": lambda a: food("honey", (234, 179, 8), (120, 53, 15), a, 7),
 "thiakry": lambda a: food("grain", (250, 245, 230), (200, 190, 170), a, 8),
}
for k, fn in P.items():
    for a in (0, 1): fn(a).save(f"{OUT}/{k}-{a + 1}.webp", "WEBP", quality=82)
for k, (bg, letter) in {"awa": ((201, 72, 11), "A"), "moussa": ((37, 99, 235), "M"), "fatou": ((21, 128, 61), "F"), "ibrahima": ((161, 98, 7), "I")}.items():
    im = Image.new("RGB", (512, 512), bg); d = ImageDraw.Draw(im); d.text((256, 256), letter, font=font(280), fill=(255, 255, 255), anchor="mm"); im.save(f"{OUT}/logo-{k}.webp", "WEBP", quality=85)
print("ok")
