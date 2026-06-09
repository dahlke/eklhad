#!/usr/bin/env python3
"""
Generate thumbnails for all photos in GCS and upload them to photos/thumbs/.

Thumbnails are used in map marker tooltips; full-res images are used in the lightbox.
The frontend derives thumb URLs by replacing /photos/ with /photos/thumbs/ in the URL.

Usage:
    GOOGLE_APPLICATION_CREDENTIALS=/path/to/sa.json python3 scripts/generate_thumbs.py
"""

import io
import os
import sys

try:
    from google.cloud import storage
    from PIL import Image, ImageOps
except ImportError:
    print("Missing deps. Run via `uv run python scripts/generate_thumbs.py` (or `uv sync` first).")
    sys.exit(1)

BUCKET_NAME   = "eklhad-web-public"
PHOTOS_PREFIX = "photos/"
THUMBS_PREFIX = "photos/thumbs/"
THUMB_WIDTH   = 400


def generate_thumbs():
    client = storage.Client()
    bucket = client.bucket(BUCKET_NAME)

    blobs = list(bucket.list_blobs(prefix=PHOTOS_PREFIX))
    photos = [
        b for b in blobs
        if not b.name.startswith(THUMBS_PREFIX)
        and b.name.lower().endswith((".png", ".jpg", ".jpeg"))
    ]

    if not photos:
        print("No photos found.")
        return

    print(f"Found {len(photos)} photos. Generating thumbnails...")

    for blob in photos:
        filename = blob.name.split("/")[-1]
        thumb_name = THUMBS_PREFIX + filename

        print(f"  {filename}", end=" ... ", flush=True)

        data = blob.download_as_bytes()
        img = Image.open(io.BytesIO(data))
        img = ImageOps.exif_transpose(img)

        w, h = img.size
        new_h = int(h * THUMB_WIDTH / w)
        img = img.resize((THUMB_WIDTH, new_h), Image.LANCZOS)

        buf = io.BytesIO()
        fmt = "PNG" if filename.lower().endswith(".png") else "JPEG"
        save_kwargs = {"format": fmt, "optimize": True}
        if fmt == "JPEG":
            save_kwargs["quality"] = 82
        img.save(buf, **save_kwargs)
        buf.seek(0)

        thumb_blob = bucket.blob(thumb_name)
        thumb_blob.upload_from_file(buf, content_type=blob.content_type)
        thumb_blob.make_public()

        print("done")

    print(f"\nUploaded {len(photos)} thumbnails to gs://{BUCKET_NAME}/{THUMBS_PREFIX}")


if __name__ == "__main__":
    generate_thumbs()
