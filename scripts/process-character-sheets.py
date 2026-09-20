#!/usr/bin/env python3
"""
Cut the raw Higgsfield character sheets into per-mood transparent PNGs.

    python scripts/process-character-sheets.py

Reads  assets/characters/_raw/<sheet>.png   (gitignored, watermarked)
Writes assets/characters/<id>-<mood>.png    (512x512, transparent)

These outputs are PLACEHOLDERS. They are derived from watermarked source art
and are not cleared for release. See docs/ASSETS.md and task T-010.

Deliberately not a Node script: it would need an image library added to
package.json for a job that is run by hand every few months. Python with
Pillow is already on this machine and stays out of the app's dependency tree.

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

# Only sheets that are actually usable. Dusk's sheet has "Stage 1..5" text
# baked into the image, which breaks the no-text rule, so it is not listed
# and Dusk keeps the blob fallback.
SHEETS = {
    "sprout": "288f4c1b-8297-4217-be4a-63f97832caa3.png",
    "ember": "240ac547-3242-4666-9375-442417c26308.png",
}

# The watermark sits in the bottom-right corner of every sheet. This fraction
# of the image is excluded from *character detection* so it cannot be mistaken
# for content. The source sheets are never modified.
WATERMARK_BAND = 0.14

BG_TOLERANCE = 40  # colour distance from the sheet background
FEATHER = 18  # soft edge, so cut-outs do not look stamped


def background_colour(rgb: np.ndarray) -> np.ndarray:
    """Average of the top corners, which are always empty backdrop."""
    top_left = rgb[0:40, 0:40].reshape(-1, 3)
    top_right = rgb[0:40, -40:].reshape(-1, 3)
    return np.concatenate([top_left, top_right]).mean(axis=0)


def column_runs(mask: np.ndarray, min_width: int = 60) -> list[tuple[int, int]]:
    """
    Contiguous columns containing content.

    Deliberately does not bridge gaps: on the Ember sheet two figures sit only
    8px apart, so any bridging wide enough to reattach a stray sparkle would
    also weld two characters together. Detached sparkles are dropped instead,
    and the five widest runs are taken as the figures.
    """
    density = mask.sum(axis=0)
    threshold = max(3, density.max() * 0.02)
    on = density > threshold

    runs: list[list[int]] = []
    start = None
    for i, is_on in enumerate(on):
        if is_on and start is None:
            start = i
        elif not is_on and start is not None:
            runs.append([start, i])
            start = None
    if start is not None:
        runs.append([start, len(on)])

    return [(a, b) for a, b in runs if b - a >= min_width]


def alpha_from_background(rgb: np.ndarray, bg: np.ndarray) -> np.ndarray:
    """Opaque where the pixel differs from the backdrop, with a soft edge."""
    distance = np.abs(rgb.astype(np.int16) - bg).sum(axis=2)
    alpha = (distance - BG_TOLERANCE) / FEATHER
    return np.clip(alpha, 0, 1)


def process(name: str, filename: str) -> int:
    path = RAW / filename
    if not path.exists():
        print(f"  skip {name}: {path.name} not found")
        return 0

    sheet = Image.open(path).convert("RGB")
    rgb = np.asarray(sheet)
    height = rgb.shape[0]

    bg = background_colour(rgb)
    alpha = alpha_from_background(rgb, bg)

    detect_height = int(height * (1 - WATERMARK_BAND))
    runs = column_runs(alpha[:detect_height] > 0.5)

    if len(runs) < len(MOODS):
        print(f"  {name}: found {len(runs)} figures, expected {len(MOODS)} — skipping")
        return 0

    # Widest five, back in left-to-right order.
    runs = sorted(sorted(runs, key=lambda r: r[1] - r[0], reverse=True)[: len(MOODS)])

    written = 0
    for mood, (x0, x1) in zip(MOODS, runs):
        column = alpha[:detect_height, x0:x1]
        rows = np.where(column.max(axis=1) > 0.5)[0]
        if rows.size == 0:
            continue
        y0, y1 = int(rows[0]), int(rows[-1]) + 1

        pad = 8
        x0p, x1p = max(0, x0 - pad), min(rgb.shape[1], x1 + pad)
        y0p, y1p = max(0, y0 - pad), min(detect_height, y1 + pad)

        crop_rgb = rgb[y0p:y1p, x0p:x1p]
        crop_a = (alpha[y0p:y1p, x0p:x1p] * 255).astype(np.uint8)
        cut = Image.fromarray(np.dstack([crop_rgb, crop_a]).astype(np.uint8), "RGBA")

        # Fit inside the square without distorting, then centre.
        scale = min(SIZE / cut.width, SIZE / cut.height)
        cut = cut.resize((max(1, round(cut.width * scale)), max(1, round(cut.height * scale))), Image.LANCZOS)

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
