#!/usr/bin/env python3
"""
Adds an "Inferred Departure" column (N) to the locations sheet,
populated only for rows where "Departed From" (col J) is blank
and we have a confident inference.
"""

import os
import sys

try:
    from googleapiclient.discovery import build
    from google.oauth2 import service_account
except ImportError:
    print("Missing deps. Run via `uv run python scripts/infer_departures.py` (or `uv sync` first).")
    sys.exit(1)

SPREADSHEET_ID = "1Ex7AuwS25FoyP_h_HYVQjKr3XwPurZd2Heos3zb2gBI"
SA_PATH = os.environ.get(
    "GOOGLE_APPLICATION_CREDENTIALS",
    os.path.expanduser("~/.gcp/eklhad-web-packer.json"),
)

# (city_name, country) -> inferred departure city
# Only high-confidence entries included.
INFERENCES = {
    # Italy 2024 May trip (photo dates: Rome 05/09, Florence 05/13, Copenhagen 05/15)
    ("Rome", "Italy"):                      "San Francisco",
    ("Florence", "Italy"):                  "Rome",
    ("Copenhagen", "Italy"):                "Florence",   # country is wrong in sheet; it's Denmark
    ("Pisa", "Italy"):                      "Florence",   # Tuscany day trip
    ("Toiano", "Italy"):                    "Florence",   # Tuscany day trip
    ("Palaia", "Italy"):                    "Florence",   # Tuscany day trip
    ("Milan", "Italy"):                     "Venice",     # 2022 Jan, same day as Venice
    # Switzerland 2022 (Visp & Brig are train stops on Geneva→Zermatt line)
    ("Visp", "Switzerland"):                "Geneva",
    ("Brig", "Switzerland"):                "Geneva",
    # Japan Oct 2025 (Nagoya on Shinkansen route Tokyo→Kyoto)
    ("Nagoya", "Japan"):                    "Tokyo",
    # Taiwan Oct 2025
    ("Luodong", "Taiwan"):                  "Yilan",
    # South Korea Oct 2025
    ("Paju", "South Korea"):                "Seoul",
    ("Incheon", "South Korea"):             "Seoul",
    # Netherlands
    ("Haarlem", "Netherlands"):             "Amsterdam",
    # New Zealand (Takapuna is an Auckland suburb)
    ("Takapuna", "New Zealand"):            "Auckland",
    # Malta (Victoria/Gozo reached by ferry from Valletta)
    ("Victoria", "Malta"):                  "Valletta",
    # Colorado suburbs/nearby
    ("Arvada", "United States of America"): "Denver",
    # US metro satellites
    ("Alpharetta", "United States of America"):  "Atlanta",
    ("Arlington", "United States of America"):   "Washington",
    ("Cambridge", "United States of America"):   "Boston",
    ("Jersey City", "United States of America"): "New York",
    ("Bellevue", "United States of America"):    "Seattle",
    ("Redmond", "United States of America"):     "Seattle",
    # Arizona road trip (2020 Grand Canyon road trip from SF)
    ("Williams", "United States of America"):               "San Francisco",
    ("Tusayan", "United States of America"):                "San Francisco",
    ("Flagstaff", "United States of America"):              "San Francisco",
    ("Grand Canyon Village", "United States of America"):   "San Francisco",
    ("Grand Canyon National Park", "United States of America"): "San Francisco",
    # Phoenix metro (flew from SF)
    ("Phoenix", "United States of America"):   "San Francisco",
    ("Scottsdale", "United States of America"): "San Francisco",
    ("Tempe", "United States of America"):     "San Francisco",
    ("Mesa", "United States of America"):      "San Francisco",
    ("Chandler", "United States of America"):  "San Francisco",
    # Utah (road trips from SF)
    ("Salt Lake City", "United States of America"): "San Francisco",
    ("Salina", "United States of America"):          "San Francisco",
    # Nevada (road trips from SF)
    ("Reno", "United States of America"):           "San Francisco",
    ("Fallon", "United States of America"):         "San Francisco",
    ("Eureka", "United States of America"):         "San Francisco",
    ("Incline Village", "United States of America"): "San Francisco",
    # Wyoming (flew from SF)
    ("Jackson Hole", "United States of America"): "San Francisco",
    ("Jackson", "United States of America"):      "San Francisco",
    # Colorado (flew from SF)
    ("Denver", "United States of America"):  "San Francisco",
    ("Boulder", "United States of America"): "San Francisco",
    # Pacific Northwest (flew from SF)
    ("Seattle", "United States of America"): "San Francisco",
    # Texas (flew from SF)
    ("Austin", "United States of America"):  "San Francisco",
    ("Dallas", "United States of America"):  "San Francisco",
    ("Houston", "United States of America"): "San Francisco",
    # Southeast (flew from SF)
    ("Atlanta", "United States of America"):    "San Francisco",
    ("Charlotte", "United States of America"):  "San Francisco",
    ("Nashville", "United States of America"):  "San Francisco",
    # Mid-Atlantic (flew from SF)
    ("Baltimore", "United States of America"):    "San Francisco",
    ("Washington", "United States of America"):   "San Francisco",
    ("Philadelphia", "United States of America"): "San Francisco",
    ("Pittsburgh", "United States of America"):   "San Francisco",
    # Florida (flew from SF)
    ("Miami", "United States of America"):           "San Francisco",
    ("Miami Beach", "United States of America"):     "San Francisco",
    ("Fort Lauderdale", "United States of America"): "San Francisco",
    ("Hollywood", "United States of America"):       "San Francisco",
    ("Jacksonville", "United States of America"):    "San Francisco",
    ("Cocoa Beach", "United States of America"):     "San Francisco",
    ("Cape Canaveral", "United States of America"):  "San Francisco",
    # Hawaii (flew from SF)
    ("Lahaina", "United States of America"):  "San Francisco",
    ("Kihei", "United States of America"):    "San Francisco",
    ("Makawao", "United States of America"):  "San Francisco",
    ("Haleakala", "United States of America"): "San Francisco",
    ("Kapalua", "United States of America"):  "San Francisco",
    # US Virgin Islands
    ("Saint Thomas", "United States Virgin Islands"): "San Francisco",
    # Midwest (road trips from Evergreen Park, childhood home)
    ("Saint Louis", "United States of America"):  "Evergreen Park",
    ("Columbia", "United States of America"):     "Evergreen Park",
    ("Columbus", "United States of America"):     "Evergreen Park",
    ("Cleveland", "United States of America"):    "Evergreen Park",
    ("Dayton", "United States of America"):       "Evergreen Park",
    ("Akron", "United States of America"):        "Evergreen Park",
    ("Louisville", "United States of America"):   "Evergreen Park",
    ("Omaha", "United States of America"):        "Evergreen Park",
    ("Kansas City", "United States of America"):  "Evergreen Park",
    ("Mammoth Cave National Park", "United States of America"): "Evergreen Park",
}


def load_creds():
    return service_account.Credentials.from_service_account_file(
        SA_PATH,
        scopes=["https://www.googleapis.com/auth/spreadsheets"],
    )


def main():
    creds = load_creds()
    service = build("sheets", "v4", credentials=creds)
    sheet = service.spreadsheets()

    result = sheet.values().get(
        spreadsheetId=SPREADSHEET_ID,
        range="locations!A1:M",
    ).execute()
    rows = result.get("values", [])

    if not rows:
        print("No data found.")
        return

    header = rows[0]
    print(f"Header: {header}")
    print(f"Total rows (incl. header): {len(rows)}")

    # Add header for new column N
    header_update = {
        "range": "locations!N1",
        "values": [["Inferred Departure"]],
    }

    updates = [header_update]
    inferred_count = 0

    for i, row in enumerate(rows[1:], start=2):  # row 2 onward (1-indexed sheet)
        city    = row[0].strip() if len(row) > 0 else ""
        country = row[2].strip() if len(row) > 2 else ""
        dep_from = row[9].strip() if len(row) > 9 else ""

        if not city:
            continue

        # Only infer where Departed From is blank
        if dep_from:
            continue

        key = (city, country)
        inferred = INFERENCES.get(key)
        if inferred:
            updates.append({
                "range": f"locations!N{i}",
                "values": [[inferred]],
            })
            print(f"  row {i}: {city!r} ({country}) → {inferred!r}")
            inferred_count += 1

    if len(updates) <= 1:
        print("No inferences to write (beyond header).")
        return

    body = {"valueInputOption": "RAW", "data": updates}
    resp = sheet.values().batchUpdate(
        spreadsheetId=SPREADSHEET_ID,
        body=body,
    ).execute()
    print(f"\nDone. {resp.get('totalUpdatedCells', 0)} cells written ({inferred_count} inferences + 1 header).")


if __name__ == "__main__":
    main()
