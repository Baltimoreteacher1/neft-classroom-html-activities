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
import re
import sys

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


def _is_data_graphic(pic) -> bool:
    """True for a plausible data graphic: a PNG, not a wide stock photo."""
    ct = (pic.get("content_type") or "").lower()
    pn = (pic.get("partname") or "").lower()
    if any(h in pn for h in _STOCK_HINTS):
        return False
    if "jpeg" in ct or "jpg" in ct:
        # Reveal's decorative mindset/stock art is a wide JPEG photo.
        return False
    # Very small PNGs are usually icons/badges (e.g. the 797x132 banner).
    w, h = pic.get("w"), pic.get("h")
    if w and h and (w * h) < 30_000:
        return False
    return True


def _score_notice_image(pic) -> float:
    """Higher = more likely the real data display on a notice/wonder slide."""
    score = 0.0
    if _is_data_graphic(pic):
        score += 100.0
    # Prefer a graphic with a substantial-but-not-giant footprint.
    w, h = pic.get("w"), pic.get("h")
    if w and h:
        area = w * h
        # Sweet spot ~ a readable table/chart (tens to low-hundreds of k px).
        score += min(area, 400_000) / 10_000.0
    return score


def _find_notice_wonder(slides):
    """Locate the Notice & Wonder data slide, image, and context text."""
    # 1) Anchor on the "Be Curious / notice / wonder / mindset" slides.
    anchors = []
    for idx, slide in enumerate(slides):
        joined = " ".join(_slide_text_blocks(slide)).lower()
        if ("be curious" in joined or "mindset" in joined) and (
            "notice" in joined or "wonder" in joined
        ):
            anchors.append(idx)

    # 2) Candidate data slides: those mentioning the data context, ideally
    #    just after the first anchor (the lesson's opening notice/wonder).
    first_anchor = anchors[0] if anchors else 0
    candidates = []
    for idx, slide in enumerate(slides):
        blocks = _slide_text_blocks(slide)
        joined = " ".join(blocks).lower()
        if any(h in joined for h in _DATA_HINTS):
            pics = _slide_pictures(slide)
            data_pics = [p for p in pics if _is_data_graphic(p)]
            if not data_pics:
                continue
            # Proximity to the opening anchor breaks ties toward the intro.
            distance = abs(idx - first_anchor)
            candidates.append((distance, idx, slide, blocks, data_pics))

    if not candidates:
        return None

    candidates.sort(key=lambda c: c[0])
    _, idx, slide, blocks, data_pics = candidates[0]

    best_pic = max(data_pics, key=_score_notice_image)

    # Context = the longest descriptive (non-question, non-"Reveal:") block.
    context = _pick_context(blocks)

    return {
        "slide_number": idx + 1,
        "context": context,
        "image": best_pic,
    }


def _pick_context(blocks):
    """Pick the data-context sentence(s) from a slide's text blocks."""
    descriptive = []
    for b in blocks:
        low = b.lower()
        if low in ("reveal:", "think about it:", "be curious", "mindset"):
            continue
        if low.endswith(":") and len(b) < 40:
            continue  # short labels like "Teaching Experience"
        descriptive.append(b)
    if not descriptive:
        return ""
    # Prefer the block that actually describes the data (the longest one that
    # is not purely a question), else the longest block overall.
    non_q = [b for b in descriptive if not b.strip().endswith("?")]
    pool = non_q or descriptive
    return max(pool, key=len)


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

    pics = _slide_pictures(slide)
    data_pics = [p for p in pics if _is_data_graphic(p)]
    image = max(data_pics, key=lambda p: p["bytes"]) if data_pics else None

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


def _emit_image(pic, out_path, write):
    """Write the chosen image to out_path (unless dry-run); return a report."""
    if pic is None:
        return None
    report = {
        "partname": pic["partname"],
        "content_type": pic["content_type"],
        "bytes": pic["bytes"],
        "width": pic["w"],
        "height": pic["h"],
        "out": out_path,
    }
    if write:
        with open(out_path, "wb") as fh:
            fh.write(pic["blob"])
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
