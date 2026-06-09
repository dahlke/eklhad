#!/usr/bin/env python3
"""
Fix EXIF orientation on full-size photos in GCS by physically rotating pixels.

PNG files don't get auto-rotated by browsers from EXIF metadata, so photos
taken in portrait/rotated orientation appear sideways in the lightbox.

Usage:
    python3 scripts/fix_photo_orientation.py
"""

import io
import sys

try:
    from google.cloud import storage
    from PIL import Image, ImageOps
except ImportError:
    print("Missing deps. Run via `uv run python scripts/fix_photo_orientation.py` (or `uv sync` first).")
    sys.exit(1)

BUCKET_NAME   = "eklhad-web-public"
PHOTOS_PREFIX = "photos/"
THUMBS_PREFIX = "photos/thumbs/"


def fix_orientations():
    client = storage.Client()
    bucket = client.bucket(BUCKET_NAME)

    blobs = list(bucket.list_blobs(prefix=PHOTOS_PREFIX))
    photos = [
        b for b in blobs
        if not b.name.startswith(THUMBS_PREFIX)
        and b.name.lower().endswith((".png", ".jpg", ".jpeg"))
    ]

    fixed = 0
    for blob in photos:
        filename = blob.name.split("/")[-1]

        data = blob.download_as_bytes()
        img = Image.open(io.BytesIO(data))

        exif = img._getexif() if hasattr(img, "_getexif") else None
        orientation = None
        if exif:
            from PIL.ExifTags import TAGS
            for tag, val in exif.items():
                if TAGS.get(tag) == "Orientation":
                    orientation = val

        if not orientation or orientation == 1:
            print(f"  {filename} — ok, skipping")
            continue

        print(f"  {filename} (orientation={orientation})", end=" ... ", flush=True)

        img = ImageOps.exif_transpose(img)

        buf = io.BytesIO()
        fmt = "PNG" if filename.lower().endswith(".png") else "JPEG"
        save_kwargs = {"format": fmt, "optimize": True}
        if fmt == "JPEG":
            save_kwargs["quality"] = 90
        img.save(buf, **save_kwargs)
        buf.seek(0)

        blob.upload_from_file(buf, content_type=blob.content_type)
        blob.make_public()
        fixed += 1
        print("fixed")

    print(f"\nFixed {fixed} photos in gs://{BUCKET_NAME}/{PHOTOS_PREFIX}")


if __name__ == "__main__":
    fix_orientations()
