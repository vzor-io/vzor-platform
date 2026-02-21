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

# Render
IMG = 2400
QUIET = 4
TOTAL = N + QUIET * 2
CELL = IMG / TOTAL

# Центральная зона под кружок (та же что и в тонком варианте)
LOGO_R_MODS = int(N * 0.14)
cx_mod, cy_mod = N / 2, N / 2

def in_logo(r, c):
    return math.hypot(r + 0.5 - cy_mod, c + 0.5 - cx_mod) < LOGO_R_MODS

img = Image.new("RGB", (IMG, IMG), (255, 255, 255))
draw = ImageDraw.Draw(img)
COL = (0, 0, 0)

def cell_xy(r, c):
    return (c + QUIET) * CELL, (r + QUIET) * CELL

# Классические сплошные модули
for r in range(N):
    for c in range(N):
        if not matrix[r][c] or in_logo(r, c):
            continue
        x, y = cell_xy(r, c)
        draw.rectangle([x, y, x + CELL, y + CELL], fill=COL)

# Кружок по центру с "vzor" — идентичный тонкому варианту
cx_px = IMG / 2
cy_px = IMG / 2
circle_r = LOGO_R_MODS * CELL

draw.ellipse([cx_px - circle_r - CELL, cy_px - circle_r - CELL,
              cx_px + circle_r + CELL, cy_px + circle_r + CELL],
             fill=(255, 255, 255))

ring_w = max(2, int(CELL * 0.25))
draw.ellipse([cx_px - circle_r, cy_px - circle_r,
              cx_px + circle_r, cy_px + circle_r],
             outline=COL, width=ring_w)

font_size = int(circle_r * 0.7)
f = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", font_size)
bb = draw.textbbox((0, 0), "vzor", font=f)
tw, th = bb[2] - bb[0], bb[3] - bb[1]
draw.text((cx_px - tw/2, cy_px - th/2 - bb[1]), "vzor", fill=COL, font=f)

path = os.path.join(OUT, "VZOR_QR_classic.png")
img.save(path, "PNG", dpi=(300, 300))
print(f"Done: {path}")
