# Lesson Platform — Integration Contract

**Single source of truth** for build agents adding the shared "lesson platform"
to self-contained math lesson HTML pages. Every fact below is quoted from the
real repo files (no guessing). When in doubt, read the cited file.

Files this contract was extracted from:

- `math/unit-1/1-1-math-is-mine/index.html` — representative lesson (self-contained HTML + inline `<script>`)
- `assets/nt-page-enhance.js` — injected into every lesson; save bar + optional auto-grade
- `assets/game-fx.js` + `assets/game-fx.css` — `window.GameFX` visual FX kit
- `assets/design-tokens.css` + `assets/neft-theme.css` — CSS custom properties
- `shared/save-resume/save-resume-engine.js` — `window.NeftSaveResume`
- `functions/api/progress/[[path]].js` — `/api/progress` Pages Function (D1)
- `tools/inject-game-fx.js` — sentinel-marker injector pattern to mirror

---

## 1. DOM selectors for interactive items

> **WARNING:** the representative lesson uses **its own local class vocabulary**
> (`.q-card`, `.mc-btn`, `.fill-input`, `.tf-btn`, `.check-btn`), NOT the
> `assets/game-fx.js` `INTERACTIVE`/`SUCCESS_CLASS` regex vocabulary
> (`.opt`/`.option`/`.choice`/`.right`/`.correct`). These two vocabularies are
> **different**. Any platform layer that auto-detects items must handle the lesson
> classes explicitly — game-fx's auto-burst will **not** fire on `.mc-btn.is-correct`.

### Item grouping

A single graded problem is an `<article>`:

```html
<article class="q-card" data-q="w1">...</article>
```

- `.q-card` = one problem card. `data-q` (values like `w1`, `w2`, `p1`…`p5`, `c1`) is the **problem id**.
- Graded result classes applied to the card: `.q-card.correct` / `.q-card.incorrect`.
- Each card contains a `.q-num` label, a `.q-prompt`, optional `.scaffold` (Level 1), optional `.explain-section` (Level 2), optional `.sentence-frame` (Level 1), plus two feedback blocks `.q-status` (right) and `.q-status-wrong`.
- Footer score readout: `#scoreCount`, `#scoreTotal`, progress bar `#progressFill`, reset `#resetBtn`.

### Four item types (how MCQ vs fill differ)

**1. Multiple choice** — options carry the candidate answer in `data-val`:

```html
<div class="mc-options">
  <button class="mc-btn" data-val="b">
    <span class="letter">B</span><span>…</span>
  </button>
</div>
<button class="check-btn" disabled>Check</button>
```

- Selected: `.mc-btn.selected`; after check: `.mc-btn.is-correct` / `.mc-btn.is-wrong` / `.mc-btn.locked`.
- Correct value is **not** on the DOM — it lives in the inline JS `ANSWERS` map keyed by `data-q` (e.g. `w1: "b"`). `.check-btn` starts `disabled`, enabled on selection.

**2. Fill-in** — the correct answer **is** on the DOM via `data-answer`:

```html
<input
  class="fill-input"
  data-answer="62"
  placeholder="?"
  aria-label="answer for a"
/>
…
<button class="check-btn" id="p4-check">Check All</button>
```

- Grading: `input.value.trim() === input.dataset.answer` (string-exact). Result: `.fill-input.is-correct` / `.fill-input.is-wrong`, then `input.readOnly = true`.

**3. True/False** — `.tf-options > .tf-btn[data-val="true|false"]`; correct value also from `ANSWERS`. States `.selected` / `.is-correct` / `.is-wrong` / `.locked`.

**4. Drag & drop** — bank `#p3-bank > .drag-item[draggable="true"][data-id][data-cat]`; zones `.drag-zone[data-cat]`; check `#p3-check`. Correct = every item's `data-cat` matches its zone's `data-cat` and no zone empty. Zone states `.drag-zone.over` / `.is-correct` / `.is-wrong`; placed items get `.placed`.

**Summary selector table**

| Concept                    | Selector                                                                                  |
| -------------------------- | ----------------------------------------------------------------------------------------- |
| Problem card               | `article.q-card[data-q]`                                                                  |
| Card correct / incorrect   | `.q-card.correct` / `.q-card.incorrect`                                                   |
| MCQ option                 | `.mc-btn[data-val]` (states `.selected`,`.is-correct`,`.is-wrong`,`.locked`)              |
| Fill input (answer on DOM) | `input.fill-input[data-answer]`                                                           |
| TF option                  | `.tf-btn[data-val]`                                                                       |
| Drag item / zone           | `.drag-item[data-id][data-cat]` / `.drag-zone[data-cat]`                                  |
| Check button               | `.check-btn` (per-card or `#p3-check`/`#p4-check`)                                        |
| Feedback right / wrong     | `.q-status` / `.q-status-wrong`                                                           |
| Level scaffolds            | `.scaffold` (L1), `.explain-section` (L2), `.sentence-frame` (L1), `.level0-support` (L0) |

---

## 2. CSS custom properties available to reuse

### A) `assets/design-tokens.css` — `:root` (shared, theme-agnostic)

Palette: `--navy` `#12355b`, `--navy-light` `#18466f`, `--teal` `#1fa6a2`, `--teal-light` `#dff2ee`, `--amber` `#f2c15b`, `--amber-light` `#fef7e0`, `--cream` `#f7f4ec`, `--coral` `#d9795d`, `--coral-light` `#fce6de`.
Semantic: `--bg` `--card` `--ink` `--muted` `--line` `--success` `--success-bg` `--error` `--error-bg` `--hint` `--hint-bg`.
Radii: `--radius-sm` `8px`, `--radius-md` `14px`, `--radius-lg` `22px`.
Spacing: `--sp-1`(4) `--sp-2`(8) `--sp-3`(12) `--sp-4`(16) `--sp-5`(20) `--sp-6`(24) `--sp-7`(32) `--sp-8`(40).
Type: `--font-display` (`"Outfit", system-ui, sans-serif`), `--font-body` (`"Hanken Grotesk", Calibri, "Segoe UI", system-ui, sans-serif`).

### B) `assets/neft-theme.css` — light/dark contract (set via `:root[data-theme]`, paired with `neft-theme.js`)

`--nt-bg` (page bg) · `--nt-surface` (cards/panels) · `--nt-text` (primary) · `--nt-muted` (secondary) · `--nt-accent` (links/buttons) · `--nt-border` (hairlines) · `--nt-focus` (focus ring). Both `light` and `dark` are defined; fallback `:root:not([data-theme="dark"])` = light. Opt-in by adding the `<link>` + `<script>` and styling with `--nt-*` (never hard-code colors).

> **Collision note:** the representative lesson defines its **own** `:root` token
> set inline (`--navy:#0f2b3c`, `--blue`, `--teal:#0b6f65`, `--gold`, `--coral`,
> `--green`, `--ink`, `--muted`, `--faint`, `--line`, `--bg`, `--card`, `--radius`,
> `--shadow`, `--font`). These **shadow** the shared `design-tokens.css` values
> (different hexes, e.g. lesson `--navy` ≠ token `--navy`). A platform layer
> injecting shared CSS into a lesson must namespace its own variables (prefer the
> `--nt-*` family) to avoid silently changing the lesson's palette.

---

## 3. `window.GameFX` public methods

Defined in `assets/game-fx.js`; idempotent (`if (window.GameFX) return;`). All motion auto-disabled under `prefers-reduced-motion`.

```js
window.GameFX = {
  celebrate(el),   // spark burst centered on el's bounding rect (no-op if reduce / 0-size)
  burst(cx, cy),   // 12-particle spark burst at viewport coords (cx, cy)
  pop(el),         // retrigger .gfx-pop scale animation on el
  reduce,          // boolean: prefers-reduced-motion is on
};
```

Auto behaviors: a `MutationObserver` fires `celebrate()` once when a small interactive element **gains** a success class matching `/(right|correct|is-correct|is-right|ok|success|won|gfx-correct)/i` AND matches interactive `/(opt|option|choice|answer|tile|card|btn|cell|key)/i` (or is `<button>`/`role=button`). Pointer parallax on `[data-parallax]` / `.ghero` containers (layer = `[data-parallax-layer]` or `.deco`).
CSS hooks (`game-fx.css`): `.gfx-spark`, `.gfx-pop` (+ `@keyframes gfxPop`), focus-visible rings on `button/a/[role=button]/[tabindex]/.opt/.option/.choice/.answer/.tile/.card`.

---

## 4. `nt-page-enhance.js` public surface + `window.NT_GRADE_ITEMS`

IIFE, idempotent via `window.__ntPageEnhance`. **No exported API** — it is configured by globals the page sets _before_ the script runs:

| Global                  | Type           | Effect                                                          |
| ----------------------- | -------------- | --------------------------------------------------------------- |
| `window.NT_ACTIVITY`    | `true`/`false` | Force-show / force-hide the save bar (overrides auto-detect)    |
| `window.NT_GRADE_ITEMS` | `Array`        | If non-empty array, a score table is appended to the DOC export |

It injects: a fixed bottom **save bar** (`.nt-pe-bar` with a name `<input>`, "Save as PDF" via `window.print()`, "Save as DOC" via msword Blob), a favicon if missing, and (deferred) `/assets/curriculum-progress-bridge.js` via `window.CurriculumProgressBridge`. `?embed=1` adds `html.nt-embed` and hides chrome (`.topbar,.phero,.breadcrumb,.nav-links,.nt-pe-bar`). It clears `html.nt-dark` and **does not** add dark mode.

**`NT_GRADE_ITEMS` item shape** (read by `maybeGrade()`):

```js
window.NT_GRADE_ITEMS = [
  {
    prompt: "Question text", // shown in table
    studentAnswer: "...", // graded value
    correctAnswer: "...", // expected value
    points: 1, // optional, default 1
  },
];
```

Grading rule: `String(studentAnswer).trim().toLowerCase() === String(correctAnswer).trim().toLowerCase()`. Percent = `round(earned/possible*100)`. On grade it **appends a row to `localStorage["nt_results_v1"]`** (schema `"nt_result_v1"`): `{schema, studentAlias, section, activityId(pageSlug), activityTitle, scorePercent, completedAt(ISO), deviceOnly:true}`. Student identity is stored under `localStorage["nt_student"]` = `{name, section}`.

Auto-detect (`isActivityPage()`): false if `#app` or `.identity-screen` present; true if a `form`/`textarea`, or ≥2 input fields, or any `[class*=quiz|question|activity|answer]` / `[id*=quiz|question]`.

---

## 5. `save-resume-engine.js` public API + namespacing

`window.NeftSaveResume` (engine version `1.1.0`); idempotent via `__loaded`. Auto-inits on `DOMContentLoaded` unless `window.NeftSaveResumeConfig.autoStart === false`.

```js
NeftSaveResume.init(config)              // {activityId, activityTitle, activityPrefix, activityVersion, backend, endpoint, autoStart, blocking}
NeftSaveResume.save(reason)              // -> Promise; force a save now
NeftSaveResume.getState()               // current captured state object (or null)
NeftSaveResume.getTeacherSummary()      // {saveCode, studentName, section, percentComplete, keyResponses[…], …}
NeftSaveResume.registerStateProvider(fn)// fn() -> plain obj contributed into state.custom["p<i>"]
NeftSaveResume.registerStateRestorer(fn)// fn(myObj, allCustom) restores it
NeftSaveResume.open() / .close()        // panel
NeftSaveResume.reset()                  // clear THIS browser's session pointer for the activity
NeftSaveResume.version                  // "1.1.0"
// also exposes the adapter classes: .LocalStorageAdapter/.CloudflareAdapter/.GoogleAppsScriptAdapter
```

### Namespacing per page

- **Config:** set `window.NeftSaveResimeConfig` before the script — supply a unique `activityId` (else auto-derived from `slugify(location.pathname)`) and an `activityPrefix` to control the resume-code prefix.
- **localStorage keys** are all under prefix `nsr:` — never collides with the lesson's own keys. Per-activity pointer: `nsr:activity:<activityId>:lastCode`; record: `nsr:rec:<CODE>`; device identity: `nsr:identity`.
- **State auto-capture** covers `input,textarea,select,[contenteditable]`, nav/tabs, drag-drop (`[draggable=true]`, `[data-nsr-dropzone]`), and author markers `[data-nsr-value]`, `[data-score]/[data-progress]/[data-nsr-score]/[data-nsr-progress]`, `[data-nsr-hint]`. To exclude a field add `data-nsr-ignore`. For state the auto-capture can't see (canvas, custom widget) use `registerStateProvider`/`registerStateRestorer`.
- Resume code: `<PREFIX>-<4 chars>` from alphabet `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (no 0/O/1/I/L). Autosave every 20s + 800ms debounce on input/change + on `beforeunload`/`visibilitychange`.

> **Central record:** `CENTRAL_RECORD` is currently set to `backend:"googleAppsScript"` with a live `/exec` endpoint, so by default every save also mirrors to that Google Apps Script. A page can override via `NeftSaveResumeConfig.backend/endpoint` (e.g. `backend:"cloudflare"` → `/api/progress`).

---

## 6. `/api/progress` GET and POST (Cloudflare Pages Function + D1)

Catch-all `functions/api/progress/[[path]].js`, binding `env.DB` (D1). **If `env.DB` is absent → every data route returns HTTP 503** (client falls back to localStorage). CORS `*` on all responses. `OPTIONS` → 204.

| Method + path                      | Request                    | Success response                                                  |
| ---------------------------------- | -------------------------- | ----------------------------------------------------------------- |
| `GET /api/progress/health`         | —                          | `{ ok:true, backend:"cloudflare", d1:<bool> }` (works without D1) |
| `GET /api/progress/load?code=CODE` | query `code` (upper-cased) | `{ ok:true, record:{…} }`                                         |
| `POST /api/progress/create`        | JSON body (below)          | `{ ok:true, saveCode, updatedAt }`                                |
| `POST /api/progress/save`          | JSON body (below)          | `{ ok:true, saveCode, updatedAt }`                                |

**Code validation:** `/^[A-Z0-9]{1,12}-[A-Z0-9]{3,8}$/` → bad code = `400 {ok:false,error:"bad-code"}`; not found = `404 {ok:false,error:"not-found"}`; bad payload = `400 {ok:false,error:"bad-payload"}`.

**POST body** (clamped: activityId≤200, activityTitle≤300, studentName≤60, section≤40):

```json
{
  "saveCode": "MATH-7KQ2",
  "activityId": "math-unit-1-1-1-math-is-mine",
  "activityTitle": "Lesson 1-1: Math is Mine",
  "studentName": "Jordan Nguyen",
  "section": "Period 3",
  "progressPercent": 40,
  "state": { "...": "..." },
  "createdAt": "2026-06-19T..."
}
```

**`record` returned by load** (`recordFromRow`):

```json
{
  "schema": 1,
  "saveCode": "...",
  "activityId": "...",
  "activityTitle": "...",
  "studentName": "...",
  "section": "...",
  "progressPercent": 0,
  "state": {},
  "createdAt": "ISO",
  "updatedAt": "ISO"
}
```

`create` = INSERT … ON CONFLICT(save_code) DO UPDATE; `save` = UPDATE, falling back to create if no row changed (cross-device first save). Table `student_progress` is auto-created (`ensureSchema`).

---

## 7. Injector mechanism (mirror `tools/inject-game-fx.js`)

Node ESM script. Walks an allow-list of roots, injects a `<link>` before `</head>` and a `<script defer>` before `</body>`, wrapped in an idempotent sentinel comment block.

```js
const MARK = "gfx-injected";
const BEGIN = `<!-- ${MARK}:begin (shared game polish — tools/inject-game-fx.js) -->`;
const END = `<!-- ${MARK}:end -->`;
html = html.replace(
  /<\/head>/i,
  `  ${BEGIN}\n  ${LINK_TAG}\n  ${END}\n</head>`,
);
html = html.replace(
  /<\/body>/i,
  `  ${BEGIN}\n  ${SCRIPT_TAG}\n  ${END}\n</body>`,
);
```

Pattern to replicate for the lesson platform:

- **Pick a unique `MARK`** (e.g. `lp-injected`) so the begin/end sentinels don't collide with existing markers. Existing markers already in lesson files: `gfx-injected` (game-fx) and `nsr-injected` (save/resume — `<!-- nsr-injected:begin (multi-day save/resume — tools/inject-save-resume.js) -->`).
- **Idempotency:** skip if `html.includes(\`${MARK}:begin\`)`; count `already`.
- **Skip files without both tags:** `if (!/<\/head>/i.test(html) || !/<\/body>/i.test(html)) skip`.
- **Flags:** `--dry-run` (report only, no writes) and `--revert` (regex-strip the begin→end block). Report counts: `scanned/injected/already/reverted/skippedNoTags`.
- **Roots** are an explicit allow-list array (game-fx uses `games`, `math/games`, named app folders…); `SKIP_DIRS = {node_modules, dist, vendor, engine3d, .git}`; only `*.html`.
- Run via `node tools/<name>.js [--dry-run|--revert]`. Repo deploys by pushing `main` (Cloudflare Git integration runs `npm run build`); verify with `npm run validate` and `node tools/audit-save-resume-integration.js`.

---

## 8. Global names already taken + lesson section structure

### Global names to avoid colliding with

| Global                                                                                                                                                                                                                                                                                                   | Owner              |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| `window.NeftSaveResume`, `window.NeftSaveResumeConfig`                                                                                                                                                                                                                                                   | save-resume engine |
| `window.GameFX`                                                                                                                                                                                                                                                                                          | game-fx.js         |
| `window.__ntPageEnhance` (guard), `window.NT_ACTIVITY`, `window.NT_GRADE_ITEMS`, `window.CurriculumProgressBridge`                                                                                                                                                                                       | nt-page-enhance.js |
| `localStorage` keys: `nsr:*`, `nt_student`, `nt_results_v1`                                                                                                                                                                                                                                              | engines above      |
| DOM ids: `#nsr-root`, `#nsr-panel`, `#nsr-launcher`, `#nsr-toast`                                                                                                                                                                                                                                        | save-resume UI     |
| CSS classes: `.nt-pe-bar`, `.gfx-*`, `.nsr-*`, `.nt-embed`, `.nt-dark`, `.nt-theme-toggle`                                                                                                                                                                                                               | shared assets      |
| Sentinels: `gfx-injected`, `nsr-injected`                                                                                                                                                                                                                                                                | injectors          |
| Lesson-local (per page): inline IIFE, `ANSWERS` map, ids `#progressFill #scoreCount #scoreTotal #resetBtn #readAloudBtn #levelDesc`, classes `.q-card .mc-btn .fill-input .tf-btn .check-btn .scaffold .explain-section .sentence-frame .level0-support`; body classes `level-0 level-1 level-2 reading` | lesson HTML        |

> Choose a fresh namespace for the platform (suggest `window.NeftLessonPlatform` + `lp-` class/id prefix + `lp-injected` sentinel + a distinct `localStorage` prefix). Do **not** reuse `nt_`, `nsr`, `gfx`, or `q-card/mc-btn`.

### Lesson section structure (representative page)

```
<head>  inline :root tokens + all styles ; nsr-injected <link>
<body class="level-1">
  <header.header>            h1, subtitle <p>, .standard-badge
  <div.level-bar>            .level-toggle > .level-btn[data-level=0|1|2] + #readAloudBtn ; #levelDesc
  <div.level0-support>       Level 0 extra-support callout
  <div.progress-bar>         .progress-track > #progressFill
  <main.main>
    <div.section-header>     .section-icon.warmup|practice|challenge + h2 + .count
    <article.q-card data-q>  one per problem (Warm-Up → Practice → Challenge)
    … repeated …
  <footer.score-bar>         #scoreCount / #scoreTotal / #resetBtn
  <script> inline IIFE: ANSWERS map, level toggle, MC/TF/drag/fill grading, reset, read-aloud
  <script src="/assets/nt-page-enhance.js" defer>
  nsr-injected <script src="/shared/save-resume/save-resume-engine.js" defer>
</body>
```

Section order convention: **Warm-Up → Practice → Challenge**, each preceded by a `.section-header`. Level is driven by the `body` class (`level-0`/`level-1`/`level-2`; Level 0 adds `level-0 level-1`). Three difficulty tiers are first-class (Level 0 = most-supported, Level 2 = enrichment) — never label them "ESOL".
