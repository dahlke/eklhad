# Add Location Photo

Add a new photo to the map for a visited location. Works for any place — cities already in
the locations sheet, lesser-known spots, or entirely new entries.

## Phase 1 — Identify the place and find the photo

If no place name was provided in $ARGUMENTS, ask the user: "What place do you want to add a photo for?"

Once you have the name:

1. **Identify it** — determine:
   - Canonical city/region name (e.g. "West Cork", "Luodong")
   - Country and state/province/region if relevant
   - Approximate lat/lng (for future sheet entry)
   - Suggested emoji that represents this place visually or culturally

2. **Generate a Google Photos search URL** using this Python snippet:

```python
import base64, urllib.parse

def google_photos_url(query: str) -> str:
    name = query.lower().encode()
    n = len(name)
    part1 = bytes([0x0A, n]) + name
    nested = bytes([0x0A, n]) + name
    part2 = bytes([0x22, len(nested)]) + nested
    tail = bytes([40, 254, 183, 228, 253, 223, 51, 56, 3])
    payload = part1 + part2 + tail
    b64 = base64.b64encode(payload).decode()
    return f"https://photos.google.com/search/{urllib.parse.quote(b64, safe='')}"
```

Run this in a bash heredoc:
```bash
python3 - <<'EOF'
import base64, urllib.parse
def google_photos_url(query):
    name = query.lower().encode()
    n = len(name)
    part1 = bytes([0x0A, n]) + name
    nested = bytes([0x0A, n]) + name
    part2 = bytes([0x22, len(nested)]) + nested
    tail = bytes([40, 254, 183, 228, 253, 223, 51, 56, 3])
    payload = part1 + part2 + tail
    b64 = base64.b64encode(payload).decode()
    return f"https://photos.google.com/search/{urllib.parse.quote(b64, safe='')}"
print(google_photos_url("PLACE_NAME_HERE"))
EOF
```

3. **Present to the user:**
   - The canonical place name and suggested emoji
   - The Google Photos URL as a clickable link
   - Tell them: "Find a photo you like, download it, then give me the file path and the date the photo was taken."

Stop and wait for the user to provide the downloaded file path and date.

---

## Phase 2 — Process and upload the photo

Once the user provides a file path (and optionally a date):

### 1. Determine the slug

Lowercase city name, spaces → underscores, remove accents, ASCII only, no hyphens.
Examples: "New Orleans" → `new_orleans`, "Jökulsárlón" → `jokulsarlon`, "West Cork" → `west_cork`, "Luodong" → `luodong`

### 2. Get the date

If the user didn't provide a date:
- If it's a zip, check metadata: `unzip -l "{source.zip}" | head -10`
- If it's a HEIC/JPG, check EXIF: `sips -g creation "{file}"`
- If still unknown, ask the user

Format the date as `YYYY_MM_DD` for the filename and `Month D, YYYY` for the JSON.

### 3. Convert to PNG

If source is a zip, extract first:
```bash
unzip -p "{source.zip}" "{image filename}" > /tmp/{slug}_raw.{ext}
```

Convert and fix orientation:
```bash
uv run --with pillow --with pillow-heif python - <<'EOF'
from PIL import Image, ImageOps
import io

img = Image.open("/tmp/{slug}_raw.{ext}")  # or source path directly
img = ImageOps.exif_transpose(img)
img = img.convert("RGB")
img.save("/tmp/{slug}_{YYYY_MM_DD}.png", format="PNG", optimize=True)
print("done")
EOF
```

### 4. Upload full-size to GCS

```bash
gsutil -h "Content-Type:image/png" \
       -h "Cache-Control:public,max-age=31536000" \
       cp /tmp/{slug}_{YYYY_MM_DD}.png \
       gs://eklhad-web-public/photos/{slug}_{YYYY_MM_DD}.png

gsutil acl ch -u AllUsers:R gs://eklhad-web-public/photos/{slug}_{YYYY_MM_DD}.png
```

### 5. Generate and upload thumbnail (400px wide)

```bash
uv run --with pillow python - <<'EOF'
from PIL import Image
img = Image.open("/tmp/{slug}_{YYYY_MM_DD}.png")
w, h = img.size
new_h = int(h * 400 / w)
thumb = img.resize((400, new_h), Image.LANCZOS)
thumb.save("/tmp/{slug}_{YYYY_MM_DD}_thumb.png", format="PNG", optimize=True)
print("done")
EOF

gsutil -h "Content-Type:image/png" \
       -h "Cache-Control:public,max-age=31536000" \
       cp /tmp/{slug}_{YYYY_MM_DD}_thumb.png \
       gs://eklhad-web-public/photos/thumbs/{slug}_{YYYY_MM_DD}.png

gsutil acl ch -u AllUsers:R gs://eklhad-web-public/photos/thumbs/{slug}_{YYYY_MM_DD}.png
```

### 6. Update locationPhotos.json

File: `web/frontend/src/config/locationPhotos.json`

Add or update the entry, keeping the file sorted **alphabetically by city name key**:
```json
"Place Name": {
  "slug": "{slug}",
  "url": "https://storage.googleapis.com/eklhad-web-public/photos/{slug}_{YYYY_MM_DD}.png",
  "date": "Month D, YYYY",
  "emoji": "{emoji}"
}
```

### 7. Remind the user about the Google Sheet

In the `locations` tab of the Google Sheet, find or create the row for this city and fill in:
- Column J (`Photo URL`): the GCS URL above
- Column M (`Photo Emoji`): the chosen emoji
- Column N (`Photo Date`): formatted date (e.g. "October 12, 2019")

After updating the sheet, re-run the data worker so the new fields appear in the GCS JSON and propagate to production.

---

## Naming conventions

- Slug: `snake_case`, ASCII only, no hyphens
- Filename: `{slug}_{YYYY_MM_DD}.png`
- GCS full-size: `gs://eklhad-web-public/photos/{slug}_{YYYY_MM_DD}.png`
- GCS thumbnail: `gs://eklhad-web-public/photos/thumbs/{slug}_{YYYY_MM_DD}.png`
- Public base URL: `https://storage.googleapis.com/eklhad-web-public/photos/`
