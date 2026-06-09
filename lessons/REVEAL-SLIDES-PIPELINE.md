# Reveal Math Slides Pipeline

Drop the **official Reveal Math slides** for a lesson into one folder, run one
command, and they show up in **three** places for that lesson:

- the interactive HTML deck — `lessons/<id>/slides.html`
- the editable PPTX deck — `lessons/<id>/slides.pptx`
- the **client-rendered HTML lesson page** — `lessons/<id>/index.html` (the app
  that renders from `config.json`). Each Reveal slide is shown **inside its
  matching lesson section** (Launch, Explore, Practice, Connect, …), driven by a
  managed `config.revealSlides` field this pipeline writes (see §6).

Everything stays **local** to the repo. No image is uploaded anywhere; the HTML
references the images by relative path and the PPTX embeds them directly.

> **Build/deploy note:** the lesson page (`index.html`) is **built from
> `config.json`** by Vite. After running this pipeline you must **rebuild/deploy**
> (push to `main` → Cloudflare runs `npm run build`) for the new Reveal slides to
> appear on the live lesson page. The slide decks (`slides.html`/`slides.pptx`)
> are post-processed in place and need no build.

---

## 0. Curated lesson integration (recommended)

If you have the **raw Reveal Math lesson deck** (`.pptx`), you don't need to
hand-crop images or write config. One command extracts the right teaching pieces
and wires them into the lesson:

```bash
npm run reveal-lesson -- <lesson-id> <reveal.pptx> [--dry-run] [--deploy]

# Preview only, write nothing:
npm run reveal-lesson -- 8-2 ~/Downloads/reveal-median.pptx --dry-run

# Wire it (writes images + config; review, then deploy yourself):
npm run reveal-lesson -- 8-2 ~/Downloads/reveal-median.pptx

# Wire + build + commit on a branch + ff main + push (auto-deploy):
npm run reveal-lesson -- 8-2 ~/Downloads/reveal-median.pptx --deploy
```

`npm run add-reveal -- <lesson> <reveal.pptx>` routes here automatically when the
single input is a `.pptx` (PDF / image-folder inputs keep the legacy slide-deck
behavior in §1–§3).

### What it extracts

It reads the deck with `python-pptx` (helper: `scripts/lib/extract_reveal.py`)
and writes two managed fields into `lessons/<id>/config.json`:

- **`config.noticeAndWonder`** — the **data display** students analyze plus its
  context sentence. Rendered as a "Be Curious / Notice & Wonder" card **after the
  Objectives**.
- **`config.revealWordProblem`** — the application/"Apply:" problem (title, text,
  image). Rendered as an "Apply" card **after Vocabulary**.

Images are saved to `lessons/<id>/reveal-assets/notice-wonder.png` and
`word-problem.png` (Vite copies `reveal-assets/` into `dist/`).

### Heuristics (and when to eyeball the result)

- **Notice & Wonder image** — among the slides near the "Be Curious / notice /
  wonder / mindset" slides, it picks the embedded raster on the slide whose text
  mentions the data (`data set`, `summarize`, `collected the data`,
  `notice about`). It **prefers a PNG data graphic** and **rejects wide JPEG
  photos / stock art** (Shutterstock, Rawpixel) — so it grabs the chalkboard data
  table, not the decorative "Be Curious Mindset" stock photo.
- **Notice & Wonder context** — the longest descriptive (non-question) body
  sentence on that slide, whitespace-cleaned.
- **Word problem** — the late-deck slide whose text contains `Apply` / a
  real-world ask (`fair, but… price`, `Question:`); its largest content image is
  saved; the title comes from the `Apply: ___` label.
- **Sentence starters** — generic, reusable defaults (`I notice that…` /
  `I wonder why…`, etc.); customize per lesson if you want topic-specific stems.

These are robust on standard Reveal lesson decks. **Always eyeball the two images
and the extracted text after a real run** (`--dry-run` first, or `npm run preview`
after) — context/title wording often reads better after light teacher polish, and
unusual deck layouts may need the slide/image picked by hand.

### Idempotent & order-preserving

Re-running **replaces** the two managed fields (never duplicates). All other
config keys, the key order, the 2-space indent, and the trailing newline are
preserved. `--dry-run` writes nothing.

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
    {
      "file": "01.png",
      "caption": "Warm-Up: What is a ratio?",
      "placement": "notice-wonder"
    },
    {
      "file": "02.png",
      "caption": "Example 1 — Comparing quantities",
      "placement": "problem"
    },
    { "file": "03.png", "caption": "Guided Practice", "placement": "connect" }
  ]
}
```

| Field                | Required | Meaning                                                                                     |
| -------------------- | -------- | ------------------------------------------------------------------------------------------- |
| `title`              | no       | Heading on the section divider slide. Default: "Reveal Math Slides".                        |
| `source`             | no       | Attribution line shown on the divider slide.                                                |
| `slides[].file`      | yes      | Image filename inside `reveal-slides/`.                                                     |
| `slides[].caption`   | no       | Caption shown under the image + used as alt text / speaker note + lesson-page caption.      |
| `slides[].placement` | no       | Which **lesson section** the slide belongs in. Alias of `role`. Resolved to a canonical id. |
| `slides[].role`      | no       | Same as `placement` (alias). If both are present, `placement` wins.                         |
| `slides[].page`      | no       | Page number recorded in `config.revealSlides`. Defaults to the slide's 1-based order.       |

Files listed in the manifest that don't exist are skipped with a warning.

### Placement → canonical lesson section

`placement`/`role` tells the **lesson page** (and the deck) which section a Reveal
slide belongs in. Any friendly value is resolved to one of the **canonical
sections** below via `resolvePlacement()` in `scripts/integrate-reveal-slides.mjs`
— so the deck and the lesson page always agree exactly. Unknown or missing values
fall back to **`launch`**.

| Canonical section | Example accepted aliases                                                         |
| ----------------- | -------------------------------------------------------------------------------- |
| `launch`          | `launch`, `warm-up`, `notice-wonder`, `intro`, `hook`, `do-now`                  |
| `explore`         | `explore`, `investigate`, `discover`, `sort`, `activity`                         |
| `vocabulary`      | `vocabulary`, `vocab`, `words`, `terms`, `glossary`                              |
| `instruction`     | `instruction`, `teach`, `concept`, `example(s)`, `model`, `i-do`                 |
| `practice`        | `practice`, `problem(s)`, `guided`, `independent`, `we-do`, `you-do`, `exercise` |
| `connect`         | `connect`, `apply`, `real-world`, `discuss`, `turn-and-talk`                     |
| `closure`         | `closure`, `wrap-up`, `exit(-ticket)`, `reflect`, `summary`, `review`            |

(See `PLACEMENT_ALIASES` in the script for the full list.)

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

- **slides.html** — **interleaves** each Reveal page into the deck at its
  placement: a responsive, lazy-loaded, keyboard-navigable `<img>` slide is
  inserted right after the matching section's slides (notice/wonder → Launch,
  problems → Practice, etc.), then all slide ids, the `slideTitles` table of
  contents, `totalSlides`, and the sidebar thumbnails are rebuilt so navigation
  (← → arrows, present mode) stays correct. Alt text comes from the caption.
- **slides.pptx** — rebuilds the base notebook deck and inserts each Reveal
  image as a **full-bleed, editable picture slide** near its placement (not all
  trailing at the end).
- **config.json** — writes a managed `revealSlides` array so the **lesson page**
  (`index.html` app) can render each Reveal slide inside its matching section.
  See §6. (Requires a rebuild/deploy to appear on the live lesson page.)

### No-op when absent

If a lesson has **no `reveal-slides/` folder**, the script does nothing to the
decks for that lesson and reports it as `skipped`. The base generators are never
modified. As a clean reversal, if `config.revealSlides` was set by a prior run it
is **removed** from that lesson's `config.json` (reported as `cleared`).

---

## 4. Idempotency

Re-running is always safe and never duplicates:

- **HTML** — the injected slides + thumbnails live between marker comments
  (`<!-- reveal-slides:begin -->` … `<!-- reveal-slides:end -->` and a matching
  thumbnail block). Each run strips the previous block, restores the deck's
  original slide count/titles (saved in a state comment), then re-injects fresh.
- **PPTX** — rebuilt from the lesson's `config.json` each run, so Reveal picture
  slides never stack up.
- **config.json** — `config.revealSlides` is a **managed field**: each run
  **replaces it entirely** from the current `reveal-slides/` folder + manifest, so
  it never grows or duplicates. When the folder is removed, the field is removed.

Update the images or `reveal-slides.json`, re-run, and the decks **and the lesson
page config** reflect the new state exactly.

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

## 6. Reveal slides on the lesson page (`config.revealSlides`)

The same Reveal slides also appear on the **client-rendered HTML lesson page**
(`lessons/<id>/index.html`, which renders from `config.json`). The renderer reads
a managed `config.revealSlides` array and displays each slide **inside its
matching section**. This pipeline is the **only writer** of that field; the
renderer is the only reader.

```jsonc
"revealSlides": [
  {
    "src": "/lessons/<id>/reveal-slides/01.png", // absolute served image path
    "caption": "Notice & Wonder warm-up", // from the manifest (may be "")
    "placement": "launch", // CANONICAL section (resolvePlacement of placement/role)
    "page": 1 // from the manifest, else 1-based order
  }
]
```

- **Managed + idempotent:** re-running **replaces** the whole array; it never
  grows or duplicates.
- **Reversible:** delete the `reveal-slides/` folder and re-run → the field is
  **removed** from `config.json` (the lesson page reverts cleanly).
- **`placement` is canonical:** it is the same value the deck uses, resolved via
  `resolvePlacement()`, so the deck and the lesson page agree exactly.
- **Build/deploy required:** the lesson app is built from `config.json` by Vite —
  push to `main` (Cloudflare runs `npm run build`) for changes to go live.

---

## Quick reference

| Thing           | Value                                                                                  |
| --------------- | -------------------------------------------------------------------------------------- |
| Drop folder     | `lessons/<id>/reveal-slides/`                                                          |
| Image order     | natural filename sort, or `reveal-slides.json` order                                   |
| Manifest        | `lessons/<id>/reveal-slides/reveal-slides.json` (opt)                                  |
| Placement       | per-slide `placement`/`role` → canonical section (see §1); default `launch`            |
| Command         | `npm run generate-reveal-slides -- --lesson <id>`                                      |
| Dry run         | add `--dry-run`                                                                        |
| Outputs touched | `lessons/<id>/slides.html`, `lessons/<id>/slides.pptx`, `config.json` (`revealSlides`) |
| Lesson page     | reads `config.revealSlides`; needs a **build/deploy** to reflect config changes        |
