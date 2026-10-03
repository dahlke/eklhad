#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["Pillow", "pillow-heif"]
# ///
"""
Local review app for the output of takeout_locations.py: approve or reject
each place and each candidate photo. Decisions save to decisions.json next to
the locations file on every click.

Usage:
    uv run scripts/review_locations.py                      # ~/Desktop/takeout_locations.json
    uv run scripts/review_locations.py path/to/locations.json --port 8765
"""

import argparse
import csv
import hashlib
import io
import json
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from PIL import Image, ImageOps
from pillow_heif import register_heif_opener

register_heif_opener()

SHEET_COLUMNS = [
    "City", "State / Province / Region / District", "Country", "Current", "Layover",
    "Home", "Lat", "Lng", "Confirmed", "Departed From", "Travel Mode", "Photo URL",
    "Location Emoji",
]
THUMB_WIDTH = 900

PAGE = r"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Location Review</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Open+Sans:wght@300;400;600&display=swap" rel="stylesheet">
<style>
  :root { --bg:#e8eaf0; --surface:#fff; --ink:#111827; --muted:#4b5563; --line:#c5c9d3; --blue:#58b9f7; --red:#cc0000; }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--ink); font:400 17px/1.5 "Open Sans",system-ui,sans-serif; }
  header { position:sticky; top:0; z-index:5; background:var(--bg); border-bottom:2px solid var(--ink); padding:16px 24px; }
  h1 { font:700 30px/1.1 "Playfair Display",Georgia,serif; margin:0 0 4px; }
  .tally { color:var(--muted); font-variant-numeric:tabular-nums; }
  .bar { display:flex; flex-wrap:wrap; gap:8px 20px; margin-top:12px; align-items:center; }
  .group { display:flex; gap:6px; align-items:center; flex-wrap:wrap; }
  .group span { font-weight:600; font-size:14px; text-transform:uppercase; letter-spacing:.06em; color:var(--muted); }
  button, a.btn { font:600 15px "Open Sans",sans-serif; color:var(--ink); background:var(--surface); border:2px solid var(--ink); border-radius:6px; padding:6px 12px; cursor:pointer; text-decoration:none; }
  button:focus-visible, a.btn:focus-visible { outline:3px solid var(--blue); outline-offset:2px; }
  button[aria-pressed="true"] { background:var(--ink); color:#fff; }
  main { max-width:1100px; margin:0 auto; padding:20px 24px 80px; }
  article { background:var(--surface); border:1px solid var(--line); border-left:8px solid var(--line); border-radius:8px; padding:18px 20px; margin-bottom:16px; }
  article[data-state="approved"] { border-left-color:var(--blue); }
  article[data-state="rejected"] { border-left-style:dashed; opacity:.62; }
  .head { display:flex; justify-content:space-between; gap:16px; flex-wrap:wrap; align-items:flex-start; }
  h2 { font:600 25px/1.2 "Playfair Display",Georgia,serif; margin:0; }
  .where { color:var(--muted); }
  .meta { margin:6px 0 0; font-size:15px; color:var(--muted); }
  .tag { display:inline-block; border:1.5px solid var(--ink); border-radius:999px; padding:0 9px; font-size:13px; font-weight:600; color:var(--ink); margin-right:6px; }
  .state { font-weight:600; min-width:9ch; }
  .actions { display:flex; gap:8px; align-items:center; }
  .photos { display:grid; grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); gap:14px; margin-top:14px; }
  figure { margin:0; border:1px solid var(--line); border-radius:6px; overflow:hidden; background:#f6f7f9; }
  figure[data-state="approved"] { border:3px solid var(--blue); }
  figure[data-state="rejected"] img { opacity:.3; filter:grayscale(1); }
  figure img { display:block; width:100%; height:210px; object-fit:cover; cursor:zoom-in; background:#dfe2e8; }
  figcaption { display:flex; gap:6px; align-items:center; padding:8px; font-size:14px; }
  figcaption .state { margin-left:auto; min-width:0; }
  figcaption button { font-size:14px; padding:4px 9px; }
  dialog { border:0; padding:0; background:transparent; max-width:95vw; max-height:95vh; }
  dialog::backdrop { background:rgba(13,17,23,.88); }
  dialog img { max-width:95vw; max-height:95vh; display:block; }
  .empty { padding:40px 0; color:var(--muted); font-size:19px; }
</style>
</head>
<body>
<header>
  <h1>Location Review</h1>
  <div class="tally" id="tally"></div>
  <div class="bar">
    <div class="group" id="scope"><span>Show</span></div>
    <div class="group" id="status"><span>Status</span></div>
    <div class="group" id="photo"><span>Photo</span></div>
    <a class="btn" href="/approved.csv">Download approved CSV</a>
  </div>
</header>
<main id="list"></main>
<dialog id="zoom"><img alt=""></dialog>
<script>
const SCOPES = {all:"All", notable:"Notable", fresh:"New places", near:"Near a pin"};
const STATUSES = {any:"Any", undecided:"Undecided", approved:"Approved", rejected:"Rejected"};
const PHOTOS = {any:"Any", with:"Has photo", without:"No photo"};
const LABEL = {approved:"✓ Approved", rejected:"✕ Rejected", undefined:"Undecided"};
let places = [], decisions = {locations:{}, photos:{}}, scope = "notable", status = "any", photo = "any";

const key = p => [p.City, p["State / Province / Region / District"], p.Country].join("|");
const el = (tag, attrs = {}, ...kids) => {
  const node = Object.assign(document.createElement(tag), attrs);
  node.append(...kids);
  return node;
};

function toggles(host, options, get, set) {
  for (const [value, label] of Object.entries(options)) {
    const b = el("button", {textContent: label});
    b.onclick = () => { set(value); render(); };
    b.dataset.value = value;
    host.append(b);
  }
  host.sync = () => host.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b.dataset.value === get()));
}

async function decide(kind, id, value, node, stateEl) {
  const next = decisions[kind][id] === value ? null : value;
  if (next) decisions[kind][id] = next; else delete decisions[kind][id];
  node.dataset.state = next || "";
  stateEl.textContent = LABEL[next || undefined];
  tally();
  await fetch("/decide", {method:"POST", body: JSON.stringify({kind, id, value: next})});
}

function verdict(kind, id, node) {
  const stateEl = el("span", {className:"state", textContent: LABEL[decisions[kind][id]]});
  const yes = el("button", {textContent:"Approve"}), no = el("button", {textContent:"Reject"});
  yes.onclick = () => decide(kind, id, "approved", node, stateEl);
  no.onclick = () => decide(kind, id, "rejected", node, stateEl);
  node.dataset.state = decisions[kind][id] || "";
  return [yes, no, stateEl];
}

function card(p) {
  const id = key(p), art = el("article");
  const tags = el("p", {className:"meta"});
  if (p.Notable) tags.append(el("span", {className:"tag", textContent:"Notable"}));
  tags.append(el("span", {className:"tag", textContent: p["On Map As"] ? `Near your pin: ${p["On Map As"]}` : "New place"}));
  tags.append(`${p.Photos} photos over ${p.Days} day${p.Days === 1 ? "" : "s"}, ${p["First Seen"]} to ${p["Last Seen"]}`);
  const title = el("div", {}, el("h2", {textContent: p.City}),
    el("div", {className:"where", textContent: [p["State / Province / Region / District"], p.Country].filter(Boolean).join(", ")}), tags);
  art.append(el("div", {className:"head"}, title, el("div", {className:"actions"}, ...verdict("locations", id, art))));
  if (p["Candidate Photos"].length) {
    const grid = el("div", {className:"photos"});
    for (const path of p["Candidate Photos"]) {
      const fig = el("figure"), src = "/photo?path=" + encodeURIComponent(path);
      const img = el("img", {src, loading:"lazy", alt:`Candidate photo for ${p.City}`});
      img.onclick = () => { zoom.firstElementChild.src = src; zoom.showModal(); };
      fig.append(img, el("figcaption", {}, ...verdict("photos", path, fig)));
      grid.append(fig);
    }
    art.append(grid);
  }
  return art;
}

// A place's own decision wins; otherwise its photo decisions stand in for it.
function standing(p) {
  const own = decisions.locations[key(p)];
  if (own) return own;
  const photos = p["Candidate Photos"].map(path => decisions.photos[path]);
  if (photos.includes("approved")) return "approved";
  if (photos.length && photos.every(v => v === "rejected")) return "rejected";
  return "undecided";
}

const hasPhoto = p => p["Candidate Photos"].some(path => decisions.photos[path] === "approved");

function visible(p) {
  const d = standing(p);
  if (photo === "with" && !hasPhoto(p)) return false;
  if (photo === "without" && hasPhoto(p)) return false;
  if (scope === "notable" && !p.Notable) return false;
  if (scope === "fresh" && p["On Map As"]) return false;
  if (scope === "near" && !p["On Map As"]) return false;
  return status === "any" || d === status;
}

function tally() {
  const d = places.map(standing), ph = Object.values(decisions.photos);
  const count = (list, v) => list.filter(x => x === v).length;
  document.getElementById("tally").textContent =
    `${places.length} places. ${count(d,"approved")} approved, ${count(d,"rejected")} rejected, ${count(d,"undecided")} undecided. ` +
    `Photos: ${count(ph,"approved")} approved, ${count(ph,"rejected")} rejected.`;
}

function render() {
  const list = document.getElementById("list"), shown = places.filter(visible);
  list.replaceChildren(...(shown.length ? shown.map(card) : [el("p", {className:"empty", textContent:"Nothing here with these filters."})]));
  document.getElementById("scope").sync(); document.getElementById("status").sync(); document.getElementById("photo").sync();
  tally();
}

const zoom = document.getElementById("zoom");
zoom.onclick = () => zoom.close();
toggles(document.getElementById("scope"), SCOPES, () => scope, v => scope = v);
toggles(document.getElementById("status"), STATUSES, () => status, v => status = v);
toggles(document.getElementById("photo"), PHOTOS, () => photo, v => photo = v);
fetch("/data").then(r => r.json()).then(d => { places = d.places; decisions = d.decisions; render(); });
</script>
</body>
</html>
"""


def place_key(place):
    return "|".join((place["City"], place["State / Province / Region / District"], place["Country"]))


class App(BaseHTTPRequestHandler):
    places = []
    photos = set()
    decisions = {"locations": {}, "photos": {}}
    decisions_path = None
    thumbs = None

    def log_message(self, *args):
        pass

    def send(self, body, content_type, status=200):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def thumbnail(self, path):
        cached = self.thumbs / (hashlib.sha1(path.encode()).hexdigest() + ".jpg")
        if not cached.exists():
            img = ImageOps.exif_transpose(Image.open(path)).convert("RGB")
            img.thumbnail((THUMB_WIDTH, THUMB_WIDTH * 2))
            img.save(cached, "JPEG", quality=82)
        return cached.read_bytes()

    def standing(self, place):
        own = self.decisions["locations"].get(place_key(place))
        photos = [self.decisions["photos"].get(path) for path in place["Candidate Photos"]]
        if own:
            return own
        if "approved" in photos:
            return "approved"
        return "rejected" if photos and all(v == "rejected" for v in photos) else "undecided"

    def approved_csv(self):
        out = io.StringIO()
        writer = csv.writer(out)
        writer.writerow(SHEET_COLUMNS + ["Notable", "Has Photo"])
        for place in self.places:
            if self.standing(place) == "approved":
                has_photo = any(self.decisions["photos"].get(p) == "approved" for p in place["Candidate Photos"])
                row = [place[c] for c in SHEET_COLUMNS] + [place["Notable"], has_photo]
                writer.writerow(("TRUE" if v else "FALSE") if isinstance(v, bool) else v for v in row)
        return out.getvalue().encode()

    def do_GET(self):
        url = urlparse(self.path)
        if url.path == "/":
            self.send(PAGE.encode(), "text/html; charset=utf-8")
        elif url.path == "/data":
            self.send(json.dumps({"places": self.places, "decisions": self.decisions}).encode(), "application/json")
        elif url.path == "/photo":
            path = parse_qs(url.query).get("path", [""])[0]
            if path not in self.photos:
                return self.send(b"not a candidate photo", "text/plain", 404)
            self.send(self.thumbnail(path), "image/jpeg")
        elif url.path == "/approved.csv":
            self.send(self.approved_csv(), "text/csv; charset=utf-8")
        else:
            self.send(b"not found", "text/plain", 404)

    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        bucket = self.decisions[body["kind"]]
        if body["value"]:
            bucket[body["id"]] = body["value"]
        else:
            bucket.pop(body["id"], None)
        self.decisions_path.write_text(json.dumps(self.decisions, indent=2, ensure_ascii=False))
        self.send(b"{}", "application/json")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("locations", type=Path, nargs="?", default=Path.home() / "Desktop/takeout_locations.json")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()

    App.places = json.loads(args.locations.read_text())
    App.photos = {path for place in App.places for path in place["Candidate Photos"]}
    App.decisions_path = args.locations.with_name("takeout_decisions.json")
    if App.decisions_path.exists():
        App.decisions = json.loads(App.decisions_path.read_text())
    App.thumbs = args.locations.parent / ".takeout_thumbs"
    App.thumbs.mkdir(exist_ok=True)

    url = f"http://localhost:{args.port}"
    print(f"{url}  (decisions save to {App.decisions_path})")
    webbrowser.open(url)
    ThreadingHTTPServer(("127.0.0.1", args.port), App).serve_forever()


if __name__ == "__main__":
    main()
