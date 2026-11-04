# ACCESS Practice Lab — design system

One visual system for every screen. Tokens, type and shared components live in `ds.css`; each screen group
has its own stylesheet that only adds layout. Read `PLATFORM.md` first for what the screens do and the honesty
rules (no invented proficiency, supports never contaminate independent results, local-only data).

## Files

| File                                         | Owns                                                                                                                                                      |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ds.css`                                     | fonts, tokens, type, top bar, footer, buttons, panels, forms, disclosures, chips, bars, crumbs, toast, empty/skeleton                                     |
| `home.css`                                   | home: exhibition hero (`.ll-hero`), next action, studio portals (`.ll-portal`), Language World band, Passport, quiet test entrance, library, doors |
| `exhibition.css`                             | Language World (`/exhibition`): hub, four-step path, support choice, step studios, help rail, teacher notes                                         |
| `room.css`                                   | a skill room (domain hero, support levels, activity list)                                                                                                 |
| `activity.css`                               | the activity shell and every quick-practice item type, listening player, recorder, feedback                                                               |
| `tests.css`                                  | practice tests: chooser, intro, question screens, review, results                                                                                         |
| `progress.css`                               | Passport, growth, Road to ACCESS, families, tools, library                                                                                                |
| `studios.css`                                | Speaking/Writing studios, missions, detective, worlds, evidence, conversation, construction, classroom, vocabulary, check-in, launch studio, Reading Room |
| `styles.css`                                 | legacy view rules still in use (tests, passport, road, test tools, innovations). Move a rule out when you restyle its screen; do not add new rules here   |
| `studio.css`, `library.css`, `worlds.css`, … | older per-screen sheets; fold what you keep into the new file for that screen group and delete the rest                                                   |

`ds.css` loads before the screen sheets. Never redefine a token or a shared component inside a screen sheet;
add a variant class instead. If you need a new shared token or component, add it to `ds.css`.

## Identity — The Living Language Studio

Editorial, dimensional, academic. Display type is Fraunces (headings `h1`, `h2`, big numerals); everything else is
Atkinson Hyperlegible (chosen for legibility for multilingual learners). Both are self-hosted under `/assets/fonts/`.

Six material families (tokens on `:root` in `ds.css`) are art-direction anchors, not gradients to spray around:

| Material | Tokens | Used for |
| --- | --- | --- |
| Midnight Indigo | `--mi-950 … --mi-300` | brand atmosphere, the home hero, Language World bands, primary buttons |
| Ivory & Pearl | `--ivory --pearl --pearl-blue` | reading surfaces, paper, preview cards |
| Ocean Glass | `--ocean-900/600/200` | Listening · The Sound Studio |
| Rose & Garnet | `--rose-900/600/200` | Speaking · The Expression Studio |
| Burnished Copper | `--copper-900/500/200` | Writing · The Composition Studio |
| Sage & Jade | `--sage-900/500/200` | growth, revision, feedback, the support choice |

Depth comes from layered light, not decoration: `--shadow / --shadow-lift / --shadow-float` (indigo-tinted, multi-layer),
`--edge-light` (a lit top edge on raised material) and `--grain` (fine paper texture). Glass never sits under body text.

The four language domains each own a colour and are always paired with an icon and a word:

| Domain    | Studio | Class         | Fill (white text on it) | Ink (text on white) | Glow (on midnight) |
| --------- | ------ | ------------- | ----------------------- | ------------------- | ------------------ |
| Listening | The Sound Studio | `d-listening` | `--listening` #075568 | `--listening-ink` | `--room-glow` #91e2d6 |
| Reading   | The Reading Atelier | `d-reading`   | `--reading` #2e4a94 | `--reading-ink` | #d5dceb |
| Speaking  | The Expression Studio | `d-speaking`  | `--speaking` #8a3a5c | `--speaking-ink` | #dba3b9 |
| Writing   | The Composition Studio | `d-writing`   | `--writing` #9a4a26 | `--writing-ink` | #f5d6a8 |

Put the domain class on a container and use `--room`, `--room-ink`, `--room-soft`, `--room-glow`. Colour is never the
only signal. Primary actions use midnight `--brand`; `--ink` is text. The content JSON `color` of each domain must
equal its token (`tools/access-design-system.test.mjs`).

**Grade bands** (`body[data-lab-band]`): Grades 3–5 get warmer paper, rounder material and 52px targets (`--target`);
Grades 6–8 get cooler editorial paper, tighter radii and denser type. Same brand, visibly different register.

**Learning vs assessment**: practice tests (`data-lab-view="test"`) and the simulator (`"assess"`) drop the atmosphere —
plain paper, no grain, flat elevation — and the top bar shows a "Focused practice mode" label.

## Tokens (see `:root` in `ds.css`)

Surfaces `--bg --surface --surface-2 --surface-3`; lines `--line --line-strong`; text `--ink --ink-2 --ink-3`;
feedback `--right --wrong --hint` with `-soft` tints; radii `--radius-sm --radius --r-lg --r-xl`; shadows
`--shadow --shadow-lift --shadow-float`; spacing `--s-1 … --s-8`. Text must keep 4.5:1 contrast (3:1 for large
text and for control borders). `--ink-3` is the lightest allowed body-adjacent text on white.

## Components (reuse; do not restyle per page)

- Buttons: `.btn`, `.btn-primary`, `.btn-secondary`, `.ghost`, `.small`, `.btn-big`. 48 px minimum height.
- Panel/card: `.panel`, `.card`. Disclosure: plain `<details><summary>` (chevron is automatic).
- Chips: `.chip`, `.cat-chip` (`aria-pressed`). Segmented grade switch: `.band-switch`. Progress: `.bar > i` (`width:%`), `ringHTML()`.
- Callout on a domain: background `--room-soft`, border `color-mix(in srgb, var(--room) 28%, transparent)`.
- Feedback: `.feedback.is-right | .is-hint | .is-shown` with an icon in `.fb-title`.
- Empty state: `.empty-state` with an illustration from `pictures/ds/` (`empty.svg`, `complete.svg`).
- Headings: one `h1` per screen. Eyebrow text is sentence case (`.eyebrow`), never all-caps.

## Icons and illustration

- No emoji as UI. Use `icon("name")` from `src/util.js` (sprite `pictures/ui-icons.svg`, 24 px grid, 1.8 stroke,
  `currentColor`). The list of names is the `<symbol id>` set in that file. Icons are decorative (`aria-hidden`);
  keep a visible text label next to them.
- Emoji that are part of _activity content_ (picture labels on answer choices, e.g. `.opt-visual`) are content, not
  chrome. Leave the content; the shell frames them in a consistent tile.
- Illustrations are original SVG in `pictures/ds/`. `hall-68.svg` / `hall-35.svg` (the exhibition hall) and the four
  `domain-*.svg` studio pictures are generated by `node tools/access-hall-art.mjs` (`--check` in the tests) — edit the
  script, never the files. Other art (`empty`, `complete`, …) predates the studio palette. New art must match: 3 px navy stroke, round joins,
  fills from the domain palette, small decorative dots/plus signs in `--accent` and navy. Reference with
  `${ART}/name.svg` (`ART` from `src/util.js`), `alt=""` when decorative.

## Layout

Page container is `.lab-main` (1200 px). Use CSS grid with `minmax(0, …)` columns; collapse deliberately at 980, 860,
640 and 560 px (do not just stack). No horizontal scroll at 320 px. Tap targets 44 px minimum. Sticky elements must
leave room for the 68 px top bar. Respect `prefers-reduced-motion` (ds.css already disables motion globally).

## Motion

Tokens: `--ease-out --ease-in-out --ease-press`, `--dur-1` (120ms, press) … `--dur-4` (520ms). Motion only for state
changes, orientation and feedback: hover/press on controls, the station pins and portals lifting on hover, the accordion
chevron, progress bars, the listening bars while audio is playing, the recording dot while recording, and one 320ms
"settle" when a new screen opens after navigation (`#app.is-entering`). No looping decoration, confetti or parallax.
`prefers-reduced-motion` turns all of it off (ds.css).

## Rules a redesign must not break

- Keep every `data-*` attribute, `id`, form-control name and class a script or test selects. Search `src/main.js`,
  the view's own `onClick/onChange`, and `tools/access-*e2e*.mjs` before renaming anything.
- Keep copy that states a rule (practice not official, no scores). Do not add claims of mastery or proficiency.
- Audio and microphone UI must reflect real state only (no fake meters or recording animations).
- Student text and recordings never leave the device; do not add network calls.

## Checking your work

- Dev server (no cache) serves this worktree at `http://localhost:4577/access-practice-lab/…`.
- `node tools/access-visual-qa.mjs --base http://localhost:4577 --out <dir> --only <screen-name> --widths 1440,1024,768,390,320`
  writes full-page PNGs per screen and width and reports horizontal overflow and console errors. Screen names are the
  keys in `SCREENS` inside that file; add a screen there when you add a route. `--y/--h` crop a long page.
- Always open the PNGs and look: spacing, alignment, contrast, emoji left over, text clipping, empty areas.
- Keyboard: tab through the screen, confirm a visible focus ring and no trap.
- `node tools/access-studio-e2e.mjs` and `node tools/access-lab-e2e.mjs` drive the real flows (slow; run the one that
  covers your screens before you finish).
