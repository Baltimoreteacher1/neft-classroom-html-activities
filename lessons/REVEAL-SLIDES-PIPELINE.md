# Reveal Math Slides Pipeline

Drop the **official Reveal Math slides** for a lesson into one folder, run one
command, and they are injected into BOTH of that lesson's generated decks:

- the interactive HTML deck — `lessons/<id>/slides.html`
- the editable PPTX deck — `lessons/<id>/slides.pptx`

Everything stays **local** to the repo. No image is uploaded anywhere; the HTML
references the images by relative path and the PPTX embeds them directly.

---

## 1. Where to drop the slides (input contract)

Create this folder inside the lesson you want to populate:

```
lessons/<id>/reveal-slides/
├── 01.png                 ← ordered slide images (.png / .jpg / .jpeg / .webp)
├── 02.png
├── 03.png
├── reveal.pdf             ← (optional) the source PDF, for your records
└── reveal-slides.json     ← (optional) manifest (title, captions, order)
```

`<id>` is the lesson folder name, e.g. `3-1-flagship`, `7-2`, `10-1-flagship`.

### Image files (required)

- Put **one image per Reveal slide**, in order.
- Name them so they sort correctly: `01.png`, `02.png`, … `10.png`. Natural
  sort is used, so `2.png` sorts before `10.png` correctly, but zero-padding
  (`02.png`) is the safest.
- Accepted extensions: `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`.
- Large, readable exports are best (classroom projection). 1600px-wide PNGs are
  a good target.

### `reveal-slides.json` manifest (optional)

If present, the manifest controls the **title, order, and captions**. If absent,
the script just uses every image in the folder in natural filename order.

```json
{
  "title": "Reveal Math — Lesson 3-1: Ratios",
  "source": "Reveal Math Grade 6, Course 1 (McGraw Hill)",
  "slides": [
    { "file": "01.png", "caption": "Warm-Up: What is a ratio?" },
    { "file": "02.png", "caption": "Example 1 — Comparing quantities" },
    { "file": "03.png", "caption": "Guided Practice" }
  ]
}
```

| Field              | Required | Meaning                                                              |
| ------------------ | -------- | -------------------------------------------------------------------- |
| `title`            | no       | Heading on the section divider slide. Default: "Reveal Math Slides". |
| `source`           | no       | Attribution line shown on the divider slide.                         |
| `slides[].file`    | yes      | Image filename inside `reveal-slides/`.                              |
| `slides[].caption` | no       | Caption shown under the image + used as alt text / speaker note.     |

Files listed in the manifest that don't exist are skipped with a warning.

---

## 2. Converting a PDF export to images

The primary supported input is **per-slide images**. If Reveal gives you a PDF
export, convert it to one image per page first (any one of these works):

```bash
# pdftoppm (Poppler) — recommended, crisp PNGs, zero-padded names
pdftoppm -png -r 150 reveal.pdf lessons/<id>/reveal-slides/slide

# ImageMagick / Ghostscript
magick -density 150 reveal.pdf lessons/<id>/reveal-slides/%02d.png

# macOS sips (per page, scripted) or Preview → Export each page as PNG
```

Then (optionally) drop the original `reveal.pdf` in the same folder for your
records — it is ignored by the pipeline (informational only).

---

## 3. Run the pipeline

```bash
# One lesson
npm run generate-reveal-slides -- --lesson 3-1-flagship

# All lessons that have a reveal-slides/ folder
npm run generate-reveal-slides

# Preview what WOULD change, write nothing
npm run generate-reveal-slides -- --lesson 3-1-flagship --dry-run
```

(You can also call it directly: `node scripts/integrate-reveal-slides.mjs --lesson 3-1-flagship`.)

### What it does

- **slides.html** — appends a labeled "Reveal Math Slides" section: a divider
  slide plus one responsive, lazy-loaded, keyboard-navigable `<img>` slide per
  Reveal page. These join the existing deck navigation (sidebar thumbnails,
  ← → arrows, present mode). Alt text comes from the caption.
- **slides.pptx** — rebuilds the base notebook deck, then appends a divider
  slide and one **full-bleed, editable picture slide** per Reveal image.

### No-op when absent

If a lesson has **no `reveal-slides/` folder**, the script does nothing for that
lesson and reports it as `skipped`. The base generators are never modified.

---

## 4. Idempotency

Re-running is always safe and never duplicates:

- **HTML** — the injected slides + thumbnails live between marker comments
  (`<!-- reveal-slides:begin -->` … `<!-- reveal-slides:end -->` and a matching
  thumbnail block). Each run strips the previous block, restores the deck's
  original slide count/titles (saved in a state comment), then re-injects fresh.
- **PPTX** — rebuilt from the lesson's `config.json` each run, so Reveal picture
  slides never stack up.

Update the images or `reveal-slides.json`, re-run, and the decks reflect the new
state exactly.

### Removing Reveal slides from a lesson

Delete the `lessons/<id>/reveal-slides/` folder, then regenerate the base decks:

```bash
node scripts/generate-slides.mjs <id>
node scripts/generate-pptx.mjs <id>
```

That returns both decks to their clean, Reveal-free state.

---

## 5. Classroom-safety notes

- Images stay **local** to the repo — nothing is uploaded.
- No student data is read or written.
- Labels and the divider slide use large, readable type for projection.
- The HTML images are `loading="lazy"` and `decoding="async"` so the deck stays
  responsive even with many high-resolution Reveal pages.

---

## Quick reference

| Thing           | Value                                                  |
| --------------- | ------------------------------------------------------ |
| Drop folder     | `lessons/<id>/reveal-slides/`                          |
| Image order     | natural filename sort, or `reveal-slides.json` order   |
| Manifest        | `lessons/<id>/reveal-slides/reveal-slides.json` (opt)  |
| Command         | `npm run generate-reveal-slides -- --lesson <id>`      |
| Dry run         | add `--dry-run`                                        |
| Outputs touched | `lessons/<id>/slides.html`, `lessons/<id>/slides.pptx` |
