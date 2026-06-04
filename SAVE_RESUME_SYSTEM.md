# Save / Resume System

A durable, multi-day **Save & Resume** layer for every active HTML lesson/activity
in this repo. A student can start an activity, work on it across several days, get
a friendly **resume code**, come back later, enter the code, and continue exactly
where they left off — including the **full activity state**, not just final answers.

It works immediately with **localStorage** (offline-first). Optional **Cloudflare D1**
and **Google Apps Script** backends add cross-device resume when you choose to enable
them. If a backend is not configured, nothing breaks — local work stays safe.

---

## What the system does

- Adds a small, non-blocking floating **“Save / Resume”** button to each activity.
- Captures full state: text inputs, textareas, radios, checkboxes, dropdowns,
  contenteditable, active tabs/pages, visible sections, drag/drop placements,
  marked data/scores/hints (when detectable), plus timestamps and safe metadata.
- Auto-saves on every input/change, on tab/hash navigation, every 20 seconds, and
  before the page unloads. A manual **Save now** button is always available.
- Restores everything on return and fires `input`/`change` events so the lesson’s
  own scoring/validation re-syncs.
- Produces a clean **teacher summary** object for export.

### Files

| File                                             | Purpose                                           |
| ------------------------------------------------ | ------------------------------------------------- |
| `shared/save-resume/save-resume-engine.js`       | The whole engine (no dependencies).               |
| `shared/save-resume/save-resume-styles.css`      | Scoped UI styles (`#nsr-root`).                   |
| `functions/api/progress/[[path]].js`             | Optional Cloudflare Pages Function (D1).          |
| `migrations/0001_student_progress.sql`           | Optional D1 schema.                               |
| `tools/google-apps-script/save-resume-webapp.gs` | Optional Apps Script backend.                     |
| `tools/inject-save-resume.js`                    | Adds the shared refs to active HTML (idempotent). |
| `tools/audit-save-resume-integration.js`         | Verifies the rollout.                             |

The shared folder is a top-level `shared/` directory; `vite.config.js`’s
`copyStandaloneHtml` plugin copies it verbatim into `dist/shared/`, so the absolute
path `/shared/save-resume/...` resolves for lessons at **any** nesting depth.

---

## Student workflow

1. Open an activity. A **Save / Resume** button appears (bottom-right). On a first
   visit the panel opens automatically.
2. Type your **initials/name** and **class/section**, then **Start new work**.
3. A **resume code** appears, e.g. `MATH-7KQ2`. Write it down (or it’s remembered
   on this device automatically).
4. Work normally. Saving happens automatically; the dot/label shows the status.
5. Next day: open the activity, click the button, choose **Continue with a code**,
   type your code, and your work returns.

On the **same device**, returning students are auto-resumed — no code needed.
The code is required to resume on a **different device** (needs a backend enabled).

### Resume codes

- Format: `PREFIX-XXXX` (e.g. `MATH-7KQ2`, `DATA-M9P4`).
- The **prefix** is derived from the activity (its `activityPrefix`, else its title).
- The 4-character suffix uses an unambiguous alphabet (no `0/O/1/I/L`).
- Codes are case-insensitive on entry.

---

## Teacher workflow

- Open the browser console on an activity and run
  `NeftSaveResume.getTeacherSummary()` to get:
  student name, section, activity, **percent complete**, current page, last saved,
  and key text responses.
- With a backend enabled, all records live in **D1** (`student_progress` table) or a
  **Google Sheet** tab (`Student Progress`) — query/sort there by activity or section.

---

## How to add the engine to a future HTML lesson

Add these two lines (absolute paths) and you’re done:

```html
<!-- in <head> -->
<link rel="stylesheet" href="/shared/save-resume/save-resume-styles.css" />
<!-- before </body> -->
<script src="/shared/save-resume/save-resume-engine.js" defer></script>
```

Or run the injector to do it for all active files at once:

```bash
node tools/inject-save-resume.js          # inject (idempotent)
node tools/inject-save-resume.js --dry-run # preview only
node tools/inject-save-resume.js --revert  # remove the injected refs
node tools/audit-save-resume-integration.js # verify
```

### Optional per-page configuration

Set a config **before** the engine script loads, or call `init` yourself:

```html
<script>
  window.NeftSaveResumeConfig = {
    activityId: "ratios-recipe-factory",
    activityTitle: "Recipe Factory",
    activityPrefix: "RATIO",
    backend: "localStorage", // or "cloudflare" | "googleAppsScript"
    endpoint: null, // backend URL when not "localStorage"
    autoStart: true, // show the intro panel on first visit
  };
</script>
```

If you omit config, the engine auto-detects `activityId` from the path,
`activityTitle` from `<title>`/`<h1>`, and defaults to `localStorage`.

### Custom state (graphs, games, canvases, drag/drop)

For state the generic capture can’t see, register hooks:

```js
NeftSaveResume.registerStateProvider(() => ({
  score: game.score,
  level: game.level,
}));
NeftSaveResume.registerStateRestorer((data) => {
  if (data) game.load(data);
});
```

You can also mark elements declaratively:
`data-nsr-value="..."`, `data-nsr-progress="60"`, `data-nsr-section`,
`data-nsr-dropzone`, `data-nsr-draggable`, or `data-nsr-ignore` to skip a field.

---

## How to enable the Cloudflare backend

The Pages Function `functions/api/progress/[[path]].js` is already present and
returns **HTTP 503** (graceful) until a D1 binding exists — so it never breaks.

1. Create a D1 database:
   ```bash
   npx wrangler d1 create neft-student-progress
   ```
2. Add the binding to `wrangler.toml`:
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "neft-student-progress"
   database_id = "<id-from-step-1>"
   ```
3. Apply the schema (optional — the function also creates the table lazily):
   ```bash
   npx wrangler d1 migrations apply neft-student-progress
   ```
4. Point activities at it (per page or globally):
   ```js
   window.NeftSaveResumeConfig = {
     backend: "cloudflare",
     endpoint: "/api/progress",
   };
   ```
5. Deploy as usual. Probe `GET /api/progress/health` → `{ ok, d1: true }`.

Endpoints: `POST /create`, `POST /save`, `GET /load?code=XXXX`, `GET /health`.

---

## How to enable the Google Apps Script backend

See the step-by-step header in `tools/google-apps-script/save-resume-webapp.gs`.
Summary: paste the file into a Sheet’s Apps Script, run `setup`, deploy as a Web App
(“Anyone” access), copy the `/exec` URL, then:

```js
window.NeftSaveResumeConfig = {
  backend: "googleAppsScript",
  endpoint: "https://script.google.com/macros/s/XXXX/exec",
};
```

---

## How to turn on the central record (one switch for EVERY activity)

Use this when you want a teacher backup of **every student's code, organized per
class**, so you can recover a lost code for any student. It builds on the Apps
Script backend above.

1. Deploy the Apps Script Web App once (see the section above) and copy the
   `/exec` URL.
2. Open `shared/save-resume/save-resume-engine.js`, find the `CENTRAL_RECORD`
   block near the top, and paste your URL into `endpoint`:

   ```js
   var CENTRAL_RECORD = {
     backend: "googleAppsScript",
     endpoint: "https://script.google.com/macros/s/XXXX/exec",
   };
   ```

3. Rebuild + deploy (`npm run build`, then the maintainer's `wrangler pages
deploy dist`). That's it — every one of the ~975 activities that loads the
   engine now mirrors each save into your Sheet. No per-file edits.

What you get in the Sheet:

- A **`Student Progress`** master tab — one row per code: `save_code`,
  `activity_id`, `activity_title`, `student_name`, `section` (class),
  `progress_percent`, timestamps.
- One **`Class · <name>`** tab per class, auto-created from what students type,
  so the roster is already split by class — find the student, read their code.

How students are identified (built in): on the first activity they enter their
**full name + class once**; the engine remembers it on that device and auto-fills
every later activity, so every save lands in the right class. On a shared
Chromebook, **"Not you? Switch student"** in the panel clears it for the next kid.

Notes / limits:

- If `endpoint` is left blank, behavior is unchanged: work saves to the
  student's own browser only (offline-first). The central record is purely
  additive and fails soft — a network blip never blocks a student.
- Free-text class labels are lightly normalized (trimmed, spacing collapsed) but
  not spell-corrected: "Period 3" and "period3" make two tabs. Keep a consistent
  label on the board. The master tab always holds every record regardless.
- If a student changes their class later, the master tab updates in place; the
  old `Class ·` tab may keep a stale copy. Treat the master tab as truth.

---

## Troubleshooting

| Symptom                                      | Cause / fix                                                                                                                      |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Button doesn’t appear                        | Check the two refs are present and `/shared/...` returns 200 in the Network tab. Run the audit tool.                             |
| “Saved on this device” never becomes “Saved” | Backend not configured/reachable — local copy is still safe. Check `GET /api/progress/health`.                                   |
| Resume on another device says not found      | Cross-device needs a backend; localStorage is per-device.                                                                        |
| A field didn’t restore                       | The engine logs `could not restore field …`. Usually the field’s DOM position changed (give it an `id`).                         |
| Active tab didn’t restore                    | Generic tab detection is best-effort; field answers still restore. Use `data-nsr-tab`/`aria-selected` tabs or a custom restorer. |
| Console diagnostics                          | Everything the engine does is logged under `[NeftSaveResume]`.                                                                   |

---

## Privacy / data notes

- Stored data is minimal: resume code, optional name/initials + section, activity id,
  the captured state blob, progress %, and timestamps.
- **Password fields and file inputs are never stored.**
- Don’t put sensitive personal data into activity fields.
- localStorage data stays on the student’s device. Backends (if enabled) store the
  same minimal record server-side; no authentication is required for local/classroom
  use — keep backend URLs classroom-scoped.

---

## QA checklist

- [x] Start as a new student; enter initials + section; generate a code.
- [x] Type into text, textarea, select, checkbox, radio, contenteditable.
- [x] Switch tab/section; refresh; confirm local restore.
- [x] Resume with the code; confirm work returns.
- [x] Wrong code → friendly “not found”; empty code handled.
- [x] No backend → localStorage default works; health reports correctly.
- [x] Nested lesson paths resolve `/shared/...`.
- [x] Multiple lesson types (Rollup-built lesson + standalone activity).
- [x] Existing lesson app still renders; **zero console errors**.
- [x] `vite build` succeeds; `dist/shared/...` present.
- [x] Injection idempotent; integration audit **PASS**; no duplicates.
