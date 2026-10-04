#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["google-api-python-client", "google-auth"]
# ///
"""
Infers Departed From (J) and Travel Mode (K) for the locations sheet from the
photo timeline in a Takeout metadata index (built by takeout_repick.py).

Every geotagged photo is snapped to its nearest pin. For each pin, the photos
just before its first visit say where you came from and how fast you moved:
- the previous pin, unless the gap is over GAP_DAYS, then wherever home was
- photo times that imply impossible speeds (shared photos, bad clocks) are skipped
- mode from distance and elapsed time: short or drivable hops are Car, long
  or too-fast ones are Plane

Only blank cells and rows past --from-row are written; hand-entered rows,
ferries and trains are left alone. Dry run by default.

Usage:
    uv run scripts/infer_trips.py /Volumes/neilo/takeout_locations/index.json --from-row 394
    uv run scripts/infer_trips.py /Volumes/neilo/takeout_locations/index.json --from-row 394 --apply
"""

import argparse
import json
import math
import os
from collections import Counter, defaultdict
from datetime import datetime, timezone

from google.oauth2 import service_account
from googleapiclient.discovery import build

SPREADSHEET_ID = "1Ex7AuwS25FoyP_h_HYVQjKr3XwPurZd2Heos3zb2gBI"
SNAP_KM = 30
GAP_DAYS = 5
MAX_KMH = 750
CAR_KMH = 80
ALWAYS_CAR_KM = 600
ALWAYS_PLANE_KM = 1000


def km(a, b):
    la1, lo1, la2, lo2 = map(math.radians, (*a, *b))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 12742 * math.asin(math.sqrt(h))


def snap(photos, pins):
    """(timestamp, pin index) per photo, nearest pin within SNAP_KM, using a coarse grid to keep it fast."""
    grid = defaultdict(list)
    for i, p in enumerate(pins):
        if isinstance(p["lat"], (int, float)) and isinstance(p["lng"], (int, float)):
            grid[(round(p["lat"]), round(p["lng"]))].append(i)
    timeline = []
    for photo in photos:
        lat, lng = photo["latlng"]
        near = [i for dy in (-1, 0, 1) for dx in (-1, 0, 1) for i in grid.get((round(lat) + dy, round(lng) + dx), [])]
        if not near:
            continue
        best = min(near, key=lambda i: km((lat, lng), (pins[i]["lat"], pins[i]["lng"])))
        if km((lat, lng), (pins[best]["lat"], pins[best]["lng"])) <= SNAP_KM:
            timeline.append((photo["taken"], best))
    return sorted(set(timeline))


def homes_by_year(timeline):
    """Where home was each year: the pin with the most distinct photo days."""
    days = defaultdict(set)
    for t, pin in timeline:
        day = datetime.fromtimestamp(t, timezone.utc).date()
        days[(day.year, pin)].add(day)
    best = {}
    for (year, pin), seen in days.items():
        if len(seen) > best.get(year, (0, None))[0]:
            best[year] = (len(seen), pin)
    return {year: pin for year, (_, pin) in best.items()}


def mode(distance, hours, same_country):
    if distance < ALWAYS_CAR_KM:
        return "Car"
    if distance >= ALWAYS_PLANE_KM or not same_country:
        return "Plane"
    return "Car" if hours >= distance / CAR_KMH else "Plane"


def infer(pins, timeline, homes):
    first = {}
    for k, (_, pin) in enumerate(timeline):
        first.setdefault(pin, k)
    out = {}
    for pin, k in first.items():
        t, here = timeline[k][0], (pins[pin]["lat"], pins[pin]["lng"])
        origin = None
        for j in range(k - 1, max(-1, k - 200), -1):
            t0, prev = timeline[j]
            if prev == pin:
                continue
            hours = max((t - t0) / 3600, 0.01)
            distance = km(here, (pins[prev]["lat"], pins[prev]["lng"]))
            if distance / hours > MAX_KMH:
                continue
            origin = (prev, hours, distance)
            break
        if origin is None:
            continue
        prev, hours, distance = origin
        basis = "photos"
        if hours > GAP_DAYS * 24:
            basis = f"home guess ({round(hours / 24)}d gap)"
            home = homes.get(datetime.fromtimestamp(t, timezone.utc).year)
            if home is None or home == pin:
                continue
            prev, distance = home, km(here, (pins[home]["lat"], pins[home]["lng"]))
            hours = distance / CAR_KMH + 1 if distance < ALWAYS_CAR_KM else 0
        out[pin] = (pins[prev]["city"], mode(distance, hours, pins[prev]["country"] == pins[pin]["country"]), round(distance), round(hours), basis)
    return out


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("index", help="index.json from takeout_repick.py")
    parser.add_argument("--from-row", type=int, required=True, help="sheet rows at or after this are fully re-inferred")
    parser.add_argument("--keep", type=int, action="append", default=[], help="sheet row to leave untouched")
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    creds = service_account.Credentials.from_service_account_file(
        os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", os.path.expanduser("~/.gcp/eklhad-web-packer.json")),
        scopes=["https://www.googleapis.com/auth/spreadsheets"],
    )
    values = build("sheets", "v4", credentials=creds).spreadsheets().values()
    header, *data = values.get(spreadsheetId=SPREADSHEET_ID, range="locations!A1:Z", valueRenderOption="UNFORMATTED_VALUE").execute()["values"]
    # Columns are found by header name so the sheet can be reordered
    rows = [{name: (r[i] if i < len(r) else "") for i, name in enumerate(header)} for r in data]
    letter = {name: chr(ord("A") + i) for i, name in enumerate(header)}
    pins = [{"city": r["City"], "country": r["Country"], "lat": r["Lat"], "lng": r["Lng"]} for r in rows]

    timeline = snap(json.load(open(args.index)).values(), pins)
    inferred = infer(pins, timeline, homes_by_year(timeline))

    updates, modes = [], Counter()
    for i, r in enumerate(rows):
        sheet_row = i + 2
        if i not in inferred or r["Travel Mode"] in ("Ferry", "Train", "Bus") or sheet_row in args.keep:
            continue
        if sheet_row < args.from_row and r["Departed From"]:
            continue
        departed, travel, distance, hours, basis = inferred[i]
        updates.append({"range": f"locations!{letter['Departed From']}{sheet_row}", "values": [[departed]]})
        updates.append({"range": f"locations!{letter['Travel Mode']}{sheet_row}", "values": [[travel]]})
        modes[travel] += 1
        print(f"row {sheet_row:4} {r['City'][:26]:26} <- {departed[:22]:22} {travel:5} {distance:6} km {hours:6} h  {basis}")
    print(f"{sum(modes.values())} rows, {dict(modes)}; {len(timeline)} photos snapped to pins")
    if args.apply and updates:
        values.batchUpdate(spreadsheetId=SPREADSHEET_ID, body={"valueInputOption": "RAW", "data": updates}).execute()
        print("written")


if __name__ == "__main__":
    main()
