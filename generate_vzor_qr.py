import qrcode
from PIL import Image, ImageDraw, ImageFont
import os, math

URL = "https://vzor-ai.com/admin.htm"
OUT = os.path.join(os.path.expanduser("~"), "Desktop")

# QR matrix
qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=1, border=0)
qr.add_data(URL)
qr.make(fit=True)
matrix = qr.get_matrix()
N = len(matrix)

# Render settings
IMG = 2400
QUIET = 4
TOTAL = N + QUIET * 2
CELL = IMG / TOTAL
# Тонкие модули: 60% от ячейки — утончённый вид
MOD_RATIO = 0.6
MOD_SZ = CELL * MOD_RATIO
GAP = (CELL - MOD_SZ) / 2

# Центральная зона под кружок
LOGO_R_MODS = int(N * 0.14)
cx_mod, cy_mod = N / 2, N / 2

def in_logo(r, c):
    return math.hypot(r + 0.5 - cy_mod, c + 0.5 - cx_mod) < LOGO_R_MODS

# Finder patterns
PDP = 7
pdps = [(0,0), (0, N-PDP), (N-PDP, 0)]
def in_pdp(r, c):
    for pr, pc in pdps:
        if pr <= r < pr+PDP and pc <= c < pc+PDP:
            return True
    return False

img = Image.new("RGB", (IMG, IMG), (255, 255, 255))
draw = ImageDraw.Draw(img)

def cell_xy(r, c):
    x = (c + QUIET) * CELL
    y = (r + QUIET) * CELL
    return x, y

# Data modules — тонкие квадратики
COL = (30, 30, 30)
for r in range(N):
    for c in range(N):
        if not matrix[r][c] or in_pdp(r, c) or in_logo(r, c):
            continue
        x, y = cell_xy(r, c)
        draw.rectangle([x + GAP, y + GAP, x + GAP + MOD_SZ, y + GAP + MOD_SZ], fill=COL)

# Finder patterns — тонкие контуры
def draw_finder(r0, c0):
    x0, y0 = cell_xy(r0, c0)
    s = CELL * PDP
    lw = CELL * 0.55  # толщина линий

    # Outer ring
    draw.rectangle([x0, y0, x0+s, y0+s], fill=COL)
    draw.rectangle([x0+lw, y0+lw, x0+s-lw, y0+s-lw], fill=(255,255,255))

    # Inner square
    inner_margin = CELL * 2
    draw.rectangle([x0+inner_margin, y0+inner_margin, x0+s-inner_margin, y0+s-inner_margin], fill=COL)

for pr, pc in pdps:
    draw_finder(pr, pc)

# Кружок по центру с "vzor"
cx_px = IMG / 2
cy_px = IMG / 2
circle_r = LOGO_R_MODS * CELL

# Белый круг
draw.ellipse([cx_px - circle_r - CELL, cy_px - circle_r - CELL,
              cx_px + circle_r + CELL, cy_px + circle_r + CELL],
             fill=(255, 255, 255))

# Тонкий контур круга
ring_w = max(2, int(CELL * 0.25))
draw.ellipse([cx_px - circle_r, cy_px - circle_r,
              cx_px + circle_r, cy_px + circle_r],
             outline=COL, width=ring_w)

# Текст "vzor"
font_size = int(circle_r * 0.7)
f = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", font_size)
bb = draw.textbbox((0, 0), "vzor", font=f)
tw, th = bb[2] - bb[0], bb[3] - bb[1]
draw.text((cx_px - tw/2, cy_px - th/2 - bb[1]), "vzor", fill=COL, font=f)

path = os.path.join(OUT, "VZOR_QR.png")
img.save(path, "PNG", dpi=(300, 300))
print(f"Done: {path} ({IMG}x{IMG})")
