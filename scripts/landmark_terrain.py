#!/usr/bin/env python3
"""
Bakes the dot-terrain scenes drawn behind the profile panel, two per place:
the Golden Gate (wide, then from Battery Spencer), Chicago (the skyline from
the lake, then the Bean), Dublin (Howth harbour, then a harp standing over
Dublin Bay) and Tahoe City (the shore under the Sierra crest, then the view
down the lake). The canvas morphs from one scene to the next. The scene order here
must match SCENE_PLACE in ParticleCanvas.tsx.

Each scene is two things:
  - a ROWS x COLS height grid from the public AWS Terrarium elevation tiles
    (no key), lightly smoothed;
  - a "sprite": the landmark drawn as vertical runs of dots standing on the
    grid. These are built by hand below. They are silhouettes, not to scale
    with the terrain, so that they read at a glance.

A scene is seen from a camera facing `heading` degrees (0 = north, 90 = east).
Row 0 is nearest the viewer, column 0 is on the left. `anchor` is the
landmark; it lands at (anchor_row, anchor_col) as fractions of the grid, so it
sits clear of the text on the left of the panel.

Output: web/frontend/src/component/particleCanvas/terrain.bin
  byte 0 = scene count, byte 1 = rows, byte 2 = cols, then for each scene:
  - rows*cols bytes, row-major. 0 = water, otherwise height in STEP meters
    (minimum 1 on land).
  - uint16 LE n, then n runs of 4 bytes: row, col, bottom, top. Row and col
    are fractions of the grid scaled to 0-255; bottom and top are STEP meters.
  - one byte n, then n beacons of 3 bytes: row, col, height. They pulse.

Usage:
    uv run scripts/landmark_terrain.py
"""

import io
import math
import os
import random
import urllib.request

from PIL import Image

OUT_PATH = os.path.join(os.path.dirname(__file__), "../web/frontend/src/component/particleCanvas/terrain.bin")
TILE_URL = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"
ZOOM = 14
ROWS, COLS = 90, 100
STEP = 2.5
M_PER_DEG_LAT = 111_320

# Golden Gate: anchorages and towers, south to north. Deck 67 m, towers 227 m.
GG_SOUTH_ANCHOR = (37.8079, -122.4755)
GG_SOUTH_TOWER = (37.8106, -122.4772)
GG_NORTH_TOWER = (37.8253, -122.4791)
GG_NORTH_ANCHOR = (37.8282, -122.4797)
GG_DECK, GG_TOP = 67, 227

# Howth. The harbour lighthouse position is from OpenStreetMap.
HOWTH_LIGHT = (53.3941, -6.0668)
DUBLIN = (53.3470, -6.2414)  # the Liffey at the Samuel Beckett Bridge
TAHOE_CITY = (39.1720, -120.1390)
TAHOE_LAKE_LEVEL = 1897

SCENES = [
    {
        "name": "San Francisco, wide",
        # The Golden Gate from the Bay looking west: the Presidio at the left, Marin at the right
        "anchor": (37.8180, -122.4782), "anchor_row": 0.5, "anchor_col": 0.58,
        "heading": 270, "depth_m": 5_000, "width_m": 4_600,
        "sea_level": 0, "water_below": 0.5, "vscale": 1.0, "sprite": "golden_gate",
    },
    {
        "name": "San Francisco, from Battery Spencer",
        # Looking south-east along the bridge from the Marin side: the north
        # tower up close, the south tower and the city beyond
        "anchor": GG_NORTH_TOWER, "anchor_row": 0.15, "anchor_col": 0.5,
        "heading": 145, "depth_m": 2_600, "width_m": 2_600,
        "sea_level": 0, "water_below": 0.5, "vscale": 1.5, "sprite": "battery_spencer",
    },
    {
        "name": "Chicago, from the lake",
        "anchor": (41.8789, -87.6359), "anchor_row": 0.5, "anchor_col": 0.6,
        "heading": 270, "depth_m": 4_500, "width_m": 4_000,
        "sea_level": 176, "water_below": 0.5, "vscale": 1.0, "sprite": "chicago",
    },
    {
        "name": "Chicago, the Bean",
        # Cloud Gate in Millennium Park, looking north at the buildings behind it
        "anchor": (41.8827, -87.6233), "anchor_row": 0.4, "anchor_col": 0.6,
        "heading": 0, "depth_m": 1_500, "width_m": 1_500,
        "sea_level": 176, "water_below": 0.5, "vscale": 1.0, "sprite": "bean",
    },
    {
        "name": "Howth, the harbour",
        # Across the harbour from the west pier: boats, the east pier and its lighthouse
        "anchor": HOWTH_LIGHT, "anchor_row": 0.32, "anchor_col": 0.64,
        "heading": 80, "depth_m": 2_500, "width_m": 2_500,
        "sea_level": 0, "water_below": 5, "vscale": 2.5, "sprite": "howth_harbour",
    },
    {
        "name": "Dublin, the harp",
        # Dublin Bay from the sea looking west: Howth at the right, the Dublin
        # and Wicklow mountains at the left, a harp standing where the city is
        "anchor": DUBLIN, "anchor_row": 0.55, "anchor_col": 0.6,
        "heading": 262, "depth_m": 24_000, "width_m": 22_000, "zoom": 11,
        "sea_level": 0, "water_below": 3, "vscale": 0.8, "sprite": "harp",
    },
    {
        "name": "Tahoe City, the shore",
        # From over the lake looking west-south-west: the town's shore, the Sierra crest behind
        "anchor": TAHOE_CITY, "anchor_row": 0.4, "anchor_col": 0.6,
        "heading": 250, "depth_m": 14_000, "width_m": 12_000, "zoom": 12,
        "sea_level": TAHOE_LAKE_LEVEL, "water_below": 1.5, "vscale": 0.5, "sprite": "tahoe_shore",
    },
    {
        "name": "Tahoe City, down the lake",
        # From the beach looking south-south-east down the length of the lake
        "anchor": TAHOE_CITY, "anchor_row": 0.08, "anchor_col": 0.55,
        "heading": 165, "depth_m": 36_000, "width_m": 26_000, "zoom": 11,
        "sea_level": TAHOE_LAKE_LEVEL, "water_below": 1.5, "vscale": 0.5, "sprite": "tahoe_lake",
    },
]


def tile_xy(lat, lng, z):
    n = 2 ** z * 256
    x = (lng + 180) / 360 * n
    y = (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n
    return x, y


_tiles = {}


def elevation(lat, lng, zoom=ZOOM):
    px, py = tile_xy(lat, lng, zoom)
    key = (zoom, int(px // 256), int(py // 256))
    if key not in _tiles:
        with urllib.request.urlopen(TILE_URL.format(z=key[0], x=key[1], y=key[2])) as r:
            _tiles[key] = Image.open(io.BytesIO(r.read())).convert("RGB").load()
    r, g, b = _tiles[key][int(px % 256), int(py % 256)]
    return r * 256 + g + b / 256 - 32768


class Scene:
    def __init__(self, s):
        self.s = s
        self.lat0, self.lng0 = s["anchor"]
        self.m_per_deg_lng = M_PER_DEG_LAT * math.cos(math.radians(self.lat0))
        h = math.radians(s["heading"])
        self.sin_h, self.cos_h = math.sin(h), math.cos(h)
        self.runs = set()     # (row byte, col byte, bottom, top)
        self.beacons = set()  # (row byte, col byte, height)

    def latlng(self, row, col):
        fwd = (row / (ROWS - 1) - self.s["anchor_row"]) * self.s["depth_m"]
        right = (col / (COLS - 1) - self.s["anchor_col"]) * self.s["width_m"]
        east = fwd * self.sin_h + right * self.cos_h
        north = fwd * self.cos_h - right * self.sin_h
        return self.lat0 + north / M_PER_DEG_LAT, self.lng0 + east / self.m_per_deg_lng

    def cell(self, lat, lng):
        """Fractional (row, col) of a point."""
        north = (lat - self.lat0) * M_PER_DEG_LAT
        east = (lng - self.lng0) * self.m_per_deg_lng
        fwd = east * self.sin_h + north * self.cos_h
        right = east * self.cos_h - north * self.sin_h
        return ((fwd / self.s["depth_m"] + self.s["anchor_row"]) * (ROWS - 1),
                (right / self.s["width_m"] + self.s["anchor_col"]) * (COLS - 1))

    def run(self, row, col, bottom, top):
        """A vertical run of dots at (row, col), from `bottom` to `top` meters."""
        if 0 <= row <= ROWS - 1 and 0 <= col <= COLS - 1:
            self.runs.add((*coord(row, col), steps(bottom), steps(top)))

    def dot(self, row, col, height):
        self.run(row, col, height, height)

    def beacon(self, row, col, height):
        self.beacons.add((*coord(row, col), steps(height)))

    def block(self, row, col, width, top, bottom=0):
        """A filled block `width` columns wide, as one run per column."""
        for i in range(width + 1):
            self.run(row, col + i, bottom, top)

    def line(self, row, col_from, col_to, height):
        """A horizontal line of dots at half-column spacing."""
        for i in range(round((col_to - col_from) * 2) + 1):
            self.dot(row, col_from + i / 2, height)


def coord(row, col):
    return round(row / (ROWS - 1) * 255), round(col / (COLS - 1) * 255)


def steps(meters):
    return max(0, min(255, round(meters / STEP)))


def lerp(a, b, t):
    return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)


def along(points, n=200):
    for a, b in zip(points, points[1:]):
        for i in range(n + 1):
            yield lerp(a, b, i / n)


def golden_gate(scene, grid):
    cable = {}  # (row, col*2) -> cable height
    for i in range(801):
        t = i / 800
        rise = GG_DECK + (GG_TOP - GG_DECK) * t
        sag = GG_DECK + 4 + (GG_TOP - GG_DECK - 4) * (2 * t - 1) ** 2
        for point, height in (
            (lerp(GG_SOUTH_ANCHOR, GG_SOUTH_TOWER, t), rise),
            (lerp(GG_NORTH_ANCHOR, GG_NORTH_TOWER, t), rise),
            (lerp(GG_SOUTH_TOWER, GG_NORTH_TOWER, t), sag),
        ):
            row, col = scene.cell(*point)
            key = (round(row), round(col * 2))
            cable[key] = max(cable.get(key, 0), height)
    for (row, col2), height in cable.items():
        scene.dot(row, col2 / 2, GG_DECK)
        # Every other position gets a suspender down to the deck
        scene.run(row, col2 / 2, GG_DECK if col2 % 2 == 0 else height, height)
    for tower in (GG_SOUTH_TOWER, GG_NORTH_TOWER):
        row, col = scene.cell(*tower)
        for d in (-0.5, 0, 0.5):
            scene.run(row, col + d, 0, GG_TOP)
        scene.beacon(row, col, GG_TOP + 6)


def chicago(scene, grid):
    row, col = (round(v) for v in scene.cell(*scene.s["anchor"]))
    # Sears Tower: bundled tubes that stop at different floors, two antennas,
    # and the dark mechanical bands.
    profile = [205, 368, 442, 442, 368, 270]
    left = col - 6
    for i, top in enumerate(profile):
        for c in (0, 1):
            scene.run(row, left + i * 2 + c, 0, top)
    scene.run(row, left + 12, 0, profile[-1])
    for band in (125, 262, 364, 438):
        for i, top in enumerate(profile):
            if top >= band:
                scene.line(row, left + i * 2, left + i * 2 + 2, band)
    for c in (col - 1, col + 1):
        scene.run(row, c, 442, 527)
        scene.beacon(row, c, 530)

    # John Hancock Center: tapered, with two antennas
    hc = col + 25
    for i in range(-6, 7):
        x = i / 2
        scene.run(row + 5, hc + x, 0, min(344, (3.6 - abs(x)) / 1.6 * 344))
    for c in (hc - 0.5, hc + 0.5):
        scene.run(row + 5, c, 344, 457)

    # The rest of the skyline, stylized: (rows back, cols right, width, height)
    for dr, dc, width, top in [
        (-7, -30, 4, 150), (4, -24, 3, 221), (-3, -19, 3, 183), (6, -14, 3, 250),
        (2, -10, 2, 293), (3, 9, 3, 307), (-5, 13, 3, 259), (-9, 17, 3, 346),
        (7, 19, 2, 200), (-2, 31, 3, 180), (-11, 27, 3, 303),
    ]:
        scene.block(row + dr, col + dc, width, top)
    # A wall of lower buildings behind and in front, as from the lakefront
    rng = random.Random(3)
    for dr, low, high in ((4, 110, 240), (-6, 50, 125)):
        c = 4
        while c < COLS - 6:
            width = rng.choice((2, 2, 3, 4))
            scene.block(row + dr, c, width, rng.uniform(low, high))
            c += width + rng.choice((1, 1, 2))
    # Trump Tower: setbacks and a spire
    scene.block(row - 3, col + 19, 4, 250)
    scene.block(row - 3, col + 20, 3, 357)
    scene.run(row - 3, col + 21.5, 357, 423)


def battery_spencer(scene, grid):
    near, far = scene.cell(*GG_NORTH_TOWER), scene.cell(*GG_SOUTH_TOWER)

    def at(u):
        """Position, height scale and half-width of the deck at `u` along the main span."""
        t = min(1, max(0, u))
        # Perspective by hand: the near end is drawn twice the size of the far end
        return lerp(near, far, u), 2 - t, 4.5 - 3.3 * t

    def cable(u):
        if u < 0:
            return GG_DECK + (GG_TOP - GG_DECK) * (1 + u / 0.27)
        if u > 1:
            return GG_DECK + (GG_TOP - GG_DECK) * (1 - (u - 1) / 0.27)
        return GG_DECK + 4 + (GG_TOP - GG_DECK - 4) * (2 * u - 1) ** 2

    for i in range(-54, 255):
        u = i / 200
        # Fewer dots toward the far end, where they bunch up on screen
        if u > 0.6 and i % 2:
            continue
        (row, col), k, w = at(u)
        for side in (-w, w):
            scene.dot(row, col + side, GG_DECK * k)
            scene.dot(row, col + side, cable(u) * k)
            if i % 4 == 0:
                scene.run(row, col + side, GG_DECK * k, cable(u) * k)

    for u in (0, 1):
        (row, col), k, w = at(u)
        for side in (-w, w):
            for d in (-0.5, 0, 0.5):
                scene.run(row, col + side + d * k / 2, 0, GG_TOP * k)
        # The portal struts between the legs
        for height in (52, 104, 146, 186, 222):
            scene.line(row, col - w, col + w, height * k)
        scene.beacon(row, col, (GG_TOP + 6) * k)

    # The city in the distance, at the left
    rng = random.Random(5)
    for c in range(8, 34):
        scene.run(ROWS - 4, c, 0, rng.uniform(25, 90))
    scene.run(ROWS - 4, 19, 0, 150)
    scene.run(ROWS - 4, 23, 0, 125)


def bean(scene, grid):
    row, col = scene.cell(*scene.s["anchor"])
    half, top = 24, 190  # columns, meters: drawn far over life size

    for i in range(-half * 2, half * 2 + 1):
        x = i / (half * 2)  # -1 to 1 across the Bean
        roof = top * (1 - x * x) ** 0.4
        if abs(x) < 0.24:
            floor = top * 0.24 * math.sqrt(1 - (x / 0.24) ** 2)  # the arch underneath
        elif abs(x) > 0.7:
            floor = top * 0.45 * ((abs(x) - 0.7) / 0.3) ** 2     # the ends tuck under
        else:
            floor = 0
        if roof > floor:
            scene.run(row, col + i / 2, floor, roof)
            # A firmer outline, top and bottom
            for edge in (roof + 3, roof + 6, floor - 3):
                scene.dot(row, col + i / 2, max(0, edge))

    # The buildings behind it
    rng = random.Random(9)
    for dr, low, high in ((28, 50, 110), (38, 90, 190), (48, 130, 260)):
        c = 6
        while c < COLS - 8:
            width = rng.choice((3, 4, 5, 6))
            scene.block(row + dr, c, width, rng.uniform(low, high))
            c += width + rng.choice((1, 2))
    # Two Prudential's spire and the Aon Center
    scene.block(row + 44, col + 4, 5, 250)
    scene.run(row + 44, col + 6.5, 250, 300)
    scene.block(row + 46, col + 13, 6, 310)


def lighthouse(scene, row, col, size):
    """A tower with a gallery, lantern and dome, and the keeper's house to its right.
    Returns the fill and line helpers so a scene can add to it at the same scale."""

    def fill(x_from, x_to, bottom, top):
        """Runs every half column from x_from to x_to. `top` may be a function of x."""
        for i in range(round((x_to - x_from) * size * 2) + 1):
            x = x_from + i / (size * 2)
            height = top(x) if callable(top) else top
            scene.run(row, col + x * size, bottom * size, height * size)

    def line(x_from, x_to, height):
        scene.line(row, col + x_from * size, col + x_to * size, height * size)

    # The tower, tapering to the gallery
    fill(-3, 3, 0, lambda x: 125 if abs(x) <= 2.2 else 125 * (3 - abs(x)) / 0.8)
    line(-2.8, 2.8, 127)
    line(-3.2, 3.2, 131)
    line(-3.2, 3.2, 143)
    for x in (-3.2, -1.6, 0, 1.6, 3.2):
        fill(x, x, 131, 143)
    # The lantern, the dome and the finial
    fill(-1.8, 1.8, 131, 165)
    for half, height in ((1.5, 168), (1.0, 173), (0.5, 177)):
        line(-half, half, height)
    fill(0, 0, 177, 190)
    scene.beacon(row, col, 150 * size)
    # The keeper's house, with its chimney
    fill(3.5, 13, 0, 78)
    line(3.5, 13.5, 80)
    fill(12.4, 13, 80, 98)
    return fill, line


def harp(scene, grid):
    row, col = scene.cell(*DUBLIN)
    wide, tall = 34, 380  # columns, meters
    left = col - wide * 0.45

    def soundbox(x):  # slants from the top left down to the foot
        return 0.92 * (1 - x / 0.78)

    def neck(x):      # the curved top, dipping in the middle
        return 0.93 - 0.13 * math.sin(math.pi * x / 0.95)

    steps_across = wide * 2
    for i in range(steps_across + 1):
        x = i / steps_across
        c = left + x * wide
        if x <= 0.95:
            scene.run(row, c, neck(x) * tall, (neck(x) + 0.055) * tall)
        if x <= 0.78:
            scene.run(row, c, max(0, soundbox(x) - 0.09) * tall, soundbox(x) * tall)
            # A string every few steps, from the soundbox up to the neck
            if i % 3 == 0 and 0.05 < x < 0.76:
                scene.run(row, c, soundbox(x) * tall, neck(x) * tall)
    # The bowed pillar at the right
    for j in range(121):
        y = j / 120 * 0.93
        x = 0.78 + 0.17 * y / 0.93 + 0.07 * math.sin(math.pi * y / 0.93)
        scene.line(row, left + (x - 0.02) * wide, left + (x + 0.02) * wide, y * tall)


def howth_harbour(scene, grid):
    row, col = scene.cell(*HOWTH_LIGHT)
    rng = random.Random(11)
    size = 1.3
    fill, line = lighthouse(scene, row, col, size)

    # The pier wall to the right, the lower wall and the rocks to the left
    fill(13.5, (COLS - 1 - col) / size, 0, 30)
    fill(-14, -3.5, 0, 34)
    fill(-40, -14.5, 0, lambda x: max(3, 24 * (40 + x) / 26 + rng.uniform(-4, 4)))
    for dr in (1, 2):
        for i in range(-100, 50):
            scene.run(row - dr, col + i / 2, 0, rng.uniform(4, 26 - 6 * dr))

    # The small beacon on the far breakwater
    for x_from, x_to, bottom, top in ((-30.3, -29.7, 0, 58), (-30, -30, 58, 78)):
        fill(x_from, x_to, bottom, top)
    line(-31, -29, 58)
    line(-31, -29, 66)
    scene.beacon(row, col - 30 * size, 80 * size)

    # Boats in the harbour, nearer the viewer: a hull and a mast each
    for _ in range(46):
        r = row - rng.uniform(5, 20)
        c = col + rng.uniform(-36, 30)
        scene.line(r, c - 1, c + 1, 4)
        scene.run(r, c, 4, rng.uniform(40, 95))


def pine(scene, row, col, height):
    """A pine: a trunk and a tapering crown."""
    half = height / 55
    scene.run(row, col, 0, height * 0.2)
    for i in range(-round(half * 2), round(half * 2) + 1):
        x = i / 2
        scene.run(row, col + x, height * 0.2, height * (1 - 0.8 * abs(x) / (half + 0.25)))


def shoreline(grid):
    """Land cells that touch water."""
    for r in range(ROWS):
        for c in range(COLS):
            near = [grid[rr][cc] for rr, cc in ((r - 1, c), (r + 1, c), (r, c - 1), (r, c + 1))
                    if 0 <= rr < ROWS and 0 <= cc < COLS]
            if grid[r][c] > 0 and min(near) <= 0:
                yield r, c


def pier(scene, row, col, rows_out, boats, rng):
    """A pier running toward the viewer from (row, col), with boats moored beside it."""
    for i in range(rows_out * 3):
        r = row - i / 3
        for d in (-0.5, 0.5):
            scene.run(r, col + d, 0, 10)
    for _ in range(boats):
        r = row - rng.uniform(1, rows_out)
        c = col + rng.choice((-1, 1)) * rng.uniform(2, 7)
        scene.line(r, c - 1, c + 1, 4)
        scene.run(r, c, 4, rng.uniform(40, 80))


def tahoe_shore(scene, grid):
    rng = random.Random(21)
    # Pines along the water's edge
    for r, c in shoreline(grid):
        if rng.random() < 0.55:
            pine(scene, r, c + rng.uniform(-0.4, 0.4), rng.uniform(50, 105))
    row, col = (round(v) for v in scene.cell(*TAHOE_CITY))
    pier(scene, row - 1, col, 7, 9, rng)


def tahoe_lake(scene, grid):
    rng = random.Random(23)
    row, col = scene.cell(*TAHOE_CITY)
    # Tall pines on the beach either side, the pier and its boats between them
    for _ in range(26):
        side = rng.choice((-1, 1))
        pine(scene, rng.uniform(0, 5), col + side * rng.uniform(9, 44), rng.uniform(110, 230))
    pier(scene, 16, col, 14, 12, rng)


SPRITES = {
    "golden_gate": golden_gate, "battery_spencer": battery_spencer, "chicago": chicago, "bean": bean,
    "howth_harbour": howth_harbour, "harp": harp,
    "tahoe_shore": tahoe_shore, "tahoe_lake": tahoe_lake,
}


def smooth(grid):
    """3x3 box blur, so slopes read as waves of dots instead of noise."""
    out = [row[:] for row in grid]
    for r in range(ROWS):
        for c in range(COLS):
            near = [grid[rr][cc] for rr in range(max(0, r - 1), min(ROWS, r + 2))
                    for cc in range(max(0, c - 1), min(COLS, c + 2))]
            out[r][c] = sum(near) / len(near)
    return out


def bake(s):
    scene = Scene(s)
    zoom = s.get("zoom", ZOOM)
    raw = [[elevation(*scene.latlng(r, c), zoom) - s["sea_level"] for c in range(COLS)] for r in range(ROWS)]
    blurred = smooth(raw)
    grid = [[0.0 if raw[r][c] < s["water_below"] else max(0.1, blurred[r][c]) * s["vscale"]
             for c in range(COLS)] for r in range(ROWS)]
    SPRITES[s["sprite"]](scene, grid)

    out = bytearray()
    for row in grid:
        for h in row:
            out.append(0 if h <= 0 else max(1, steps(h)))
    runs = sorted(scene.runs)
    out += len(runs).to_bytes(2, "little")
    for run in runs:
        out += bytes(run)
    out.append(len(scene.beacons))
    for beacon in sorted(scene.beacons):
        out += bytes(beacon)
    print(f"{s['name']}: {len(runs)} runs, {len(scene.beacons)} beacons, "
          f"{sum(1 for b in out[:ROWS * COLS] if b)} land cells")
    return out


def main():
    out = bytearray([len(SCENES), ROWS, COLS])
    for s in SCENES:
        out += bake(s)
    with open(OUT_PATH, "wb") as f:
        f.write(out)
    print(f"Wrote {OUT_PATH}: {len(out)} bytes")


if __name__ == "__main__":
    main()
