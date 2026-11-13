# AXIOM CITY — Interactive Graphic Novel Series
### Grade 6 Math · Reveal Math (2025) Course 1 alignment · EduWonderLab

Ten single-file HTML graphic novels, one per unit. Four sixth graders and VEX — a fragment of a century-old Pattern Engine — solve city mysteries that run on grade-level math. The story locks at six **reader gates** per volume; students must solve the math to turn the page.

## The volumes

| Vol | Title | Unit | Standards |
|---|---|---|---|
| 1 | The Pattern Engine | Unit 1 · Math Is… (launch) | 5th→6th review bridge, MP1/MP7 |
| 2 | The Crooked Census | Unit 2 · Statistics | 6.SP.A.1–3, 6.SP.B.4–5, 6.NS.B.2–3 |
| 3 | Full Velocity | Unit 3 · Ratios & Rates | 6.RP.A.1–3 |
| 4 | The Hundred Market | Unit 4 · Percentages | 6.RP.A.3c |
| 5 | Blueprint for Brightside | Unit 5 · Area, SA & Volume | 6.G.A.1, 6.G.A.2, 6.G.A.4 |
| 6 | The Expression Engine | Unit 6 · Expressions | 6.NS.A.1, 6.EE.A.1–4, 6.NS.B.4 |
| 7 | Below Zero | Unit 7 · Rational Numbers & Coordinate Plane | 6.NS.C.5–8, 6.G.A.3 |
| 8 | The Balance Vault | Unit 8 · Equations & Inequalities | 6.EE.B.5–8 |
| 9 | Cause & Effect | Unit 9 · Two-Variable Relationships | 6.EE.C.9 |
| 10 | Boundless | Unit 10 · Math Is… (capstone) | All-units remix + reflection |

Volumes chain: each ends with a teaser for the next, and each "Previously" panel recaps the last. They also work fully standalone.

## How it works for students
3D page-turning book with parallax-depth comic panels. Six gates per volume (one per chapter + a 3-lock boss). Wrong answers earn escalating help: conceptual hint → procedural hint → "Ask VEX" worked example with different numbers (never the answer). Solving earns badges; finishing unlocks a printable completion certificate. Progress saves on the device automatically.

## How it works for teachers
The **Teacher** button (top right) in every volume opens standards alignment, a gate-by-gate answer key with misconception notes, and suggested pacing — printable from the panel. Suggested use: project whole-class, assign in pairs on devices, or run as unit anchor/enrichment across 2–3 days per unit.

## Tech notes
One HTML file per volume — no internet needed after download, no accounts, no data leaves the device. Works on Chromebooks, iPads, laptops (Chrome/Edge/Safari/Firefox). Keyboard, mouse, and touch supported. Accessibility: sound off by default, 3D motion toggle (auto-off for reduced-motion users), larger-text and high-contrast toggles, screen-reader labels and live announcements throughout.

© EduWonderLab. All characters, art, and problems are original.

## Comic art pipeline (illustrated books)

Pilot: `episodes/axiom-city-u6-e2-the-power-ring.html`. Each story page is a comic page (`.gn-comic`, a 6-column
grid of 2-5 panels) with generated, wordless art and every word still live HTML: balloons, captions, sound effects
and the signs the story writes on (`.gn-sign`, `data-gn-skip`). Easy read, vocabulary pop-ups, screen readers and a
later Spanish edition keep working because no text is in a picture. Gates keep their widgets and logic; only their
frame changes.

| Piece | File |
|---|---|
| Character sheet and prompt fragments (`{{maya}}`, `{{vex}}` ...), one seed per character | `_engine/art/CHARACTERS.md` |
| Per-book panel list: id, size, seed, prompt, alt text, face boxes | `_engine/art/<book>/panels.json` |
| Generate (Gemini, or local FLUX via mflux) and pack (one WebP atlas per book) | `tools/gn-art.py` |
| Atlas coordinates (written by pack) | `_engine/art/<book>/atlas.json` |
| Write coordinates + alt text into the book (`GN_ART`, `ART(id)`), `--check` for staleness | `tools/inject-gn-art.mjs` |
| Panel, balloon, caption, sign and gate-frame styles (shared) | `../_shared/gn-comic.css` |
| Consistency test (atlas hash, frames used, alt text, jsdom render) | `tools/gn-art.test.mjs` (in `npm test`) |

`_engine/` is never copied to `dist/`; a book ships exactly one extra file, its atlas
(`art/<book>.webp`, budget 2.5 MB; Cloudflare Pages caps `dist/` at 20,000 files). The atlas is a CSS background,
so it never blocks the cover's first paint, and the browser cache keeps the book readable offline after one visit.

To illustrate another book:

1. Copy `_engine/art/u6-e2/panels.json` to `_engine/art/<book-short>/`, set `book`, and write one entry per panel.
   Name kids by symbol fragment, never by story name (the crew symbols carry different names in Unit 6).
   Draw any sign, board or plate the story writes on BLANK; its words become a `.gn-sign` on top.
2. `~/.local/share/uv/tools/mflux/bin/python tools/gn-art.py generate _engine/art/<book>/panels.json`
   (model: `dhairyashil/FLUX.1-schnell-mflux-4bit`, ~9.6 GB, in `~/.cache/gn-art/models/flux-schnell-4bit`;
   install with `uv tool install --python 3.12 mflux`). Raw PNGs land in `~/.cache/gn-art/<book>/raw/`, outside the repo.
3. LOOK at every image. Reroll (change `seed`, `--only <id> --force`) any with text-like marks, extra limbs,
   wrong colours or an off-model character. Then write `alt` (the scene, for a screen reader) and `faces`
   (`[x, y, w, h]`, 0-1, one box per face that a balloon must not cover).
4. `python3 tools/gn-art.py pack _engine/art/<book>/panels.json` then `node tools/inject-gn-art.mjs`.
5. Rewrite the book's `PAGES` html into `.gn-comic` grids that call `ART("<id>")`, moving each balloon and
   caption unchanged (Easy read keys on the text). Check with `node tools/gn-art.test.mjs`,
   `node tools/gn-layer.test.mjs`, `node tools/inject-gn-layer.mjs --check` and
   `node tools/verify-gn-layer-browser.mjs --books=<slug>`.

Image engines (`generate --engine`):
- `gemini` (default for new books when a key exists): `GEMINI_API_KEY` from `~/.config/gn-art/gemini.env`, model
  `gemini-2.5-flash-image`, ~7 s a panel. Crops a drawn frame/margin and retries on rate limits. The key was rejected (401)
  on 2026-11-12, so the 25 books drawn after that used the local engine below.
- `flux` (default): local FLUX.1-schnell via mflux, no key, ~3 min a panel.
- FLUX.2 Klein 4B (`mflux`, `flux2-klein-4b`, `small_text_encoder=True`) also runs with no key at 2-4 min a panel and gives a
  flatter cel look closer to the Gemini books. It needs ~8.6 GB of RAM: on a 16 GB machine under other load it swaps and a
  step can take 15 minutes, so run it alone. Its download is ~17 GB in `~/.cache/huggingface/hub/blobs`; delete that when done.
Keyless Pollinations now serves only its `sana` model (one image per 45 s, watermarked, not usable as comic art).
