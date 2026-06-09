#!/usr/bin/env python3
"""
One-time script to backfill photo URL / emoji / date from locationPhotos.json
into the Google Sheet (columns J, M, N of the 'locations' tab).

Run after updating locationPhotos.json, then run `make collect_data` to
regenerate the GCS locations JSON.

Usage:
    GOOGLE_APPLICATION_CREDENTIALS=/path/to/sa.json python3 scripts/backfill_photos.py
    # or with API key (read/write requires service account):
    GOOGLE_API_KEY=... python3 scripts/backfill_photos.py
"""

import json
import os
import sys

try:
    from googleapiclient.discovery import build
    from google.oauth2 import service_account
except ImportError:
    print("Missing deps. Run via `uv run python scripts/backfill_photos.py` (or `uv sync` first).")
    sys.exit(1)

SPREADSHEET_ID = "1Ex7AuwS25FoyP_h_HYVQjKr3XwPurZd2Heos3zb2gBI"
PHOTOS_JSON    = os.path.join(os.path.dirname(__file__), "../web/frontend/src/config/locationPhotos.json")

def get_service():
    sa_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    if sa_path:
        creds = service_account.Credentials.from_service_account_file(
            sa_path,
            scopes=["https://www.googleapis.com/auth/spreadsheets"],
        )
        return build("sheets", "v4", credentials=creds)
    api_key = os.environ.get("GOOGLE_API_KEY")
    if api_key:
        return build("sheets", "v4", developerKey=api_key)
    print("Set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_API_KEY")
    sys.exit(1)

def main():
    with open(PHOTOS_JSON) as f:
        photos = json.load(f)  # {"City Name": {"url": ..., "emoji": ..., "date": ...}}

    service  = get_service()
    sheet    = service.spreadsheets()

    # Read city names (col A) and current photo URL (col J) — A2:N
    result = sheet.values().get(
        spreadsheetId=SPREADSHEET_ID,
        range="locations!A2:N",
    ).execute()
    rows = result.get("values", [])

    updates = []
    for i, row in enumerate(rows):
        city = row[0].strip() if row else ""
        if not city:
            continue

        entry = photos.get(city)
        if not entry:
            print(f"  no photo entry for: {city!r}")
            continue

        row_num = i + 2  # sheet is 1-indexed, row 1 is header

        # Only write if photo URL column (J = index 9) is empty
        current_url = row[9].strip() if len(row) > 9 else ""
        if current_url:
            print(f"  skip {city!r} — already has URL")
            continue

        photo_url  = entry.get("url", "")
        photo_emoji = entry.get("emoji", "")
        photo_date  = entry.get("date", "")

        updates.append({
            "range": f"locations!J{row_num}",
            "values": [[photo_url]],
        })
        updates.append({
            "range": f"locations!M{row_num}",
            "values": [[photo_emoji]],
        })
        updates.append({
            "range": f"locations!N{row_num}",
            "values": [[photo_date]],
        })
        print(f"  queued {city!r} -> {photo_url[-40:]}")

    if not updates:
        print("Nothing to update.")
        return

    body = {"valueInputOption": "RAW", "data": updates}
    resp = sheet.values().batchUpdate(
        spreadsheetId=SPREADSHEET_ID,
        body=body,
    ).execute()
    print(f"\nDone. {resp.get('totalUpdatedCells', 0)} cells updated.")
    print("Now run:  make collect_data")

if __name__ == "__main__":
    main()
