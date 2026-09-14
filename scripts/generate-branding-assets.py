import os
import base64
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

os.makedirs('public', exist_ok=True)
os.makedirs('src/app', exist_ok=True)

# 1. Load source logo
logo_src = Image.open('public/logo.png').convert('RGBA')
bbox = logo_src.getbbox()
cropped_logo = logo_src.crop(bbox)
lw, lh = cropped_logo.size

# Square logo with 2% margin for maximum favicon legibility
pad = int(max(lw, lh) * 0.02)
sq_size = max(lw, lh) + 2 * pad
sq_logo = Image.new('RGBA', (sq_size, sq_size), (0, 0, 0, 0))
sq_logo.paste(cropped_logo, ((sq_size - lw) // 2, (sq_size - lh) // 2), cropped_logo)

# --- FAVICONS ---
print("Generating Favicons...")

# 16x16
icon_16 = sq_logo.resize((16, 16), Image.Resampling.LANCZOS)
icon_16 = ImageEnhance.Sharpness(icon_16).enhance(1.4)
icon_16.save('public/favicon-16x16.png')

# 32x32
icon_32 = sq_logo.resize((32, 32), Image.Resampling.LANCZOS)
icon_32 = ImageEnhance.Sharpness(icon_32).enhance(1.2)
icon_32.save('public/favicon-32x32.png')
icon_32.save('public/icon.png')
icon_32.save('src/app/icon.png')

# 48x48
icon_48 = sq_logo.resize((48, 48), Image.Resampling.LANCZOS)
icon_48.save('public/favicon-48x48.png')

# Multi-size ICO
sq_logo.save(
    'public/favicon.ico',
    format='ICO',
    sizes=[(16, 16), (32, 32), (48, 48)]
)
sq_logo.save(
    'src/app/favicon.ico',
    format='ICO',
    sizes=[(16, 16), (32, 32), (48, 48)]
)

# 192x192 & 512x512
icon_192 = sq_logo.resize((192, 192), Image.Resampling.LANCZOS)
icon_192.save('public/icon-192.png')

icon_512 = sq_logo.resize((512, 512), Image.Resampling.LANCZOS)
icon_512.save('public/icon-512.png')

# Apple Touch Icon (180x180) with deep navy brand background #050B44
apple_icon = Image.new('RGBA', (180, 180), (5, 11, 68, 255))
apple_emblem = cropped_logo.resize((132, 132), Image.Resampling.LANCZOS)
apple_icon.paste(apple_emblem, (24, 24), apple_emblem)
apple_icon.save('public/apple-icon.png')
apple_icon.save('public/apple-touch-icon.png')
apple_icon.save('src/app/apple-icon.png')

# Also create clean SVG representation wrapping the logo
with open('public/logo.png', 'rb') as f:
    b64_logo = base64.b64encode(f.read()).decode('utf-8')

svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="100%" height="100%">
  <image width="1024" height="1024" href="data:image/png;base64,{b64_logo}"/>
</svg>'''

with open('public/logo.svg', 'w') as f:
    f.write(svg_content)

print("Favicons generated.")

# --- OPEN GRAPH IMAGE (1200 x 630) ---
print("Generating Open Graph and Twitter images...")

W, H = 1200, 630
base = Image.new('RGBA', (W, H), (5, 11, 68, 255)) # #050B44

# Depth / radial glow
cyan_glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
cyan_draw = ImageDraw.Draw(cyan_glow)
center_x, center_y = W // 2, 215

for r in range(480, 0, -12):
    alpha = int(32 * (1 - r / 480))
    cyan_draw.ellipse(
        [center_x - r, center_y - r, center_x + r, center_y + r],
        fill=(10, 132, 255, alpha)
    )

gold_glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
gold_draw = ImageDraw.Draw(gold_glow)
for r in range(320, 0, -8):
    alpha = int(45 * (1 - r / 320))
    gold_draw.ellipse(
        [center_x - r, center_y - r, center_x + r, center_y + r],
        fill=(212, 175, 55, alpha)
    )

og_img = Image.alpha_composite(base, cyan_glow)
og_img = Image.alpha_composite(og_img, gold_glow)

# Framing borders
draw = ImageDraw.Draw(og_img)
draw.rounded_rectangle([24, 24, W - 24, H - 24], radius=20, outline=(212, 175, 55, 65), width=1)
draw.rounded_rectangle([32, 32, W - 32, H - 32], radius=16, outline=(255, 255, 255, 18), width=1)

# Corner accents
acc_len = 32
gold_acc = (212, 175, 55, 190)
draw.line([(40, 40), (40 + acc_len, 40)], fill=gold_acc, width=2)
draw.line([(40, 40), (40, 40 + acc_len)], fill=gold_acc, width=2)
draw.line([(W - 40, 40), (W - 40 - acc_len, 40)], fill=gold_acc, width=2)
draw.line([(W - 40, 40), (W - 40, 40 + acc_len)], fill=gold_acc, width=2)
draw.line([(40, H - 40), (40 + acc_len, H - 40)], fill=gold_acc, width=2)
draw.line([(40, H - 40), (40, H - 40 - acc_len)], fill=gold_acc, width=2)
draw.line([(W - 40, H - 40), (W - 40 - acc_len, H - 40)], fill=gold_acc, width=2)
draw.line([(W - 40, H - 40), (W - 40, H - 40 - acc_len)], fill=gold_acc, width=2)

# Logo in OG
logo_sz = 230
resized_logo_og = cropped_logo.resize((logo_sz, logo_sz), Image.Resampling.LANCZOS)

# Soft shadow
shadow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
shadow_logo = Image.new('RGBA', (logo_sz, logo_sz), (0, 0, 0, 180))
shadow_logo.putalpha(resized_logo_og.split()[3])
shadow_pos = ((W - logo_sz) // 2, 68 + 5)
shadow.paste(shadow_logo, shadow_pos, shadow_logo)
shadow = shadow.filter(ImageFilter.GaussianBlur(14))
og_img = Image.alpha_composite(og_img, shadow)

# Paste logo
logo_pos = ((W - logo_sz) // 2, 68)
og_img.paste(resized_logo_og, logo_pos, resized_logo_og)

# Fonts
font_title = ImageFont.truetype('/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf', 44)
font_sub = ImageFont.truetype('/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf', 23)
font_badge = ImageFont.truetype('/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf', 16)
font_url = ImageFont.truetype('/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf', 16)

draw = ImageDraw.Draw(og_img)

# Title
title_text = "LAMKA COACHING CENTER"
bbox_t = draw.textbbox((0, 0), title_text, font=font_title)
title_w = bbox_t[2] - bbox_t[0]
draw.text(((W - title_w) // 2, 322), title_text, fill=(255, 255, 255), font=font_title)

# Subtitle
sub_text = "CENTER OF EXCELLENCE"
bbox_s = draw.textbbox((0, 0), sub_text, font=font_sub)
sub_w = bbox_s[2] - bbox_s[0]
line_y = 391
draw.line([((W - sub_w) // 2 - 80, line_y), ((W - sub_w) // 2 - 20, line_y)], fill=(212, 175, 55, 180), width=1)
draw.line([((W + sub_w) // 2 + 20, line_y), ((W + sub_w) // 2 + 80, line_y)], fill=(212, 175, 55, 180), width=1)
draw.text(((W - sub_w) // 2, 378), sub_text, fill=(212, 175, 55), font=font_sub)

# Tagline badge
tag_str = "Competitive Exams  •  Computer Training  •  Study Cabins"
bbox_tag = draw.textbbox((0, 0), tag_str, font=font_badge)
tag_w = bbox_tag[2] - bbox_tag[0]
bx1 = (W - tag_w) // 2 - 24
by1 = 438
bx2 = (W + tag_w) // 2 + 24
by2 = by1 + (bbox_tag[3] - bbox_tag[1]) + 20

draw.rounded_rectangle([bx1, by1, bx2, by2], radius=18, fill=(12, 22, 80, 230), outline=(56, 189, 248, 100), width=1)
draw.text(((W - tag_w) // 2, by1 + 9), tag_str, fill=(224, 242, 254), font=font_badge)

# Bottom URL
url_text = "lamkacoaching.com  •  Churachandpur, Manipur"
bbox_u = draw.textbbox((0, 0), url_text, font=font_url)
url_w = bbox_u[2] - bbox_u[0]
draw.text(((W - url_w) // 2, 538), url_text, fill=(148, 163, 184), font=font_url)

final_og = og_img.convert('RGB')
final_og.save('public/og-image.png', quality=95)
final_og.save('public/opengraph-image.png', quality=95)
final_og.save('src/app/opengraph-image.png', quality=95)
final_og.save('src/app/twitter-image.png', quality=95)

print("Open Graph and Twitter images generated successfully.")
