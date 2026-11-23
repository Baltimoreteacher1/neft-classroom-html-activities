# ACCESS Practice Lab — design system

One visual system for every screen. Tokens, type and shared components live in `ds.css`; each screen group
has its own stylesheet that only adds layout. Read `PLATFORM.md` first for what the screens do and the honesty
rules (no invented proficiency, supports never contaminate independent results, local-only data).

## Files

| File                                         | Owns                                                                                                                                                      |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ds.css`                                     | fonts, tokens, type, top bar, footer, buttons, panels, forms, disclosures, chips, bars, crumbs, toast, empty/skeleton                                     |
| `home.css`                                   | home: exhibition hero (`.ll-hero`), next action, studio portals (`.ll-portal`), Language World band, Passport, quiet test entrance, library, doors        |
| `exhibition.css`                             | Language World (`/exhibition`): hub, four-step path, support choice, step studios, help rail, teacher notes                                               |
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

Editorial Academic: warm paper, deep slate ink, restrained accents, flat crisp cards. Type is self-hosted
(`/assets/fonts/`, bundle `inter-jetbrains-mono-plus-jakarta-sans-source-serif-4-lp`): **Plus Jakarta Sans** 600/700 for
headings and wordmarks, **Inter** 400-600 for UI and body (`font-feature-settings: "cv02","cv03","cv04","cv11"`),
**Source Serif 4** only for reading passages and literary prompts (`.passage`, `blockquote`, line-height 1.75),
**JetBrains Mono** for WIDA codes, ELP levels and score readouts. Scores, levels and timers use tabular numerals.
Body is 16px / 1.6; instructional text and passages never exceed 68ch.

The four language domains each own a colour and are always paired with an icon and a word (listening teal-ocean,
reading indigo, speaking garnet, writing copper). Put the domain class (`d-listening` ...) on a container and use
`--room`, `--room-ink`, `--room-soft`. Colour is never the only signal.

## Tokens (see `:root` in `ds.css`)

Semantic names first, legacy aliases kept so screen sheets inherit the theme:

- Surfaces `--bg-canvas #faf9f6`, `--bg-surface #fff`, `--bg-subtle #f2efe9`, `--bg-interactive-hover #eae5dc`
  (aliases `--bg --surface --surface-2 --surface-3`).
- Ink `--text-primary #182230`, `--text-secondary #475467`, `--text-tertiary #586377` (aliases `--ink --ink-2 --ink-3`).
  Tertiary is 0.2 darker than the original spec (#667085) so it holds 4.5:1 on `--bg-subtle` and the hover surface too.
- Brand `--brand-primary #1e3a5f` (Oxford navy; alias `--brand`), `--brand-primary-hover`, `--brand-accent #0f766e`
  (teal, alias `--teal`), `--brand-gold #b45309` (alias `--accent`; markers and badges, never a large fill).
- Status `--status-{success,warning,error}-{bg,text,border}` (aliases `--right --hint --wrong` and `-soft`).
- Lines `--border-subtle #e4e0d8` (alias `--line`), `--border-strong #cbd5e1` (alias `--line-strong`),
  `--border-control #7c8799` for form-control edges (3:1 against white, WCAG 1.4.11; the spec's `--border-strong` is
  1.5:1 and is only for cards and dividers).
- Geometry `--radius-sm 6px` (badges, inputs, buttons), `--radius-md 10px` (cards), `--radius-lg 14px` (modals, heroes);
  legacy `--r-xs --radius --r-lg --r-xl` map onto these. No pills except tiny status tags and progress tracks.
- Depth `--shadow-card` (flat default), `--shadow-elevated` (modals and dropdowns only).
- Spacing `--s-1 ... --s-8` on an 8px rhythm; cards have at least 24px padding on desktop.
- Text must keep 4.5:1 contrast (3:1 for large text and control borders).

## Components (reuse; do not restyle per page)

- Buttons: `.btn`, `.btn-primary` (navy fill, white text), `.btn-secondary` (white, 1px border), `.ghost` (quiet), `.small`, `.btn-big`. 44 px minimum height, 6px radius.
- Panel/card: `.panel`, `.card`. Disclosure: plain `<details><summary>` (chevron is automatic).
- Chips: `.chip`, `.cat-chip` (`aria-pressed`). Segmented grade switch: `.band-switch`. Progress: `.bar > i` (`width:%`), `ringHTML()`.
- Callout on a domain: background `--room-soft`, border `color-mix(in srgb, var(--room) 28%, transparent)`.
- Feedback: `.feedback.is-right | .is-hint | .is-shown` with an icon in `.fb-title`.
- Empty state: `.empty-state` with an illustration from `pictures/ds/` (`empty.svg`, `complete.svg`).
- Headings: one `h1` per screen. Eyebrow text is sentence case (`.eyebrow`), never all-caps.

## Activity kit (shared activity chrome)

One set of pieces for every practice surface (rooms, the ACCESS bank player, studios, game shells, books), so a learner meets
the same directions, feedback and help everywhere. Code: `src/activity-kit.js` (pure markup builders; Node tests import them).
Styles: the "activity kit" block at the end of `ds.css` (classes start `ak-`). Test: `tools/access-activity-kit.test.mjs`
(structure, contrast) and `tools/access-activity-kit-e2e.mjs` (browser: axe, 44px, hint reveal, states). Existing `.feedback`,
`.directions` and `.task-card` keep working; new work and rewrites use the kit.

**Zones** (`zoneHTML(I, zone, inner)`, `data-zone`): each is told apart by shape and a visible text label, never colour alone.

| Zone           | Look                                                  | Use                                                    |
| -------------- | ----------------------------------------------------- | ------------------------------------------------------ |
| `instructions` | room tint, thick start bar                            | directions                                             |
| `context`      | quiet grey, thin bar, small text                      | background a learner may skim                          |
| `stimulus`     | white paper, full outline, `--measure-reading` lines  | the passage, audio player, picture, data               |
| `task`         | bold prompt, no box                                   | the question                                           |
| `response`     | white, thick outline in the room colour               | where the learner answers                              |
| `hint`         | amber tint, dashed outline                            | help the learner asked for                             |
| `feedback`     | status bar + icon + words                             | the result                                             |

**Directions card** (`directionsCardHTML`): "You are learning" / "Your job" / "How" / "You did it when", plus a folded "See an
example". Rows with no content are dropped. Keep each row to one sentence; put the worked example in `example.body`. The Hear
button speaks `say` (default: the job).

**Feedback panel** (`feedbackPanelHTML`): `status` is `right | partly | notyet | shown`; `why` is required (the function throws
without it) because feedback must teach: what was right or what to change and which evidence or language feature decides it.
Optional `evidence` ("Look at ...") and `next` ("Next step ..."). Retry and next buttons go in `actions`. When a page re-renders,
speak the result with `announceFeedback(I, status, why)` (the persistent `#labLive`); a live region created together with its
content is often not read. `live: true` adds `role="status"` for panels inserted on their own.

**Hint ladder** (`hintLadderHTML` + `wireHintLadders(root, I)`): Look, Clue, Show me. One rung per press, focus moves to the
rung, it is announced, and `ak:hint-used` fires with `{ used, total }` so the host can record that help was used. Pass `used`
to re-open rungs after a re-render. Never put the answer before the last rung.

**Interaction states**: `ACTIVITY_STATES` = start, active, response, feedback, retry, next, complete. `setActivityState(el, state)`
sets `data-act-state` and fires `ak:state`. Mark content with `data-ak-in="feedback retry"` and CSS shows it only in those states.
FEEDBACK has two exits: RETRY (try again, hints still available) and NEXT.

**Progress** (`activityProgressHTML`): "Question 2 of 5" with a bar. Where the learner is in the set; never a score, timer or streak.

**Tokens added (additive)**: type `--fs-small --fs-body --fs-prompt --fs-lead --lh-tight --lh-body`; measure `--measure-reading`
(62ch, directions and passages); `--target-min` (2.75rem, the 44px floor); `--focus-ring`; `--zone-bar --zone-context
--zone-stimulus --zone-response`. Do not define a token that reads `--room` at `:root`: it freezes the brand colour for every
domain (read `var(--room)` inside the rule instead).

**Targets and focus**: every header control keeps a 44px target on touch and tablet widths (`registers.css` floor; fine-pointer
desktop keeps compact pills, which clear WCAG 2.2 SC 2.5.8). A table that scrolls sideways gets `tabindex="0"` and a name from
`focusableScrollRegions()` (`src/comfort.js`, runs after every render) so arrow keys scroll it.

## Icons and illustration

- Emoji are allowed anywhere, interface chrome included (Joel, 2026-11-16). The icon sprite is still available: `icon("name")` from `src/util.js` (sprite `pictures/ui-icons.svg`, 24 px grid, 1.8 stroke,
  `currentColor`). The list of names is the `<symbol id>` set in that file. Icons are decorative (`aria-hidden`);
  keep a visible text label next to them.
- Emoji that are part of _activity content_ (picture labels on answer choices, e.g. `.opt-visual`) are content, not
  chrome. Leave the content; the shell frames them in a consistent tile.
- Illustrations are original SVG in `pictures/ds/`. `hall-68.svg` / `hall-35.svg` (the exhibition hall) and the four
  `domain-*.svg` studio pictures are generated by `node tools/access-hall-art.mjs` (`--check` in the tests) — edit the
  script, never the files. Every other picture under `pictures/` (activity pictures, the `ds/` spot art such as
  `empty`, `complete`, `hero`, `reality-*`, `studio-*`, the `worlds/` cards and the `publisher/` figures) is generated
  by `node tools/lp-art/build.mjs` from one scene module per file in `tools/lp-art/scenes/<stem>.mjs`, using the shared
  kit `access-practice-lab/src/art/kit.js` (people, places, palette) and the spot-art helpers in `tools/lp-art/lib/g.mjs` (cards,
  check badges, speech bubbles, sound waves, pencils, magnifiers, soft shadows). Edit the scene, never the SVG;
  `build.mjs --check` fails when an output is stale. The look is editorial and dimensional: no outlines, form from a
  lit top-left side and a shaded side, soft blurred shadows, Deep Harbor colours (navy, teal, gold, coral, ivory) and
  the domain colours on domain cards, with small sparkles and dots as accents. Keep each file's viewBox and its
  transparent or opaque background so layouts do not shift. Reference with `${ART}/name.svg` (`ART` from
  `src/util.js`), `alt=""` when decorative.

## Layout

Page container is `.lab-main` (80rem = max-w-7xl, 24-32 px side padding). Use CSS grid with `minmax(0, …)` columns; collapse deliberately at 980, 860,
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
- Student text and recordings never leave the device; do not add network calls. The one adult-page exception is
  Mr. Neft, the AI guide (`PLATFORM.md`, rule 3): only a question an adult types goes to `/api/language-guide`.

## Checking your work

- Dev server (no cache) serves this worktree at `http://localhost:4577/access-practice-lab/…`.
- `node tools/access-visual-qa.mjs --base http://localhost:4577 --out <dir> --only <screen-name> --widths 1440,1024,768,390,320`
  writes full-page PNGs per screen and width and reports horizontal overflow and console errors. Screen names are the
  keys in `SCREENS` inside that file; add a screen there when you add a route. `--y/--h` crop a long page.
- Always open the PNGs and look: spacing, alignment, contrast, text clipping, empty areas.
- Keyboard: tab through the screen, confirm a visible focus ring and no trap.
- `node tools/access-studio-e2e.mjs` and `node tools/access-lab-e2e.mjs` drive the real flows (slow; run the one that
  covers your screens before you finish).
