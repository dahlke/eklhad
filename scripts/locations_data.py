"""Reads and writes web/data/locations.json, the source of truth for the map's places."""

import json
from pathlib import Path

PATH = Path(__file__).parent / "../web/data/locations.json"


def load():
    return json.loads(PATH.read_text())


def save(places):
    PATH.write_text(json.dumps(places, indent=2, ensure_ascii=False) + "\n")
