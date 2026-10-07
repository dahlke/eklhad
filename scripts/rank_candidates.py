#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["open_clip_torch", "torch", "Pillow", "pillow-heif"]
# ///
"""
Scores every review candidate photo for how well it shows its place, offline
with CLIP: similarity to "a scenic photo of <place>: <keywords>" minus the best
match among things that make a poor map photo (selfies, screenshots, food,
blurry shots). Scores go into takeout_locations.json under "Match", and the
review app sorts each place's photos best first. Already-scored photos are
skipped, so it can be rerun after adding candidates.

Usage:
    uv run scripts/rank_candidates.py
"""

import json
from pathlib import Path

import open_clip
import torch
from PIL import Image, ImageOps
from pillow_heif import register_heif_opener

register_heif_opener()

DESKTOP = Path.home() / "Desktop"
KEYWORDS = Path(__file__).with_name("stamp_keywords.json")
POOR = ["a selfie of a person's face", "a screenshot of a phone screen", "a close-up photo of food on a plate",
        "a blurry dark photo", "a photo of a document or receipt", "a group of people posing indoors"]


def main():
    path = DESKTOP / "takeout_locations.json"
    places = json.loads(path.read_text())
    keywords = json.loads(KEYWORDS.read_text())
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    model, _, preprocess = open_clip.create_model_and_transforms("ViT-B-32", pretrained="laion2b_s34b_b79k", device=device)
    tokenizer = open_clip.get_tokenizer("ViT-B-32")
    model.eval()

    with torch.no_grad():
        poor = model.encode_text(tokenizer(POOR).to(device))
        poor /= poor.norm(dim=-1, keepdim=True)
        scored = 0
        for place in places:
            match = place.setdefault("Match", {})
            todo = [p for p in place["Candidate Photos"] if p not in match and Path(p).exists()]
            if not todo:
                continue
            motifs = keywords.get(place.get("Map Pin") or place["City"], "").replace(" · ", ", ")
            text = model.encode_text(tokenizer([f"a scenic travel photo of {place['City']}, {place['Country']}: {motifs}"]).to(device))
            text /= text.norm(dim=-1, keepdim=True)
            for start in range(0, len(todo), 16):
                batch = todo[start:start + 16]
                images = torch.stack([preprocess(ImageOps.exif_transpose(Image.open(p)).convert("RGB")) for p in batch]).to(device)
                feats = model.encode_image(images)
                feats /= feats.norm(dim=-1, keepdim=True)
                good = (feats @ text.T).squeeze(1)
                bad = (feats @ poor.T).max(dim=1).values
                for p, g, b in zip(batch, good.tolist(), bad.tolist()):
                    match[p] = round(g - 0.5 * b, 4)
                scored += len(batch)
            print(f"{place['City']}: {len(todo)} scored", flush=True)
    path.write_text(json.dumps(places, indent=2, ensure_ascii=False))
    print(f"scored {scored} photos")


if __name__ == "__main__":
    main()
