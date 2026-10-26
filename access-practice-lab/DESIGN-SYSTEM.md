# ACCESS Practice Lab — design system

One visual system for every screen. Tokens, type and shared components live in `ds.css`; each screen group
has its own stylesheet that only adds layout. Read `PLATFORM.md` first for what the screens do and the honesty
rules (no invented proficiency, supports never contaminate independent results, local-only data).

## Files

| File                                         | Owns                                                                                                                                                      |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ds.css`                                     | fonts, tokens, type, top bar, footer, buttons, panels, forms, disclosures, chips, bars, crumbs, toast, empty/skeleton                                     |
| `home.css`                                   | home                                                                                                                                                      |
| `room.css`                                   | a skill room (domain hero, support levels, activity list)                                                                                                 |
| `activity.css`                               | the activity shell and every quick-practice item type, listening player, recorder, feedback                                                               |
| `tests.css`                                  | practice tests: chooser, intro, question screens, review, results                                                                                         |
| `progress.css`                               | Passport, growth, Road to ACCESS, families, tools, library                                                                                                |
| `studios.css`                                | Speaking/Writing studios, missions, detective, worlds, evidence, conversation, construction, classroom, vocabulary, check-in, launch studio, Reading Room |
| `styles.css`                                 | legacy view rules still in use (tests, passport, road, test tools, innovations). Move a rule out when you restyle its screen; do not add new rules here   |
| `studio.css`, `library.css`, `worlds.css`, … | older per-screen sheets; fold what you keep into the new file for that screen group and delete the rest                                                   |

`ds.css` loads before the screen sheets. Never redefine a token or a shared component inside a screen sheet;
add a variant class instead. If you need a new shared token or component, add it to `ds.css`.

## Identity

Editorial, calm, academic. Display type is Fraunces (headings `h1`, `h2`, big numerals); everything else is Atkinson
Hyperlegible (chosen for legibility for multilingual learners). Both are self-hosted under `/assets/fonts/`.
The four language domains each own a colour and are always paired with an icon and a word:

| Domain    | Class         | Fill (white text on it) | Ink (text on white) | Tint               |
| --------- | ------------- | ----------------------- | ------------------- | ------------------ |
| Listening | `d-listening` | `--listening` #2563eb   | `--listening-ink`   | `--listening-soft` |
| Reading   | `d-reading`   | `--reading` #0b7a75     | `--reading-ink`     | `--reading-soft`   |
| Speaking  | `d-speaking`  | `--speaking` #7c3aed    | `--speaking-ink`    | `--speaking-soft`  |
| Writing   | `d-writing`   | `--writing` #b45309     | `--writing-ink`     | `--writing-soft`   |

Put the domain class on a container and use `--room`, `--room-ink`, `--room-soft`. Colour is never the only signal.
Primary action blue is `--brand`; navy `--ink` is text and the footer; `--accent` amber and `--coral` are decoration only.

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
- Illustrations are original SVG in `pictures/ds/` (`hero`, `domain-listening|reading|speaking|writing`, `empty`,
  `complete`), navy outlines with flat domain-colour fills. New art must match: 3 px navy stroke, round joins,
  fills from the domain palette, small decorative dots/plus signs in `--accent` and navy. Reference with
  `${ART}/name.svg` (`ART` from `src/util.js`), `alt=""` when decorative.

## Layout

Page container is `.lab-main` (1200 px). Use CSS grid with `minmax(0, …)` columns; collapse deliberately at 980, 860,
640 and 560 px (do not just stack). No horizontal scroll at 320 px. Tap targets 44 px minimum. Sticky elements must
leave room for the 68 px top bar. Respect `prefers-reduced-motion` (ds.css already disables motion globally).

## Motion

Only state changes animate: hover/press on controls, accordion chevron, progress bars, the listening bars while audio is
playing, the recording dot while recording. No entrance animations, confetti or looping decoration.

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
