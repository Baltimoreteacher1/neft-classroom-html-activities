# Language Studio Print Pipeline — build brief

Goal: **TPT-publisher / commercial-curriculum quality printables** generated from the authored Studio content (`detail.studio`, schema in `schema.mjs`, exemplar
`units/g6-math-u1.mjs`). Joel: "these need to look identical to a publisher" — both the HTML/PDF and the Word versions. **Less teacher direction, more student-facing,
exciting, clear activities and resources.** Every page should look like it came from a premium workbook: color-coded domain bands, rounded cards, tidy typography, write-on lines,
cut-out cards with dashed borders, consistent header/footer, generous white space. Never a wall of text.

## Architecture (single source of truth — no duplicated layout logic)

1. `functions/_lib/bcpss/studio-doc.js` — builds a **neutral document model** from `detail` + options `{ level: "l1_2"|"l3_4"|"l5_6", part, answerKey }`.
   A document = `{ title, subtitle, sections: [{ pageBreakBefore?, layout: "portrait"|"landscape", blocks: [...] }] }`.
   Blocks (define and DOCUMENT them in the file header; keep the set small and renderer-friendly): `band` (colored activity header: number, domain, title, minutes, grouping),
   `heading`, `paragraph` (inline runs: plain / bold / italic / highlight(tone)), `callout` (tone), `lines` (n write-on lines), `table` (headers, rows, widths), `cardGrid` (cols, rows,
   cards[{front:[...], back:[...]}] for cut-out cards), `chips` (word bank), `checklist`, `columns` (2-col layout), `matchColumns`, `boxRow` (n empty answer boxes), `spacer`, `footerNote`.
   Document-model functions per part, one file each ≤ 500 lines: `studio-doc-book.js`, `studio-doc-kits.js`, `studio-doc-packet.js`, `studio-doc-key.js`; shared helpers in `studio-doc.js`.
2. `functions/_lib/bcpss/studio-print-html.js` — renders a document model to a complete, print-ready HTML string (inline CSS; `@page` Letter; `print-color-adjust: exact`; no external requests
   except what the existing packet already uses). The PDF is produced from this HTML by the existing export endpoint (Cloudflare Browser Rendering), so HTML print CSS decides PDF quality.
3. (A later agent writes `studio-docx.js` that renders the SAME model to Word — design blocks so each maps cleanly to Word: tables, shaded cells, paragraphs, borders. Avoid CSS-only tricks
   that Word cannot reproduce; where a block needs a table in Word, build it as a table in the model.)
4. Endpoint: update `functions/api/bcpss/export/[unitId].js` to serve `?format=html|pdf|docx&part=<part>&wida=<l>`: parts `packet` (teacher unit overview, default), `book` (Student Activity Book),
   `activity-<n>`, `key` (answer key + one-line tips + rubric), `cards` (vocabulary flashcards), `bingo`, `wall`, `poster`, `strips`, `talk`. Keep `packetFilename` conventions; add part to the filename.
   For `format=docx` keep calling the existing docx path for `packet` until the DOCX agent lands; return `501`-style clear JSON error for new parts in docx for now, and note it in your final reply.
   Existing legacy renderers (`renderUnitHtmlPacket`, `renderUnitDocxPacket` in `unit-packet.js`): the legacy teacher-heavy packet content is being **replaced** — make `packet` use the new model
   (unit overview: cover, "I can", essential question, standards, language move, vocabulary table with example/non-example/Spanish, mentor sentence unpacked with color-coded chunks, activity menu table
   with domain/minutes/grouping, exit ticket + 3-level rubric, watch-outs). Keep it to 3–4 pages, no scripts. If a unit has no `detail.studio` (not yet authored), fall back to the legacy renderer so nothing breaks.

## Parts — design specs

- **Student Activity Book (`book`)**: Cover (unit title big, grade/subject/curriculum chip, "Name ____ Date ____", a bold geometric cover band in the subject color), "I can" page, Word Wall page (8–10 term cards with icon
  for K–2, definition, example, Spanish), then ONE activity per page (two if long) in the order given, each with: colored band (number badge + domain icon + title + minutes), the one-sentence mission,
  the printable version of the activity, a level-support strip (`support[level]`), and a small self-check ("I did it ☐"). Last page: exit ticket slip with rubric strip.
  Printable version per kind: `match` two columns with dots to draw lines; `word_sort` category columns + cut-out word chips row; `clue_game` numbered clue cards with answer lines + word bank;
  `cloze` story with blanks + word bank; `unscramble` phrase chips + sentence lines; `sequence` boxes to number; `quiz`/`error_analysis` multiple choice with bubbles; `dictogloss` notes box + rebuild lines;
  `info_gap` Partner A card and Partner B card on separate half-pages (cut apart) + fill-in table; `talk_cards` cut-out card sheet + role badges; `read_annotate` passage with wide margins, colored mark key,
  then questions; `sentence_combine` lines with connector chip; `write_scaffold` framed Claim/Reason/Evidence boxes + word bank + checklist. Provide `answerKey:true` variant that fills answers (used by `key`).
- **Key (`key`)**: every answer, model response and the one-line tip per activity; exit-ticket rubric. Clean 2–4 pages.
- **Cards (`cards`)**: vocabulary flashcards, 8 per Letter page, dashed cut lines, front = icon + term + part of speech, back = kid definition + example + Spanish; pair front/back pages (back page mirrored
  columns for duplex printing).
- **Bingo (`bingo`)**: 6 unique 3×3 boards (free center) with the unit words (clue-based variant: squares show the word; call sheet gives the clues from the `clue_game` or definitions) + call sheet.
- **Wall (`wall`)**: large-print word-wall strips (landscape), one term per strip with icon + Spanish. **Poster (`poster`)**: landscape mentor-sentence anchor chart with color-coded chunks and role labels.
  **Strips (`strips`)**: sentence frames by level on cut-apart strips. **Talk (`talk`)**: the `talk_cards` deck as cut-out conversation cards + talk-move cards.

## Visual system

- Domain colors (consistent across all parts): Listening (teal), Speaking (coral), Reading (indigo), Writing (amber), Vocabulary (green), Game (magenta-ish rose). Define them as tokens in ONE place with print-safe AA contrast;
  NO purple/violet (a repo palette gate bans violet hues — use rose/indigo carefully: keep hues outside 255–335°). Use a neutral ink, soft tinted card backgrounds, 1px rules.
- Typography: use the fonts the existing packet HTML uses (read `renderUnitHtmlPacket`); sizes ≥ 11pt for student text (K–2: ≥ 14pt).
- Small inline-SVG icon set for domains (ear, speech bubble, book, pencil, abc blocks, game controller/die) in `studio-icons.js` — drawn by you, simple and crisp.
- Footer on every page: unit title · "The Language Page" · page number.
- Respect Joel's rules: no timers, no "ESOL" label, plain language, no teacher scripts.

## Verification (required)

- Add `functions/_lib/bcpss/studio-print.test.mjs` (node:test, no network): builds every part for `g6-math-u1` (and any other authored units present) in all levels; asserts non-empty HTML, no `undefined`/`[object Object]`,
  answer-key correctness (e.g. match pairs, cloze answers appear), cut-card counts, page-break structure; `node --test` passes.
- Render real PDFs to LOOK at them: use Playwright Chromium (`node_modules/playwright`) to print the HTML to PDF/PNG for each part, convert pages to PNG, view them, and iterate until they look like a top
  publisher's workbook. Save outputs under `/tmp/claude-501/scratch/print-shots/`. Check Letter-size margins, no clipped content, no orphan headings, cut-lines align.
- `npx biome check <your files> --max-diagnostics=20`.
- Files ≤ 500 lines each. Write ONLY the files named above + the export endpoint + tests. No git. No network.
