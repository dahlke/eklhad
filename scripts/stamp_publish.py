#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["Pillow", "pillow-heif", "numpy", "google-cloud-storage"]
# ///
"""
Publishes the stamp posters made by stamp_batch.py to the map: a small pin
image of each stamp and a web-sized copy of each poster (plus a thumbnail) go
to the public bucket, and locationPhotos.json gets their URLs. File names carry
a content hash, so a rerolled stamp gets a fresh URL instead of a stale cache.

Every version in every --dirs folder is uploaded and listed under the place's
"stamps"; nothing is dropped. The one the map shows ("stamp"/"poster") comes
from the first folder listed, unless --picks names a folder for that place.
--archive also copies the full-size originals to the private bucket.

Usage:
    uv run scripts/stamp_publish.py --dirs ~/Desktop/stamp_posters_v2 ~/Desktop/stamp_posters
    uv run scripts/stamp_publish.py --dirs ... --dry-run
"""

import argparse
import hashlib
import io
import json
from pathlib import Path

import numpy as np
from PIL import Image

from stamp_local import crop_to_ink, lift_to_white

BUCKET = "eklhad-web-public"
PUBLIC = f"https://storage.googleapis.com/{BUCKET}/"
PHOTOS_JSON = Path(__file__).parent / "../web/frontend/src/config/locationPhotos.json"


def pin_image(stamp, size=120):
    """The stamp's ink, trimmed, centered in a fixed transparent square so every pin has the same footprint."""
    ink = crop_to_ink(lift_to_white(stamp), pad=0.02)
    ink.thumbnail((size, size), Image.LANCZOS)
    rgb = np.asarray(ink, float) / 255
    # Keep the printed colours; fade out only paper and pale washes so the cutout stays crisp
    darkness = 1 - rgb.min(axis=2)
    alpha = np.clip((darkness - 0.12) / 0.25, 0, 1)
    cutout = Image.fromarray((np.dstack([rgb, alpha]) * 255).astype(np.uint8), "RGBA")
    square = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    square.paste(cutout, ((size - cutout.width) // 2, (size - cutout.height) // 2))
    return square


def encode(img, fmt, **kw):
    buf = io.BytesIO()
    img.save(buf, format=fmt, **kw)
    return buf.getvalue()


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--dirs", type=Path, nargs="+", required=True)
    parser.add_argument("--picks", type=Path, help='JSON of {"slug": "folder name"} choosing which version the map shows')
    parser.add_argument("--archive", action="store_true", help="also copy full-size originals to gs://eklhad-web-private/stamps/")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    photos = json.loads(PHOTOS_JSON.read_text())
    by_slug = {Path(entry["url"]).stem: city for city, entry in photos.items()}

    picks = json.loads(args.picks.read_text()) if args.picks else {}
    versions = []
    for folder in args.dirs:
        for poster in sorted(folder.glob("*.png")):
            slug = poster.stem
            stamp = poster.with_name(f"{slug}_stamp.png")
            if not slug.endswith("_stamp") and slug in by_slug and stamp.exists():
                versions.append((slug, poster, stamp))

    bucket = archive = None
    if not args.dry_run:
        from google.cloud import storage
        client = storage.Client(project="eklhad-web")
        bucket = client.bucket(BUCKET)
        archive = client.bucket("eklhad-web-private") if args.archive else None

    shown = set()
    for i, (slug, poster_path, stamp_path) in enumerate(versions, 1):
        poster = Image.open(poster_path).convert("RGB")
        files = {
            "pins": encode(pin_image(Image.open(stamp_path)), "PNG", optimize=True),
            "posters": encode(poster, "JPEG", quality=85, optimize=True),
            "posters/thumbs": encode(poster.resize((480, 360), Image.LANCZOS), "JPEG", quality=82, optimize=True),
        }
        # Each file is named by its own content hash: a new pin style doesn't duplicate the posters
        digest = {kind: hashlib.sha1(data).hexdigest()[:8] for kind, data in files.items()}
        digest["posters/thumbs"] = digest["posters"]
        names = {kind: f"stamps/{kind}/{slug}_{digest[kind]}.{'png' if kind == 'pins' else 'jpg'}" for kind in files}
        if bucket:
            for kind, data in files.items():
                blob = bucket.blob(names[kind])
                if not blob.exists():
                    blob.cache_control = "public,max-age=31536000"
                    blob.upload_from_string(data, content_type="image/png" if kind == "pins" else "image/jpeg")
        if archive:
            for path in (poster_path, stamp_path):
                blob = archive.blob(f"stamps/{poster_path.parent.name}/{path.name}")
                if not blob.exists():
                    blob.upload_from_filename(str(path))

        entry = photos[by_slug[slug]]
        version = {"stamp": PUBLIC + names["pins"], "poster": PUBLIC + names["posters"], "run": poster_path.parent.name}
        entry["stamps"] = [v for v in entry.get("stamps", []) if v["stamp"] != version["stamp"]] + [version]
        wanted = picks.get(slug)
        if (wanted and wanted == version["run"]) or (not wanted and slug not in shown):
            entry["stamp"], entry["poster"] = version["stamp"], version["poster"]
            shown.add(slug)
        print(f"[{i}/{len(versions)}] {by_slug[slug]}  {version['run']}", flush=True)

    if not args.dry_run:
        PHOTOS_JSON.write_text(json.dumps(photos, indent=2, ensure_ascii=False) + "\n")
    print(f"{len(versions)} versions; {sum(bool(e.get('stamp')) for e in photos.values())} of {len(photos)} photo places have a stamp")


if __name__ == "__main__":
    main()
