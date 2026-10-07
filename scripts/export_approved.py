#!/usr/bin/env python3
"""
Exports every place approved in review_locations.py (the place itself, or one
of its photos) into one folder: the approved photos named
`{slug}_{YYYY_MM_DD}.{ext}` like the map's photos, plus `locations.csv` in the
sheet's column order with Notable and Has Photo appended, and `manifest.json`.
Rerun as more get approved; photos no longer approved are removed.

Usage:
    python3 scripts/export_approved.py
"""

import argparse
import csv
import json
import re
import shutil
from pathlib import Path

WORKDIR = Path.home() / "eklhad-takeout"
SHEET_COLUMNS = [
    "City", "State / Province / Region / District", "Country", "Current", "Layover",
    "Home", "Lat", "Lng", "Confirmed", "Departed From", "Travel Mode", "Photo URL",
    "Location Emoji",
]


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--out", type=Path, default=WORKDIR / "takeout_approved")
    args = parser.parse_args()

    places = json.loads((WORKDIR / "takeout_locations.json").read_text())
    decisions = json.loads((WORKDIR / "takeout_decisions.json").read_text())
    args.out.mkdir(exist_ok=True)

    manifest = []
    for place in places:
        key = "|".join((place["City"], place["State / Province / Region / District"], place["Country"]))
        verdict = decisions["locations"].get(key)
        photos = [Path(p) for p in place["Candidate Photos"] if decisions["photos"].get(p) == "approved"]
        if verdict == "rejected" or not (verdict == "approved" or photos):
            continue
        files = []
        for source in photos:
            slug, date = re.match(r"(.+)_(\d{4}_\d{2}_\d{2})_", source.name).groups()
            dest = args.out / f"{slug}_{date}{source.suffix.lower()}"
            n = 2
            while dest.name in files or (dest.exists() and dest.stat().st_size != source.stat().st_size):
                dest = args.out / f"{slug}_{date}_{n}{source.suffix.lower()}"
                n += 1
            if not dest.exists():
                shutil.copy2(source, dest)
            files.append(dest.name)
        manifest.append({**{k: v for k, v in place.items() if k != "Candidate Photos"},
                         "Has Photo": bool(files), "Photo Files": files})

    kept = {f for m in manifest for f in m["Photo Files"]} | {"manifest.json", "locations.csv"}
    for stale in args.out.iterdir():
        if stale.is_file() and stale.name not in kept:
            stale.unlink()

    (args.out / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False))
    with open(args.out / "locations.csv", "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(SHEET_COLUMNS + ["Notable", "Has Photo"])
        for m in manifest:
            row = [m[c] for c in SHEET_COLUMNS] + [m["Notable"], m["Has Photo"]]
            writer.writerow(("TRUE" if v else "FALSE") if isinstance(v, bool) else v for v in row)

    for notable in (True, False):
        group = [m for m in manifest if m["Notable"] == notable]
        print(f"{'Notable' if notable else 'Other':8} {len(group):4} places, {sum(m['Has Photo'] for m in group):4} with a photo")
    print(args.out)


if __name__ == "__main__":
    main()
