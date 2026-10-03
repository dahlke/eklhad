#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["openai", "Pillow", "pillow-heif"]
# ///
"""
Turns a travel photo into a "rubber-stamp field-note" poster: the original
photo on the left, a hand-stamped multicolor print of the place on old paper
on the right. Prompt adapted from https://x.com/Hamburgerai/status/2090683415104557406

The model is only trusted with the right-hand paper panel. The original photo
is pasted back over the left 58% afterward so it is never redrawn.

Usage:
    OPENAI_API_KEY=... uv run scripts/stamp_poster.py photo.png "Dubrovnik" 2023 --number 12
"""

import argparse
import base64
import io
from pathlib import Path

from openai import OpenAI
from PIL import Image, ImageOps
from pillow_heif import register_heif_opener

register_heif_opener()

MODEL = "gpt-image-2.5-sunburst"
SIZE = (1536, 1152)
PHOTO_SHARE = 0.58

PROMPT = """Turn this photo into one "rubber-stamp travel field-note poster". 4:3 landscape. Two regions, no visible dividing line.

LEFT ~58%: the original photo, faithfully preserved. Keep subject, terrain, architecture, plants, people, spatial relationships, natural light, texture and color mood. Only restrained, art-book-grade color grading and very light fine film grain. Natural cropping is fine; never stretch, distort, move, replace or redraw the subject.

RIGHT ~42%: warm off-white old paper with fine fibers, natural grain, light wear and a matte feel. Keep large areas of unprinted paper; the empty space is part of the layout.

From the photo, extract the most place-identifying silhouette, structure, terrain line, plant posture, road or shoreline and compress it into one small multicolor rubber-stamp image. Keep only the minimum needed to recognize the place at a glance. Remove crowds, cars, dense windows, repeated buildings, fine foliage, ornament and irrelevant background.

Place the stamp in the lower-middle of the paper area, about 30-38% of that area's height, with generous margins. It must not grow into an illustration, a full landscape painting or a logo.

Organize the stamp by scene type:
- Landmark building: most recognizable outline, roof, dome, arch, tower or main structure.
- Hillside settlement: buildings compressed into a few stepped color blocks following the terrain.
- Coastline: mountain line, settlement layers, shoreline and a few broken water lines.
- City view: main skyline, one landmark and one or two layers of distant hills.
- Nature: direction of the main mountains, trees, water or road.
- Foreground element: keep as a stamp outline only if it matters to the story.

Pull 2-4 spot ink colors from the photo, preferring desaturated charcoal, deep green, brick red, ochre, grey-blue, grey-brown, without forcing a fixed palette. Keep the photo's color character; only one small accent color.

Each color is a separately hand-pressed layer: real carved-rubber texture, hand cut marks, uneven hatching, notched outlines, broken edges, dry under-inked areas, paper showing through, grainy ink, uneven pressure, slight ghosting, and 1-2 mm misregistration between layers. Edges must not be digitally smooth. It should look like a real carved stamp pressed on old paper, not a filtered photo, smooth vector art or line logo.

Text, small and restrained, slightly imperfect typewriter face, below or beside the stamp, like a traveler's field note rather than an ad headline. Exactly these lines, spelled exactly:
{place}
No. {number}
{keywords}
{year}

Quiet, restrained, tactile, clearly of its place, with handmade error and a collected feel. The photo records the scene; the stamp keeps what memory would recognize.

Avoid: a visible center divider, round seals, red Chinese seal stamps, postage perforations, wax seals, sticker collage, souvenir templates, smooth vector logos, generic city icons, copying every building, dense detail, childish craft look, cartoon style, 3D render, plastic texture, smooth digital gradients, oversaturation, too much text, decorative clutter, and any redrawing or change of the left-side photo."""


def cover(img, size):
    return ImageOps.fit(img, size, Image.LANCZOS, centering=(0.5, 0.5))


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("photo", type=Path)
    parser.add_argument("place")
    parser.add_argument("year")
    parser.add_argument("--number", default="1")
    parser.add_argument("--keywords", default="", help='three words, e.g. "walls · harbor · terracotta"; blank lets the model pick')
    parser.add_argument("--quality", default="high")
    parser.add_argument("--out", type=Path)
    args = parser.parse_args()

    photo = ImageOps.exif_transpose(Image.open(args.photo)).convert("RGB")
    upload = io.BytesIO()
    cover(photo, SIZE).save(upload, format="PNG")
    upload.name = "photo.png"

    keywords = args.keywords or "three short English keywords you choose for this place"
    result = OpenAI().images.edit(
        model=MODEL,
        image=upload,
        prompt=PROMPT.format(place=args.place, number=args.number, keywords=keywords, year=args.year),
        size=f"{SIZE[0]}x{SIZE[1]}",
        quality=args.quality,
    )
    poster = Image.open(io.BytesIO(base64.b64decode(result.data[0].b64_json))).convert("RGB").resize(SIZE)
    out = args.out or args.photo.with_name(f"{args.photo.stem}_stamp.png")
    raw = out.with_name(f"{out.stem}_raw.png")
    poster.save(raw)

    left = (round(SIZE[0] * PHOTO_SHARE), SIZE[1])
    poster.paste(cover(photo, left), (0, 0))
    poster.save(out)
    print(out, raw)


if __name__ == "__main__":
    main()
