# Canvas Bridge — whole-library Canvas integration (no SCORM, no admin)

The original Canvas tools (`build-cartridge`, `build-course`, `build-scorm`,
`build-unit-pack`, `build-command-center`) cover the **64–74 curriculum
lessons** in `data/curriculum-manifest.json`. **Canvas Bridge** extends that to
the **entire library** — every activity, game, project, and assessment in
`data/registry.json` (596 student-safe of 624) — and to **everything you add in
the future**: drop a folder, run `npm run generate-registry`, rebuild, and the
new item lands in Canvas automatically.

> **SCORM is optional.** Every path below works with a stock Canvas course — no
> SCORM tool, no district admin. SCORM is only needed for the live-activity
> auto-grade path, which requires your district to enable the Canvas SCORM LTI.

## The pieces

| File | What it does |
| --- | --- |
| `tools/canvas/lib/library-select.mjs` | Single source of truth: which registry items are student-safe, and which Canvas module each belongs to. Imported by the two tools below so the console you browse == the package you build. |
| `tools/canvas/build-library-cartridge.mjs` | Builds a Common Cartridge of the whole library, organized into Modules. `npm run library-cartridge`. |
| `tools/canvas/build-studio-index.mjs` | Snapshots the library to `teacher-tools/canvas-studio/library.json` for the static console. `npm run canvas-studio`. |
| `teacher-tools/canvas-studio/index.html` | The teacher console: browse / search / filter the whole library and copy the one command that builds your import package. |
| `assets/canvas-bridge.js` | One-line opt-in that gives **any** standalone activity the same completion code (and optional SCORM score) the engine lessons already emit. |

## Grading paths (all SCORM-free)

1. **Links** — `npm run library-cartridge`
   Whole library as Canvas Modules of live links. Import the `.imscc`, publish
   what you teach. No grading wiring.

2. **Completion codes (graded)** — `npm run library-cartridge -- --mode=graded`
   Each item becomes a text-entry assignment. Students finish the activity, get
   a `NTG1.…` code, and paste it into Canvas. Decode codes into scores with the
   existing **Canvas Grades** tool (`teacher-tools/canvas-grades/`). The codec
   (`assets/canvas-code-codec.js`) is the same one the engine lessons use, so
   lesson codes and activity codes verify through one pipeline.

3. **Auto-graded quizzes (QTI)** — `npm run course -- --quizzes-only`
   Native Canvas quizzes built from lesson questions; they grade themselves.
   Lessons only (needs structured questions).

### Useful flags

```bash
npm run library-cartridge -- --type=Game         # one activity type
npm run library-cartridge -- --section=esol       # urls under /esol…/
npm run library-cartridge -- --mode=graded        # completion-code assignments
npm run library-cartridge -- --limit=25           # small smoke-test package
npm run library-cartridge -- --select=canvas-selection.json   # exact picks from the Studio
npm run library-cartridge -- --select-urls=/lessons/1-1/,/netfold-3d/   # inline picks
npm run library-cartridge -- --split             # one importable package PER section
```

### Per-section split

`--split` emits one independently-importable, self-validated cartridge per
module (`neft-library-unit-3.imscc`, `neft-library-games.imscc`, …) instead of
one combined course — how teachers roll out week by week. Combines with
`--mode=graded`. It also writes `canvas-packages/INDEX.md` — a printable rollout
sheet listing each section, its item count, and the package to import, in order.

### Exact selection from Canvas Studio

In the Studio, tick the activities you want, click **⬇ Selection file** to save
`canvas-selection.json` to the repo root, then run the command it shows:

```bash
npm run library-cartridge -- --select=canvas-selection.json
```

The package contains exactly your picks (add `--mode=graded` for completion-code
assignments). Any selected url no longer in the library is reported and skipped.

Output lands in `canvas-packages/` (gitignored) with a `.manifest.json` sidecar
listing exactly what shipped, by module.

## Making a standalone activity Canvas-gradeable

Standalone activities use the save/resume engine and did not emit a completion
code. Add one line **after** `save-resume-engine.js`:

```html
<script src="/assets/canvas-bridge.js" defer></script>
```

The bridge reads the student's name/section/progress from
`window.NeftSaveResume.getTeacherSummary()`, and when progress reaches 100% (or
a threshold you set) it shows the same copy-paste completion code the lessons
do. Configure before it loads:

```html
<script>
  window.NeftCanvasBridgeConfig = {
    activityId: "ratio-color-mixer",
    activityTitle: "Ratio Color Mixer",
    threshold: 100,   // auto-complete at this percent
    manual: false,    // true = only fire when you call NeftCanvasBridge.complete()
  };
</script>
```

If the activity has its own name field (no save/resume), pass identity directly:

```js
NeftCanvasBridge.complete(score, { studentName: nameInput.value, classPeriod: periodInput.value });
```

API: `NeftCanvasBridge.complete(percent, { studentName, classPeriod, force })`,
`.reportScore(percent)`, `.isScormLaunch()`, `.reset()`. Every path is wrapped
so it can never break the host activity.

**Working reference:** `teacher-tools/canvas-studio/bridge-example/` is a
complete, self-contained activity that uses this pattern (configure → load →
`complete()` on finish). Copy it. Behavior is covered by
`tools/canvas/canvas-bridge.test.mjs` (run via `npm test`).

## Import into Canvas

`Settings → Import Course Content →`
- **"Common Cartridge 1.x Package"** for the library `.imscc`, or
- **"QTI .zip file"** for `neft-quizzes.zip`.

Everything imports **UNPUBLISHED**. Publish module-by-module as you teach.

## Future work, automatically

`data/registry.json` is regenerated by `npm run generate-registry`. The Studio
and the cartridge both read it, so the integration tracks your library with no
per-item work — add content, regenerate, rebuild.

## Verifying a package

`build-library-cartridge.mjs` **self-validates** every package before it ships
(via `tools/canvas/validate-cartridge.mjs`) — a structural defect aborts the
build instead of writing a broken `.imscc`, mirroring how `build-course.mjs`
guards answer keys.

To check existing packages by hand:

```bash
npm run validate:canvas                       # all canvas-packages/*.imscc
node tools/canvas/validate-cartridge.mjs <pkg.imscc | staged-dir>
```

It confirms `imsmanifest.xml` is well-formed, every `href` and module
`identifierref` resolves, no template token is left unfilled, and every page
carries a live link. The validator itself is covered by
`tools/canvas/validate-cartridge.test.mjs` (positive + corruption cases). A
live-Canvas import test still needs a real LMS; the generators mirror the proven
XML format of the existing, Canvas-tested `build-course.mjs`.
