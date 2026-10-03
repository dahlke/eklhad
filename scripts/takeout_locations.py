#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["reverse_geocoder", "pycountry", "Pillow", "pillow-heif"]
# ///
"""
Walks a folder of Google Takeout zips one at a time: unzip, read photo GPS,
reverse-geocode to a city, log it, delete the unzipped folder, next zip.

Writes a CSV in the `locations` sheet column order (plus review columns) and
copies the best few photos for each notable place so they survive the cleanup.
Progress is saved after every zip, so a rerun resumes where it stopped.

Usage:
    uv run scripts/takeout_locations.py /Volumes/neilo/2026_09_29_takeout_dahlkeio
"""

import argparse
import csv
import json
import math
import re
import shutil
import sys
import urllib.request
import zipfile
from datetime import datetime, timezone
from pathlib import Path

import pycountry
import reverse_geocoder
from PIL import Image
from pillow_heif import register_heif_opener

register_heif_opener()

LOCATIONS_URL = "https://storage.googleapis.com/eklhad-web-public/data/locations.json"
IMAGE_EXTS = {".jpg", ".jpeg", ".heic", ".heif", ".png"}
MEDIA_EXTS = IMAGE_EXTS | {".mp4", ".mov"}
ON_MAP_KM = 15
HOME_KM = 80
NOTABLE_MIN_PHOTOS = 10
PHOTOS_PER_PLACE = 3
SHEET_COLUMNS = [
    "City", "State / Province / Region / District", "Country", "Current", "Layover",
    "Home", "Lat", "Lng", "Confirmed", "Departed From", "Travel Mode", "Photo URL",
    "Location Emoji",
]
REVIEW_COLUMNS = [
    "Notable", "On Map As", "Photos", "Days", "First Seen", "Last Seen", "Candidate Photos",
]


def km(a, b):
    lat1, lng1, lat2, lng2 = map(math.radians, (*a, *b))
    h = math.sin((lat2 - lat1) / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin((lng2 - lng1) / 2) ** 2
    return 6371 * 2 * math.asin(math.sqrt(h))


def country_name(cc):
    country = pycountry.countries.get(alpha_2=cc)
    return getattr(country, "common_name", None) or (country.name if country else cc)


def slug(text):
    return re.sub(r"[^a-z0-9]+", "_", text.lower()).strip("_")


def media_for_sidecar(sidecar):
    # Takeout truncates sidecar names ("x.jpg.supplemental-metad.json") and moves
    # duplicate counters to the end ("x.jpg.supplemental-metadata(1).json" -> "x(1).jpg").
    name = sidecar.name[: -len(".json")]
    counter = re.search(r"(\(\d+\))$", name)
    name = re.sub(r"\(\d+\)$", "", name)
    if Path(name).suffix.lower() not in MEDIA_EXTS:
        name = re.sub(r"\.s[a-z-]*$", "", name)
    if counter:
        stem, ext = Path(name).stem, Path(name).suffix
        name = f"{stem}{counter.group(1)}{ext}"
    return sidecar.with_name(name)


def exif_gps(path):
    try:
        with Image.open(path) as img:
            gps = img.getexif().get_ifd(0x8825)
            taken = img.getexif().get_ifd(0x8769).get(36867) or img.getexif().get(306)
    except Exception:
        return None, None
    if not gps or 2 not in gps or 4 not in gps:
        return None, taken
    to_deg = lambda v: float(v[0]) + float(v[1]) / 60 + float(v[2]) / 3600
    lat = to_deg(gps[2]) * (-1 if gps.get(1) == "S" else 1)
    lng = to_deg(gps[4]) * (-1 if gps.get(3) == "W" else 1)
    return (lat, lng), taken


def scan(root):
    """Yield one dict per geotagged item. Takeout often puts a photo and its sidecar in different zips."""
    covered = set()
    for sidecar in root.rglob("*.json"):
        try:
            meta = json.loads(sidecar.read_text())
        except (ValueError, UnicodeDecodeError):
            continue
        if not isinstance(meta, dict) or "photoTakenTime" not in meta:
            continue
        media = media_for_sidecar(sidecar)
        covered.add(media)
        geo = next(
            (g for g in (meta.get("geoData"), meta.get("geoDataExif"))
             if g and (g.get("latitude") or g.get("longitude"))),
            None,
        )
        latlng = (geo["latitude"], geo["longitude"]) if geo else None
        if not latlng and media.exists() and media.suffix.lower() in IMAGE_EXTS:
            latlng, _ = exif_gps(media)
        if not latlng:
            continue
        taken = datetime.fromtimestamp(int(meta["photoTakenTime"]["timestamp"]), timezone.utc)
        yield {
            "id": meta.get("url") or f"{meta.get('title')}:{taken.isoformat()}",
            "rel": str(media.relative_to(root)), "latlng": latlng, "taken": taken,
            "media": media if media.exists() else None, "favorited": bool(meta.get("favorited")),
        }

    for media in root.rglob("*"):
        if media in covered or media.suffix.lower() not in IMAGE_EXTS:
            continue
        latlng, taken = exif_gps(media)
        try:
            taken = datetime.strptime(str(taken), "%Y:%m:%d %H:%M:%S").replace(tzinfo=timezone.utc)
        except ValueError:
            taken = datetime.fromtimestamp(media.stat().st_mtime, timezone.utc)
        rel = str(media.relative_to(root))
        yield {"id": rel, "rel": rel, "latlng": latlng, "taken": taken, "media": media, "favorited": False}


def load_map():
    with urllib.request.urlopen(LOCATIONS_URL) as resp:
        return json.load(resp)


def on_map_as(latlng, pins):
    nearest = min(pins, key=lambda p: km(latlng, (p["lat"], p["lng"])))
    return nearest if km(latlng, (nearest["lat"], nearest["lng"])) <= ON_MAP_KM else None


def near_home(latlng, homes):
    return any(km(latlng, (h["lat"], h["lng"])) <= HOME_KM for h in homes)


def is_notable(place, pins, homes):
    pin = on_map_as(place["latlng"], pins)
    has_photo = bool(pin and pin.get("photourl"))
    enough = len(place["photos"]) >= NOTABLE_MIN_PHOTOS or place["favorites"] > 0
    return not near_home(place["latlng"], homes) and not has_photo and enough


def photo_score(candidate):
    return (candidate["favorited"], candidate["size"])


def keep_candidate(place, media, favorited, taken, photos_dir, homes):
    if media.suffix.lower() not in IMAGE_EXTS or near_home(place["latlng"], homes):
        return
    candidate = {"favorited": favorited, "size": media.stat().st_size}
    kept = place["candidates"]
    if len(kept) >= PHOTOS_PER_PLACE and photo_score(candidate) <= photo_score(kept[-1]):
        return
    dest_dir = photos_dir / place["slug"]
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / f"{place['slug']}_{taken[:10].replace('-', '_')}_{media.name}"
    shutil.copy2(media, dest)
    candidate["path"] = str(dest)
    kept.append(candidate)
    kept.sort(key=photo_score, reverse=True)
    for dropped in kept[PHOTOS_PER_PLACE:]:
        Path(dropped["path"]).unlink(missing_ok=True)
    del kept[PHOTOS_PER_PLACE:]


def process_zip(zip_path, work_dir, state, photos_dir, homes):
    shutil.rmtree(work_dir, ignore_errors=True)
    work_dir.mkdir(parents=True)
    with zipfile.ZipFile(zip_path) as zf:
        for member in zf.infolist():
            try:
                zf.extract(member, work_dir)
            except OSError as e:
                print(f"    skipped {member.filename}: {e}", flush=True)

    batch = []
    for item in scan(work_dir):
        pending = state["pending"].pop(item["rel"], None)
        if pending:
            place = state["places"][pending["key"]]
            keep_candidate(place, item["media"], pending["favorited"], pending["taken"], photos_dir, homes)
        elif item["latlng"] and item["id"] not in state["seen"] and item["rel"] not in state["seen"]:
            state["seen"].update((item["id"], item["rel"]))
            batch.append(item)

    cities = reverse_geocoder.search([item["latlng"] for item in batch], mode=1, verbose=False) if batch else []
    for item, city in zip(batch, cities):
        key = f"{city['name']}|{city['admin1']}|{city['cc']}"
        place = state["places"].setdefault(key, {
            "city": city["name"], "state": city["admin1"], "country": country_name(city["cc"]),
            "latlng": (float(city["lat"]), float(city["lon"])), "slug": slug(city["name"]),
            "photos": [], "favorites": 0, "candidates": [],
        })
        taken = item["taken"].isoformat()
        place["photos"].append(taken)
        place["favorites"] += item["favorited"]
        if item["media"]:
            keep_candidate(place, item["media"], item["favorited"], taken, photos_dir, homes)
        elif Path(item["rel"]).suffix.lower() in IMAGE_EXTS:
            state["pending"][item["rel"]] = {"key": key, "favorited": item["favorited"], "taken": taken}

    shutil.rmtree(work_dir)
    state["done"].append(zip_path.name)
    return len(batch)


def departures(places):
    """Guess Departed From / Travel Mode from the previous place visited, by first-seen time."""
    visits = sorted((t, key) for key, p in places.items() for t in p["photos"])
    guesses, previous = {}, None
    for _, key in visits:
        if previous and key != previous and key not in guesses:
            distance = km(places[key]["latlng"], places[previous]["latlng"])
            guesses[key] = (places[previous]["city"], "Plane" if distance > 400 else "Car")
        previous = key
    return guesses


def write_csv(state, pins, out_csv):
    homes = [p for p in pins if p.get("home")]
    guesses = departures(state["places"])
    rows = []
    for key, place in state["places"].items():
        pin = on_map_as(place["latlng"], pins)
        days = sorted({t[:10] for t in place["photos"]})
        departed, mode = guesses.get(key, ("", ""))
        rows.append({
            "City": place["city"], "State / Province / Region / District": place["state"],
            "Country": place["country"], "Current": "FALSE", "Layover": "FALSE", "Home": "FALSE",
            "Lat": place["latlng"][0], "Lng": place["latlng"][1], "Confirmed": "FALSE",
            "Departed From": departed, "Travel Mode": mode, "Photo URL": "", "Location Emoji": "",
            "Notable": "TRUE" if is_notable(place, pins, homes) else "",
            "On Map As": pin["city"] if pin else "",
            "Photos": len(place["photos"]), "Days": len(days),
            "First Seen": days[0], "Last Seen": days[-1],
            "Candidate Photos": " | ".join(c["path"] for c in place["candidates"]),
        })
    rows.sort(key=lambda r: (r["Notable"] != "TRUE", bool(r["On Map As"]), -r["Photos"]))
    with open(out_csv, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=SHEET_COLUMNS + REVIEW_COLUMNS)
        writer.writeheader()
        writer.writerows(rows)
    return rows


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("takeout_dir", type=Path)
    parser.add_argument("--out", type=Path, help="defaults to <takeout_dir>/../takeout_locations")
    parser.add_argument("--glob", default="takeout-*.zip")
    args = parser.parse_args()

    out_dir = args.out or args.takeout_dir.parent / "takeout_locations"
    out_dir.mkdir(parents=True, exist_ok=True)
    state_path = out_dir / "state.json"
    state = json.loads(state_path.read_text()) if state_path.exists() else {"done": [], "seen": [], "pending": {}, "places": {}}
    state["seen"] = set(state["seen"])
    for place in state["places"].values():
        place["latlng"] = tuple(place["latlng"])
    pins = load_map()
    homes = [p for p in pins if p.get("home")]

    zips = sorted(args.takeout_dir.glob(args.glob))
    for i, zip_path in enumerate(zips, 1):
        if zip_path.name in state["done"]:
            continue
        print(f"[{i}/{len(zips)}] {zip_path.name}", flush=True)
        found = process_zip(zip_path, out_dir / "_unzipped", state, out_dir / "photos", homes)
        state_path.write_text(json.dumps({**state, "seen": sorted(state["seen"])}))
        rows = write_csv(state, pins, out_dir / "locations.csv")
        print(f"    {found} new geotagged photos, {len(rows)} places, "
              f"{sum(r['Notable'] == 'TRUE' for r in rows)} notable", flush=True)

    print(f"Done. {out_dir / 'locations.csv'}")


if __name__ == "__main__":
    sys.exit(main())
