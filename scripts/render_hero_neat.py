#!/usr/bin/env python3
"""
Re-render greatsage.org hero + OG image: high-res composite, NEAT branding,
site palette. Requires: pillow, rembg (first run downloads model).

  python3 scripts/render_hero_neat.py

Reads:  assets/hero-mascot-legacy.png (original character PNG; required)
Writes: assets/hero-mascot-cutout.png (cached rembg)
        assets/hero-mascot.png (portrait, ~1200px wide)
        assets/og-greatsage-hero-1200x630.png (Open Graph / LinkedIn)
"""

from __future__ import annotations

import io
import os
import random
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"

# Site tokens (index.html :root)
PRIMARY = (124, 58, 237)  # #7C3AED
PRIMARY_LIGHT = (155, 92, 255)
TEAL = (45, 212, 191)  # hair-adjacent accent
BG_DEEP = (15, 12, 28)
BG_MID = (45, 35, 78)


def _font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        "/System/Library/Fonts/SFNS.ttf",
        "/System/Library/Fonts/SFNSDisplay.ttf",
        "/System/Library/Fonts/Supplemental/Avenir Next.ttc",
        "/Library/Fonts/Arial.ttf",
    ]
    for fp in candidates:
        if os.path.exists(fp):
            try:
                return ImageFont.truetype(fp, size=size)
            except OSError:
                continue
    return ImageFont.load_default()


def _load_cutout() -> Image.Image:
    cut = ASSETS / "hero-mascot-cutout.png"
    legacy = ASSETS / "hero-mascot-legacy.png"
    if not legacy.exists():
        raise FileNotFoundError(
            "Missing assets/hero-mascot-legacy.png — keep the original character render there; "
            "the composited hero-mascot.png must not be used as a rembg source."
        )
    inp = legacy

    if cut.exists() and cut.stat().st_mtime >= legacy.stat().st_mtime:
        return Image.open(cut).convert("RGBA")

    from rembg import remove

    data = remove(inp.read_bytes())
    im = Image.open(io.BytesIO(data)).convert("RGBA")
    im.save(cut, optimize=True)
    return im


def _radial_gradient(size: tuple[int, int], center: tuple[float, float], colors: list[tuple]) -> Image.Image:
    w, h = size
    cx, cy = center
    base = Image.new("RGB", size, colors[-1])
    px = base.load()
    max_r = (w * w + h * h) ** 0.5 / 2
    for y in range(h):
        for x in range(w):
            d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5 / max_r
            d = min(1.0, d)
            # piecewise blend first two stops
            if d < 0.55:
                t = d / 0.55
                c0, c1 = colors[0], colors[1]
            else:
                t = (d - 0.55) / 0.45
                c0, c1 = colors[1], colors[2]
            r = int(c0[0] + (c1[0] - c0[0]) * t)
            g = int(c0[1] + (c1[1] - c0[1]) * t)
            b = int(c0[2] + (c1[2] - c0[2]) * t)
            px[x, y] = (r, g, b)
    return base


def _add_soft_vignette(rgb: Image.Image, strength: float = 0.35) -> Image.Image:
    w, h = rgb.size
    overlay = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(overlay)
    margin = min(w, h) // 8
    d.rounded_rectangle((margin, margin, w - margin, h - margin), radius=min(w, h) // 5, fill=255)
    overlay = overlay.filter(ImageFilter.GaussianBlur(min(w, h) // 15))
    dark = Image.new("RGB", (w, h), (0, 0, 0))
    return Image.composite(dark, rgb, overlay).convert("RGB")


def _bokeh_layer(size: tuple[int, int], seed: int = 42) -> Image.Image:
    rnd = random.Random(seed)
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    w, h = size
    for _ in range(55):
        x = rnd.randint(0, w)
        y = rnd.randint(0, h)
        r = rnd.randint(2, 28)
        col = (*PRIMARY_LIGHT, rnd.randint(25, 90)) if rnd.random() > 0.45 else (*TEAL, rnd.randint(20, 75))
        d.ellipse((x - r, y - r, x + r, y + r), fill=col)
    return layer.filter(ImageFilter.GaussianBlur(12))


def _neat_constellation(size: tuple[int, int], seed: int = 7) -> Image.Image:
    rnd = random.Random(seed)
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    w, h = size
    pts = [(rnd.randint(w // 10, 9 * w // 10), rnd.randint(h // 10, 9 * h // 10)) for _ in range(14)]
    edge = (100, 200, 255, 55)
    for i, (x, y) in enumerate(pts):
        others = sorted(
            [(((x - ox) ** 2 + (y - oy) ** 2) ** 0.5, j) for j, (ox, oy) in enumerate(pts) if j != i]
        )[:3]
        for _, j in others:
            ox, oy = pts[j]
            d.line((x, y, ox, oy), fill=edge, width=1)
    for (x, y) in pts:
        r = rnd.randint(3, 6)
        d.ellipse((x - r, y - r, x + r, y + r), fill=(*TEAL, 180))
    return layer.filter(ImageFilter.GaussianBlur(0.8))


def _paste_center(base: Image.Image, fg: Image.Image, scale: float) -> tuple[Image.Image, tuple[int, int, int, int]]:
    w, h = fg.size
    nw, nh = int(w * scale), int(h * scale)
    fg_s = fg.resize((nw, nh), Image.Resampling.LANCZOS)
    cw, ch = base.size
    x = (cw - nw) // 2
    y = ch - nh - int(ch * 0.02)
    if y < 0:
        y = (ch - nh) // 2
    shadow = Image.new("RGBA", base.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    foot_y = y + nh - 8
    sd.ellipse((x + nw // 6, foot_y, x + 5 * nw // 6, foot_y + nh // 8), fill=(0, 0, 0, 90))
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))
    out = Image.alpha_composite(base.convert("RGBA"), shadow)
    out.paste(fg_s, (x, y), fg_s)
    return out, (x, y, nw, nh)


def render_portrait(cutout: Image.Image, out_w: int = 1200) -> Image.Image:
    src_w, src_h = cutout.size
    aspect = src_h / src_w
    out_h = int(out_w * aspect)
    canvas = _radial_gradient(
        (out_w, out_h),
        (out_w * 0.5, out_h * 0.38),
        [BG_DEEP, BG_MID, (96, 80, 140)],
    )
    canvas = _add_soft_vignette(canvas, 0.28)
    canvas_rgba = canvas.convert("RGBA")
    bokeh = _bokeh_layer((out_w, out_h))
    canvas_rgba = Image.alpha_composite(canvas_rgba, bokeh)
    neat = _neat_constellation((out_w, out_h))
    canvas_rgba = Image.alpha_composite(canvas_rgba, neat)

    scale = (out_w * 0.92) / src_w
    composed, box = _paste_center(canvas_rgba, cutout, scale)

    d = ImageDraw.Draw(composed)
    font_sm = _font(26)
    font_md = _font(34, bold=True)
    font_lg = _font(42, bold=True)
    # Top brand
    d.text((36, 36), "The Great Sage", fill=(255, 255, 255, 235), font=font_lg)
    d.text((38, 92), "Offline-first AI for everyone", fill=(230, 220, 255, 200), font=font_sm)
    # NEAT ribbon bottom
    ribbon_h = 120
    ry0 = out_h - ribbon_h - 24
    d.rounded_rectangle((24, ry0, out_w - 24, ry0 + ribbon_h), radius=22, fill=(*PRIMARY, 230))
    d.text((out_w // 2, ry0 + 22), "N · E · A · T.", fill=(255, 255, 255, 255), font=font_md, anchor="mm")
    d.text(
        (out_w // 2, ry0 + 72),
        "Just A Neat Evolving Thinker",
        fill=(237, 233, 254, 255),
        font=font_sm,
        anchor="mm",
    )

    return composed.convert("RGBA")


def render_og(cutout: Image.Image, size: tuple[int, int] = (1200, 630)) -> Image.Image:
    ow, oh = size
    canvas = _radial_gradient(
        size,
        (ow * 0.28, oh * 0.45),
        [BG_DEEP, BG_MID, (70, 55, 110)],
    )
    canvas = _add_soft_vignette(canvas, 0.22)
    cr = canvas.convert("RGBA")
    cr = Image.alpha_composite(cr, _bokeh_layer(size, seed=11))
    cr = Image.alpha_composite(cr, _neat_constellation(size, seed=13))

    d = ImageDraw.Draw(cr)
    font_xl = _font(52, bold=True)
    font_sm = _font(28)
    font_tag = _font(24)
    d.text((48, 72), "The Great Sage", fill=(255, 255, 255, 245), font=font_xl)
    d.text((52, 142), "Offline-first AI for everyone", fill=(220, 210, 255, 230), font=font_sm)
    d.text((52, 210), "Privacy-first · Voice-first · Open source", fill=(180, 170, 220, 240), font=font_tag)
    d.text((52, 270), "greatsage.org", fill=(*TEAL, 255), font=font_tag)

    # NEAT badge
    d.rounded_rectangle((48, 360, 520, 455), radius=18, fill=(*PRIMARY, 215))
    d.text((284, 388), "N.E.A.T.", fill=(255, 255, 255, 255), font=_font(36, bold=True), anchor="mm")
    d.text((284, 425), "Just A Neat Evolving Thinker", fill=(237, 233, 254, 250), font=_font(20), anchor="mm")

    # Character right
    src_w, src_h = cutout.size
    target_h = int(oh * 0.92)
    scale = target_h / src_h
    nw, nh = int(src_w * scale), int(src_h * scale)
    fg = cutout.resize((nw, nh), Image.Resampling.LANCZOS)
    x = ow - nw + 20
    y = (oh - nh) // 2
    shadow = Image.new("RGBA", size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.ellipse((x + nw // 8, y + nh - 30, x + 7 * nw // 8, y + nh + 40), fill=(0, 0, 0, 85))
    shadow = shadow.filter(ImageFilter.GaussianBlur(22))
    cr = Image.alpha_composite(cr, shadow)
    cr.paste(fg, (x, y), fg)
    return cr


def main() -> int:
    print("Loading / generating cutout (rembg may run once)...", file=sys.stderr)
    cut = _load_cutout()
    portrait = render_portrait(cut)
    og = render_og(cut)

    out_hero = ASSETS / "hero-mascot.png"
    out_og = ASSETS / "og-greatsage-hero-1200x630.png"

    portrait.save(out_hero, optimize=True, compress_level=6)
    og.save(out_og, optimize=True, compress_level=6)

    print(f"Wrote {out_hero} ({portrait.size[0]}×{portrait.size[1]})", file=sys.stderr)
    print(f"Wrote {out_og} ({og.size[0]}×{og.size[1]})", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
