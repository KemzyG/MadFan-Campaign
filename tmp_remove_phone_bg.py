"""Remove near-black backgrounds from hero phone PNGs with edge flood-fill.

Uses a hard flood from the image border, then feathers only a thin ring
around that mask so dark phone UI is never flooded as background.
"""

from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter

PUBLIC = Path(r"C:\MF Project\backend\backend\public\landing-media")
ROOT = Path(r"C:\MF Project\backend\backend\resources\images\landing")
FILES = [
    "hero-phone-feed.png",
    "hero-phone-passport.png",
    "hero-phone-chat.png",
]

# Connected border pixels at/below this max-channel value become fully transparent.
# 22 clears slight floor glow; 30+ leaks into dark phone UI.
HARD_THRESH = 22
# Within the 2px ring around the hard mask, dark pixels get soft alpha.
SOFT_RING = 2
SOFT_THRESH = 55


def lum(r: int, g: int, b: int) -> int:
    return max(r, g, b)


def flood_from_border(pixels: list, w: int, h: int, thresh: int) -> bytearray:
    n = w * h
    bg = bytearray(n)
    q: deque[int] = deque()

    def seed(x: int, y: int) -> None:
        i = y * w + x
        if bg[i]:
            return
        r, g, b, _ = pixels[i]
        if lum(r, g, b) <= thresh:
            bg[i] = 1
            q.append(i)

    for x in range(w):
        seed(x, 0)
        seed(x, h - 1)
    for y in range(h):
        seed(0, y)
        seed(w - 1, y)

    while q:
        i = q.popleft()
        x = i % w
        y = i // w
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if nx < 0 or ny < 0 or nx >= w or ny >= h:
                continue
            j = ny * w + nx
            if bg[j]:
                continue
            r, g, b, _ = pixels[j]
            if lum(r, g, b) <= thresh:
                bg[j] = 1
                q.append(j)
    return bg


def dilate(mask: bytearray, w: int, h: int, radius: int) -> bytearray:
    out = bytearray(mask)
    for _ in range(radius):
        nxt = bytearray(out)
        for y in range(h):
            row = y * w
            for x in range(w):
                i = row + x
                if out[i]:
                    continue
                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                    if 0 <= nx < w and 0 <= ny < h and out[ny * w + nx]:
                        nxt[i] = 1
                        break
        out = nxt
    return out


def process(src: Path, dst: Path) -> dict:
    im = Image.open(src).convert("RGBA")
    w, h = im.size
    pixels = list(im.getdata())
    hard = flood_from_border(pixels, w, h, HARD_THRESH)
    dilated = dilate(hard, w, h, SOFT_RING)

    out = []
    transparent = 0
    soft = 0
    kept = 0
    for i, (r, g, b, a) in enumerate(pixels):
        if hard[i]:
            out.append((0, 0, 0, 0))
            transparent += 1
            continue
        if dilated[i]:
            # Thin fringe only — never interior phone pixels.
            L = lum(r, g, b)
            if L <= HARD_THRESH:
                out.append((0, 0, 0, 0))
                transparent += 1
                continue
            if L <= SOFT_THRESH:
                t = (L - HARD_THRESH) / max(1, SOFT_THRESH - HARD_THRESH)
                alpha = max(0, min(255, int(round(t * 255))))
                out.append((r, g, b, alpha))
                soft += 1
                continue
        out.append((r, g, b, 255 if a == 0 else a))
        kept += 1

    result = Image.new("RGBA", (w, h))
    result.putdata(out)

    rgb = result.convert("RGB")
    alpha = result.getchannel("A").filter(ImageFilter.GaussianBlur(radius=0.45))
    result = Image.merge("RGBA", (*rgb.split(), alpha))

    cleaned = []
    for r, g, b, a in result.getdata():
        cleaned.append((0, 0, 0, 0) if a == 0 else (r, g, b, a))
    result.putdata(cleaned)
    result.save(dst, "PNG", optimize=True)

    verify = list(result.getdata())
    corner_a = [verify[0][3], verify[w - 1][3], verify[(h - 1) * w][3], verify[-1][3]]
    center_a = verify[(h // 2) * w + (w // 2)][3]
    # Integrity: opaque ratio in center third
    opaque_center = 0
    total_center = 0
    for y in range(h // 4, 3 * h // 4, 4):
        for x in range(w // 3, 2 * w // 3, 4):
            total_center += 1
            if verify[y * w + x][3] > 200:
                opaque_center += 1
    zero_pct = sum(1 for p in verify if p[3] == 0) / len(verify) * 100

    return {
        "file": dst.name,
        "corner_alpha": corner_a,
        "center_alpha": center_a,
        "center_opaque_pct": round(100 * opaque_center / total_center, 1),
        "zero_alpha_pct": round(zero_pct, 1),
        "transparent": transparent,
        "soft": soft,
        "kept": kept,
    }


def main() -> None:
    for name in FILES:
        info = process(PUBLIC / name, ROOT / name)
        print(info)


if __name__ == "__main__":
    main()
