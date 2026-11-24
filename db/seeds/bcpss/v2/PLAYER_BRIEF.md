# Language Studio Player — build brief

Goal: a **publisher-grade, exciting, clear** student-facing player for the authored Language Studio activities (schema: `db/seeds/bcpss/v2/schema.mjs`,
exemplar data: `db/seeds/bcpss/v2/units/g6-math-u1.mjs`, payload recipes: `AUTHORING.md`). Joel's direction: **less teacher direction, more exciting, engaging,
clear activities.** Students should _want_ to click. Think premium educational app (Nearpod / Kahoot-calm / Duolingo-clean), not a worksheet on a screen.
Hard rules from Joel: **NO timers/countdowns**, real games, scaffolds never give the answer away, plain language, never label learners "ESOL", not overwhelming — one obvious next action per screen.

## Page contract

- Page: `/bcpss-teachers/language-studio/?unit=<unitId>&a=<activityIndex 1-based>&level=<l1_2|l3_4|l5_6>`.
- Data: `GET /api/bcpss/units/<unitId>` → the detail object itself: `{ unit, studio, connections, activities, reading, ... }` (no wrapper). Use `.studio` (see schema) and `.unit` (title, grade, subject, curriculum_name).
- Look: follow the site's editorial-academic design (`access-practice-lab/ds.css` tokens, Inter / Plus Jakarta Sans, `bcpss-teachers/bcpss-teachers.css` header style). Add a
  **grade-band theme**: K–2 big rounded playful (large type, emoji icons from `vocab[].icon`), 3–5 friendly, 6–8 sleek/editorial. Light + dark mode via `prefers-color-scheme`.
  Colors from tokens only (no new hex outside a `:root` token block). No emoji in chrome except K–2 vocabulary icons. 44px targets, 16px+ text, visible focus, AA contrast.
- Respect `prefers-reduced-motion` (celebration/confetti only when motion is allowed). Works at 390px and 1366px. Chromebook friendly (touch + keyboard + mouse).
- Accessibility: every drag interaction has a click/keyboard alternative; `aria-live` announcements; no color-only feedback; labels on every control.
- No inline `on*=` handlers; ES modules; ≤ 500 lines per file; no frameworks, no new dependencies; no external requests.
- Save/Resume: copy the two `nsr-injected` sentinel blocks from `bcpss-teachers/activity/index.html` into the new `index.html` (a validator requires them).

## Shared module contract (both agents code to this)

`studio-kinds/<kind>.js` — `export default function mount(root, ctx)`; returns an optional cleanup function. `root` is an empty element to render into.
`ctx` = `{ unit, studio, activity, payload, level, rng(seedString) → () => number, shuffle(array, seedString) → copy, tts(text, {rate}) → Promise, esc(str), announce(msg),
vocabIcon(term), done({ stars: 1|2|3, detail?: string }), saveState(obj), loadState() → obj|null }`.

- `done()` is called when the student finishes (shows celebration + "Next activity"). Stars: 3 = mostly first-try, 2 = some retries, 1 = completed with support.
- Self-checking kinds must work with **zero teacher involvement**. Open-ended kinds end with a self-check checklist and "I'm done" button.
- Shared stylesheet classes (defined in `studio.css`, owned by agent S): `.st-card`, `.st-btn`, `.st-btn--primary`, `.st-chip`, `.st-chip--ok/--no`, `.st-feedback`, `.st-grid`, `.st-slot`.
  Agent G puts kind-specific CSS in `studio-games.css`; agent S in `studio.css`. Use CSS variables (`--st-*`) defined by S: `--st-ink`, `--st-muted`, `--st-surface`, `--st-line`,
  `--st-accent`, `--st-ok`, `--st-no`, `--st-focus`, `--st-radius`.

## Interaction specs (wrong answers teach, never reveal the answer; correct answers get a small delightful confirmation)

- `match`: two columns; tap one on the left then one on the right; correct pairs lock with color + check; wrong ones shake (not under reduced motion) and return. Shuffle right column. Text-to-speech button on words.
- `word_sort`: category buckets; drag or tap chip then tap bucket; immediate check on placement; wrong → chip returns with "Not quite — look at how it's used."; summary at end.
- `clue_game`: a card deck; reveal clue 1; button "Show another clue" (max 3); guess by tapping from a word-bank of the unit's terms (all card terms); points 3/2/1 for clue count; no clock; end summary.
- `cloze`: story with tappable blanks + word bank chips; tap chip then blank (or drag); "Check" locks correct, marks wrong; extras in bank are rejected naturally.
- `unscramble`: shuffled phrase chips; tap to build the sentence in order; "Check"; on success the sentence is read aloud (tts) and highlighted.
- `sequence`: reorder steps (up/down buttons + drag); signal words shown as chips to place in the sentence frame; check.
- `quiz` and `error_analysis`: one question per screen, option buttons, instant feedback with `why`, progress dots, retry wrong ones at the end. For error_analysis show the wrong sentence with the error type label after answering.
- `dictogloss`: "Listen" button reads `text` with tts at slow rate (0.8) then natural; students tap key-word chips they heard and type notes; "Rebuild" textarea with `frame`; a "Check my ideas" list from `checks` (self-check checkboxes); "Reveal text" at the end. Works without audio support by showing a "Teacher reads aloud" fallback.
- `info_gap`: two cards (Partner A / Partner B) side by side on wide screens, stacked on phones, each with "Hide my card / Show my card" so two students can share a device; ask/tell frames as chips; each partner fills in the `needs` fields; "Check" compares (case/space/units-insensitive) with the other card's `has`.
- `talk_cards`: a deck of conversation cards (flip animation), whose turn (Explainer / Challenger) indicator, "Swap roles", the talk-moves tray; shuffle; counts cards discussed.
- `read_annotate`: text rendered as tappable words; palette of mark colors from `marks[]`; tap words (or drag across) to highlight under the active mark; "Check" compares with the target phrases (found X of Y, extras) without revealing missed phrases; then multiple-choice questions with `why`.
- `sentence_combine`: show two short sentences + connector chip; student types the combined sentence; after submit show `model` ("one possible answer") and let them self-check connector use.
- `write_scaffold`: prompt, the structure frames as labeled boxes (Claim/Reason/Evidence), word bank chips that insert into the focused box, checklist, a live word count, "Read aloud" (tts), "Show a model" **only after** the student has written at least ~15 words; "Copy" and "Print my writing".

## Studio home (agent S)

Header: unit title, curriculum chip, essential question, the two "I can" statements. Level switch (Levels 1–2 / 3–4 / 5–6 shown as "Starter / Core / Stretch" with tooltip showing the WIDA band).
**Word Wall**: 8–10 flip cards (front: icon (K–2) + term + speaker; back: kid definition, example sentence, "not this" nonexample, Spanish + note, word family). **Mentor sentence**: the sentence with
color-coded chunks; tap a chunk to see its role and question; a "read aloud" button. **Activity gallery**: cards (title, domain chip, minutes, grouping, mission sentence, stars earned), filter by domain
(Listening / Speaking / Reading / Writing / Vocabulary / Game); a clear single primary action: "Start" on the next unplayed activity. **Exit ticket** card at the end. Progress persists in localStorage
(`bcpss-studio:<unitId>`: stars per activity, last level) with try/catch around storage. Print/download buttons link to `/api/bcpss/export/<unitId>?format=pdf|docx|html&part=<part>` where
part ∈ `book` (Student Activity Book), `activity-<n>` (single activity), `cards` (vocabulary cards), `bingo`, `wall` (word wall), `poster` (mentor sentence poster), `strips` (sentence strips),
`talk` (talk cards), `key` (answer key). Another agent builds these endpoints — just link to them (a "Resources & printables" section with one tidy row per resource).
Do NOT show teacher scripts; show the one-line `tip` only in a small "Teacher tip" disclosure on each activity.

## Verification (required)

1. Build a local fixture: `node -e` import `functions/_lib/bcpss/db.js` → `getUnitDetail({}, "g6-math-u1")` and save the JSON; serve the repo with a static server
   (e.g. `npx http-server -p 4801` or Python) and use Playwright (see `node_modules/playwright` or the Playwright MCP) with route interception for `/api/bcpss/units/*`.
2. Exercise EVERY activity kind in the exemplar unit end to end (correct path, wrong path, keyboard path) at 1366×800 and 390×844; no console errors; no horizontal overflow.
3. Run an axe pass if `@axe-core/playwright` is installed (no serious/critical).
4. Take screenshots (home, and each kind) into `/tmp/claude-501/scratch/player-shots/` and LOOK at them; fix anything dull, cramped, or unclear. Iterate until it feels premium.
5. `npx biome check <your files> --max-diagnostics=20` clean (never pipe biome into head).
