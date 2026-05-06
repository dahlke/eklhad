#!/usr/bin/env python3
"""
Merges photo URL + emoji from locationPhotos.json into a downloaded
locations sheet CSV (columns J=Photo URL, K=Location Emoji).

Usage:
    python3 scripts/update_location_photos.py <input.csv> [output.csv]

If output is omitted, writes to <input>_updated.csv.
Only fills in empty cells — existing values are not overwritten.
"""

import csv
import json
import os
import sys

PHOTOS_JSON = os.path.join(os.path.dirname(__file__), "../web/frontend/src/config/locationPhotos.json")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    input_csv = sys.argv[1]
    if len(sys.argv) >= 3:
        output_csv = sys.argv[2]
    else:
        base, ext = os.path.splitext(input_csv)
        output_csv = base + "_updated" + ext

    with open(PHOTOS_JSON) as f:
        photos = json.load(f)

    photo_lookup = {city: {"url": data["url"], "emoji": data["emoji"]} for city, data in photos.items()}

    rows_updated = 0
    rows_total = 0

    with open(input_csv, newline="", encoding="utf-8") as fin, \
         open(output_csv, "w", newline="", encoding="utf-8") as fout:

        reader = csv.reader(fin)
        writer = csv.writer(fout)
        writer.writerow(next(reader))  # header

        for row in reader:
            rows_total += 1
            city = row[0].strip() if row else ""

            if city:
                entry = photo_lookup.get(city)
                if entry:
                    while len(row) < 11:
                        row.append("")
                    changed = False
                    if not row[9] and entry["url"]:
                        row[9] = entry["url"]
                        changed = True
                    if not row[10] and entry["emoji"]:
                        row[10] = entry["emoji"]
                    if changed:
                        rows_updated += 1

            writer.writerow(row)

    print(f"Updated {rows_updated}/{rows_total} rows → {output_csv}")


if __name__ == "__main__":
    main()
