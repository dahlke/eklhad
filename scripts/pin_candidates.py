#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["reverse_geocoder", "pycountry", "Pillow", "pillow-heif"]
# ///
"""
Finds more candidate photos for map pins, by distance rather than by place
name: every geotagged photo is snapped to its nearest pin (within SNAP_KM), and
each target pin gets the next best photos it hasn't shown yet. Results go into
the review app's data, adding a row for pins the Takeout scan never named.

Usage:
    uv run scripts/pin_candidates.py /Volumes/neilo/2026_09_29_takeout_dahlkeio \
        --index ~/eklhad-takeout/import/index.json --targets targets.txt --exclude-person "Full Name"
"""

import argparse
import json
import math
import time
import urllib.request
import zipfile
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath

from takeout_repick import more, slug

WORKDIR = Path.home() / "eklhad-takeout"
LOCATIONS_URL = "https://storage.googleapis.com/eklhad-web-public/data/locations.json"
SNAP_KM = 30


def km(a, b):
    la1, lo1, la2, lo2 = map(math.radians, (*a, *b))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 12742 * math.asin(math.sqrt(h))


def snap(photos, pins):
    grid = defaultdict(list)
    for i, p in enumerate(pins):
        grid[(round(p["lat"]), round(p["lng"]))].append(i)
    by_pin = defaultdict(list)
    for photo in photos:
        lat, lng = photo["latlng"]
        near = [i for dy in (-1, 0, 1) for dx in (-1, 0, 1) for i in grid.get((round(lat) + dy, round(lng) + dx), [])]
        if near:
            best = min(near, key=lambda i: km((lat, lng), (pins[i]["lat"], pins[i]["lng"])))
            if km((lat, lng), (pins[best]["lat"], pins[best]["lng"])) <= SNAP_KM:
                by_pin[best].append(photo)
    return by_pin


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("takeout_dir", type=Path)
    parser.add_argument("--index", type=Path, required=True)
    parser.add_argument("--targets", type=Path, required=True, help="map city names, one per line")
    parser.add_argument("--exclude-person", action="append", default=[])
    parser.add_argument("--count", type=int, default=10)
    parser.add_argument("--data-dir", type=Path, default=WORKDIR)
    args = parser.parse_args()

    with urllib.request.urlopen(f"{LOCATIONS_URL}?t={int(time.time())}") as resp:
        pins = [p for p in json.load(resp) if isinstance(p.get("lat"), (int, float))]
    index = json.loads(args.index.read_text())
    for rel, photo in index.items():
        photo["rel"], photo["name"] = rel, PurePosixPath(rel).name
    by_pin = snap(index.values(), pins)

    locations_path = args.data_dir / "takeout_locations.json"
    rows = json.loads(locations_path.read_text())
    backup = locations_path.with_name(f"takeout_locations_before_pins_{time.strftime('%Y%m%d_%H%M%S')}.json")
    backup.write_text(locations_path.read_text())
    photos_dir = args.data_dir / "takeout_location_photos_v2"

    targets = [t.strip() for t in args.targets.read_text().splitlines() if t.strip()]
    to_extract = defaultdict(list)
    for city in targets:
        pin_index = next((i for i, p in enumerate(pins) if p["city"] == city), None)
        if pin_index is None:
            continue
        pin = pins[pin_index]
        row = next((r for r in rows if r["City"] == city), None) or next((r for r in rows if r.get("On Map As") == city), None)
        if row is None and not by_pin.get(pin_index):
            continue
        if row is None:
            snapped = by_pin.get(pin_index, [])
            days = sorted({datetime.fromtimestamp(p["taken"], timezone.utc).strftime("%Y-%m-%d") for p in snapped})
            row = {"City": city, "State / Province / Region / District": pin["stateprovinceregion"], "Country": pin["country"],
                   "Lat": pin["lat"], "Lng": pin["lng"], "Notable": pin["notable"], "On Map As": city,
                   "Photos": len(snapped), "Days": len(days), "First Seen": days[0] if days else "",
                   "Last Seen": days[-1] if days else "", "Candidate Photos": []}
            rows.append(row)
        prefix = slug(row["City"])
        shown = {Path(p).name[len(prefix) + 12:] for p in row["Candidate Photos"]}
        extra = more(by_pin.get(pin_index, []), args.exclude_person, shown, args.count)
        for photo in extra:
            taken = datetime.fromtimestamp(photo["taken"], timezone.utc)
            dest = photos_dir / prefix / f"{prefix}_{taken:%Y_%m_%d}_{photo['name']}"
            to_extract[photo["zip"]].append((photo["rel"], dest))
            row["Candidate Photos"].append(str(dest))
        print(f"{city}: {len(extra)} more ({len(by_pin.get(pin_index, []))} photos near the pin)", flush=True)

    for zip_name, wanted in sorted(to_extract.items()):
        with zipfile.ZipFile(args.takeout_dir / zip_name) as zf:
            for rel, dest in wanted:
                if not dest.exists():
                    dest.parent.mkdir(parents=True, exist_ok=True)
                    dest.write_bytes(zf.read(rel))
    locations_path.write_text(json.dumps(rows, indent=2, ensure_ascii=False))
    print(f"extracted {sum(len(w) for w in to_extract.values())} photos; backup at {backup}")


if __name__ == "__main__":
    main()
