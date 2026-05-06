Update the downloaded locations sheet CSV with photo URLs and emojis from locationPhotos.json.

Steps:
1. Find the most recently modified CSV in ~/Downloads matching "dahlke.io data - locations*.csv" (or use the path provided in $ARGUMENTS if given)
2. Run: `python3 scripts/update_location_photos.py "<input_csv>"` — this produces `<input>_updated.csv`
3. Report how many rows were updated and the output path
4. Remind the user to re-import the updated CSV into the Google Sheet, then run `make collect_data`
