#!/usr/bin/env python3
"""
Generates web/frontend/src/config/tripRoutes.json from the Google Sheet.
Each entry: {"from": "City A", "to": "City B", "mode": "Plane|Train|Car|Ferry"}
Car entries also get "path": the driving route as [[lng, lat], ...] from the
public OSRM router, so drives follow roads instead of arcs. Paths already in the
file are reused when the endpoints have not moved.

Filtering:
  - Skip rows with no Departed From or no Travel Mode
  - Skip self-referential departures (city departs from itself)
  - Skip "Taiwan" as a departure (not a city; map to Taipei)
  - For Car routes: only include if the two cities are > 25 km apart
    (avoids suburb-to-suburb clutter on the global map)
"""

import json
import math
import os
import sys
import time
import urllib.request

try:
    from googleapiclient.discovery import build
    from google.oauth2 import service_account
except ImportError:
    print("Missing deps. Run via `uv run python scripts/generate_trip_routes.py` (or `uv sync` first).")
    sys.exit(1)

SPREADSHEET_ID = "1Ex7AuwS25FoyP_h_HYVQjKr3XwPurZd2Heos3zb2gBI"
SA_PATH = os.environ.get(
    "GOOGLE_APPLICATION_CREDENTIALS",
    os.path.expanduser("~/.gcp/eklhad-web-packer.json"),
)
OUT_PATH = os.path.join(
    os.path.dirname(__file__),
    "../web/frontend/src/config/tripRoutes.json",
)

# Normalize departure city names that don't match the City column
DEP_ALIASES = {
    "Taiwan":       "Taipei",
    "New York City": "New York",
    "Reykjavik":    "Reykjavík",
    "Valetta":      "Valletta",
}

# Haversine distance in km
def haversine(lat1, lng1, lat2, lng2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng/2)**2
    return R * 2 * math.asin(math.sqrt(a))

CAR_MIN_KM = 25  # suppress very short car hops
OSRM = "https://router.project-osrm.org/route/v1/driving/{};{}?overview=simplified&geometries=geojson"


def closest_pair(froms, tos):
    """Cities are looked up by name; when a name is shared (Saratoga CA and WY), use the closest pair."""
    if not froms or not tos:
        return None
    return min(((a, b) for a in froms for b in tos), key=lambda p: haversine(*p[0], *p[1]))


def driving_path(a, b):
    url = OSRM.format(f"{a[1]},{a[0]}", f"{b[1]},{b[0]}")
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "dahlke.io trip routes"}), timeout=30) as resp:
            data = json.load(resp)
    except OSError as e:
        print(f"  no road route {a} -> {b}: {e}")
        return None
    finally:
        time.sleep(1)  # OSRM demo server asks for at most one request a second
    if data.get("code") != "Ok":
        return None
    return [[round(lng, 4), round(lat, 4)] for lng, lat in data["routes"][0]["geometry"]["coordinates"]]

def main():
    creds = service_account.Credentials.from_service_account_file(
        SA_PATH, scopes=["https://www.googleapis.com/auth/spreadsheets.readonly"]
    )
    service = build("sheets", "v4", credentials=creds)

    result = service.spreadsheets().values().get(
        spreadsheetId=SPREADSHEET_ID,
        range="locations!A1:Z",
    ).execute()
    header, *data = result.get("values", [])
    # Columns are found by header name so the sheet can be reordered
    rows = [{name: (r[i].strip() if i < len(r) else "") for i, name in enumerate(header)} for r in data]

    # Build city → [(lat, lng), ...] lookup; a name can belong to several places
    coords: dict[str, list[tuple[float, float]]] = {}
    for row in rows:
        city = row["City"]
        try:
            lat, lng = float(row["Lat"]), float(row["Lng"])
        except ValueError:
            lat = lng = None
        if city and lat is not None and lng is not None:
            coords.setdefault(city, []).append((lat, lng))

    previous = {}
    if os.path.exists(OUT_PATH):
        for r in json.load(open(OUT_PATH)):
            if r.get("path"):
                previous[(r["from"], r["to"])] = r

    routes = []
    seen = set()

    for row in rows:
        city, dep_from, mode = row["City"], row["Departed From"], row["Travel Mode"]

        if not city or not dep_from or not mode:
            continue
        if dep_from == city:   # self-referential
            continue

        dep_from = DEP_ALIASES.get(dep_from, dep_from)

        ends = closest_pair(coords.get(dep_from), coords.get(city))

        # Distance filter for Car
        if mode == "Car" and ends and haversine(*ends[0], *ends[1]) < CAR_MIN_KM:
            continue

        key = (dep_from, city, mode)
        if key in seen:
            continue
        seen.add(key)

        route = {"from": dep_from, "to": city, "mode": mode}
        if mode == "Car" and ends:
            old = previous.get((dep_from, city))
            if old and old.get("ends") == [list(ends[0]), list(ends[1])]:
                route["path"] = old["path"]
            else:
                route["path"] = driving_path(*ends)
            if route["path"]:
                route["ends"] = [list(ends[0]), list(ends[1])]
            else:
                del route["path"]
        routes.append(route)

    # Sort for stable diffs: mode → from → to
    routes.sort(key=lambda r: (r["mode"], r["from"], r["to"]))

    with open(OUT_PATH, "w") as f:
        json.dump(routes, f, indent=2, ensure_ascii=False)

    by_mode: dict[str, int] = {}
    for r in routes:
        by_mode[r["mode"]] = by_mode.get(r["mode"], 0) + 1
    print(f"Wrote {len(routes)} routes to {OUT_PATH}")
    for m, n in sorted(by_mode.items()):
        print(f"  {m}: {n}")

if __name__ == "__main__":
    main()
