#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["reverse_geocoder", "pycountry", "Pillow", "pillow-heif"]
# ///
"""
Second pass over the Takeout zips: re-picks candidate photos for every place
found by takeout_locations.py, this time using the people Google Photos tagged
in each photo. Photos tagged with an excluded person are never picked, and
photos with nobody tagged win over photos with people.

Nothing is unzipped. The metadata is read straight out of each zip into an
index (saved, so reruns are quick), and only the picked photos are extracted.

Usage:
    uv run scripts/takeout_repick.py /Volumes/neilo/2026_09_29_takeout_dahlkeio --exclude-person Roxanna
    uv run scripts/takeout_repick.py /Volumes/neilo/2026_09_29_takeout_dahlkeio --exclude-person Roxanna --more 10
"""

import argparse
import json
import zipfile
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath

import reverse_geocoder

from takeout_locations import IMAGE_EXTS, country_name, load_map, media_for_sidecar, near_home, slug

DESKTOP = Path.home() / "Desktop"
PICKS_PER_PLACE = 5
BURST_SECONDS = 120


def build_index(zips):
    """One entry per geotagged photo: where it was taken, when, who is tagged, and which zip holds the file."""
    photos, files = {}, {}
    for i, zip_path in enumerate(zips, 1):
        print(f"[{i}/{len(zips)}] indexing {zip_path.name}", flush=True)
        with zipfile.ZipFile(zip_path) as zf:
            for info in zf.infolist():
                name = PurePosixPath(info.filename)
                if name.suffix.lower() in IMAGE_EXTS:
                    files[info.filename] = {"zip": zip_path.name, "size": info.file_size}
                if name.suffix != ".json":
                    continue
                try:
                    meta = json.loads(zf.read(info))
                except (ValueError, UnicodeDecodeError):
                    continue
                if not isinstance(meta, dict) or "photoTakenTime" not in meta:
                    continue
                geo = next(
                    (g for g in (meta.get("geoData"), meta.get("geoDataExif"))
                     if g and (g.get("latitude") or g.get("longitude"))),
                    None,
                )
                if not geo:
                    continue
                photos[str(media_for_sidecar(name))] = {
                    "id": meta.get("url") or info.filename,
                    "latlng": (geo["latitude"], geo["longitude"]),
                    "taken": int(meta["photoTakenTime"]["timestamp"]),
                    "people": [p["name"] for p in meta.get("people", [])],
                    "favorited": bool(meta.get("favorited")),
                }
    for rel, photo in photos.items():
        photo.update(files.get(rel, {}))
    return photos


def place_keys(photos):
    cities = reverse_geocoder.search([tuple(p["latlng"]) for p in photos], mode=1, verbose=False)
    return ["|".join((c["name"], c["admin1"], country_name(c["cc"]))) for c in cities]


def ranked(photos, excluded):
    """Usable photos for one place, best first, never the excluded person."""
    usable, seen = [], set()
    for photo in sorted(photos, key=lambda p: (p["favorited"], p.get("size", 0)), reverse=True):
        tagged_excluded = any(x.lower() in name.lower() for x in excluded for name in photo["people"])
        if "zip" not in photo or photo["id"] in seen or tagged_excluded:
            continue
        seen.add(photo["id"])
        usable.append(photo)
    return usable


def spaced(pool, picks, limit):
    """Fill picks from pool up to limit, skipping burst shots until there is nothing else left."""
    for spacing in (BURST_SECONDS, 0):
        for photo in pool:
            if len(picks) >= limit:
                break
            if photo not in picks and all(abs(photo["taken"] - p["taken"]) >= spacing for p in picks):
                picks.append(photo)
    return picks


def pick(photos, excluded, keep):
    """Nobody tagged first, people only if that leaves nothing. Keeps already-approved photos."""
    usable = ranked(photos, excluded)
    pool = [p for p in usable if not p["people"]] or usable
    return spaced(pool, [p for p in usable if p["name"] in keep], PICKS_PER_PLACE)


def more(photos, excluded, shown, count):
    """The next best photos not shown yet: nobody tagged first, then people."""
    usable = [p for p in ranked(photos, excluded) if p["name"] not in shown]
    pool = [p for p in usable if not p["people"]] + [p for p in usable if p["people"]]
    return spaced(pool, [], count)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("takeout_dir", type=Path)
    parser.add_argument("--exclude-person", action="append", default=[], help="name, or part of one, to never pick")
    parser.add_argument("--glob", default="takeout-*.zip")
    parser.add_argument("--index", type=Path, help="defaults to <takeout_dir>/../takeout_locations/index.json")
    parser.add_argument("--more", type=int, metavar="N",
                        help="instead of re-picking, add N more photos to notable places with no approved photo")
    parser.add_argument("--data-dir", type=Path, default=DESKTOP, help="holds takeout_locations.json and takeout_decisions.json")
    args = parser.parse_args()

    index_path = args.index or args.takeout_dir.parent / "takeout_locations/index.json"
    if index_path.exists():
        index = json.loads(index_path.read_text())
    else:
        index = build_index(sorted(args.takeout_dir.glob(args.glob)))
        index_path.write_text(json.dumps(index))
    for rel, photo in index.items():
        photo["rel"], photo["name"] = rel, PurePosixPath(rel).name

    by_place = defaultdict(list)
    for photo, key in zip(index.values(), place_keys(list(index.values()))):
        by_place[key].append(photo)

    locations_path, decisions_path = args.data_dir / "takeout_locations.json", args.data_dir / "takeout_decisions.json"
    photos_dir = args.data_dir / "takeout_location_photos_v2"
    places = json.loads(locations_path.read_text())
    decisions = json.loads(decisions_path.read_text())
    homes = [p for p in load_map() if p.get("home")]

    to_extract, approvals = defaultdict(list), dict(decisions["photos"])
    stats = defaultdict(int)
    for place in places:
        if near_home((place["Lat"], place["Lng"]), homes):
            continue
        key = "|".join((place["City"], place["State / Province / Region / District"], place["Country"]))
        prefix = slug(place["City"])
        # candidate files are named "<slug>_<YYYY_MM_DD>_<original name>"
        if args.more:
            shown = place["Candidate Photos"]
            if (not place["Notable"] or decisions["locations"].get(key) == "rejected"
                    or any(decisions["photos"].get(p) == "approved" for p in shown)):
                continue
            extra = more(by_place.get(key, []), args.exclude_person, {Path(p).name[len(prefix) + 12:] for p in shown}, args.more)
            stats["notable places given more photos"] += bool(extra)
            stats["notable places with nothing more to show"] += not extra
            for photo in extra:
                taken = datetime.fromtimestamp(photo["taken"], timezone.utc)
                dest = photos_dir / prefix / f"{prefix}_{taken:%Y_%m_%d}_{photo['name']}"
                to_extract[photo["zip"]].append((photo["rel"], dest))
                shown.append(str(dest))
            continue
        approved = {Path(p).name[len(prefix) + 12:] for p in place["Candidate Photos"] if decisions["photos"].get(p) == "approved"}
        picks = pick(by_place.get(key, []), args.exclude_person, approved)
        if not picks:
            stats["kept old candidates (nothing usable in pass 2)"] += 1
            continue
        stats["places re-picked"] += 1
        stats["places with only people photos"] += all(p["people"] for p in picks)
        stats["approved places back to undecided"] += bool(approved) and not any(p["name"] in approved for p in picks)
        for old in place["Candidate Photos"]:
            approvals.pop(old, None)
        place["Candidate Photos"] = []
        for photo in picks:
            taken = datetime.fromtimestamp(photo["taken"], timezone.utc)
            dest = photos_dir / prefix / f"{prefix}_{taken:%Y_%m_%d}_{photo['name']}"
            to_extract[photo["zip"]].append((photo["rel"], dest))
            place["Candidate Photos"].append(str(dest))
            if photo["name"] in approved:
                approvals[str(dest)] = "approved"

    for zip_name, wanted in sorted(to_extract.items()):
        print(f"extracting {len(wanted)} photos from {zip_name}", flush=True)
        with zipfile.ZipFile(args.takeout_dir / zip_name) as zf:
            for rel, dest in wanted:
                if not dest.exists():
                    dest.parent.mkdir(parents=True, exist_ok=True)
                    dest.write_bytes(zf.read(rel))

    for path in (locations_path, decisions_path):
        backup = path.with_name(f"{path.stem}_pass1.json")
        if not backup.exists():
            backup.write_text(path.read_text())
    locations_path.write_text(json.dumps(places, indent=2, ensure_ascii=False))
    if not args.more:
        decisions["photos"] = approvals
        decisions_path.write_text(json.dumps(decisions, indent=2, ensure_ascii=False))

    for label, count in stats.items():
        print(f"{count:5d}  {label}")
    if not args.more:
        print(f"{sum(v == 'approved' for v in approvals.values()):5d}  photo approvals carried over")


if __name__ == "__main__":
    main()
