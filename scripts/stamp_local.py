#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["Pillow", "pillow-heif", "numpy"]
# ///
"""
Makes a "rubber-stamp field note" poster from a travel photo, fully local.

FLUX.2 Klein (via mflux) only draws the stamp, in a printmaking style picked
for the region. Everything else is composed here so it is exact: the original
photo on the left, aged paper on the right, and typewriter text.

Needs mflux: `uv tool install mflux`. The first run downloads the model.

Usage:
    uv run scripts/stamp_local.py photo.png "Dubrovnik" Croatia 2023 --number 20 \
        --keywords "walls, harbor, terracotta"
"""

import argparse
import subprocess
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps
from pillow_heif import register_heif_opener

register_heif_opener()

MFLUX = Path.home() / ".local/bin/mflux-generate-flux2-edit"
SIZE = (1600, 1200)
PHOTO_SHARE = 0.58
PAPER = (240, 232, 214)
FONT = "/System/Library/Fonts/Supplemental/AmericanTypewriter.ttc"

# Printmaking traditions to borrow from, by country. Anything missing falls back to DEFAULT_STYLE.
REGION_STYLES = {
    "Croatia": "Dalmatian folk art and old Adriatic travel posters; brick red, deep teal, charcoal",
    "Italy": "Italian Renaissance woodcut and vintage ENIT travel posters; terracotta, olive, sepia",
    "Spain": "Spanish azulejo tile motifs and linocut; cobalt blue, saffron, black",
    "Portugal": "Portuguese azulejo blue-and-white tile painting; cobalt, white, a touch of ochre",
    "France": "French Art Nouveau lithograph and SNCF travel posters; slate blue, ochre, black",
    "Greece": "Greek island folk woodcut; Aegean blue, whitewash, terracotta",
    "Ireland": "1930s Irish tourism poster linocut, with Celtic detail only as a small accent; moss green, slate blue, cream",
    "United Kingdom": "British railway poster linocut; navy, brick red, grey",
    "Iceland": "Nordic woodcut with stark volcanic forms; charcoal, glacier blue, rust",
    "Denmark": "Scandinavian mid-century linocut; muted red, black, sea blue",
    "Switzerland": "Swiss alpine poster woodcut; red, slate, snow white",
    "Netherlands": "Delftware blue tile illustration; cobalt blue, white",
    "Japan": "Japanese ukiyo-e woodblock print, Hiroshige style; indigo, vermilion, sumi black",
    "South Korea": "Korean minhwa folk painting as a woodblock print; jade green, red, black",
    "Taiwan": "Taiwanese temple woodblock print; red, gold ochre, black",
    "China": "Chinese woodblock print in the style of nianhua; vermilion, ink black, jade",
    "Thailand": "Thai lacquer and gold temple art as a linocut; gold ochre, deep red, black",
    "India": "Indian block printing in the Sanganeri tradition; indigo, madder red, turmeric",
    "Nepal": "Nepali paubha and prayer flag woodblock print; saffron, red, Himalayan blue",
    "Morocco": "Moroccan zellige and Berber motif linocut; terracotta, majolica blue, saffron",
    "Mexico": "Mexican linocut in the tradition of José Guadalupe Posada; black, magenta, marigold",
    "Peru": "Andean textile motifs as a woodcut; alpaca brown, terracotta, Inca gold",
    "Argentina": "Argentine fileteado porteño as a linocut; red, cream, black",
    "Brazil": "Brazilian cordel literature woodcut; black, warm yellow",
    "Chile": "Chilean arpillera folk illustration as a linocut; earth red, Andes blue",
    "Costa Rica": "Costa Rican oxcart painting as a linocut; red, jungle green, yellow",
    "Cuba": "Cuban silkscreen poster style; faded teal, coral, black",
    "New Zealand": "Kiwi mid-century travel poster linocut with subtle Maori koru motifs; fern green, ocean blue",
    "Australia": "Australian mid-century travel poster linocut; ochre, eucalyptus green, sea blue",
    "Canada": "Group of Seven inspired woodcut; forest green, lake blue, rust",
    "Malta": "Maltese baroque stonework and luzzu boat motifs as a linocut; honey limestone, Mediterranean blue, red",
    "Turkey": "Ottoman Iznik tile motifs as a woodcut; cobalt, turquoise, coral red",
    "Russia": "Russian lubok folk woodcut; red, gold ochre, black",
    "Germany": "German expressionist woodcut in the Bauhaus era; black, deep red, slate",
    "Panama": "Kuna mola textile layers as a linocut; red, black, orange",
    "Bahamas": "Bahamian Junkanoo and shoreline linocut; turquoise, coral, sand",
    "Cayman Islands": "Caribbean seaside linocut; turquoise, coral, sand",
    "Turks and Caicos": "Caribbean seaside linocut; turquoise, coral, sand",
    "United States of America": "WPA national park poster screenprint; muted sage, burnt orange, navy",
}

# The US is most of the map, so it gets a style per region instead of one for the whole country.
US_REGION_STYLES = {
    "California": "WPA-era California travel poster linocut; poppy orange, pacific blue, redwood green",
    "Arizona": "Southwest Navajo and Pueblo motifs as a linocut; terracotta, turquoise, desert sand",
    "Utah": "WPA national park poster of redrock country; burnt sienna, canyon red, sky blue",
    "Nevada": "Great Basin mining-town poster linocut; sagebrush green, rust, slate",
    "Colorado": "Rocky Mountain ski poster screenprint; pine green, snow white, rust",
    "Wyoming": "Western ranch brand and rodeo poster woodcut; saddle brown, sage, red",
    "Hawaii": "vintage Hawaiian aloha print and tiki woodcut; hibiscus red, ocean teal, cream",
    "Washington": "Pacific Northwest Coast Salish formline as a linocut; black, red, cedar",
    "Florida": "1950s Florida postcard and art deco linocut; flamingo pink, aqua, sun yellow",
    "Louisiana": "New Orleans jazz-age poster and wrought-iron motifs; deep purple, gold, green",
    "New York": "1930s New York subway poster linocut; navy, signal red, cream",
    "New Jersey": "Jersey Shore boardwalk poster linocut; sea blue, red, sand",
    "Massachusetts": "New England maritime scrimshaw as a linocut; navy, oxblood, bone",
    "Pennsylvania": "Pennsylvania Dutch hex sign folk art as a woodcut; red, mustard, black",
    "District of Columbia": "WPA federal poster screenprint; navy, red, stone",
    "Tennessee": "Appalachian quilt and folk woodcut; barn red, indigo, mustard",
    "Texas": "Texas honky-tonk gig poster letterpress; red, black, cream",
    "Illinois": "Chicago prairie school and Art Institute poster linocut; brick red, lake blue, ochre",
    "Wisconsin": "Northwoods lodge woodcut; forest green, lake blue, red plaid",
    "Michigan": "Great Lakes industrial poster linocut; steel blue, rust, cream",
    "Iowa": "Grant Wood regionalist woodcut; corn gold, barn red, sky blue",
    "Missouri": "Thomas Hart Benton regionalist woodcut; ochre, river brown, red",
    "Georgia": "Southern folk art linocut; peach, magnolia green, red clay",
    "North Carolina": "Blue Ridge folk woodcut; pine green, red clay, blue",
    "Virginia": "colonial Virginia sampler woodcut; red, navy, linen",
    "Alabama": "Southern space-age poster screenprint; rocket red, navy, cream",
    "Mississippi": "Gulf Coast bayou folk woodcut; moss green, brown, muted gold",
}
DEFAULT_STYLE = "regional folk printmaking; two or three muted, earthy inks"

PROMPT = (
    "Turn this photo into a small hand-carved rubber stamp print pressed on warm off-white paper. "
    "Style: {style}. Use only two or three spot inks from that palette. Keep only the essential "
    "silhouette of {place}: the shapes someone would recognize at a glance, nothing else. "
    "Show these motifs from the place: {motifs}. "
    "Visible carving marks, uneven ink coverage, slight misregistration between colors, lots of "
    "blank paper around the stamp. Absolutely no letters, words or writing anywhere in the image. "
    "No border, no round seal. Leave out every person, "
    "figure and face in the photo: show only the place itself."
)


def paper(size, seed=0):
    rng = np.random.default_rng(seed)
    base = np.ones((size[1], size[0], 3)) * PAPER
    grain = rng.normal(0, 6, (size[1], size[0], 1))
    blotch = np.array(Image.fromarray(rng.integers(0, 255, (size[1] // 40, size[0] // 40), dtype=np.uint8))
                      .resize(size, Image.BICUBIC).filter(ImageFilter.GaussianBlur(30)))[..., None] / 255 * 10 - 5
    return Image.fromarray(np.clip(base + grain + blotch, 0, 255).astype(np.uint8))


def lift_to_white(stamp):
    """Divide out the generated paper (estimated per pixel, so vignetting goes too) so a multiply blend keeps only the ink."""
    rgb = stamp.convert("RGB")
    small = rgb.resize((rgb.width // 8, rgb.height // 8)).filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(6))
    background = np.asarray(small.resize(rgb.size, Image.BICUBIC)).astype(float)
    lifted = np.clip(np.asarray(rgb).astype(float) / np.maximum(background, 1) * 255, 0, 255)
    lifted[lifted.min(axis=2) > 232] = 255
    return Image.fromarray(lifted.astype(np.uint8))


def crop_to_ink(ink, pad=0.04):
    """Trim the empty paper the model leaves around the stamp, so every stamp lands at a similar size."""
    mask = Image.fromarray(((np.asarray(ink).min(axis=2) < 215) * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(5))
    bbox = mask.getbbox()
    if not bbox:
        return ink
    margin = round(max(bbox[2] - bbox[0], bbox[3] - bbox[1]) * pad)
    return ink.crop((max(bbox[0] - margin, 0), max(bbox[1] - margin, 0),
                     min(bbox[2] + margin, ink.width), min(bbox[3] + margin, ink.height)))


def region_style(country, state=""):
    if country == "United States of America" and state in US_REGION_STYLES:
        return US_REGION_STYLES[state]
    return REGION_STYLES.get(country, DEFAULT_STYLE)


def generate_stamp(photo, place, country, seed, out, state="", motifs=""):
    with tempfile.TemporaryDirectory() as tmp:
        src = Path(tmp) / "photo.png"
        ImageOps.contain(photo, (1024, 1024)).save(src)
        style = region_style(country, state)
        subprocess.run([str(MFLUX), "--model", "flux2-klein-4b", "-q", "8", "--image-paths", str(src),
                        "--width", "768", "--height", "768", "--steps", "4", "--seed", str(seed),
                        "--prompt", PROMPT.format(style=style, place=place, motifs=motifs.replace(" · ", ", ") or "its landmarks and landscape"), "--output", str(out)],
                       check=True, capture_output=True)
    return Image.open(out)


def compose(photo, stamp, place, number, keywords, year):
    poster = Image.new("RGB", SIZE)
    left_w = round(SIZE[0] * PHOTO_SHARE)
    poster.paste(ImageOps.fit(photo, (left_w, SIZE[1]), Image.LANCZOS), (0, 0))

    panel = paper((SIZE[0] - left_w, SIZE[1]))
    ink = crop_to_ink(lift_to_white(stamp))
    box = ImageOps.contain(ink, (round(panel.width * 0.62), round(SIZE[1] * 0.30)))
    # Stamp centered in a fixed band, text pinned below it, so every poster lines up
    band_top, band_bottom = round(SIZE[1] * 0.38), round(SIZE[1] * 0.74)
    x, y = (panel.width - box.width) // 2, band_top + (band_bottom - band_top - box.height) // 2
    region = panel.crop((x, y, x + box.width, y + box.height))
    panel.paste(Image.fromarray((np.asarray(region, float) * np.asarray(box, float) / 255).astype(np.uint8)), (x, y))

    draw = ImageDraw.Draw(panel)
    ink_color = (58, 52, 46)
    lines = [(place.upper(), 34), (f"No. {number:03d}", 22), (keywords, 20), (str(year), 22)]
    ty = round(SIZE[1] * 0.79)
    for text, size in lines:
        font = ImageFont.truetype(FONT, size)
        draw.text(((panel.width - draw.textlength(text, font=font)) // 2, ty), text, font=font, fill=ink_color)
        ty += size + 18
    poster.paste(panel, (left_w, 0))
    return poster


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("photo", type=Path)
    parser.add_argument("place")
    parser.add_argument("country")
    parser.add_argument("year", type=int)
    parser.add_argument("--number", type=int, default=1)
    parser.add_argument("--keywords", default="")
    parser.add_argument("--seed", type=int, default=7)
    parser.add_argument("--stamp", type=Path, help="reuse an already generated stamp instead of running the model")
    parser.add_argument("--out", type=Path)
    args = parser.parse_args()

    photo = ImageOps.exif_transpose(Image.open(args.photo)).convert("RGB")
    out = args.out or args.photo.with_name(f"{args.photo.stem}_poster.png")
    stamp = Image.open(args.stamp) if args.stamp else generate_stamp(photo, args.place, args.country, args.seed, out.with_name(f"{out.stem}_stamp.png"))
    compose(photo, stamp, args.place, args.number, args.keywords, args.year).save(out)
    print(out)


if __name__ == "__main__":
    main()
