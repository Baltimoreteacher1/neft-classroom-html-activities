#!/usr/bin/env python3
"""extract_reveal.py — pull curated teaching pieces out of a Reveal Math .pptx.

Given a Reveal Math lesson deck, this finds the three pieces the HTML lesson
engine knows how to render:

  1. Notice & Wonder DATA image  — the data display students analyze (NOT the
     decorative "Be Curious Mindset" stock photo), plus the data-context text.
  2. Word problem               — the application/"Apply:" slide: its image
     (if any), the problem text, and a short title from the "Apply: ___" label.

It is a *read-only reporter*: it extracts text, copies the chosen raster images
to the requested output paths, and prints a single JSON blob on stdout. All
config wiring + git/build orchestration lives in scripts/reveal-lesson.mjs.

Usage:
  python3 extract_reveal.py <deck.pptx> --notice-wonder-out <path.png> \
      --word-problem-out <path.png> [--no-write]

With --no-write, no image files are written (dry-run); the JSON still reports
which slides/images WOULD be used and their dimensions.

Heuristics (validated on the official "Describe Data Using the Median" deck,
where notice/wonder data = image8.png and word problem = image23.png/slide53):

  * Notice & Wonder image: among the slides near the "Be Curious / notice /
    wonder" mindset slides, pick the embedded raster on the slide whose text
    mentions the DATA ("data set", "summarize", "collected the data",
    "notice about"). Strongly prefer a PNG data graphic; avoid wide JPEG
    photos and stock-photo media (Shutterstock / Rawpixel / the large
    decorative "Be Curious Mindset" image).
  * Notice & Wonder context: the data-context sentence(s) from that slide
    (the non-question body text), lightly cleaned.
  * Word problem: the slide whose text contains "Apply" or a real-world
    application question ("fair... price", "What would be...", "Question:").
    Save its largest content image; derive the title from an "Apply: ___"
    label when present.
"""

from __future__ import annotations

import argparse
import io
import json
import os
import re
import sys

try:
    from PIL import Image
except Exception:  # Pillow optional — fall back to raw bytes if unavailable.
    Image = None

try:
    from pptx import Presentation
    from pptx.util import Emu
except Exception as exc:  # pragma: no cover - dependency guard
    print(
        json.dumps({"error": f"python-pptx import failed: {exc}"}),
        file=sys.stdout,
    )
    sys.exit(2)

try:
    from PIL import Image

    _HAVE_PIL = True
except Exception:  # pragma: no cover - PIL is optional for dims only
    _HAVE_PIL = False


PICTURE_SHAPE_TYPE = 13  # MSO_SHAPE_TYPE.PICTURE

# Words that flag the decorative mindset/stock art we must NOT pick.
_STOCK_HINTS = ("shutterstock", "rawpixel", "istock", "getty", "adobe stock")

# Words that flag the data-context slide for Notice & Wonder.
_DATA_HINTS = (
    "data set",
    "summarize",
    "collected the data",
    "notice about",
    "the data shown",
    "data shown",
)

# Words that flag the application / word-problem slide.
_APPLY_HINTS = ("apply", "question:", "fair, but", "fair but", "selling price")


def _clean_text(text: str) -> str:
    """Collapse whitespace and strip Reveal's invisible markers."""
    if not text:
        return ""
    # Drop zero-width / soft markers Reveal embeds, normalise unicode spaces.
    text = text.replace("​", "").replace("\xa0", " ")
    text = re.sub(r"[ \t]*\n[ \t]*", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def _slide_text_blocks(slide):
    """Return cleaned, non-empty text frames for a slide (order preserved)."""
    blocks = []
    for shape in slide.shapes:
        if shape.has_text_frame:
            raw = shape.text_frame.text
            cleaned = _clean_text(raw)
            if cleaned:
                blocks.append(cleaned)
    return blocks


def _slide_pictures(slide):
    """Return [{partname, content_type, bytes, w, h, emu_w, emu_h, blob}] for a slide."""
    pics = []
    for shape in slide.shapes:
        if shape.shape_type != PICTURE_SHAPE_TYPE:
            continue
        try:
            blip = shape._element.blip_rId
            part = slide.part.related_part(blip)
            partname = str(part.partname)
            blob = shape.image.blob
            content_type = shape.image.content_type
        except Exception:
            continue
        w = h = None
        if _HAVE_PIL:
            try:
                with Image.open(io.BytesIO(blob)) as im:
                    w, h = im.size
            except Exception:
                w = h = None
        emu_w = Emu(shape.width).inches if shape.width else None
        emu_h = Emu(shape.height).inches if shape.height else None
        pics.append(
            {
                "partname": partname,
                "content_type": content_type,
                "bytes": len(blob),
                "w": w,
                "h": h,
                "emu_w": emu_w,
                "emu_h": emu_h,
                "blob": blob,
            }
        )
    return pics


# Banners/badges are tiny; the Be Curious photo is a large image.
_MIN_IMAGE_PX = 40_000


def _is_real_image(pic) -> bool:
    """True for a substantial image (the Be Curious photo), not a tiny banner/icon."""
    w, h = pic.get("w"), pic.get("h")
    if w and h and (w * h) < _MIN_IMAGE_PX:
        return False
    return True


def _image_area(pic) -> float:
    return float((pic.get("w") or 0) * (pic.get("h") or 0))


def _find_notice_wonder(slides):
    """Locate the Be Curious slide, its PHOTO (the launch image students notice &
    wonder about), and the data-context text.

    Teacher preference: the Notice & Wonder image is the Be Curious launch PHOTO
    (the engaging real-world image on the "What do you notice? / wonder?" slide),
    NOT the later data table. We pick the largest real image on the Be Curious
    anchor slide (or the next slide that has one).
    """
    # 1) Anchor on the "Be Curious / notice / wonder / mindset" slides.
    anchors = []
    for idx, slide in enumerate(slides):
        joined = " ".join(_slide_text_blocks(slide)).lower()
        # Reveal's Be Curious launch varies: "What do you notice? / wonder?" on
        # some decks, "What could the question be?" on others. Anchor on the
        # Be Curious / Mindset marker itself (don't require notice/wonder words).
        if "be curious" in joined or "mindset" in joined:
            anchors.append(idx)

    # 2) The Be Curious photo: largest real image on the anchor slide, scanning a
    #    small window forward if the anchor itself has no usable image.
    if anchors:
        order = list(range(anchors[0], min(anchors[0] + 4, len(slides))))
    else:
        order = list(range(min(8, len(slides))))

    best_idx, best_pic = None, None
    for idx in order:
        pics = [p for p in _slide_pictures(slides[idx]) if _is_real_image(p)]
        if pics:
            best_idx = idx
            best_pic = max(pics, key=_image_area)
            break

    if best_pic is None:
        return None

    # 3) Context = the scenario/data sentence NEAR the Be Curious slide (not the
    #    later rule/summary). Gather text from the anchor slide + the next few,
    #    then pick the best descriptive (non-question, non-rule) block.
    start = anchors[0] if anchors else best_idx
    window_blocks = []
    for idx in range(start, min(start + 4, len(slides))):
        window_blocks.extend(_slide_text_blocks(slides[idx]))
    context = _pick_context(window_blocks)
    if not context:
        context = _pick_context(_slide_text_blocks(slides[best_idx]))

    return {
        "slide_number": best_idx + 1,
        "context": context,
        "image": best_pic,
    }


# Procedural rule/summary phrasing — NOT a notice/wonder scenario.
_RULE_HINTS = (
    "algorithm",
    "place the decimal",
    "multiply both",
    "power of 10",
    "quotient above",
    "you can use",
)


def _pick_context(blocks):
    """Pick the scenario/data sentence from a set of text blocks."""
    descriptive = []
    for b in blocks:
        low = b.lower()
        if low in ("reveal:", "think about it:", "be curious", "mindset"):
            continue
        if low.endswith(":") and len(b) < 40:
            continue  # short labels like "Teaching Experience"
        if any(r in low for r in _RULE_HINTS):
            continue  # skip the procedural rule/summary
        descriptive.append(b)
    if not descriptive:
        return ""
    # The richest scenario/data block is reliably the longest one (it may end
    # with the framing question, which is fine for a Notice & Wonder prompt).
    # Only fall back to skipping questions if the longest is a bare mindset ask.
    longest = max(descriptive, key=len)
    if longest.strip().endswith("?") and len(longest) < 30:
        non_q = [b for b in descriptive if not b.strip().endswith("?")]
        if non_q:
            return max(non_q, key=len)
    return longest


def _find_word_problem(slides):
    """Locate the application / "Apply:" slide, its image, text, and title."""
    candidates = []
    n = len(slides)
    for idx, slide in enumerate(slides):
        blocks = _slide_text_blocks(slide)
        joined = " ".join(blocks).lower()
        hits = sum(1 for h in _APPLY_HINTS if h in joined)
        has_apply_label = any(b.lower().startswith("apply") for b in blocks)
        if hits == 0 and not has_apply_label:
            continue
        # Application slides live late in the deck; weight that in.
        lateness = idx / max(n - 1, 1)
        score = hits + (2.0 if has_apply_label else 0.0) + lateness
        candidates.append((score, idx, slide, blocks))

    if not candidates:
        return None

    candidates.sort(key=lambda c: c[0], reverse=True)
    _, idx, slide, blocks = candidates[0]

    title = _derive_apply_title(blocks)
    text = _pick_problem_text(blocks)

    pics = [p for p in _slide_pictures(slide) if _is_real_image(p)]
    image = max(pics, key=_image_area) if pics else None

    return {
        "slide_number": idx + 1,
        "title": title,
        "text": text,
        "image": image,
    }


def _derive_apply_title(blocks):
    """Turn an "Apply: Real Estate" label into a clean title."""
    for b in blocks:
        if b.lower().startswith("apply"):
            # "Apply: Real Estate" -> "Apply: Real Estate"
            label = re.sub(r"\s+", " ", b).strip()
            return label
    return "Apply"


def _pick_problem_text(blocks):
    """Pick the real-world problem statement from the slide."""
    body = [b for b in blocks if not b.lower().startswith("apply")]
    if not body:
        return ""
    text = max(body, key=len)
    # Reveal often prefixes the ask with a literal "Question:" — keep the
    # whole statement but normalise that marker into a sentence flow.
    text = re.sub(r"\bQuestion:\s*", "", text).strip()
    return text


def _web_extension(content_type) -> str:
    """Keep photos as .jpg (light) and graphics as .png."""
    ct = (content_type or "").lower()
    return ".jpg" if ("jpeg" in ct or "jpg" in ct) else ".png"


def _save_web_image(blob, final_path, ext, max_w=1100):
    """Downscale to <= max_w wide and save in a web-friendly format."""
    if Image is None:
        with open(final_path, "wb") as fh:
            fh.write(blob)
        return
    try:
        img = Image.open(io.BytesIO(blob))
        if img.width and img.width > max_w:
            ratio = max_w / float(img.width)
            img = img.resize((max_w, max(1, int(img.height * ratio))), Image.LANCZOS)
        if ext == ".jpg":
            img.convert("RGB").save(final_path, "JPEG", quality=85, optimize=True)
        else:
            img.save(final_path, "PNG", optimize=True)
    except Exception:
        with open(final_path, "wb") as fh:
            fh.write(blob)


def _emit_image(pic, out_path, write):
    """Write the chosen image (web-sized, format matched to source); return a
    report whose `out`/`filename` reflect the ACTUAL extension written."""
    if pic is None:
        return None
    ext = _web_extension(pic.get("content_type"))
    base, _ = os.path.splitext(out_path)
    final_path = base + ext
    report = {
        "partname": pic["partname"],
        "content_type": pic["content_type"],
        "bytes": pic["bytes"],
        "width": pic["w"],
        "height": pic["h"],
        "out": final_path,
        "filename": os.path.basename(final_path),
    }
    if write:
        _save_web_image(pic["blob"], final_path, ext)
    return report


def main(argv=None):
    ap = argparse.ArgumentParser(description="Extract curated Reveal pieces.")
    ap.add_argument("pptx")
    ap.add_argument("--notice-wonder-out", required=True)
    ap.add_argument("--word-problem-out", required=True)
    ap.add_argument(
        "--no-write",
        action="store_true",
        help="Report only; do not write any image files.",
    )
    args = ap.parse_args(argv)

    try:
        prs = Presentation(args.pptx)
    except Exception as exc:
        print(json.dumps({"error": f"could not open pptx: {exc}"}))
        return 2

    slides = list(prs.slides)
    write = not args.no_write

    nw = _find_notice_wonder(slides)
    wp = _find_word_problem(slides)

    out = {"slide_count": len(slides), "noticeAndWonder": None, "wordProblem": None}

    if nw is not None:
        img_report = _emit_image(nw["image"], args.notice_wonder_out, write)
        out["noticeAndWonder"] = {
            "slide_number": nw["slide_number"],
            "context": nw["context"],
            "image": img_report,
        }

    if wp is not None:
        img_report = _emit_image(wp["image"], args.word_problem_out, write)
        out["wordProblem"] = {
            "slide_number": wp["slide_number"],
            "title": wp["title"],
            "text": wp["text"],
            "image": img_report,
        }

    print(json.dumps(out))
    return 0


if __name__ == "__main__":
    sys.exit(main())
