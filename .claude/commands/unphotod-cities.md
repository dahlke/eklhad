# Find Unphoto'd Cities

Generate a ranked list of visited cities that don't yet have a photo, with Google Photos search links.

## Steps

### 1. Load locationPhotos.json

Read `web/frontend/src/config/locationPhotos.json` — this is the authoritative set of cities that already have photos. Extract the city name keys into a set.

### 2. Fetch the live locations data

```bash
curl -s "https://storage.googleapis.com/eklhad-web-public/data/locations.json"
```

Parse the JSON array. Each location has fields: `city`, `country`, `stateprovinceregion`, `layover`, `home`, `photourl`, `photoemoji`, etc.

### 3. Cross-reference

Filter locations to cities that:
- Are NOT layovers (`layover` is falsy)
- Are NOT home (`home` is falsy)
- Have no photo: city name is NOT a key in `locationPhotos.json`

Deduplicate by city name (a city may appear multiple times in the sheet).

### 4. Rank by coolness

Use judgment to rank the filtered cities by travel interest/notability. Prioritize:
- International destinations over domestic US
- Iconic/recognizable cities
- Places with unique character or strong visual identity

Return top ~25 unless the user asks for more.

### 5. Generate Google Photos search URLs

Use this Python snippet to generate a search URL for each city:

```python
import base64, urllib.parse

def google_photos_url(city: str) -> str:
    name = city.lower().encode()
    n = len(name)
    part1 = bytes([0x0A, n]) + name
    nested = bytes([0x0A, n]) + name
    part2 = bytes([0x22, len(nested)]) + nested
    tail = bytes([40, 254, 183, 228, 253, 223, 51, 56, 3])
    payload = part1 + part2 + tail
    b64 = base64.b64encode(payload).decode()
    return f"https://photos.google.com/search/{urllib.parse.quote(b64, safe='')}"
```

### 6. Output format

For each city, output:
- City name + country/region
- A suggested emoji (if you have a strong opinion) or note it has none yet
- Google Photos link

Remind the user that after finding a photo they can run `/add-location-photo` to upload it.
