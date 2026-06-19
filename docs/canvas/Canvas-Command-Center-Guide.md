% Canvas + EduWonderLab Command Center — Teacher Guide
% Mr. Neft's Math Classroom
% 2026-06-19

# What this is

A single page that tells you, at a glance, everything about putting your math
lessons and quizzes into Canvas — **without needing district IT.** It shows which
files are ready, which quizzes exist, which units are ready, how to grade, and the
one next step to take.

Open it at: **teacher-tools/canvas-command-center/** (on the live site or locally).

# The short version — which workflow to use first

**Use native Canvas quizzes.** They grade themselves. No codes, no SCORM, no LTI,
no admin help.

1. Build the Unit 1 quiz package (smallest, safest test):
   `npm run course -- 1 --quizzes-only`
2. In Canvas: **Settings → Import Course Content → "QTI .zip file"** → choose
   `neft-quizzes-unit1.zip` → Import.
3. Everything imports **unpublished**. Go to **Quizzes** and publish only what you need.
4. Students take the quiz; the score lands in your gradebook automatically.

If a unit has lessons with no quiz questions, use the **lesson assignment +
completion code** path instead (below).

# How to import simple lesson assignments (completion-code path)

1. Build them: `npm run cartridge` (all units) or `npm run cartridge -- 1` (Unit 1).
2. Canvas → **Settings → Import Course Content → "Common Cartridge 1.x Package"** →
   choose `neft-lessons.imscc` (or the unit file) → Import.
3. Items import **unpublished**. Publish the assignments you need.
4. Students follow six steps: click the lesson link → do the lesson → a code pops
   up (auto-copied) → return to Canvas → paste the code → Submit.
5. Grade with the **Canvas Grade Bridge** (teacher-tools/canvas-grades).

# How to import native quiz packages

- One unit: `npm run course -- 3 --quizzes-only` → `neft-quizzes-unit3.zip`
- All units: `npm run course -- --quizzes-only` → `neft-quizzes.zip`
- Import as **QTI .zip file** (not Common Cartridge). That's the most reliable
  quiz path.
- Every answer key is **validated against the lesson source at build time** — if a
  key were wrong, the build stops and refuses to make the package.

# One folder per unit (easiest)

`npm run unit-pack -- 3` builds **canvas-packages/unit-3/** containing the quiz
zip, the lesson cartridge, the full course package, a teacher guide, student
instructions, an import checklist, the lesson links, and the quiz titles — all in
one place. Use `npm run unit-pack -- all` for every unit.

# How to use the Canvas Grade Bridge

- Open **teacher-tools/canvas-grades**.
- It turns the completion codes students paste into a Canvas-ready gradebook.
- For native quizzes you don't need this — Canvas grades those itself.

# How to use the Canvas Dashboard / Command Center

- **Command Center** (teacher-tools/canvas-command-center): the overview — units
  ready, packages built, recommended path, next best action.
- **Canvas Dashboard** (teacher-tools/canvas-dashboard): no-code grading and class
  progress from live scores.

# What to do if quizzes do not appear

1. Make sure you imported the **QTI .zip file**, not as a Common Cartridge.
2. Quizzes import **unpublished** — check **Quizzes**, they're there but hidden
   until you publish.
3. If a single quiz looks empty, that lesson may have only unsupported question
   types (drag-sort, error-analysis, open-response). The Command Center's Unit
   Status flags these. Use the completion-code lesson assignment for that lesson.
4. Rebuild and re-import: `npm run course -- <unit> --quizzes-only`.

# What to ask IT for if you want fully automatic LTI / SCORM later

Send the email in **Canvas-IT-Auto-Grading-Email.docx** (also on your Desktop).
It asks for any one of: SCORM upload, an LTI 1.3 external tool, or a scoped
teacher API token.

# Exact terminal commands (you can ask Claude to run these)

| Command                              | What it does                                      |
| ------------------------------------ | ------------------------------------------------- |
| `npm run command-center`             | Refresh the Command Center status page data       |
| `npm run cartridge`                  | Build all lesson assignments (completion code)    |
| `npm run cartridge -- 1`             | Build Unit 1 lesson assignments                   |
| `npm run cartridge -- --mode=iframe` | Lesson assignments with the lesson embedded       |
| `npm run course -- --quizzes-only`   | Build all native quizzes (QTI)                    |
| `npm run course -- 1 --quizzes-only` | Build Unit 1 native quizzes                       |
| `npm run course`                     | Build the full course (pages + quizzes)           |
| `npm run course -- 1`                | Build the full Unit 1 course                      |
| `npm run unit-pack -- 3`             | Build the complete Unit 3 import folder           |
| `npm run unit-pack -- all`           | Build every unit's import folder                  |
| `npm run validate:course`            | Re-check every quiz answer key against the source |

All packages are written to `canvas-packages/` and the key files are copied to your
Desktop.
