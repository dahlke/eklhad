#!/usr/bin/env python3
"""
Adds the places in an approved CSV (from review_locations.py or export_approved.py) to
web/data/locations.json. A place already there (same city, state and country) is skipped.
Dry run by default.

Usage:
    uv run python scripts/add_locations.py ~/eklhad-takeout/takeout_approved/locations.csv
    uv run python scripts/add_locations.py ~/eklhad-takeout/takeout_approved/locations.csv --apply
"""

import argparse
import csv

import locations_data

STATE = "State / Province / Region / District"


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("csv")
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    places = locations_data.load()
    known = {(p["city"], p["state"], p["country"]) for p in places}
    added = 0
    for row in csv.DictReader(open(args.csv, newline="")):
        key = (row["City"], row[STATE], row["Country"])
        if key in known:
            continue
        known.add(key)
        place = {"city": key[0], "state": key[1], "country": key[2], "lat": float(row["Lat"]), "lng": float(row["Lng"]),
                 "departed_from": row["Departed From"], "travel_mode": row["Travel Mode"]}
        if row.get("Notable") == "TRUE":
            place["notable"] = True
        places.append(place)
        added += 1
        print(f"add {', '.join(key)}")
    print(f"{added} new places")
    if args.apply and added:
        locations_data.save(places)
        print("written")


if __name__ == "__main__":
    main()
