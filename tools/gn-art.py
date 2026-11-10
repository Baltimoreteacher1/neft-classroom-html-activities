#!/usr/bin/env python3
"""Axiom City comic art pipeline: generate panel images, then pack them into one atlas per book.

    gn-art.py generate <panels.json> [--only id,id] [--force]   needs mflux (FLUX.1-schnell, local)
    gn-art.py pack     <panels.json>                              needs Pillow (optional per-panel "crop")
    gn-art.py prompts  <panels.json> [--only id]                  print the expanded prompts

Prompts in panels.json use {{key}} fragments from graphic-novels/axiom-city/_engine/art/CHARACTERS.md,
so a character is described once and reused word for word. Raw images go to a cache outside the repo
(GN_ART_CACHE, default ~/.cache/gn-art/<book>/raw/<id>.png); only the packed atlas ships.

pack writes:
  graphic-novels/axiom-city/art/<book>.webp           the atlas (ONE file per book; Pages caps dist at 20,000)
  <panels dir>/atlas.json                               {w, h, sha256, frames: {id: [x, y, w, h]}}
then run `node tools/inject-gn-art.mjs` to write the coordinates and alt text into the book.

Generate with the mflux tool's own interpreter, which has MLX:
  ~/.local/share/uv/tools/mflux/bin/python tools/gn-art.py generate <panels.json>
Model: dhairyashil/FLUX.1-schnell-mflux-4bit (Apache-2.0), downloaded to GN_ART_MODEL
(default ~/.cache/gn-art/models/flux-schnell-4bit).
"""

import argparse
import hashlib
import io
import json
import os
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CHARACTERS = ROOT / "graphic-novels/axiom-city/_engine/art/CHARACTERS.md"
ATLAS_DIR = ROOT / "graphic-novels/axiom-city/art"
CACHE = Path(os.environ.get("GN_ART_CACHE", Path.home() / ".cache/gn-art"))
MODEL = Path(os.environ.get("GN_ART_MODEL", CACHE / "models/flux-schnell-4bit"))


def fragments():
    """The `- key: text` lines under '## Prompt fragments' in CHARACTERS.md."""
    text = CHARACTERS.read_text()
    section = text.split("## Prompt fragments", 1)[1].split("\n## ", 1)[0]
    return {m[1]: m[2].strip() for m in re.finditer(r"^- (\w+): (.+)$", section, re.M)}


def expand(prompt, frags):
    def sub(m):
        if m[1] not in frags:
            sys.exit(f"unknown prompt fragment {{{{{m[1]}}}}}")
        return frags[m[1]]

    out = re.sub(r"\{\{(\w+)\}\}", sub, prompt)
    return re.sub(r"\.\s*\.", ".", out)


def load(spec_path):
    spec = json.loads(Path(spec_path).read_text())
    ids = [p["id"] for p in spec["panels"]]
    if len(ids) != len(set(ids)):
        sys.exit("duplicate panel ids")
    for p in spec["panels"]:
        w, h = p["size"]
        if w % 16 or h % 16:
            sys.exit(f"{p['id']}: size must be multiples of 16")
    return spec


def raw_dir(spec):
    d = CACHE / spec["book"] / "raw"
    d.mkdir(parents=True, exist_ok=True)
    return d


def pick(spec, only):
    want = set(filter(None, (only or "").split(",")))
    unknown = want - {p["id"] for p in spec["panels"]}
    if unknown:
        sys.exit(f"unknown ids: {', '.join(sorted(unknown))}")
    return [p for p in spec["panels"] if not want or p["id"] in want]


def cmd_prompts(args):
    spec, frags = load(args.spec), fragments()
    for p in pick(spec, args.only):
        print(
            f"[{p['id']}] seed={p['seed']} size={p['size']}\n{expand(p['prompt'], frags)}\n"
        )


def cmd_generate(args):
    from mflux.models.common.config import ModelConfig
    from mflux.models.flux.variants.txt2img.flux import Flux1

    spec, frags = load(args.spec), fragments()
    out = raw_dir(spec)
    todo = [
        p
        for p in pick(spec, args.only)
        if args.force or not (out / f"{p['id']}.png").exists()
    ]
    if not todo:
        print("nothing to generate")
        return
    flux = Flux1(
        model_config=ModelConfig.from_name(model_name="schnell"), model_path=str(MODEL)
    )
    steps = spec.get("generator", {}).get("steps", 4)
    for p in todo:
        t0 = time.time()
        w, h = p["size"]
        image = flux.generate_image(
            seed=p["seed"],
            prompt=expand(p["prompt"], frags),
            width=w,
            height=h,
            num_inference_steps=steps,
        )
        image.image.save(out / f"{p['id']}.png")
        print(
            f"{p['id']}: {w}x{h} seed {p['seed']} in {time.time() - t0:.0f}s",
            flush=True,
        )


def shelf_pack(sizes, max_w):
    """Place rectangles (tallest first) on shelves; returns {id: (x, y)} and the sheet size."""
    order = sorted(sizes, key=lambda k: (-sizes[k][1], k))
    pos, x, y, shelf_h, width = {}, 0, 0, 0, 0
    for k in order:
        w, h = sizes[k]
        if x and x + w > max_w:
            x, y, shelf_h = 0, y + shelf_h, 0
        pos[k] = (x, y)
        x += w
        shelf_h = max(shelf_h, h)
        width = max(width, x)
    return pos, (width, y + shelf_h)


def cmd_pack(args):
    from PIL import Image

    spec = load(args.spec)
    opts = spec.get("pack", {})
    scale, quality, max_bytes = (
        opts.get("scale", 1),
        opts.get("quality", 72),
        opts.get("maxBytes", 2_500_000),
    )
    src = raw_dir(spec)
    missing = [p["id"] for p in spec["panels"] if not (src / f"{p['id']}.png").exists()]
    if missing:
        sys.exit(f"missing raw images (run generate): {', '.join(missing)}")
    images, sizes = {}, {}
    for p in spec["panels"]:
        im = Image.open(src / f"{p['id']}.png").convert("RGB")
        if p.get("crop"):  # [left, top, right, bottom] as 0-1: trim a frame the model drew inside the image
            l, t, r, b = p["crop"]
            im = im.crop((round(l * im.width), round(t * im.height), round(r * im.width), round(b * im.height)))
        w, h = round(im.width * scale), round(im.height * scale)
        images[p["id"]] = im.resize((w, h), Image.LANCZOS)
        sizes[p["id"]] = (w, h)
    pos, (W, H) = shelf_pack(sizes, opts.get("maxWidth", 2048))
    sheet = Image.new("RGB", (W, H), (13, 31, 51))
    for k, im in images.items():
        sheet.paste(im, pos[k])
    buf = io.BytesIO()
    sheet.save(buf, "WEBP", quality=quality, method=6)
    data = buf.getvalue()
    if len(data) > max_bytes:
        sys.exit(
            f"atlas is {len(data)} bytes, over the {max_bytes} budget: lower pack.scale or pack.quality"
        )
    ATLAS_DIR.mkdir(parents=True, exist_ok=True)
    atlas = ATLAS_DIR / f"{spec['book']}.webp"
    atlas.write_bytes(data)
    meta = {
        "w": W,
        "h": H,
        "bytes": len(data),
        "sha256": hashlib.sha256(data).hexdigest(),
        "frames": {p["id"]: [*pos[p["id"]], *sizes[p["id"]]] for p in spec["panels"]},
    }
    (Path(args.spec).parent / "atlas.json").write_text(
        json.dumps(meta, indent=2) + "\n"
    )
    print(
        f"{atlas.relative_to(ROOT)}: {W}x{H}, {len(data) / 1e6:.2f} MB, {len(images)} frames"
    )


def main():
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    sub = ap.add_subparsers(dest="cmd", required=True)
    for name in ("generate", "pack", "prompts"):
        s = sub.add_parser(name)
        s.add_argument("spec")
        s.add_argument("--only")
        s.add_argument("--force", action="store_true")
    args = ap.parse_args()
    {"generate": cmd_generate, "pack": cmd_pack, "prompts": cmd_prompts}[args.cmd](args)


if __name__ == "__main__":
    main()
