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
    uv run scripts/review_locations.py                      # ~/eklhad-takeout/takeout_locations.json
    uv run scripts/review_locations.py path/to/locations.json --port 8765
"""

import argparse
import csv
import hashlib
import io
import json
import math
import time
import urllib.request
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
  figcaption .match { font-size:12px; color:var(--muted); font-variant-numeric:tabular-nums; }
  figcaption button { font-size:14px; padding:4px 9px; }
  dialog { border:0; padding:0; background:transparent; max-width:95vw; max-height:95vh; }
  dialog::backdrop { background:rgba(13,17,23,.88); }
  dialog img { max-width:95vw; max-height:95vh; display:block; }
  .empty { padding:40px 0; color:var(--muted); font-size:19px; }
  .saving { font-weight:600; margin-left:10px; }
  .saving.error { color:var(--red); }
  .cover { display:flex; gap:14px; align-items:center; margin-top:12px; padding:10px; border:2px solid var(--ink); border-radius:6px; background:#f6f7f9; }
  .cover img { width:120px; height:80px; object-fit:cover; border-radius:4px; }
  .cover.none { border-style:dashed; color:var(--muted); }
  .cover b { display:block; font-size:14px; text-transform:uppercase; letter-spacing:.06em; }
  figure[data-cover="true"] { outline:4px solid var(--ink); outline-offset:-4px; }
  .badge { font-weight:700; font-size:13px; background:var(--ink); color:#fff; border-radius:999px; padding:1px 8px; }
</style>
</head>
<body>
<header>
  <h1>Location Review</h1>
  <div class="tally"><span id="tally"></span><span class="saving" id="saving"></span></div>
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
const SCOPES = {all:"All", notable:"Notable", other:"Not notable"};
const STATUSES = {any:"Any", undecided:"Undecided", approved:"Approved", rejected:"Rejected"};
const PHOTOS = {any:"Any", without:"Needs photo", with:"Has photo"};
const remembered = (() => { try { return JSON.parse(localStorage.getItem("review-filters")) || {}; } catch { return {}; } })();
let places = [], decisions = {locations:{}, photos:{}, cover:{}};
let scope = remembered.scope || "notable", status = remembered.status || "any", photo = remembered.photo || "without";
const remember = () => { try { localStorage.setItem("review-filters", JSON.stringify({scope, status, photo, y: scrollY})); } catch {} };
addEventListener("scroll", () => { clearTimeout(remember.t); remember.t = setTimeout(remember, 300); });

// Every click is queued and retried until the app confirms it saved, so nothing is lost if the app restarts
let queue = [];
async function flush() {
  const saving = document.getElementById("saving");
  while (queue.length) {
    try {
      const r = await fetch("/decide", {method:"POST", body: JSON.stringify(queue[0])});
      if (!r.ok) throw new Error(r.status);
      queue.shift();
    } catch {
      saving.textContent = `${queue.length} not saved yet, retrying. Is the app running?`;
      saving.className = "saving error";
      setTimeout(flush, 3000);
      return;
    }
  }
  saving.textContent = "All saved"; saving.className = "saving";
}
const save = change => { queue.push(change); if (queue.length === 1) flush(); };

const key = p => [p.City, p["State / Province / Region / District"], p.Country].join("|");
const el = (tag, attrs = {}, ...kids) => {
  const node = Object.assign(document.createElement(tag), attrs);
  node.append(...kids);
  return node;
};

function toggles(host, options, get, set) {
  for (const [value, label] of Object.entries(options)) {
    const b = el("button", {textContent: label});
    b.onclick = () => { set(value); remember(); render(); };
    b.dataset.value = value;
    host.append(b);
  }
  host.sync = () => host.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b.dataset.value === get()));
}

// Clicking the pressed button again clears the decision
function decide(kind, id, value, rerender) {
  const next = decisions[kind][id] === value ? null : value;
  if (next) decisions[kind][id] = next; else delete decisions[kind][id];
  save({kind, id, value: next});
  rerender();
  tally();
}

function verdict(kind, id, node, rerender) {
  const state = decisions[kind][id];
  const yes = el("button", {textContent: kind === "photos" ? "Keep" : "Approve"}), no = el("button", {textContent:"Reject"});
  yes.setAttribute("aria-pressed", state === "approved");
  no.setAttribute("aria-pressed", state === "rejected");
  yes.onclick = () => decide(kind, id, "approved", rerender);
  no.onclick = () => decide(kind, id, "rejected", rerender);
  node.dataset.state = state || "";
  return [yes, no];
}

const kept = p => p["Candidate Photos"].filter(path => decisions.photos[path] === "approved");
// The photo that will go on the map: the one you starred, else the first one you kept
const coverOf = p => {
  const pick = decisions.cover[key(p)];
  return pick && decisions.photos[pick] === "approved" ? pick : null;
};
const thumbOf = url => url.replace("/photos/", "/photos/thumbs/");

function coverPanel(p) {
  const pick = coverOf(p), keep = kept(p), first = pick || (!p["Map Photo URL"] && keep[0]);
  if (first) return el("div", {className:"cover"}, el("img", {src: "/photo?path=" + encodeURIComponent(first), alt:""}),
    el("div", {}, el("b", {textContent: p["Map Photo URL"] ? "Will replace the map photo" : "Will go on the map"}),
      `${keep.length} kept for ${p.City}. ${pick ? "You starred this one." : "Star a kept photo to choose a different one."}`));
  if (p["Map Photo URL"]) return el("div", {className:"cover"}, el("img", {src: thumbOf(p["Map Photo URL"]), alt:""}),
    el("div", {}, el("b", {textContent:"On the map now"}),
      `${keep.length} more kept as extras. Star a kept photo to put it on the map instead.`));
  return el("div", {className:"cover none"}, el("div", {}, el("b", {textContent:"No map photo yet"}), "Keep a photo below and it goes on the map."));
}

function card(p) {
  const art = el("article");
  const draw = () => art.replaceChildren(...cardBody(p, art, draw));
  draw();
  return art;
}

function cardBody(p, art, draw) {
  const id = key(p);
  const tags = el("p", {className:"meta"});
  if (p["Map Notable"]) tags.append(el("span", {className:"tag", textContent:`Notable · level ${p["Map Notability"] || 1}`}));
  if (p["Map Pin"] && p["Map Pin"] !== p.City) tags.append(el("span", {className:"tag", textContent:`Map pin: ${p["Map Pin"]}`}));
  tags.append(`${p.Photos} photos over ${p.Days} day${p.Days === 1 ? "" : "s"}, ${p["First Seen"]} to ${p["Last Seen"]}`);
  const title = el("div", {}, el("h2", {textContent: p.City}),
    el("div", {className:"where", textContent: [p["State / Province / Region / District"], p.Country].filter(Boolean).join(", ")}), tags);
  const parts = [el("div", {className:"head"}, title, el("div", {className:"actions"}, ...verdict("locations", id, art, draw))), coverPanel(p)];
  if (p["Candidate Photos"].length) {
    const grid = el("div", {className:"photos"});
    // Best match first, from rank_candidates.py; unscored photos keep their order at the end
    const match = p.Match || {}, pick = coverOf(p) || (!p["Map Photo URL"] && kept(p)[0]);
    const ordered = [...p["Candidate Photos"]].sort((a, b) => (match[b] ?? -9) - (match[a] ?? -9));
    for (const path of ordered) {
      const fig = el("figure"), src = "/photo?path=" + encodeURIComponent(path);
      const img = el("img", {src, loading:"lazy", alt:`Candidate photo for ${p.City}`});
      img.onclick = () => { zoom.firstElementChild.src = src; zoom.showModal(); };
      const extra = [];
      if (decisions.photos[path] === "approved") {
        fig.dataset.cover = path === pick;
        if (path === pick) extra.push(el("span", {className:"badge", textContent:"★ Map photo"}));
        else {
          const star = el("button", {textContent:"★ Use on map"});
          star.onclick = () => { decisions.cover[id] = path; save({kind:"cover", id, value: path}); draw(); };
          extra.push(star);
        }
      }
      if (match[path] !== undefined) extra.push(el("span", {className:"match", textContent:`match ${Math.round(match[path] * 100)}`}));
      fig.append(img, el("figcaption", {}, ...verdict("photos", path, fig, draw), ...extra));
      grid.append(fig);
    }
    parts.push(grid);
  }
  return parts;
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

// Has a photo if one is approved here or the map pin already shows one
const hasPhoto = p => p["Map Photo"] || kept(p).length > 0;

function visible(p) {
  const d = standing(p);
  if (photo === "with" && !hasPhoto(p)) return false;
  if (photo === "without" && hasPhoto(p)) return false;
  if (scope === "notable" && !p["Map Notable"]) return false;
  if (scope === "other" && p["Map Notable"]) return false;
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
// Most notable first, then the places with the most photos
fetch("/data").then(r => r.json()).then(d => {
  places = d.places.sort((a, b) => (b["Map Notable"] - a["Map Notable"]) || ((b["Map Notability"] || 0) - (a["Map Notability"] || 0)) || (b.Photos - a.Photos));
  decisions = d.decisions; decisions.cover ||= {}; render();
  scrollTo(0, remembered.y || 0);
});
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
        bucket = self.decisions.setdefault(body["kind"], {})
        if body["value"]:
            bucket[body["id"]] = body["value"]
        else:
            bucket.pop(body["id"], None)
        self.decisions_path.write_text(json.dumps(self.decisions, indent=2, ensure_ascii=False))
        self.send(b"{}", "application/json")


LOCATIONS_URL = "https://storage.googleapis.com/eklhad-web-public/data/locations.json"
RENAMES = {"Hoefn": "Höfn", "Hveragerdi": "Hveragerði", "Grindavik": "Grindavík", "Cezy": "Cézy", "Loch Garman": "Wexford"}


def km(a, b):
    la1, lo1, la2, lo2 = map(math.radians, (*a, *b))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 12742 * math.asin(math.sqrt(h))


def attach_map(places):
    """Tag each place with the live map pin it became, so filters use the map's Notable flag and photos, not the scan's."""
    with urllib.request.urlopen(f"{LOCATIONS_URL}?t={int(time.time())}", timeout=60) as resp:
        pins = [p for p in json.load(resp) if isinstance(p.get("lat"), (int, float))]
    for place in places:
        here = (place.get("Lat"), place.get("Lng"))
        names = {RENAMES.get(place["City"], place["City"]), place.get("On Map As") or ""}
        close = [p for p in pins if isinstance(here[0], (int, float)) and km(here, (p["lat"], p["lng"])) < 60]
        pin = next((p for p in close if p["city"] in names), None)
        if pin is None and close:
            nearest = min(close, key=lambda p: km(here, (p["lat"], p["lng"])))
            pin = nearest if km(here, (nearest["lat"], nearest["lng"])) < 15 else None
        place["Map Pin"] = pin["city"] if pin else ""
        place["Map Notable"] = bool(pin and pin.get("notable"))
        place["Map Notability"] = (pin or {}).get("notability", 0)
        place["Map Photo"] = bool(pin and pin.get("photourl"))
        place["Map Country"] = (pin or {}).get("country", place["Country"])
        place["Map Photo Date"] = (pin or {}).get("photodate", "")
        place["Map Photo URL"] = (pin or {}).get("photourl", "")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("locations", type=Path, nargs="?", default=Path.home() / "eklhad-takeout/takeout_locations.json")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()

    App.places = json.loads(args.locations.read_text())
    attach_map(App.places)
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
