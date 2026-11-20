"""Compose the four Vice Cover Maker screenshots from the sample photos.

Outputs JPEG files under screenshots/, each at most 256 KiB, long side at
most 1280 px and short side at least 480 px, with bold caption lettering
in a heavy system font.
"""
import glob
import io
import os

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAMPLES = os.path.join(ROOT, "app", "samples")
OUT_DIR = os.path.join(ROOT, "screenshots")
MAX_BYTES = 256 * 1024


def find_bold_font():
    candidates = sorted(glob.glob("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))
    candidates += sorted(glob.glob("/usr/share/fonts/**/DejaVuSans-Bold.ttf", recursive=True))
    candidates += sorted(glob.glob("/usr/share/fonts/**/LiberationSans-Bold.ttf", recursive=True))
    for path in candidates:
        if os.path.exists(path):
            return path
    raise FileNotFoundError("No heavy system font found under /usr/share/fonts")


FONT_PATH = find_bold_font()


def load_font(size):
    return ImageFont.truetype(FONT_PATH, size)


def crop_to_fill(image, target_w, target_h):
    src_w, src_h = image.size
    scale = max(target_w / src_w, target_h / src_h)
    new_w = max(target_w, round(src_w * scale))
    new_h = max(target_h, round(src_h * scale))
    resized = image.resize((new_w, new_h), Image.LANCZOS)
    left = (new_w - target_w) // 2
    top = (new_h - target_h) // 2
    return resized.crop((left, top, left + target_w, top + target_h))


def sunset_tint(image):
    overlay = Image.new("RGB", image.size, (255, 140, 66))
    tinted = Image.blend(image, overlay, 0.18)
    pink = Image.new("RGB", image.size, (255, 62, 127))
    return Image.blend(tinted, pink, 0.10)


def neon_tint(image):
    magenta = Image.new("RGB", image.size, (255, 43, 214))
    tinted = Image.blend(image, magenta, 0.16)
    cyan = Image.new("RGB", image.size, (34, 230, 255))
    return Image.blend(tinted, cyan, 0.10)


def draw_caption(image, title, subtitle=""):
    draw = ImageDraw.Draw(image, "RGBA")
    w, h = image.size
    band_h = int(h * 0.26)
    for y in range(band_h):
        alpha = int(215 * (y / max(1, band_h - 1)))
        draw.line([(0, h - band_h + y), (w, h - band_h + y)], fill=(8, 4, 18, alpha))
    title_size = int(w * 0.11)
    font = load_font(title_size)
    while title_size > 18:
        bbox = draw.textbbox((0, 0), title, font=font, stroke_width=max(2, title_size // 12))
        if bbox[2] - bbox[0] <= w * 0.92:
            break
        title_size -= 4
        font = load_font(title_size)
    stroke = max(2, title_size // 12)
    bbox = draw.textbbox((0, 0), title, font=font, stroke_width=stroke)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    title_y = h - int(h * 0.085) - text_h if subtitle else h - int(h * 0.05) - text_h
    draw.text(((w - text_w) / 2 - bbox[0], title_y - bbox[1]), title, font=font,
              fill=(255, 190, 90), stroke_width=stroke, stroke_fill=(11, 7, 20))
    if subtitle:
        sub_size = max(16, int(w * 0.034))
        sub_font = load_font(sub_size)
        sub_stroke = max(1, sub_size // 14)
        sbbox = draw.textbbox((0, 0), subtitle, font=sub_font, stroke_width=sub_stroke)
        sub_w = sbbox[2] - sbbox[0]
        sub_h = sbbox[3] - sbbox[1]
        draw.text(((w - sub_w) / 2 - sbbox[0], h - int(h * 0.035) - sub_h - sbbox[1]),
                  subtitle, font=sub_font, fill=(244, 238, 252),
                  stroke_width=sub_stroke, stroke_fill=(11, 7, 20))
    return image


def panel_layout(width, height):
    gap = max(8, round(min(width, height) * 0.012))
    margin = gap
    inner_w = width - margin * 2
    inner_h = height - margin * 2
    if height > width * 1.08:
        hero_h = round(inner_h * 0.58)
        side_h = inner_h - hero_h - gap
        side_w = round((inner_w - gap) / 2)
        return [
            (margin, margin, inner_w, hero_h),
            (margin, margin + hero_h + gap, side_w, side_h),
            (margin + side_w + gap, margin + hero_h + gap, inner_w - side_w - gap, side_h),
        ]
    hero_w = round(inner_w * 0.62)
    side_w = inner_w - hero_w - gap
    side_h = round((inner_h - gap) / 2)
    return [
        (margin, margin, hero_w, inner_h),
        (margin + hero_w + gap, margin, side_w, side_h),
        (margin + hero_w + gap, margin + side_h + gap, side_w, inner_h - side_h - gap),
    ]


def compose_cover(width, height, photos, tint, title, subtitle=""):
    canvas = Image.new("RGB", (width, height), (11, 7, 20))
    rects = panel_layout(width, height)
    for index, (x, y, pw, ph) in enumerate(rects):
        photo = photos[index % len(photos)]
        panel = crop_to_fill(photo, pw, ph)
        panel = tint(panel)
        canvas.paste(panel, (x, y))
        draw = ImageDraw.Draw(canvas)
        draw.rectangle([x, y, x + pw - 1, y + ph - 1], outline=(11, 7, 20), width=3)
    canvas = draw_caption(canvas, title, subtitle)
    return canvas


def compose_editor(width, height, photos):
    canvas = Image.new("RGB", (width, height), (20, 16, 29))
    draw = ImageDraw.Draw(canvas, "RGBA")
    title_font = load_font(30)
    label_font = load_font(17)
    small_font = load_font(14)
    draw.text((28, 18), "VICE COVER MAKER", font=title_font, fill=(255, 140, 66))
    draw.text((28, 58), "Your photos. Your caption. Exported as PNG.", font=small_font, fill=(185, 174, 212))
    col_x, col_w = 28, 300
    y = 104
    groups = [
        ("PHOTOS", ["Hero panel photo", "Top side panel photo", "Bottom side panel photo"]),
        ("EXPORT SIZE", ["1080 x 1080  /  1080 x 1350  /  1920 x 1080"]),
        ("COLOUR GRADE", ["Vice City sunset", "Magenta / cyan neon"]),
        ("CAPTION", ["VICE CITY"]),
    ]
    for heading, lines in groups:
        box_h = 34 + len(lines) * 26 + 10
        draw.rounded_rectangle([col_x, y, col_x + col_w, y + box_h], radius=10,
                               fill=(31, 24, 48), outline=(58, 47, 85), width=1)
        draw.text((col_x + 14, y + 8), heading, font=small_font, fill=(34, 230, 255))
        ly = y + 32
        for line in lines:
            draw.text((col_x + 14, ly), line, font=label_font, fill=(244, 238, 252))
            ly += 26
        y += box_h + 12
    draw.rounded_rectangle([col_x, y, col_x + col_w, y + 48], radius=8, fill=(255, 62, 127))
    btn = "EXPORT PNG"
    bbox = draw.textbbox((0, 0), btn, font=label_font)
    draw.text((col_x + (col_w - (bbox[2] - bbox[0])) / 2, y + 13), btn, font=label_font, fill=(255, 255, 255))
    preview = compose_cover(820, 520, photos, sunset_tint, "VICE CITY", "Sunset Heist")
    px = col_x + col_w + 32
    py = 104
    draw.rounded_rectangle([px - 8, py - 8, px + preview.width + 8, py + preview.height + 8],
                           radius=12, outline=(58, 47, 85), width=2)
    canvas.paste(preview, (px, py))
    draw.text((px, py + preview.height + 20), "Live preview - drag a photo to reframe it.",
              font=small_font, fill=(185, 174, 212))
    return canvas


def save_jpeg(image, path):
    quality = 86
    while quality >= 40:
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG", quality=quality, optimize=True)
        data = buffer.getvalue()
        if len(data) <= MAX_BYTES:
            with open(path, "wb") as handle:
                handle.write(data)
            print(f"{os.path.basename(path)}: {image.width}x{image.height}, {len(data)} bytes, quality {quality}")
            return
        quality -= 6
    raise RuntimeError(f"Could not fit {path} under {MAX_BYTES} bytes")


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    boulevard = Image.open(os.path.join(SAMPLES, "boulevard.jpg")).convert("RGB")
    pier = Image.open(os.path.join(SAMPLES, "pier.jpg")).convert("RGB")
    save_jpeg(compose_cover(1280, 720, [pier, boulevard, pier], sunset_tint, "VICE CITY", "Sunset Heist"),
              os.path.join(OUT_DIR, "1-cover.jpg"))
    save_jpeg(compose_editor(1280, 720, [boulevard, pier, boulevard]),
              os.path.join(OUT_DIR, "2-editor.jpg"))
    save_jpeg(compose_cover(1024, 1280, [boulevard, pier, boulevard], neon_tint, "NEON NIGHTS"),
              os.path.join(OUT_DIR, "3-cover.jpg"))
    save_jpeg(compose_cover(1080, 1080, [pier, boulevard, pier], sunset_tint, "SUNSET HEIST"),
              os.path.join(OUT_DIR, "4-cover.jpg"))


if __name__ == "__main__":
    main()
