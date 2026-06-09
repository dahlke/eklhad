#!/usr/bin/env python3
"""
Fills in blank Travel Mode (col K) cells in the locations sheet
based on geography, trip context, and departure city.
Only writes where we have high confidence.
"""

import os
import sys

try:
    from googleapiclient.discovery import build
    from google.oauth2 import service_account
except ImportError:
    print("Missing deps. Run via `uv run python scripts/infer_travel_modes.py` (or `uv sync` first).")
    sys.exit(1)

SPREADSHEET_ID = "1Ex7AuwS25FoyP_h_HYVQjKr3XwPurZd2Heos3zb2gBI"
SA_PATH = os.environ.get(
    "GOOGLE_APPLICATION_CREDENTIALS",
    os.path.expanduser("~/.gcp/eklhad-web-packer.json"),
)

# (city, country, departed_from) -> travel mode
# departed_from="" means we match regardless of departure.
INFERENCES = {
    # ── CANADA ──────────────────────────────────────────────────────────────
    ("Montreal",                "Canada",               "Chicago"):         "Plane",

    # ── CHILE ───────────────────────────────────────────────────────────────
    ("Santiago",                "Chile",                "San Salvador"):    "Plane",

    # ── CHINA ───────────────────────────────────────────────────────────────
    ("Shanghai",                "China",                "San Francisco"):   "Plane",
    ("Qingdao",                 "China",                "San Francisco"):   "Plane",
    ("Beijing",                 "China",                "San Francisco"):   "Plane",

    # ── COSTA RICA ──────────────────────────────────────────────────────────
    ("San Juan",                "Costa Rica",           "San Francisco"):   "Plane",
    ("Rincon de la Vieja",      "Costa Rica",           "San Juan"):        "Car",
    ("Playa Del Coco",          "Costa Rica",           "San Juan"):        "Car",
    ("Liberia",                 "Costa Rica",           "San Juan"):        "Car",

    # ── CROATIA ─────────────────────────────────────────────────────────────
    ("Dubrovnik",               "Croatia",              "Athens"):          "Plane",
    ("Split",                   "Croatia",              "Dubrovnik"):       "Ferry",
    ("Solta",                   "Croatia",              "Split"):           "Ferry",
    ("Maslinica",               "Croatia",              "Solta"):           "Car",
    ("Lopud",                   "Croatia",              "Dubrovnik"):       "Ferry",
    ("Drvenik Veli",            "Croatia",              "Dubrovnik"):       "Ferry",

    # ── CUBA ────────────────────────────────────────────────────────────────
    ("Havana",                  "Cuba",                 "Chicago"):         "Plane",

    # ── EL SALVADOR ─────────────────────────────────────────────────────────
    ("San Salvador",            "El Salvador",          "San Francisco"):   "Plane",

    # ── FINLAND ─────────────────────────────────────────────────────────────
    ("Helsinki",                "Finland",              "Chicago"):         "Plane",

    # ── FRANCE ──────────────────────────────────────────────────────────────
    ("Paris",                   "France",               "London"):          "Train",  # Eurostar

    # ── GERMANY ─────────────────────────────────────────────────────────────
    ("Munich",                  "Germany",              "San Francisco"):   "Plane",
    ("Hamburg",                 "Germany",              "Chicago"):         "Plane",
    ("Berlin",                  "Germany",              "Chicago"):         "Plane",

    # ── GREECE ──────────────────────────────────────────────────────────────
    ("Athens",                  "Greece",               "Paris"):           "Plane",
    ("Santorini",               "Greece",               "Athens"):          "Plane",

    # ── ICELAND ─────────────────────────────────────────────────────────────
    ("Vik",                     "Iceland",              "San Francisco"):   "Plane",
    ("Reykjavík",               "Iceland",              "Reykjavík"):       "Plane",
    ("Stóridalur",              "Iceland",              "Reykjavík"):       "Car",
    ("Selfoss",                 "Iceland",              "Reykjavík"):       "Car",
    ("Norðurljósavegur",        "Iceland",              "Reykjavík"):       "Car",
    ("Kirkjubæjarklaustur",     "Iceland",              "Reykjavík"):       "Car",
    ("Jökulsárlón",             "Iceland",              "Reykjavík"):       "Car",
    ("Falljökull",              "Iceland",              "Reykjavík"):       "Car",
    ("Baldvinsskáli",           "Iceland",              "Reykjavík"):       "Car",

    # ── INDIA ───────────────────────────────────────────────────────────────
    ("New Delhi",               "India",                "Beijing"):         "Plane",
    ("Agra",                    "India",                "New Delhi"):       "Train",
    ("Jaipur",                  "India",                "Agra"):            "Train",
    ("Hyderabad",               "India",                "Jaipur"):          "Plane",
    ("Mumbai",                  "India",                "Agra"):            "Plane",
    ("Fort Kochi",              "India",                "Mumbai"):          "Plane",
    ("Delhi",                   "India",                "New Delhi"):       "Car",

    # ── IRELAND ─────────────────────────────────────────────────────────────
    ("Wicklow",                 "Ireland",              "Dublin"):          "Car",
    ("Westmeath",               "Ireland",              "Dublin"):          "Car",
    ("Waterford",               "Ireland",              "Dublin"):          "Car",
    ("Tullamore",               "Ireland",              "Dublin"):          "Car",
    ("Swords",                  "Ireland",              "Dublin"):          "Car",
    ("Sutton",                  "Ireland",              "Dublin"):          "Car",
    ("Skibereen",               "Ireland",              "Dublin"):          "Car",
    ("Meath",                   "Ireland",              "Dublin"):          "Car",
    ("Limerick",                "Ireland",              "Dublin"):          "Car",
    ("Kilkenny",                "Ireland",              "Dublin"):          "Car",
    ("Kildare",                 "Ireland",              "Dublin"):          "Car",
    ("Howth",                   "Ireland",              "Dublin"):          "Car",
    ("Galway",                  "Ireland",              "Dublin"):          "Car",
    ("Dundalk",                 "Ireland",              "Dublin"):          "Car",
    ("Cork",                    "Ireland",              "Dublin"):          "Car",
    ("Castletownsend",          "Ireland",              "Dublin"):          "Car",
    ("Baldoyle",                "Ireland",              "Dublin"):          "Car",
    ("Dublin",                  "Ireland",              "Dublin"):          "Plane",

    # ── ITALY ───────────────────────────────────────────────────────────────
    ("Venice",                  "Italy",                "Dublin"):          "Plane",
    ("Rome",                    "Italy",                "Chicago"):         "Plane",
    ("Pisa",                    "Italy",                "Rome"):            "Train",
    ("Florence",                "Italy",                "Rome"):            "Train",
    ("Toiano",                  "Italy",                "Pisa"):            "Car",
    ("Palaia",                  "Italy",                "Pisa"):            "Car",
    ("Milan",                   "Italy",                "Toiano"):          "Car",
    ("Copenhagen",              "Italy",                "Milan"):           "Plane",  # country wrong in sheet

    # ── JAPAN ───────────────────────────────────────────────────────────────
    ("Tokyo",                   "Japan",                "Taiwan"):          "Plane",
    ("Fujinomiya",              "Japan",                "Tokyo"):           "Train",
    ("Nagoya",                  "Japan",                "Tokyo"):           "Train",  # Shinkansen
    ("Kyoto",                   "Japan",                "Tokyo"):           "Train",  # Shinkansen
    ("Osaka",                   "Japan",                "Chicago"):         "Plane",
    ("Okinawa",                 "Japan",                "Osaka"):           "Plane",

    # ── MALTA ───────────────────────────────────────────────────────────────
    ("Valletta",                "Malta",                "Chicago"):         "Plane",
    ("Victoria",                "Malta",                "Valetta"):         "Ferry",  # Gozo ferry
    ("Mdina",                   "Malta",                "Valetta"):         "Car",

    # ── MEXICO ──────────────────────────────────────────────────────────────
    ("Cabo San Lucas",          "Mexico",               "San Francisco"):   "Plane",
    ("Cabo Pulmo",              "Mexico",               "San Francisco"):   "Plane",

    # ── MOROCCO ─────────────────────────────────────────────────────────────
    ("Marrakech",               "Morocco",              "Lisbon"):          "Plane",

    # ── NETHERLANDS ─────────────────────────────────────────────────────────
    ("Haarlem",                 "Netherlands",          "Chicago"):         "Plane",

    # ── NEW ZEALAND ─────────────────────────────────────────────────────────
    ("Auckland",                "New Zealand",          "Sydney"):          "Plane",
    ("Queenstown",              "New Zealand",          "Auckland"):        "Plane",
    ("Takapuna",                "New Zealand",          "Auckland"):        "Car",

    # ── PERU ────────────────────────────────────────────────────────────────
    ("Lima",                    "Peru",                 "San Francisco"):   "Plane",
    ("Cusco",                   "Peru",                 "Lima"):            "Plane",

    # ── PORTUGAL ────────────────────────────────────────────────────────────
    ("Lisbon",                  "Portugal",             "San Francisco"):   "Plane",
    ("Sintra",                  "Portugal",             "Lisbon"):          "Train",

    # ── RUSSIA ──────────────────────────────────────────────────────────────
    ("Saint Petersburg",        "Russia",               "Chicago"):         "Plane",

    # ── SCOTLAND ────────────────────────────────────────────────────────────
    ("Edinburgh",               "Scotland",             "Copenhagen"):      "Plane",

    # ── SOUTH KOREA ─────────────────────────────────────────────────────────
    ("Seoul",                   "South Korea",          "Osaka"):           "Plane",
    ("Paju",                    "South Korea",          "Seoul"):           "Car",
    ("Incheon",                 "South Korea",          "Seoul"):           "Train",  # AREX

    # ── SPAIN ───────────────────────────────────────────────────────────────
    ("Madrid",                  "Spain",                "Lisbon"):          "Plane",
    ("Valencia",                "Spain",                "Madrid"):          "Train",  # AVE
    ("Barcelona",               "Spain",                "Amsterdam"):       "Plane",

    # ── SWITZERLAND ─────────────────────────────────────────────────────────
    ("Geneva",                  "Switzerland",          "Reykjavík"):       "Plane",
    ("Visp",                    "Switzerland",          "Geneva"):          "Train",
    ("Brig",                    "Switzerland",          "Geneva"):          "Train",

    # ── TAIWAN ──────────────────────────────────────────────────────────────
    ("Taipei",                  "Taiwan",               "San Francisco"):   "Plane",
    ("Yilan",                   "Taiwan",               "Taipei"):          "Train",  # TRA
    ("Luodong",                 "Taiwan",               "Yilan"):           "Car",

    # ── THAILAND ────────────────────────────────────────────────────────────
    ("Bangkok",                 "Thailand",             "Beijing"):         "Plane",
    ("Chiang Mai",              "Thailand",             "Bangkok"):         "Plane",
    ("Krabi",                   "Thailand",             "Chiang Mai"):      "Plane",
    ("Ao Nang",                 "Thailand",             "Krabi"):           "Car",

    # ── TURKEY ──────────────────────────────────────────────────────────────
    ("Istanbul",                "Turkey",               "Athens"):          "Plane",

    # ── TURKS AND CAICOS ────────────────────────────────────────────────────
    ("Providenciales",          "Turks and Caicos",     "San Francisco"):   "Plane",

    # ── UNITED KINGDOM ──────────────────────────────────────────────────────
    ("London",                  "United Kingdom",       "San Francisco"):   "Plane",

    # ── UNITED STATES ───────────────────────────────────────────────────────
    # Arizona — flew to Phoenix, then drove within the metro / to Grand Canyon
    ("Phoenix",                 "United States of America", "San Francisco"):   "Plane",
    ("Scottsdale",              "United States of America", "Phoenix"):         "Car",
    ("Tempe",                   "United States of America", "Phoenix"):         "Car",
    ("Mesa",                    "United States of America", "Phoenix"):         "Car",
    ("Chandler",                "United States of America", "Phoenix"):         "Car",
    ("Williams",                "United States of America", "Phoenix"):         "Car",
    ("Tusayan",                 "United States of America", "Phoenix"):         "Car",
    ("Flagstaff",               "United States of America", "San Francisco"):   "Plane",
    ("Grand Canyon Village",    "United States of America", "San Francisco"):   "Plane",
    ("Grand Canyon National Park","United States of America","San Francisco"):  "Plane",

    # California road trips already handled (Car) in existing data

    # Colorado
    ("Denver",                  "United States of America", "San Francisco"):   "Plane",
    ("Boulder",                 "United States of America", "San Francisco"):   "Plane",
    ("Arvada",                  "United States of America", "Denver"):          "Car",

    # Florida
    ("Miami",                   "United States of America", "San Francisco"):   "Plane",
    ("Miami Beach",             "United States of America", "San Francisco"):   "Plane",
    ("Fort Lauderdale",         "United States of America", "San Francisco"):   "Plane",
    ("Hollywood",               "United States of America", "San Francisco"):   "Plane",
    ("Jacksonville",            "United States of America", "San Francisco"):   "Plane",
    ("Cocoa Beach",             "United States of America", "San Francisco"):   "Plane",
    ("Cape Canaveral",          "United States of America", "San Francisco"):   "Plane",

    # Hawaii — flew to Maui/etc., then drove around the island
    ("Lahaina",                 "United States of America", "San Francisco"):   "Plane",
    ("Kihei",                   "United States of America", "Lahaina"):         "Car",
    ("Kapalua",                 "United States of America", "Lahaina"):         "Car",
    ("Makawao",                 "United States of America", "San Francisco"):   "Plane",
    ("Haleakala",               "United States of America", "San Francisco"):   "Plane",

    # Louisiana
    ("New Orleans",             "United States of America", "San Francisco"):   "Plane",

    # Maryland
    ("Baltimore",               "United States of America", "San Francisco"):   "Plane",

    # Massachusetts
    ("Boston",                  "United States of America", "San Francisco"):   "Plane",
    ("Cambridge",               "United States of America", "Boston"):          "Car",

    # Midwest (road trips from Chicago/Evergreen Park)
    ("Saint Louis",             "United States of America", "Chicago"):         "Car",
    ("Columbia",                "United States of America", "Evergreen Park"):  "Car",
    ("Columbus",                "United States of America", "Evergreen Park"):  "Car",
    ("Cleveland",               "United States of America", "Evergreen Park"):  "Car",
    ("Dayton",                  "United States of America", "Evergreen Park"):  "Car",
    ("Akron",                   "United States of America", "Evergreen Park"):  "Car",
    ("Louisville",              "United States of America", "Evergreen Park"):  "Car",
    ("Mammoth Cave National Park","United States of America","Evergreen Park"):  "Car",
    ("Omaha",                   "United States of America", "Chicago"):         "Car",
    ("Kansas City",             "United States of America", "Chicago"):         "Car",
    ("Nashville",               "United States of America", "Chicago"):         "Car",

    # Missouri (from Chicago)
    ("Saint Louis",             "United States of America", "Chicago"):         "Car",

    # Nevada (road trips from SF)
    ("Reno",                    "United States of America", "San Francisco"):   "Car",
    ("Fallon",                  "United States of America", "San Francisco"):   "Car",
    ("Eureka",                  "United States of America", "San Francisco"):   "Car",
    ("Incline Village",         "United States of America", "Tahoe City"):      "Car",

    # New Jersey
    ("Jersey City",             "United States of America", "New York"):        "Car",

    # New York
    ("New York",                "United States of America", "San Francisco"):   "Plane",

    # North Carolina
    ("Charlotte",               "United States of America", "San Francisco"):   "Plane",

    # Northeast (from NYC)
    ("Philadelphia",            "United States of America", "New York City"):   "Train",
    ("Hartford",                "United States of America", "New York City"):   "Train",
    ("Pittsburgh",              "United States of America", "New York City"):   "Car",

    # Pacific Northwest
    ("Seattle",                 "United States of America", "San Francisco"):   "Plane",
    ("Redmond",                 "United States of America", "Seattle"):         "Car",
    ("Bellevue",                "United States of America", "Seattle"):         "Car",

    # Texas
    ("Austin",                  "United States of America", "San Francisco"):   "Plane",
    ("Dallas",                  "United States of America", "San Francisco"):   "Plane",
    ("Houston",                 "United States of America", "San Francisco"):   "Plane",

    # Utah
    ("Salt Lake City",          "United States of America", "San Francisco"):   "Plane",
    ("Park City",               "United States of America", "Salt Lake City"):  "Car",
    ("Salina",                  "United States of America", "Salt Lake City"):  "Car",
    ("Moab",                    "United States of America", "San Francisco"):   "Car",

    # Virginia / DC
    ("Washington",              "United States of America", "Phoenix"):         "Plane",
    ("Arlington",               "United States of America", "Washington"):      "Car",

    # Wyoming
    ("Jackson Hole",            "United States of America", "San Francisco"):   "Plane",
    ("Jackson",                 "United States of America", "San Francisco"):   "Plane",

    # Georgia
    ("Atlanta",                 "United States of America", "San Francisco"):   "Plane",
    ("Alpharetta",              "United States of America", "Atlanta"):         "Car",

    # Alabama
    ("Huntsville",              "United States of America", "San Francisco"):   "Plane",

    # ── US VIRGIN ISLANDS ───────────────────────────────────────────────────
    ("Saint Thomas",            "United States Virgin Islands", "San Francisco"): "Plane",
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
        range="locations!A1:K",
    ).execute()
    rows = result.get("values", [])

    updates = []
    for i, row in enumerate(rows[1:], start=2):
        city     = row[0].strip() if len(row) > 0 else ""
        country  = row[2].strip() if len(row) > 2 else ""
        dep_from = row[9].strip() if len(row) > 9 else ""
        mode     = row[10].strip() if len(row) > 10 else ""

        if not city or mode:
            continue

        key = (city, country, dep_from)
        inferred = INFERENCES.get(key)
        if inferred:
            updates.append({
                "range": f"locations!K{i}",
                "values": [[inferred]],
            })
            print(f"  row {i}: {city!r} ({country}, dep={dep_from!r}) → {inferred!r}")

    if not updates:
        print("Nothing to update.")
        return

    resp = sheet.values().batchUpdate(
        spreadsheetId=SPREADSHEET_ID,
        body={"valueInputOption": "RAW", "data": updates},
    ).execute()
    print(f"\nDone. {resp.get('totalUpdatedCells', 0)} cells updated ({len(updates)} rows).")


if __name__ == "__main__":
    main()
