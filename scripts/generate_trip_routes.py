#!/usr/bin/env python3
"""
Generates web/frontend/src/config/tripRoutes.json from the Google Sheet.
Each entry: {"from": "City A", "to": "City B", "mode": "Plane|Train|Car|Ferry"}

Filtering:
  - Skip rows with no Departed From or no Travel Mode
  - Skip self-referential departures (city departs from itself)
  - Skip "Taiwan" as a departure (not a city; map to Taipei)
  - For Car routes: only include if the two cities are > 80 km apart
    (avoids suburb-to-suburb clutter on the global map)
"""

import json
import math
import os
import sys

try:
    from googleapiclient.discovery import build
    from google.oauth2 import service_account
except ImportError:
    print("Missing deps. Run: pip install google-api-python-client google-auth")
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

CAR_MIN_KM = 80  # suppress very short car hops

def main():
    creds = service_account.Credentials.from_service_account_file(
        SA_PATH, scopes=["https://www.googleapis.com/auth/spreadsheets.readonly"]
    )
    service = build("sheets", "v4", credentials=creds)

    result = service.spreadsheets().values().get(
        spreadsheetId=SPREADSHEET_ID,
        range="locations!A1:K",
    ).execute()
    rows = result.get("values", [])

    # Build city → (lat, lng) lookup
    coords: dict[str, tuple[float, float]] = {}
    for row in rows[1:]:
        city = row[0].strip() if len(row) > 0 else ""
        try:
            lat = float(row[6]) if len(row) > 6 else None
            lng = float(row[7]) if len(row) > 7 else None
        except ValueError:
            lat = lng = None
        if city and lat is not None and lng is not None:
            coords[city] = (lat, lng)

    routes = []
    seen = set()

    for row in rows[1:]:
        city      = row[0].strip()  if len(row) > 0  else ""
        dep_from  = row[9].strip()  if len(row) > 9  else ""
        mode      = row[10].strip() if len(row) > 10 else ""

        if not city or not dep_from or not mode:
            continue
        if dep_from == city:   # self-referential
            continue

        dep_from = DEP_ALIASES.get(dep_from, dep_from)

        # Distance filter for Car
        if mode == "Car":
            from_coords = coords.get(dep_from)
            to_coords   = coords.get(city)
            if from_coords and to_coords:
                dist = haversine(from_coords[0], from_coords[1], to_coords[0], to_coords[1])
                if dist < CAR_MIN_KM:
                    continue

        key = (dep_from, city, mode)
        if key in seen:
            continue
        seen.add(key)

        routes.append({"from": dep_from, "to": city, "mode": mode})

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
