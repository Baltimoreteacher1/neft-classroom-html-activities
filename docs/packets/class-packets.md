# Class packets and print kits

Mixed-band class packets (Prompt 3 section 7.2) and the per-unit print kits. Studio view: `#/packets`. Export route: `GET /api/bcpss/packet`.

## What a teacher gets

Enter a unit and how many students sit at each band (1_2, 3_4, 5_6). Only counts are entered: no names, aliases or initials exist anywhere in the flow.

| Part | File | Notes |
| --- | --- | --- |
| `student` (+ `band`) | one paper per variant | Identical layout and length for every band. Bands differ only in the practice mode of each word row (copy, fill in, write), the sentence frames and the help box. The only mark is an opaque variant code (for example `K7`) printed small in the footer. |
| `key` | answer key | Every variant's expected responses, the exit-ticket model answer, the rubric row. Teacher file. |
| `cover` (+ `counts`) | one-page cover sheet | Decodes the codes (code, group, students, copies to print, what is on the paper). Always a separate file, never a page inside the student stack. |
| `kit-cards` | vocabulary cards | Word, plain definition (no picture), Spanish gloss marked "draft translation" until reviewed, cognate note. |
| `kit-frames` | sentence frame strips | All three papers' frames as cut-apart strips, marked with the codes only. |
| `kit-exit` | exit-ticket sheet | Prompt, frame, writing lines, rubric row. Two tickets per sheet when they fit, one otherwise (K-2, long prompts). |
| `kit-family` | family sheet | English and Spanish, from the unit's family guide. |

Formats: `html`, `pdf` (Browser Rendering, falling back to print HTML), `docx`. Student downloads are named by code (`BCPSS-<unit>-paper-K7.pdf`), never by band.

## Where things live

- `shared/packets/bands.js` bands, count parsing, opaque variant codes. `content.js` what goes on every page (plain data). `fit.js` row heights for the cut-apart kits. `leak.js` the forbidden-label scan.
- `functions/_lib/bcpss/packet-doc.js`, `packet-kits.js` document models (built with the Studio block model in `studio-doc.js`). `packet-render.js` renders with the Studio HTML and Word renderers, removing page breaks and swapping the footer. `packet-parts.js` the part registry.
- `functions/api/bcpss/packet.js` the route (shared `handler`, GET only, rate limited, stores nothing).
- `bcpss-teachers/studio/views/packets/` the `#/packets` view.

## Rules the tests hold

`npm run test:packets` (no browser, no network): export text equals source in HTML and Word for all 162 units and 3 bands; no page-break construct in any part or format; one flowing section per document; student papers carry no level, band, program, name or initial token (property test over every unit and band, negative control: a paper that leaks "Level 2" is caught); the three papers of a unit share one layout; the cover sheet is a separate one-section file and never appears in a student file; Spanish glosses print as draft translations unless a reviewer approved them (no review dimension exists yet for Studio blocks, so the route always passes "not reviewed").

The leak scan masks authored source first. Authored vocabulary that is ordinary English trips the raw scan (a level of cubes, a rubber band, initial value, the very beginning, reaching a goal); the tests report those and never edit them.

## Print check

`npm run check:packet-print` (needs Playwright Chromium and poppler `pdftoppm`; not part of `qa:fast`). It renders every part for 36 units, one per grade and subject (all 9 grades, all 4 subjects), and measures overflow (clipped text, content past the side margins), margins (rasterised PDF left, right, top; every `@page` margin read from the stylesheet), grayscale contrast (WCAG AA after converting both colours to gray), text under 6pt, page counts per part and equal page count across a unit's three papers. Each detector first runs on a known-bad fixture it must flag and a known-good fixture it must pass; if a control stops firing the tool exits 3. Exit 0 = no new findings against `print-check-baseline.json`, 1 = new findings, 3 = the tool is broken. `--out <dir>` keeps the PDFs, `--json <file>` writes every finding, `--units a,b` narrows the sample.

The bottom margin is not measured on the raster because the running footer (the variant code on student papers) sits in it by design; the declared `@page` bottom margin is checked instead.
