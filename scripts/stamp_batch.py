#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["Pillow", "pillow-heif", "numpy"]
# ///
"""
Makes a stamp poster for every place on the map that has a photo, using
stamp_local.py. Numbers posters in the order the photos were taken. Skips
posters that already exist, so it can be stopped and rerun.

Usage:
    uv run scripts/stamp_batch.py --only "Kyoto" "Dublin"     # a sample
    uv run scripts/stamp_batch.py                             # everything
"""

import argparse
import io
import json
import time
import urllib.request
from datetime import datetime
from pathlib import Path

from PIL import Image, ImageOps

from stamp_local import compose, generate_stamp

LOCATIONS_URL = "https://storage.googleapis.com/eklhad-web-public/data/locations.json"
KEYWORDS = Path(__file__).with_name("stamp_keywords.json")


def fetch_photo(url, cache):
    cached = cache / Path(url).name
    if not cached.exists():
        with urllib.request.urlopen(url, timeout=120) as resp:
            img = ImageOps.exif_transpose(Image.open(io.BytesIO(resp.read()))).convert("RGB")
        ImageOps.contain(img, (2048, 2048)).save(cached)
    return Image.open(cached).convert("RGB")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--only", nargs="*", help="city names to make; default is every place with a photo")
    parser.add_argument("--only-file", type=Path, help="file of city names separated by | or newlines")
    parser.add_argument("--out", type=Path, default=Path.home() / "Desktop/stamp_posters")
    parser.add_argument("--seed", type=int, default=7)
    args = parser.parse_args()
    if args.only_file:
        args.only = (args.only or []) + [c.strip() for c in args.only_file.read_text().replace("|", "\n").splitlines() if c.strip()]

    # Query string skips the CDN copy, which can be up to an hour stale
    with urllib.request.urlopen(f"{LOCATIONS_URL}?t={int(time.time())}", timeout=60) as resp:
        places = [p for p in json.load(resp) if p.get("photourl")]
    places.sort(key=lambda p: datetime.strptime(p["photodate"], "%B %d, %Y") if p.get("photodate") else datetime.max)
    keywords = json.loads(KEYWORDS.read_text())
    cache = args.out / "_photos"
    cache.mkdir(parents=True, exist_ok=True)

    todo = [(n, p) for n, p in enumerate(places, 1) if not args.only or p["city"] in args.only]
    for i, (number, place) in enumerate(todo, 1):
        slug = Path(place["photourl"]).stem
        out = args.out / f"{slug}.png"
        if out.exists():
            continue
        started = time.time()
        photo = fetch_photo(place["photourl"], cache)
        year = place["photodate"][-4:] if place.get("photodate") else ""
        stamp = generate_stamp(photo, place["city"], place["country"], args.seed, args.out / f"{slug}_stamp.png",
                               state=place.get("stateprovinceregion", ""), motifs=keywords.get(place["city"], ""))
        compose(photo, stamp, place["city"], number, keywords.get(place["city"], ""), year).save(out)
        print(f"[{i}/{len(todo)}] {place['city']}, {place['country']}  {time.time() - started:.0f}s", flush=True)
    print("done", args.out)


if __name__ == "__main__":
    main()
