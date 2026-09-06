# Reveal Math Slides Pipeline

Drop the official Reveal Math slides for a lesson into one folder, run one
command, and they appear in three places:

- the interactive HTML deck — `lessons/<id>/slides.html`
- the editable PPTX deck — `lessons/<id>/slides.pptx`
- the client-rendered lesson page — `lessons/<id>/index.html`, which renders from
  `config.json` and shows each Reveal slide inside its matching lesson section
  (Launch, Explore, Practice, Connect, …) via the managed `config.revealSlides`
  field this pipeline writes (§6)

Images stay local to the repo. Nothing is uploaded: the HTML references images by
relative path and the PPTX embeds them.

> **Build/deploy.** The decks (`slides.html`, `slides.pptx`) are post-processed in
> place and need no build. The lesson page is built from `config.json` by Vite, so
> config changes go live only after a rebuild — push to `main` and let Cloudflare
> run `npm run build`.

---

## 0. Curated lesson integration (recommended)

With the raw Reveal Math lesson deck (`.pptx`), you do not need to hand-crop
images or write config. One command extracts the teaching pieces and wires them in:

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
single input is a `.pptx`. PDF and image-folder inputs keep the legacy slide-deck
behavior in §1–§3.

### What it extracts

It reads the deck with `python-pptx` (helper: `scripts/lib/extract_reveal.py`) and
writes two managed fields into `lessons/<id>/config.json`:

- **`config.noticeAndWonder`** — the data display students analyze, plus its
  context sentence. Rendered as a "Be Curious / Notice & Wonder" card after the
  Objectives.
- **`config.revealWordProblem`** — the application/"Apply:" problem (title, text,
  image). Rendered as an "Apply" card after Vocabulary.

Images are saved to `lessons/<id>/reveal-assets/notice-wonder.png` and
`word-problem.png`. Vite copies `reveal-assets/` into `dist/`.

### Heuristics, and when to eyeball the result

- **Notice & Wonder image** — among the slides near the "Be Curious / notice /
  wonder / mindset" slides, it picks the embedded raster whose slide text mentions
  the data (`data set`, `summarize`, `collected the data`, `notice about`). It
  prefers a PNG data graphic and rejects wide JPEG photos and stock art
  (Shutterstock, Rawpixel) — so it grabs the chalkboard data table, not the
  decorative "Be Curious Mindset" photo.
- **Notice & Wonder context** — the longest descriptive (non-question) body
  sentence on that slide, whitespace-cleaned.
- **Word problem** — the late-deck slide whose text contains `Apply` or a
  real-world ask (`fair, but… price`, `Question:`). Its largest content image is
  saved; the title comes from the `Apply: ___` label.
- **Sentence starters** — generic reusable defaults (`I notice that…`,
  `I wonder why…`). Customize per lesson for topic-specific stems.

These are robust on standard Reveal lesson decks. Always eyeball the two images
and the extracted text after a real run — use `--dry-run` first, or
`npm run preview` after. Context and title wording usually reads better with light
teacher polish, and an unusual deck layout may need the slide or image picked by
hand.

### Idempotent and order-preserving

Re-running replaces the two managed fields; it never duplicates them. Every other
config key, the key order, the 2-space indent, and the trailing newline are
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

`<id>` is the lesson folder name — `3-1-flagship`, `7-2`, `10-1-flagship`.

### Image files (required)

- One image per Reveal slide, in order.
- Name them to sort correctly: `01.png`, `02.png`, … `10.png`. Natural sort is
  used, so `2.png` does sort before `10.png`, but zero-padding is safest.
- Accepted extensions: `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`.
- Export large and readable for classroom projection — 1600px-wide PNGs are a good
  target.

### `reveal-slides.json` manifest (optional)

When present, the manifest controls title, order, and captions. When absent, the
script uses every image in the folder in natural filename order.

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

| Field                | Required | Meaning                                                                                 |
| -------------------- | -------- | --------------------------------------------------------------------------------------- |
| `title`              | no       | Heading on the section divider slide. Default: "Reveal Math Slides".                    |
| `source`             | no       | Attribution line shown on the divider slide.                                            |
| `slides[].file`      | yes      | Image filename inside `reveal-slides/`.                                                 |
| `slides[].caption`   | no       | Caption under the image; also alt text, speaker note, and lesson-page caption.          |
| `slides[].placement` | no       | Which lesson section the slide belongs in. Alias of `role`. Resolved to a canonical id. |
| `slides[].role`      | no       | Same as `placement`. If both are present, `placement` wins.                             |
| `slides[].page`      | no       | Page number recorded in `config.revealSlides`. Defaults to the slide's 1-based order.   |

A manifest entry naming a file that does not exist is skipped with a warning.

### Placement → canonical lesson section

`placement`/`role` tells the lesson page and the deck which section a slide belongs
in. Any friendly value resolves to one of the canonical sections below via
`resolvePlacement()` in `scripts/integrate-reveal-slides.mjs`, so the deck and the
lesson page always agree. Unknown or missing values fall back to `launch`.

| Canonical section | Example accepted aliases                                                         |
| ----------------- | -------------------------------------------------------------------------------- |
| `launch`          | `launch`, `warm-up`, `notice-wonder`, `intro`, `hook`, `do-now`                  |
| `explore`         | `explore`, `investigate`, `discover`, `sort`, `activity`                         |
| `vocabulary`      | `vocabulary`, `vocab`, `words`, `terms`, `glossary`                              |
| `instruction`     | `instruction`, `teach`, `concept`, `example(s)`, `model`, `i-do`                 |
| `practice`        | `practice`, `problem(s)`, `guided`, `independent`, `we-do`, `you-do`, `exercise` |
| `connect`         | `connect`, `apply`, `real-world`, `discuss`, `turn-and-talk`                     |
| `closure`         | `closure`, `wrap-up`, `exit(-ticket)`, `reflect`, `summary`, `review`            |

See `PLACEMENT_ALIASES` in the script for the full list.

---

## 2. Converting a PDF export to images

The supported input is per-slide images. If Reveal gives you a PDF, convert it to
one image per page first — any of these work:

```bash
# pdftoppm (Poppler) — recommended, crisp PNGs, zero-padded names
pdftoppm -png -r 150 reveal.pdf lessons/<id>/reveal-slides/slide

# ImageMagick / Ghostscript
magick -density 150 reveal.pdf lessons/<id>/reveal-slides/%02d.png

# macOS sips (per page, scripted) or Preview → Export each page as PNG
```

You can leave the original `reveal.pdf` in the same folder for your records; the
pipeline ignores it.

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

Direct invocation also works:
`node scripts/integrate-reveal-slides.mjs --lesson 3-1-flagship`.

### What it does

- **slides.html** — interleaves each Reveal page into the deck at its placement. A
  responsive, lazy-loaded, keyboard-navigable `<img>` slide is inserted right after
  the matching section's slides (notice/wonder → Launch, problems → Practice). All
  slide ids, the `slideTitles` table of contents, `totalSlides`, and the sidebar
  thumbnails are then rebuilt so arrow navigation and present mode stay correct.
  Alt text comes from the caption.
- **slides.pptx** — rebuilds the base notebook deck and inserts each Reveal image
  as a full-bleed, editable picture slide near its placement, not trailing at the
  end.
- **config.json** — writes the managed `revealSlides` array the lesson page reads
  (§6). Needs a rebuild to appear live.

### No-op when absent

A lesson with no `reveal-slides/` folder is reported as `skipped` and its decks are
untouched. The base generators are never modified. If a prior run had set
`config.revealSlides`, it is removed — reported as `cleared`.

---

## 4. Idempotency

Re-running is always safe and never duplicates.

- **HTML** — injected slides and thumbnails live between marker comments
  (`<!-- reveal-slides:begin -->` … `<!-- reveal-slides:end -->`, plus a matching
  thumbnail block). Each run strips the previous block, restores the deck's
  original slide count and titles from a saved state comment, then re-injects.
- **PPTX** — rebuilt from `config.json` each run, so picture slides never stack up.
- **config.json** — `revealSlides` is a managed field. Each run replaces it
  entirely from the current folder and manifest. Remove the folder and the field is
  removed.

Update the images or the manifest, re-run, and both decks and the lesson-page
config reflect the new state exactly.

### Removing Reveal slides from a lesson

Delete `lessons/<id>/reveal-slides/`, then regenerate the base decks:

```bash
node scripts/generate-slides.mjs <id>
node scripts/generate-pptx.mjs <id>
```

Both decks return to their clean, Reveal-free state.

---

## 5. Classroom-safety notes

- Images stay local to the repo. Nothing is uploaded.
- No student data is read or written.
- Labels and the divider slide use large type sized for projection.
- HTML images are `loading="lazy"` and `decoding="async"`, so the deck stays
  responsive even with many high-resolution pages.

---

## 6. Reveal slides on the lesson page (`config.revealSlides`)

The lesson page renders from `config.json` and displays each Reveal slide inside
its matching section. This pipeline is the only writer of `config.revealSlides`;
the renderer is the only reader.

```jsonc
"revealSlides": [
  {
    "src": "/lessons/<id>/reveal-slides/01.png", // absolute served image path
    "caption": "Notice & Wonder warm-up",        // from the manifest (may be "")
    "placement": "launch",                       // canonical section (resolvePlacement)
    "page": 1                                    // from the manifest, else 1-based order
  }
]
```

- **Managed and idempotent** — re-running replaces the whole array.
- **Reversible** — delete the `reveal-slides/` folder and re-run; the field is
  removed and the lesson page reverts cleanly.
- **Canonical placement** — the same value the deck uses, resolved through
  `resolvePlacement()`, so the two always agree.
- **Needs a build** — see the build/deploy note at the top.

---

## Quick reference

| Thing           | Value                                                                                  |
| --------------- | -------------------------------------------------------------------------------------- |
| Drop folder     | `lessons/<id>/reveal-slides/`                                                          |
| Image order     | natural filename sort, or `reveal-slides.json` order                                   |
| Manifest        | `lessons/<id>/reveal-slides/reveal-slides.json` (optional)                             |
| Placement       | per-slide `placement`/`role` → canonical section (§1); default `launch`                |
| Command         | `npm run generate-reveal-slides -- --lesson <id>`                                      |
| Dry run         | add `--dry-run`                                                                        |
| Outputs touched | `lessons/<id>/slides.html`, `lessons/<id>/slides.pptx`, `config.json` (`revealSlides`) |
| Lesson page     | reads `config.revealSlides`; needs a build/deploy to reflect config changes            |
