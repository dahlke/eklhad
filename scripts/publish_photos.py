#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["Pillow", "pillow-heif", "google-cloud-storage"]
# ///
"""
Puts photos approved in review_locations.py onto the map. For every map pin
without a photo, the first approved photo becomes its photo: a PNG and a 400px
thumbnail go to gs://eklhad-web-public/photos/, locationPhotos.json gets the
entry. A photo starred in the review app is used instead of the first, and replaces the
photo a pin already shows (the old one becomes an alternate). Other approved
photos are kept as "alternates".

Usage:
    uv run scripts/publish_photos.py --emoji emoji.json            # {"City": "🌵", ...}
    uv run scripts/publish_photos.py --emoji emoji.json --dry-run
"""

import argparse
import io
import json
import re
from collections import Counter
from datetime import datetime
from pathlib import Path

from google.cloud import storage
from PIL import Image, ImageOps
from pillow_heif import register_heif_opener

from review_locations import attach_map, place_key
from takeout_locations import slug

register_heif_opener()

WORKDIR = Path.home() / "eklhad-takeout"
PHOTOS_JSON = Path(__file__).parent / "../web/data/locationPhotos.json"
BUCKET = "eklhad-web-public"
PUBLIC = f"https://storage.googleapis.com/{BUCKET}/"


def photo_date(path):
    found = re.search(r"_(\d{4})_(\d{2})_(\d{2})_", Path(path).name)
    return datetime(*map(int, found.groups())) if found else None


def upload(bucket, source, name):
    """Upload a PNG and its thumbnail under a name that isn't taken yet; returns the public URL."""
    stem, n = name, 2
    while bucket.blob(f"photos/{stem}.png").exists():
        stem, n = f"{name}_{n}", n + 1
    img = ImageOps.exif_transpose(Image.open(source)).convert("RGB")
    thumb = img.resize((400, round(img.height * 400 / img.width)), Image.LANCZOS)
    for path, image in ((f"photos/{stem}.png", img), (f"photos/thumbs/{stem}.png", thumb)):
        buf = io.BytesIO()
        image.save(buf, format="PNG", optimize=True)
        blob = bucket.blob(path)
        blob.cache_control = "public,max-age=31536000"
        blob.upload_from_string(buf.getvalue(), content_type="image/png")
    return f"{PUBLIC}photos/{stem}.png"


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--emoji", type=Path, help='JSON of {"City": "emoji"} for pins getting their first photo')
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    places = json.loads((WORKDIR / "takeout_locations.json").read_text())
    all_decisions = json.loads((WORKDIR / "takeout_decisions.json").read_text())
    decisions, covers = all_decisions["photos"], all_decisions.get("cover", {})
    attach_map(places)
    photos = json.loads(PHOTOS_JSON.read_text())
    emoji = json.loads(args.emoji.read_text()) if args.emoji else {}

    approved, starred = {}, {}
    for place in places:
        pin = place["Map Pin"] or place["City"]
        star = covers.get(place_key(place))
        if star and decisions.get(star) == "approved" and Path(star).exists():
            starred[pin] = star
        for path in place["Candidate Photos"]:
            if decisions.get(path) == "approved" and Path(path).exists():
                # Skip the photo the pin already shows (published earlier from this same approval)
                if place["Map Photo Date"] and photo_date(path) and f"{photo_date(path):%B} {photo_date(path).day}, {photo_date(path).year}" == place["Map Photo Date"]:
                    continue
                approved.setdefault((pin, place["Map Country"], place["Map Photo"]), []).append(path)

    bucket = storage.Client(project="eklhad-web").bucket(BUCKET) if not args.dry_run else None
    name_counts = Counter(p.get("Map Pin") for p in places if p.get("Map Pin"))
    new_entries = {}
    for (pin, country, on_map), paths in sorted(approved.items()):
        entry = photos.get(pin)
        star = starred.get(pin)
        if star in paths:
            paths = [star] + [p for p in paths if p != star]
        if entry and star in paths and Path(star).name not in {a.get("source") for a in entry.get("alternates", [])} | {entry.get("source")}:
            taken = photo_date(star)
            print(f"replace photo     {pin}: {Path(star).name}")
            if not args.dry_run:
                entry.setdefault("alternates", []).append({"url": entry["url"]})
                entry.update(url=upload(bucket, star, f"{slug(pin)}_{taken:%Y_%m_%d}"), date=f"{taken:%B} {taken.day}, {taken.year}", source=Path(star).name)
                for stale in ("stamp", "badge", "poster"):
                    entry.pop(stale, None)
                new_entries[pin] = entry
            paths = paths[1:]
        if on_map or entry:
            have = {a.get("source") for a in (entry or {}).get("alternates", [])}
            extra = [p for p in paths if Path(p).name not in have]
            if extra and not args.dry_run and entry:
                for p in extra:
                    url = upload(bucket, p, f"{slug(pin)}_{photo_date(p):%Y_%m_%d}_alt")
                    entry.setdefault("alternates", []).append({"url": url, "source": Path(p).name})
            print(f"keep shown photo  {pin}: {len(extra)} more kept as alternates")
            continue
        first, *rest = paths
        taken = photo_date(first)
        print(f"first photo       {pin} ({country}) {taken:%Y-%m-%d}, {len(rest)} alternates")
        if args.dry_run:
            continue
        entry = {"slug": slug(pin), "url": upload(bucket, first, f"{slug(pin)}_{taken:%Y_%m_%d}"), "source": Path(first).name,
                 "date": f"{taken:%B} {taken.day}, {taken.year}", "emoji": emoji.get(pin, "📷")}
        if name_counts[pin] > 1 or sum(1 for p in places if p.get("Map Pin") == pin and p["Country"] != country):
            entry["country"] = country
        entry["alternates"] = [{"url": upload(bucket, p, f"{slug(pin)}_{photo_date(p):%Y_%m_%d}_alt"), "source": Path(p).name} for p in rest]
        photos[pin] = entry
        new_entries[pin] = entry

    if args.dry_run or not new_entries:
        return
    PHOTOS_JSON.write_text(json.dumps(dict(sorted(photos.items())), indent=2, ensure_ascii=False) + "\n")

    print(f"{len(new_entries)} pins got a photo")


if __name__ == "__main__":
    main()
