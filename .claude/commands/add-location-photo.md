# Add Location Photo

Add a new photo to the map for a visited location.

## What to ask the user

1. What city is the photo for?
2. Where is the source file (path to jpg/heic/png/zip)?
3. What emoji best represents this city? (suggest one if not sure)
4. Do they know the date the photo was taken?

## Steps

### 1. Convert to PNG (lossless)

Determine the slug: lowercase city name, spaces → underscores, remove accents.
Examples: "New Orleans" → `new_orleans`, "Jökulsárlón" → `jokulsarlon`

If source is a zip, extract the image (skip any .mov file):
```bash
unzip -p "{source.zip}" "{image filename}" > /tmp/{slug}_raw.{ext}
```

Get the date from zip metadata if not provided:
```bash
unzip -l "{source.zip}" | head -5
```

Convert to PNG via sips:
```bash
sips -s format png /tmp/{slug}_raw.{ext} --out /tmp/{slug}_{YYYY_MM_DD}.png
```

### 2. Upload to GCS

```bash
gsutil -h "Content-Type:image/png" \
       -h "Cache-Control:public,max-age=31536000" \
       cp /tmp/{slug}_{YYYY_MM_DD}.png \
       gs://eklhad-web-public/photos/{slug}.png

gsutil acl ch -u AllUsers:R gs://eklhad-web-public/photos/{slug}.png
```

### 3. Update locationPhotos.json

File: `web/frontend/src/config/locationPhotos.json`

Add or update the entry (keep alphabetical by city name):
```json
"City Name": {
  "slug": "{slug}",
  "url": "https://storage.googleapis.com/eklhad-web-public/photos/{slug}.png",
  "date": "Month D, YYYY",
  "emoji": "{emoji}"
}
```

### 4. Copy to local static folder (for dev, gitignored)

```bash
cp /tmp/{slug}_{YYYY_MM_DD}.png \
   web/frontend/public/static/locations/{slug}.png
```

### 5. Tell the user to update the Google Sheet

In the `locations` tab, find the city row and fill in:
- Column J (`Photo URL`): `https://storage.googleapis.com/eklhad-web-public/photos/{slug}.png`
- Column M (`Photo Emoji`): the chosen emoji
- Column N (`Photo Date`): formatted date (e.g. "October 12, 2019")

After updating the sheet, re-run the data worker so the new fields appear in the GCS JSON and propagate to production.

## Naming conventions

- Slug: `snake_case`, ASCII only, no hyphens
- Local filename in downloads: `{slug}_{YYYY_MM_DD}.png`
- GCS object name: `{slug}.png` (no date — clean URL)
- GCS bucket: `eklhad-web-public`, prefix: `photos/`
- Public base URL: `https://storage.googleapis.com/eklhad-web-public/photos/`
