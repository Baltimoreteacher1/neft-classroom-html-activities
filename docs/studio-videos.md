# Studio videos

Videos made in the motion studio (`claude-motion-studio`) appear on both sites from one manifest.
Nothing is hand-edited into a page.

| Piece | Where |
| --- | --- |
| Manifest (the only list of what appears where) | `data/studio-videos.json` |
| Contract, VTT parser, brand table | `tools/lib/studio-videos.mjs` |
| Where on a page a card goes (`after` / `up`) | `tools/lib/studio-video-anchor.mjs` (jsdom source offsets) |
| Placing a card on a Language Page screen | `access-practice-lab/src/studio-video-mount.js` (the card HTML is pre-rendered into the generated route table) |
| Player (custom element, no dependencies) | `assets/studio-video/studio-video.js`, `.css` |
| Card markup (one builder, build time and browser) | `assets/studio-video/studio-video-markup.mjs` |
| Files per video | `assets/studio-videos/<id>/<id>.mp4`, `poster.jpg`, `<id>.vtt` |
| Generator | `scripts/generate-studio-videos.mjs` (`npm run generate:studio-videos`) |
| Gate | `npm run validate:studio-videos`, `tools/studio-videos.test.mjs` |

## What the generator writes

- **Mapped static pages** (`pages[]`): one marked block per video, `<!-- studio-video:start <id> -->` to
  `<!-- studio-video:end -->`, spliced into the page's original bytes (the stylesheet and script once per page, in
  its first block). A page that is not mapped is never read or written; a block whose page is no longer mapped is
  removed byte for byte. Where the block goes is the placement (below).
- **The Language Page app** (`/access-practice-lab/...` routes are rendered by the app, not files):
  `access-practice-lab/src/studio-video-routes.js` (route -> `{ id, after?, up? }`). `main.js` looks the route up
  after each render and puts the pre-rendered card in the same frame (no layout shift), then
  loads the player to upgrade it in place; an unmapped route costs one object lookup and no request.
- **Hubs**: `/videos/` (brand `eduwonderlab`) and `/access-practice-lab/videos/` (brand `languagepage`), each
  listing only its own brand, concept clips (15 s or less, `isClip` in the contract) apart from full films. They reach `data/catalog.json` (so `/directory/` and the sitemap) through the
  existing catalog generator, and `functions/_lib/language-page.js` lists the lab hub for thelanguagepage.com.
- `thelanguagepage.com` serves `/assets/`, `/data/` and `/access-practice-lab/` already, so the player, the files
  and the lab hub work on both domains. `/videos/` is EduWonderLab's hub and redirects there from the other host.

## Placement: where on the page

A `pages` item is a path (`"/math/unit-9/"`) or an object:

```json
{ "path": "/math/unit-9/", "after": "#unit-9-lessons-heading", "up": 1 }
```

- No `after`: under the page's `<h1>` and its lead paragraph (the default).
- `after`: a CSS selector, first match; the card goes right after that element. `up` (0-3) climbs that many
  parents first, so `#unit-9-lessons-heading` with `up: 1` lands after the whole section heading block, inside the
  section. Resolved with jsdom source offsets, so the page text is never re-serialised.
- One video per *place*: the same page may carry several videos when each has its own `after`/`up` (a page may
  not show two at the same place). Prefer one card per page; on a page that shows both a full film and a clip, show
  only the clip (the concept is the point there) and put the film where it is the better fit.
- **Static pages**: the validator resolves the selector in the page's HTML, so a renamed section fails
  `validate:studio-videos` instead of silently moving the card. The generator is idempotent: it strips and
  re-splices the blocks, so another generator rewriting the page is repaired by `npm run generate:studio-videos`
  (the gate reports it as stale).
- **Language Page routes**: the same `after`/`up` apply in the browser (`querySelector`). Only the selector's
  syntax is validated (the app renders the screen); if it stops matching, the card falls back to the default
  place and logs a warning, so check the route in a browser after changing a screen.
- Do not anchor inside a grid or flex row of cards (`/math/` unit cards, activity grids): the card would become
  one cell. Anchor on a section heading or a hero instead.

## Where each video appears

| Video | Page and place | Why it belongs there |
| --- | --- | --- |
| Mathematics Comes to Life (film) | `/math/`, `/math/games/` (default) | Site-wide math overview |
| Language Learning Through Exploration (film) | `/access-practice-lab/` | Lab overview |
| Exponents: 2^5 (film) | `/math/unit-6/6-ee-a-1-onramp/` after `header.hero` | The "What Exponents Mean" on-ramp page |
| Exponents: repeated multiplication | `/math/unit-6/` after `#unit-6-lessons-heading` up 1 | Lesson 6.1 Powers and Exponents is the first lesson listed |
| Order of operations | `/math/unit-6/pemdas-alchemy/` after `header` | The PEMDAS Alchemy game teaches this order |
| Multiplying fractions with an area model | `/math/remediation/unit-r2/lesson-5/` after the first `.sec-head` | Lesson R2.5 "Multiply Fractions & Mixed Numbers", Learn It |
| Graphing a line: y = 2x + 1 | `/math/unit-9/` after `#unit-9-lessons-heading` up 1 | Unit 9, Two-Variable Relationships |
| Volume of a rectangular prism | `/math/unit-5/5-5-volume-rectangular-prisms/` after `header` | Lesson 5.5 |
| Reading a dot plot | `/math/statistics/6-sp-b-4-onramp/` after `section.card:nth-of-type(1)` | Displaying data: dot plots, between the word bank and the worked example |
| Speaking with sentence frames | `/access-practice-lab/speak` | Speaking Studio |
| Building a stronger sentence | `/access-practice-lab/sentences`, `/access-practice-lab/write` | Sentence Lab, Writing Studio |
| Key words before you read | `/access-practice-lab/vocabulary` | Word Builder |
| Four skills, one idea | `/access-practice-lab/explore/practice` | The practice directory, all four skills |

Not mapped on purpose: `/math/` unit cards (a grid of cards, no section to anchor in); student activity pages whose
opening screen is the activity (the games' play areas); lesson shells under `/lessons/` (generated from
`config.json` by the lesson generators, which rewrite them whole); `.html` file pages such as
`/esol/reveal-math-guides/sheet-2a-multiply-fractions.html` (a mapped path must have an `index.html`).

## Add a video to any page

From the studio (needs the project's QA report to show every objective check passed, and ffmpeg):

```sh
CLASSROOM_REPO=/path/to/classroom-checkout \
  npm run publish:site -- <slug> --page /math/games/ --page "/math/unit-9/@#unit-9-lessons-heading^1"
```

`--page "<path>@<selector>[^up]"` is the placement above. That copies the MP4, VTT and a generated poster here,
upserts the manifest entry and runs the generator. Review `git diff`, run `npm run validate:studio-videos` (and
`npm run qa:fast`), commit, then ship the commit with `ALLOW_DEPLOY=1 npm run ship -- <sha>`.

Rules the validator enforces: one video per place on a page; a static page must exist and every anchor must
resolve in it; a page may not be a teacher surface; files are named from the id; 16:9; MP4 <= 20 MiB; poster <=
150 KB; VTT must parse and end inside the video. To remove a video from a page, delete the item from `pages[]` and
run the generator.

## Player behaviour

Poster first (`preload="none"`; nothing but the poster is fetched until the card is within 300px of the viewport,
and the MP4 only after Play). Native controls, an English captions `<track>` from the VTT that is off until chosen in the captions menu (the films already show their words, so a default track would draw every line twice), muted,
click or key to play, never autoplay. `prefers-reduced-motion`: no transitions and the captions text opens by
default. Without JavaScript the card is a labelled link to the MP4 plus the full captions text. The films are
silent, and the card says so.

## Checking it in a browser (not part of the gate: needs a browser with H.264)

Serve `dist/` (a static server with Range support; the Language Page routes need the `app-shell` fallback) and,
at 1440x900 and 390x844, in light and dark, check on every mapped page in the table above plus `/videos/` and
`/access-practice-lab/videos/`, and one unmapped neighbour of each:
no console errors, no request to another origin, no `.mp4` request before Play, a `206` for the MP4 after Play,
the captions track `showing`, no layout shift attributed to `studio-video`, and the same with
`prefers-reduced-motion: reduce`. Playwright's bundled Chromium has no H.264; use `channel: "chrome"`.
