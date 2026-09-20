#!/usr/bin/env python3
"""
Cut the raw Higgsfield character sheets into per-mood transparent PNGs.

    python scripts/process-character-sheets.py

Reads  assets/characters/_raw/<sheet>.png   (gitignored, watermarked)
Writes assets/characters/<id>-<mood>.png    (512x512, transparent)

These outputs are PLACEHOLDERS. They are derived from watermarked source art
and are not cleared for release. See docs/ASSETS.md and task T-010.

Deliberately not a Node script: it would need an image library added to
package.json for a job run by hand every few months. Python with Pillow is
already here and stays out of the app's dependency tree.

Requires: Pillow, numpy.
"""

from __future__ import annotations

import sys
from pathlib import Path

try:
    import numpy as np
    from PIL import Image
except ImportError:
    sys.exit("needs Pillow and numpy:  pip install Pillow numpy")

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "assets" / "characters" / "_raw"
OUT = ROOT / "assets" / "characters"

SIZE = 512
# Moods run left to right on each sheet, 1 (rough) to 5 (thriving).
MOODS = [1, 2, 3, 4, 5]

SHEETS = {
    "sprout": "288f4c1b-8297-4217-be4a-63f97832caa3.png",
    "ember": "240ac547-3242-4666-9375-442417c26308.png",
    # Dusk's sheet has "Stage 1..5" captions under the figures and the
    # watermark lower still. Both are separate horizontal bands, so selecting
    # the densest band (below) keeps the figures and leaves the text behind.
    "dusk": "ec0aaa60-2067-4f4a-a3c2-51b324c72c2e.png",
}

BG_TOLERANCE = 40  # colour distance from the sheet backdrop
FEATHER = 18  # soft outer edge, so cut-outs do not look stamped


def background_colour(rgb: np.ndarray) -> np.ndarray:
    """Average of the top corners, which are always empty backdrop."""
    top_left = rgb[0:40, 0:40].reshape(-1, 3)
    top_right = rgb[0:40, -40:].reshape(-1, 3)
    return np.concatenate([top_left, top_right]).mean(axis=0)


def runs_of(on: np.ndarray, min_length: int) -> list[tuple[int, int]]:
    """Contiguous True spans of a 1-D boolean array."""
    spans: list[list[int]] = []
    start = None
    for i, value in enumerate(on):
        if value and start is None:
            start = i
        elif not value and start is not None:
            spans.append([start, i])
            start = None
    if start is not None:
        spans.append([start, len(on)])
    return [(a, b) for a, b in spans if b - a >= min_length]


def content_band(mask: np.ndarray) -> tuple[int, int]:
    """
    The horizontal band holding the figures.

    A sheet can carry captions under the figures and a watermark below that.
    Each is its own band of rows separated by blank space, and the figures are
    by far the densest, so the band with the most content is the one wanted.
    Picking it this way means no sheet needs hand-measured coordinates, and
    nothing is erased from the source — the other bands are simply not read.
    """
    rows = mask.sum(axis=1)
    bands = runs_of(rows > rows.max() * 0.02, min_length=40)
    if not bands:
        return 0, mask.shape[0]
    return max(bands, key=lambda b: rows[b[0] : b[1]].sum())


def column_runs(mask: np.ndarray, min_width: int = 60) -> list[tuple[int, int]]:
    """
    Columns containing content, one span per figure.

    Deliberately does not bridge gaps: two figures on the Ember sheet sit 8px
    apart, so any bridging wide enough to reattach a stray sparkle would also
    weld two characters together. Detached sparkles are dropped instead and
    the widest spans are taken as the figures.
    """
    density = mask.sum(axis=0)
    return runs_of(density > max(3, density.max() * 0.02), min_length=min_width)


def reachable_background(is_backdrop: np.ndarray) -> np.ndarray:
    """
    Backdrop pixels connected to the edge of the crop, by scanline flood fill.

    This is the whole reason the first attempt went wrong: matching on colour
    alone made every near-white pixel transparent, which ate the whites of
    Sprout's eyes. An eye is backdrop-coloured but enclosed by the face, so it
    is never reachable from the edge — connectivity tells the two apart where
    colour cannot.
    """
    height, width = is_backdrop.shape
    seen = np.zeros_like(is_backdrop)
    stack: list[tuple[int, int]] = []

    for x in range(width):
        if is_backdrop[0, x]:
            stack.append((0, x))
        if is_backdrop[height - 1, x]:
            stack.append((height - 1, x))
    for y in range(height):
        if is_backdrop[y, 0]:
            stack.append((y, 0))
        if is_backdrop[y, width - 1]:
            stack.append((y, width - 1))

    while stack:
        y, x = stack.pop()
        if seen[y, x] or not is_backdrop[y, x]:
            continue

        # Grow to the whole horizontal span in one go; filling span by span
        # rather than pixel by pixel is what keeps this fast in Python.
        row = is_backdrop[y]
        left = x
        while left > 0 and row[left - 1]:
            left -= 1
        right = x
        while right + 1 < width and row[right + 1]:
            right += 1
        seen[y, left : right + 1] = True

        for neighbour in (y - 1, y + 1):
            if not 0 <= neighbour < height:
                continue
            candidates = is_backdrop[neighbour, left : right + 1] & ~seen[neighbour, left : right + 1]
            index = np.flatnonzero(candidates)
            if index.size == 0:
                continue
            # One seed per contiguous group, not per pixel.
            breaks = np.flatnonzero(np.diff(index) > 1)
            starts = np.concatenate(([index[0]], index[breaks + 1]))
            for start in starts:
                stack.append((neighbour, left + int(start)))

    return seen


# Enclosed regions worth making opaque are facial: eye whites and highlights.
# They sit in the middle of a figure. A gap between the feet, or under a
# drooping leaf, is also enclosed but belongs to the silhouette and must stay
# see-through — filling it puts a pale blob on the app's dark theme.
#
# Measured on these sheets: eyes land at 25-55% of figure height, foot gaps at
# 90%+, and a leaf gap at 10%. Colour cannot tell them apart (Sprout's foot
# gap reads further from the backdrop than its own eyes do), so position is
# what the split is made on.
FILL_BAND = (0.15, 0.80)

# Height does the real work: every genuine gap measured on these sheets sits
# outside the band (Sprout's leaf gap at 10%, foot gaps at 89-93%), while eyes
# sit at 20-55%. The area cap is only a safety net against filling a large
# structural hole, so it is set well clear of anything real.
#
# It was 5% and that was too tight by a hair: the glow around Dusk's right eye
# in the thriving pose makes that socket 5.36% of the figure, so it was
# rejected and the eye came out translucent over the dark theme.
FILL_MAX_AREA = 0.12


def components(mask: np.ndarray) -> list[np.ndarray]:
    """Indices of each connected region of a small boolean mask."""
    seen = np.zeros_like(mask)
    found: list[np.ndarray] = []
    for sy, sx in zip(*np.nonzero(mask)):
        if seen[sy, sx]:
            continue
        stack = [(int(sy), int(sx))]
        pixels: list[tuple[int, int]] = []
        while stack:
            y, x = stack.pop()
            if not (0 <= y < mask.shape[0] and 0 <= x < mask.shape[1]):
                continue
            if seen[y, x] or not mask[y, x]:
                continue
            seen[y, x] = True
            pixels.append((y, x))
            stack += [(y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)]
        found.append(np.array(pixels))
    return found


def cut_out(rgb: np.ndarray, bg: np.ndarray) -> Image.Image:
    """One figure, with the backdrop removed but facial highlights kept."""
    distance = np.abs(rgb.astype(np.int16) - bg).sum(axis=2)
    soft = np.clip((distance - BG_TOLERANCE) / FEATHER, 0, 1)

    # Every pixel not already fully opaque is a candidate for being backdrop,
    # the feather band included. Flood filling that whole set is what
    # separates the real backdrop from pale areas inside the figure.
    outside = reachable_background(soft < 1.0)

    alpha = soft.copy()
    figure_area = max(1, int((soft >= 1.0).sum()))
    height = soft.shape[0]

    for pixels in components((soft < 1.0) & ~outside):
        if len(pixels) / figure_area > FILL_MAX_AREA:
            continue
        centre = pixels[:, 0].mean() / height
        if not FILL_BAND[0] <= centre <= FILL_BAND[1]:
            continue
        # Feathering belongs to the outer rim alone. Left alone, an eye white
        # lands in the feather band and comes out translucent — which is what
        # happened to Sprout's eyes and then to the owl's right eye.
        alpha[pixels[:, 0], pixels[:, 1]] = 1.0

    return Image.fromarray(np.dstack([rgb, (alpha * 255).astype(np.uint8)]).astype(np.uint8), "RGBA")


def process(name: str, filename: str) -> int:
    path = RAW / filename
    if not path.exists():
        print(f"  skip {name}: {path.name} not found")
        return 0

    rgb = np.asarray(Image.open(path).convert("RGB"))
    bg = background_colour(rgb)
    mask = np.abs(rgb.astype(np.int16) - bg).sum(axis=2) > BG_TOLERANCE

    top, bottom = content_band(mask)
    band = mask[top:bottom]
    runs = column_runs(band)

    if len(runs) < len(MOODS):
        print(f"  {name}: found {len(runs)} figures, expected {len(MOODS)} — skipping")
        return 0

    runs = sorted(sorted(runs, key=lambda r: r[1] - r[0], reverse=True)[: len(MOODS)])

    written = 0
    for mood, (x0, x1) in zip(MOODS, runs):
        rows = np.flatnonzero(band[:, x0:x1].any(axis=1))
        if rows.size == 0:
            continue

        pad = 8
        y0 = top + max(0, int(rows[0]) - pad)
        y1 = top + min(bottom - top, int(rows[-1]) + 1 + pad)
        x0p = max(0, x0 - pad)
        x1p = min(rgb.shape[1], x1 + pad)

        cut = cut_out(rgb[y0:y1, x0p:x1p], bg)

        scale = min(SIZE / cut.width, SIZE / cut.height)
        cut = cut.resize(
            (max(1, round(cut.width * scale)), max(1, round(cut.height * scale))), Image.LANCZOS
        )

        canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
        canvas.paste(cut, ((SIZE - cut.width) // 2, (SIZE - cut.height) // 2))

        out = OUT / f"{name}-{mood}.png"
        canvas.save(out, optimize=True)
        print(f"  {out.name}  {out.stat().st_size // 1024} KB")
        written += 1

    return written


def main() -> None:
    if not RAW.exists():
        sys.exit(f"no raw sheets at {RAW} — see docs/ASSETS.md")

    OUT.mkdir(parents=True, exist_ok=True)
    total = 0
    for name, filename in SHEETS.items():
        print(f"{name}:")
        total += process(name, filename)

    print(f"\n{total} placeholder images written.")
    print("These are watermark-derived placeholders and must not ship. See docs/ASSETS.md.")


if __name__ == "__main__":
    main()
